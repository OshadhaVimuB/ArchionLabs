"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Viewer3D from "@/components/Viewer3D";
import ShareModal from "@/components/ShareModel";
import { useFloorPlanStore } from "@/store/useFloorPlanStore";
import { Eye, ScanEye, Info, Move3d, RotateCcw, Upload, AlertCircle, Cpu, MapPin, Trash2, X, Share2 } from "lucide-react";
import { Share } from "next/font/google";

export default function ViewerPage() {
  const router = useRouter();
  const { modelUrl, modelName, modelFormat, mtlText, isLoading, error, reset, annotations, annotationMode, setAnnotationMode, removeAnnotation, clearAnnotations } = useFloorPlanStore();
  const [showInfo, setShowInfo] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleBackToUpload = () => {
    reset();
    router.push("/upload");
  };

  if (!modelUrl) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="inline-flex items-center justify-center p-4 bg-muted rounded-full text-muted-foreground mb-2">
            <AlertCircle className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">No Model Loaded</h1>
          <p className="text-muted-foreground">Please upload a 3D model first.</p>
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

      {/* 3D Viewer Canvas - Full Screen */}
      <div className="w-full h-full relative z-10">
        <Viewer3D />
      </div>

      {/* Top Control Bar */}
      <div className="absolute top-0 left-0 right-0 bg-linear-to-b from-background/80 to-transparent z-20 p-4 pointer-events-none">
        <div className="flex items-center justify-between max-w-full px-4 pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-card border border-border rounded-lg shadow-sm">
              <Eye className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Archion-Viewer</h1>
              <p className="text-xs text-muted-foreground font-medium">{modelName || "3D Model"}</p>
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
              <Move3d className="w-4 h-4" /> <span className="hidden sm:inline">Controls</span>
            </button>
            <button
              onClick={() => {
                setAnnotationMode(!annotationMode);
                if (!annotationMode) setShowAnnotations(true);
              }}
              className={`backdrop-blur-md border px-4 py-2 rounded-xl transition-all text-sm font-semibold flex items-center gap-2 shadow-sm ${annotationMode
                  ? "bg-indigo-500/90 border-indigo-400/50 text-white"
                  : "bg-card/80 border-border hover:border-muted-foreground/50 text-foreground"
                }`}
              title={annotationMode ? "Exit annotation mode" : "Enter annotation mode"}
            >
              <MapPin className="w-4 h-4" /> <span className="hidden sm:inline">{annotationMode ? "Annotating" : "Annotate"}</span>
            </button>
            <button
              onClick={() => setShowAnnotations(!showAnnotations)}
              className={`backdrop-blur-md border px-4 py-2 rounded-xl transition-all text-sm font-semibold flex items-center gap-2 shadow-sm relative ${showAnnotations
                  ? "bg-card border-primary/50 text-foreground"
                  : "bg-card/80 border-border hover:border-muted-foreground/50 text-foreground"
                }`}
              title="Toggle annotations list"
            >
              <ScanEye className="w-4 h-4" /> <span className="hidden sm:inline">Notes</span>
              {annotations.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {annotations.length}
                </span>
              )}
            </button>

            {/* ── Share Button ── */}
            <button
              onClick={() => setShowShareModal(true)}
              className="backdrop-blur-md border px-4 py-2 rounded-xl transition-all text-sm font-semibold flex items-center gap-2 shadow-sm bg-card/80 border-border hover:border-violet-400/60 hover:bg-violet-500/10 text-foreground hover:text-violet-300"
              title="Share this model securely"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              onClick={handleBackToUpload}
              className="bg-primary/10 hover:bg-destructive/10 text-primary hover:text-destructive border border-primary/20 hover:border-destructive/30 px-4 py-2 rounded-xl transition-all text-sm font-semibold flex items-center gap-2 shadow-sm ml-2"
            >
              <RotateCcw className="w-4 h-4" /> <span className="hidden sm:inline">Upload New</span>
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
                <ScanEye className="w-4 h-4" /> Model Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Name</span>
                  <span className="text-foreground font-semibold truncate max-w-[120px]" title={modelName || "Unknown"}>{modelName || "Unknown"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Format</span>
                  <span className="text-foreground font-semibold uppercase">{modelFormat || "Unknown"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Renderer</span>
                  <span className="text-foreground font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded text-xs flex items-center gap-1">
                    <Cpu className="w-3 h-3" /> WebGL
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Annotations List Panel */}
      {showAnnotations && (
        <div className="absolute top-24 right-4 bg-card/85 backdrop-blur-md border border-border shadow-2xl rounded-2xl p-5 z-20 max-w-xs max-h-[calc(100vh-120px)] overflow-y-auto w-full" style={{ top: showInfo ? '340px' : '96px' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
              <MapPin className="w-4 h-4" /> Annotations ({annotations.length})
            </h3>
            {annotations.length > 0 && (
              <button
                onClick={clearAnnotations}
                className="text-xs text-destructive/70 hover:text-destructive font-semibold flex items-center gap-1 transition-colors"
                title="Clear all annotations"
              >
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          {annotations.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 py-4 text-center">
              No annotations yet. Click &quot;Annotate&quot; to start.
            </p>
          ) : (
            <div className="space-y-2">
              {annotations.map((ann, i) => (
                <div
                  key={ann.id}
                  className="flex items-start gap-2 bg-muted/30 rounded-lg p-2.5 group"
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0 mt-0.5"
                    style={{ backgroundColor: ann.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{ann.label}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(ann.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={() => removeAnnotation(ann.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 rounded"
                    title="Remove annotation"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom Controls Guide */}
      {showControls && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-4 sm:bottom-4 bg-card/85 backdrop-blur-md border border-border shadow-2xl rounded-2xl p-4 z-20 max-w-sm w-[90%] sm:w-auto">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Move3d className="w-4 h-4 text-primary" /> Camera Controls
          </h3>
          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-3 bg-muted/30 p-2 rounded-lg">
              <span className="text-foreground font-semibold flex shrink-0 items-center justify-center w-6 h-6 rounded bg-card border border-border">L</span>
              <span className="pt-1"><strong>Left Drag</strong> to rotate view around the model</span>
            </div>
            <div className="flex items-start gap-3 bg-muted/30 p-2 rounded-lg">
              <span className="text-foreground font-semibold flex shrink-0 items-center justify-center w-6 h-6 rounded bg-card border border-border">R</span>
              <span className="pt-1"><strong>Right Drag</strong> to pan camera</span>
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
            <p className="text-foreground font-semibold text-lg">Loading 3D Model...</p>
            <p className="text-sm text-muted-foreground mt-2">Parsing geometry and materials</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute bottom-6 right-6 bg-destructive/10 border border-destructive/20 text-destructive shadow-2xl backdrop-blur-md rounded-xl p-5 z-50 max-w-sm flex gap-3 items-start animate-in slide-in-from-bottom-5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Failed to load model</p>
            <p className="text-xs text-destructive/80 mt-1">{error}</p>
          </div>
        </div>
      )}
      
      {/* Share Modal */}
      {showShareModal && modelUrl && (
        <ShareModal
          modelUrl={modelUrl}
          modelFormat={modelFormat || "gltf"}
          modelName={modelName || "3D Model"}
          mtlText={mtlText}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
