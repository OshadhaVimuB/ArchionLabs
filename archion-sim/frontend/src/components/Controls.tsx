"use client";

import { useRef } from "react";
import {
  Upload,
  Play,
  Pause,
  RotateCcw,
  Loader2,
  Zap,
  Eye,
  Box,
} from "lucide-react";
import type { SimPhase, PlaybackSpeed, ViewMode } from "@/types/simulation";

interface ControlsProps {
  phase: SimPhase;
  playing: boolean;
  frame: number;
  totalFrames: number;
  speed: PlaybackSpeed;
  agentCount: number;
  violationCount: number;
  viewMode: ViewMode;
  onUploadClick: () => void;
  onRunSim: () => void;
  onTogglePlay: () => void;
  onSeek: (frame: number) => void;
  onReset: () => void;
  onCycleSpeed: () => void;
  onToggleViewMode: () => void;
}

export default function Controls({
  phase,
  playing,
  frame,
  totalFrames,
  speed,
  agentCount,
  violationCount,
  viewMode,
  onUploadClick,
  onRunSim,
  onTogglePlay,
  onSeek,
  onReset,
  onCycleSpeed,
  onToggleViewMode,
}: ControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canRun = phase === "processing";
  const canPlay = (phase === "completed" || phase === "simulating") && totalFrames > 0;
  const isWorking = phase === "uploading";

  const formatTime = (f: number) => {
    const secs = f / 10;
    const m = Math.floor(secs / 60);
    const s = (secs % 60).toFixed(1);
    return `${m}:${s.padStart(4, "0")}`;
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/90 backdrop-blur-md px-5 py-3 shadow-2xl">
        {/* Upload */}
        <button
          onClick={onUploadClick}
          disabled={isWorking}
          className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground transition hover:bg-accent disabled:opacity-40"
        >
          {phase === "uploading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Upload Model
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-border" />

        {/* Run Simulation */}
        <button
          onClick={onRunSim}
          disabled={!canRun}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
            canRun
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-secondary text-muted-foreground cursor-not-allowed"
          }`}
        >
          {phase === "simulating" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          {phase === "simulating" ? "Simulating\u2026" : "Run Simulation"}
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-border" />

        {/* Play / Pause */}
        <button
          onClick={onTogglePlay}
          disabled={!canPlay}
          className="flex items-center justify-center rounded-lg bg-secondary p-2 text-secondary-foreground transition hover:bg-accent disabled:opacity-40"
        >
          {playing ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>

        {/* Speed toggle */}
        <button
          onClick={onCycleSpeed}
          disabled={!canPlay}
          className="flex items-center justify-center rounded-lg bg-secondary px-2.5 py-2 text-xs font-mono font-bold text-foreground transition hover:bg-accent disabled:opacity-40 min-w-[40px]"
        >
          {speed}x
        </button>

        {/* Timeline Scrubber */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground w-10 text-right">
            {formatTime(frame)}
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(totalFrames - 1, 0)}
            value={frame}
            onChange={(e) => onSeek(Number(e.target.value))}
            disabled={!canPlay}
            className="w-40 accent-ring disabled:opacity-40"
          />
          <span className="text-[10px] font-mono text-muted-foreground w-10">
            {formatTime(totalFrames > 0 ? totalFrames - 1 : 0)}
          </span>
        </div>

        {/* Stats */}
        {canPlay && (
          <>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
              <span>F:{Math.floor(frame)}/{totalFrames - 1}</span>
              <span className="text-border">|</span>
              <span className="text-foreground">{agentCount} agents</span>
              {violationCount > 0 && (
                <>
                  <span className="text-border">|</span>
                  <span className="text-red-400">{violationCount} violations</span>
                </>
              )}
            </div>
          </>
        )}

        {/* Divider */}
        <div className="h-6 w-px bg-border" />

        {/* 2D/3D toggle */}
        <button
          onClick={onToggleViewMode}
          disabled={!canPlay && phase !== "processing"}
          className="flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-2 text-xs font-medium text-secondary-foreground transition hover:bg-accent disabled:opacity-40"
        >
          {viewMode === "3d" ? (
            <Eye className="h-4 w-4" />
          ) : (
            <Box className="h-4 w-4" />
          )}
          {viewMode === "3d" ? "3D" : "2D"}
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          className="flex items-center justify-center rounded-lg bg-secondary p-2 text-secondary-foreground transition hover:bg-accent"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Phase indicator */}
      <div className="mt-2 text-center">
        <span
          className={`text-[10px] font-mono uppercase tracking-widest ${
            isWorking
              ? "text-amber-400"
              : phase === "completed"
                ? "text-green-400"
                : "text-muted-foreground"
          }`}
        >
          {phase}
        </span>
      </div>
    </div>
  );
}
