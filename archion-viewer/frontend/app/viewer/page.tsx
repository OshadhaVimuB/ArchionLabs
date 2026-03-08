"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useFloorPlanStore } from "@/store/useFloorPlanStore";
import { Box, Info, Gamepad2, Upload, AlertCircle, Maximize } from "lucide-react";

export default function ViewerPage() {
  const router = useRouter();
  const { floorPlan, isLoading, error, reset } = useFloorPlanStore();
  const [showInfo, setShowInfo] = useState(true);
  const [showControls, setShowControls] = useState(true);

  const handleBackToUpload = () => {
    reset();
    router.push("/upload");
  };

  if (!floorPlan) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="inline-flex items-center justify-center p-4 bg-muted rounded-full text-muted-foreground mb-2">
            <AlertCircle className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">No Floor Plan Loaded</h1>
          <p className="text-muted-foreground">Please upload a floor plan first.</p>
          <button
            onClick={() => router.push("/upload")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mx-auto"
          >
            <Upload className="w-5 h-5" />
            Go to Upload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-background overflow-hidden text-foreground">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Top Control Bar */}
      <div className="absolute top-0 left-0 right-0 bg-linear-to-b from-background/80 to-transparent z-20 p-4 pointer-events-none">
        <div className="flex items-center justify-between max-w-full px-4 pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-card border border-border rounded-lg shadow-sm">
              <Box className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">{floorPlan.name}</h1>
              <p className="text-xs text-muted-foreground font-medium">3D Floor Plan Viewer</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="bg-card/80 backdrop-blur-md border border-border hover:border-muted-foreground/50 text-foreground px-4 py-2 rounded-xl transition-all text-sm font-semibold flex items-center gap-2 shadow-sm"
              title="Toggle info panel"
            >
              <Info className="w-4 h-4" /> <span className="hidden sm:inline">Info</span>
            </button>
            <button
              onClick={() => setShowControls(!showControls)}
              className="bg-card/80 backdrop-blur-md border border-border hover:border-muted-foreground/50 text-foreground px-4 py-2 rounded-xl transition-all text-sm font-semibold flex items-center gap-2 shadow-sm"
              title="Toggle controls guide"
            >
              <Gamepad2 className="w-4 h-4" /> <span className="hidden sm:inline">Controls</span>
            </button>
            <button
              onClick={handleBackToUpload}
              className="bg-primary/10 hover:bg-destructive/10 text-primary hover:text-destructive border border-primary/20 hover:border-destructive/30 px-4 py-2 rounded-xl transition-all text-sm font-semibold flex items-center gap-2 shadow-sm ml-2"
            >
              <Upload className="w-4 h-4" /> <span className="hidden sm:inline">Upload New</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Info Panel */}
      {showInfo && (
        <div className="absolute top-24 right-4 bg-card/85 backdrop-blur-md border border-border shadow-2xl rounded-2xl p-6 z-20 max-w-xs max-h-[calc(100vh-120px)] overflow-y-auto w-full">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2 uppercase tracking-wider">
                <Box className="w-4 h-4" /> Floor Plan Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Name</span>
                  <span className="text-foreground font-semibold truncate max-w-[120px]" title={floorPlan.name}>{floorPlan.name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Levels</span>
                  <span className="text-foreground font-semibold">{floorPlan.levels.length}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Total Area</span>
                  <span className="text-foreground font-semibold bg-muted px-2 py-0.5 rounded text-xs">{floorPlan.total_area?.toFixed(1) || "—"} m²</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Dimensions</span>
                  <span className="text-foreground font-semibold text-xs text-right">
                    {floorPlan.width?.toFixed(1) || "—"}w × {floorPlan.height?.toFixed(1) || "—"}h
                  </span>
                </div>
              </div>
            </div>

            {floorPlan.levels[0] && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2 uppercase tracking-wider">
                  <Maximize className="w-4 h-4" /> Ground Floor
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-muted/50 p-3 rounded-xl border border-border/50 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">{floorPlan.levels[0].rooms.length}</span>
                    <span className="text-xs text-muted-foreground mt-1">Rooms</span>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-xl border border-border/50 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">{floorPlan.levels[0].walls.length}</span>
                    <span className="text-xs text-muted-foreground mt-1">Walls</span>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-xl border border-border/50 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">{floorPlan.levels[0].doors.length}</span>
                    <span className="text-xs text-muted-foreground mt-1">Doors</span>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-xl border border-border/50 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">{floorPlan.levels[0].windows.length}</span>
                    <span className="text-xs text-muted-foreground mt-1">Windows</span>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-border pt-5">
              <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Room Legend</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div> Living Rm</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div> Bedroom</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]"></div> Bathroom</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div> Kitchen</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> Dining</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-500 shadow-[0_0_8px_rgba(107,114,128,0.5)]"></div> Garage</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div> Office</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls Guide */}
      {showControls && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-4 sm:bottom-4 bg-card/85 backdrop-blur-md border border-border shadow-2xl rounded-2xl p-4 z-20 max-w-sm w-[90%] sm:w-auto">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-primary" /> Camera Controls
          </h3>
          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-3 bg-muted/30 p-2 rounded-lg">
              <span className="text-foreground font-semibold flex shrink-0 items-center justify-center w-6 h-6 rounded bg-card border border-border">L</span>
              <span className="pt-1"><strong>Left Drag</strong> to rotate view around the floor plan</span>
            </div>
            <div className="flex items-start gap-3 bg-muted/30 p-2 rounded-lg">
              <span className="text-foreground font-semibold flex shrink-0 items-center justify-center w-6 h-6 rounded bg-card border border-border">R</span>
              <span className="pt-1"><strong>Right Drag</strong> to pan camera across the plane</span>
            </div>
            <div className="flex items-start gap-3 bg-muted/30 p-2 rounded-lg">
              <span className="text-foreground font-semibold flex shrink-0 items-center justify-center w-6 h-6 rounded bg-card border border-border">S</span>
              <span className="pt-1"><strong>Scroll</strong> to zoom in and out</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center bg-card border border-border shadow-2xl rounded-2xl p-8 max-w-sm">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-foreground font-semibold text-lg">Processing Model...</p>
            <p className="text-sm text-muted-foreground mt-2">Generating 3D geometry from floor plan</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute bottom-6 right-6 bg-destructive/10 border border-destructive/20 text-destructive shadow-2xl backdrop-blur-md rounded-xl p-5 z-50 max-w-sm flex gap-3 items-start animate-in slide-in-from-bottom-5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Failed to load floor plan</p>
            <p className="text-xs text-destructive/80 mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
