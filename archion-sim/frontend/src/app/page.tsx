/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ModelUpload from "@/components/ModelUpload";
import Controls from "@/components/Controls";
import { ViolationPanel } from "@/components/ViolationMonitor";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import RoleConfigurator from "@/components/RoleConfigurator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { usePlayback } from "@/hooks/usePlayback";
import type {
  AgentFrame,
  GeometryData,
  Trajectories,
  SimPhase,
  RoleConfig,
  Violation,
  ComplianceReport,
  AnalyticsData,
  ViewMode,
} from "@/types/simulation";

// Lazy-load SimViewer to avoid SSR issues with Three.js
const SimViewer = dynamic(() => import("@/components/SimViewer"), {
  ssr: false,
});

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function Home() {
  // --- Connection ---
  const [backendOk, setBackendOk] = useState(false);

  // --- Lifecycle ---
  const [phase, setPhase] = useState<SimPhase>("idle");
  const [error, setError] = useState<string | null>(null);

  // --- Roles Configuration ---
  const [roles, setRoles] = useState<RoleConfig[]>([
    { id: 'agent-1', name: 'Agent 1', count: 1, color: '#3b82f6', areas: [] },
    { id: 'agent-2', name: 'Agent 2', count: 1, color: '#ec4899', areas: [] }
  ]);
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null);

  // --- Data ---
  const [geometry, setGeometry] = useState<GeometryData | null>(null);
  const [trajectories, setTrajectories] = useState<Trajectories | null>(null);

  // --- Playback (rAF-based hook with speed control) ---
  const {
    isPlaying,
    currentFrame,
    totalFrames,
    speed,
    frameRef,
    togglePlay,
    reset: resetPlayback,
    cycleSpeed,
    scrubTo,
    setPlaying,
  } = usePlayback({ trajectories });

  const uploadInputRef = useRef<HTMLInputElement>(null);

  // --- View mode ---
  const [viewMode, setViewMode] = useState<ViewMode>("3d");
  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === "3d" ? "2d" : "3d"));
  }, []);

  // --- Compliance ---
  const [buildingType, setBuildingType] = useState("residential");
  const [complianceReport, setComplianceReport] =
    useState<ComplianceReport | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [highlightedViolationId, setHighlightedViolationId] = useState<
    string | null
  >(null);
  const [focusTarget, setFocusTarget] = useState<{
    x: number;
    y: number;
    z: number;
  } | null>(null);

  // --- Analytics ---
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null,
  );
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // ----------------------------------------------------------------
  // Health check
  // ----------------------------------------------------------------
  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((r) => r.json())
      .then((d) => {
        if (d.status === "ok") setBackendOk(true);
      })
      .catch(() => setBackendOk(false));
  }, []);

  // ----------------------------------------------------------------
  // Upload handler
  // ----------------------------------------------------------------
  const handleUploadComplete = useCallback((data: GeometryData) => {
    console.log("=== handleUploadComplete Start ===");
    console.log("Received data structure:", !!data);
    // Prepend API_URL to relative model path so the browser can fetch it
    const fullData: GeometryData = {
      ...data,
      modelUrl: data.modelUrl ? `${API_URL}${data.modelUrl}` : undefined,
    };
    setGeometry(fullData);
    setTrajectories(null);
    resetPlayback();
    setPhase("configuring");
    setComplianceReport(null);
    setComplianceLoading(false);
    setViewMode("3d");
    console.log("=== Geometry Data Received & Applied ===");
    console.log("Boundary points:", data.boundaries?.length ?? 0);
    console.log("Raw boundary points:", data.rawBoundaries?.length ?? 0);
    console.log("Obstacles detected:", data.obstacles?.length ?? 0);
    if (data.floorArea) console.log("Floor area:", data.floorArea, "m²");
    if (fullData.modelUrl) console.log("Model URL:", fullData.modelUrl);
  }, [resetPlayback]);

  // ----------------------------------------------------------------
  // Analytics
  // ----------------------------------------------------------------
  const handleRequestAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/analytics`);
      const data = await res.json();
      if (data.status === "done" && data.data) {
        setAnalyticsData(data.data as AnalyticsData);
      }
    } catch {
      // Non-critical
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  // ----------------------------------------------------------------
  // Start simulation — uses real-time SSE streaming instead of batch polling
  // ----------------------------------------------------------------
  const handleRunSim = useCallback(async () => {
    if (!geometry) return;
    setPhase("simulating");
    setError(null);
    setComplianceReport(null);
    setComplianceLoading(true);

    try {
      const streamUrl = `${API_URL}/api/simulation/stream?n_standard=2&n_specialist=0`;
      const es = new EventSource(streamUrl);

      let firstFrameReceived = false;

      es.addEventListener("frame", (e: MessageEvent) => {
        const payload = JSON.parse(e.data) as { frame: number; agents: Record<string, AgentFrame> };

        // ⚡ Only keep the LATEST frame — no accumulation, no spread, no GC pressure
        // Store as key "0" so the viewer always reads from frame 0 (current live position)
        setTrajectories({ "0": payload.agents });
        scrubTo(0);

        if (!firstFrameReceived) {
          firstFrameReceived = true;
          // Note: Keep phase as "simulating". We set "completed" only when it's done.
        }
      });

      es.addEventListener("done", async () => {
        es.close();
        setPhase("completed");

        // Fetch full trajectories array to allow playback scrubbing
        try {
          const tRes = await fetch(`${API_URL}/api/get-trajectories`);
          const tData = await tRes.json();
          if (tData && !tData.error && !tData.status) {
            setTrajectories(tData);
            scrubTo(0);
          }
        } catch (err) {
          console.error("Failed to fetch full trajectories", err);
        }

        // Fetch the generated compliance report
        try {
          const res = await fetch(`${API_URL}/api/compliance/report`);
          const data = await res.json();
          if (data.status === "done" && data.report) {
            setComplianceReport(data.report);
          } else {
            setError(data.message || data.error || "Failed to load compliance report");
          }
        } catch (err) {
          console.error("Failed to fetch compliance report", err);
          setError("Compliance fetch failed");
        } finally {
          setComplianceLoading(false);
        }

        handleRequestAnalytics();
      });

      es.addEventListener("error", (e) => {
        es.close();
        const msg = (e as MessageEvent).data
          ? JSON.parse((e as MessageEvent).data).error
          : "Stream connection failed";
        setError(msg);
        setPhase("processing");
        setComplianceLoading(false);
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setPhase("processing");
      setComplianceLoading(false);
    }
  }, [geometry, handleRequestAnalytics, scrubTo, ]);

  const handleConfigureSim = useCallback(async () => {
    if (!geometry) return;
    try {
      await fetch(`${API_URL}/api/simulation/configure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles }),
      });
      handleRunSim();
    } catch (err) {
      console.error("Configure failed", err);
      setError("Failed to configure simulation roles on server.");
    }
  }, [roles, geometry, handleRunSim]);

  // ----------------------------------------------------------------
  // Compliance handlers
  // ----------------------------------------------------------------
  const handleBuildingTypeChange = useCallback(
    async (type: string) => {
      setBuildingType(type);
      try {
        await fetch(`${API_URL}/api/compliance/init`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ building_type: type }),
        });
      } catch {
        // Non-critical — defaults will be used
      }
    },
    [],
  );

  const handleFocusViolation = useCallback((violation: Violation) => {
    setHighlightedViolationId(violation.id);
    setFocusTarget(violation.coordinate);
  }, []);

  const handleFocusComplete = useCallback(() => {
    setFocusTarget(null);
    setTimeout(() => setHighlightedViolationId(null), 3000);
  }, []);

  // ----------------------------------------------------------------
  // Control callbacks
  // ----------------------------------------------------------------
  const handleReset = useCallback(() => {
    setGeometry(null);
    setTrajectories(null);
    resetPlayback();
    setPhase("idle");
    setError(null);
    setComplianceReport(null);
    setComplianceLoading(false);
    setHighlightedViolationId(null);
    setFocusTarget(null);
    setAnalyticsData(null);
    setAnalyticsLoading(false);
    setShowHeatmap(false);
    setViewMode("3d");
  }, [resetPlayback]);

  const handleUploadClick = useCallback(() => {
    uploadInputRef.current?.click();
  }, []);

  // ----------------------------------------------------------------
  // Derived data
  // ----------------------------------------------------------------
  const agentCount = useMemo(() => {
    if (!trajectories) return 0;
    const firstFrame = trajectories["0"];
    return firstFrame ? Object.keys(firstFrame).length : 0;
  }, [trajectories]);

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
  const hasViewport = geometry !== null;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* 3D Viewport (fills screen when geometry loaded) */}
      {hasViewport ? (
        <ErrorBoundary>
          <SimViewer
            boundaries={geometry.boundaries}
            rawBoundaries={geometry.rawBoundaries}
            obstacles={geometry.obstacles}
            trajectories={trajectories}
            frameRef={frameRef}
            phase={phase}
            modelUrl={geometry.modelUrl}
            modelFormat={geometry.modelFormat}
            centerOffset={geometry.centerOffset}
            violations={complianceReport?.violations ?? []}
            highlightedViolationId={highlightedViolationId}
            focusTarget={focusTarget}
            onFocusComplete={handleFocusComplete}
            heatmapData={analyticsData?.density_heatmap ?? null}
            showHeatmap={showHeatmap}
            onToggleHeatmap={() => setShowHeatmap((h) => !h)}
            viewMode={viewMode}
            roles={roles}
            setRoles={setRoles}
            activeRoleId={activeRoleId}
          />
        </ErrorBoundary>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-8 p-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-2">Archion Sim</h1>
            <p
              className={`text-sm ${backendOk ? "text-green-500" : "text-muted-foreground"}`}
            >
              {backendOk ? "Backend Connected" : "Checking backend…"}
            </p>
          </div>
          <ModelUpload
            apiUrl={API_URL}
            onUploadComplete={handleUploadComplete}
          />
        </div>
      )}

      {/* HUD overlay — always visible once geometry is loaded */}
      {hasViewport && (
        <>
          {phase === "configuring" && (
            <RoleConfigurator
              roles={roles}
              setRoles={setRoles}
              activeRoleId={activeRoleId}
              setActiveRoleId={setActiveRoleId}
              onStartSimulation={handleConfigureSim}
            />
          )}

          {/* Top-left info bar */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
            <h1 className="text-sm font-bold text-foreground tracking-wide">
              ARCHION SIM
            </h1>
            <span className="text-[10px] font-mono text-muted-foreground">
              {geometry.boundaries.length} boundary pts
              {geometry.obstacles.length > 0 &&
                ` · ${geometry.obstacles.length} obstacles`}
            </span>
            {trajectories && (
              <span className="text-[10px] font-mono text-primary">
                · {Object.keys(trajectories["0"] || {}).length} agents
              </span>
            )}
          </div>

          {/* Building type selector — shown when ready to simulate */}
          {phase === "processing" && (
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2 rounded-lg border border-border bg-card/90 backdrop-blur-md px-3 py-2">
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                Building Type
              </label>
              <select
                value={buildingType}
                onChange={(e) => handleBuildingTypeChange(e.target.value)}
                className="rounded bg-secondary border border-border text-xs text-secondary-foreground px-2 py-1 focus:outline-none focus:border-primary"
              >
                <option value="residential">Residential</option>
                <option value="public_buildings">Public Buildings</option>
                <option value="hospital">Hospital</option>
                <option value="educational">Educational</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
              </select>
            </div>
          )}

          {/* Hidden file input triggered by Controls "Upload Model" button */}
          <input
            ref={uploadInputRef}
            type="file"
            accept=".obj,.glb,.gltf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              e.target.value = "";
              setPhase("uploading");
              const formData = new FormData();
              formData.append("file", file);
              fetch(`${API_URL}/api/process-model`, { method: "POST", body: formData })
                .then((r) => {
                  if (!r.ok) return r.json().then((b) => { throw new Error(b.detail || `HTTP ${r.status}`); });
                  return r.json();
                })
                .then((data) => handleUploadComplete(data))
                .catch((err) => {
                  setError(err instanceof Error ? err.message : "Upload failed");
                  setPhase(geometry ? "processing" : "idle");
                });
            }}
          />

          {/* Error toast */}
          {error && (
            <div className="absolute top-4 right-4 z-10 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          {/* Violation Monitor + Analytics — shown during and after simulation */}
          {(phase === "simulating" || phase === "completed") && (
            <>
              <ViolationPanel
                report={complianceReport}
                loading={complianceLoading}
                onFocusViolation={handleFocusViolation}
              />
              <AnalyticsDashboard
                analyticsData={analyticsData}
                complianceReport={complianceReport}
                loading={analyticsLoading}
                onRequestAnalytics={handleRequestAnalytics}
              />
            </>
          )}

          {/* Bottom controls */}
          <Controls
            phase={phase}
            playing={isPlaying}
            frame={currentFrame}
            totalFrames={totalFrames}
            speed={speed}
            agentCount={agentCount}
            violationCount={complianceReport?.total_violations ?? 0}
            viewMode={viewMode}
            onUploadClick={handleUploadClick}
            onRunSim={handleConfigureSim}
            onTogglePlay={togglePlay}
            onSeek={scrubTo}
            onReset={handleReset}
            onCycleSpeed={cycleSpeed}
            onToggleViewMode={toggleViewMode}
          />
        </>
      )}
    </div>
  );
}
