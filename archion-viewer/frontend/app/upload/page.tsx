"use client";

import React from "react";
import { useRouter } from "next/navigation";
import FloorPlanUploader from "@/components/FloorPlanUploader";
import { useFloorPlanStore } from "@/store/useFloorPlanStore";
import { createSampleFloorPlan } from "@/lib/floorPlanProcessor";
import { Box, FileText, Zap, MousePointer2, AlertCircle } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const { setFloorPlan, error, clearError } = useFloorPlanStore();

  const handleUploadComplete = () => {
    // Navigate to viewer page
    router.push("/viewer");
  };

  const handleLoadSample = () => {
    clearError();
    const samplePlan = createSampleFloorPlan();
    setFloorPlan(samplePlan);
    // Navigate to viewer
    router.push("/viewer");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      {/* Decorative background element distinct from archion-build */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-3xl w-full z-10 space-y-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-muted rounded-2xl mb-2">
            <Box className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Archion Viewer</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Transform 2D floor plans into interactive 3D models instantly.
          </p>
        </div>

        <div className="bg-card border border-border shadow-2xl rounded-2xl p-6 sm:p-10">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            Upload Floor Plan
          </h2>

          <FloorPlanUploader
            onUploadStart={() => clearError()}
            onUploadComplete={handleUploadComplete}
          />

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-4 text-muted-foreground">or</span>
            </div>
          </div>

          <button
            onClick={handleLoadSample}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Box className="w-5 h-5" />
            Load Sample Model
          </button>

          {error && (
            <div className="mt-6 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card/50 border border-border rounded-xl p-5 backdrop-blur-sm hover:border-muted-foreground transition-colors">
            <FileText className="w-6 h-6 mb-3 text-muted-foreground" />
            <h3 className="font-semibold mb-1 text-sm">Multiple Formats</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">Images (PNG/JPG), CAD (DXF), and structured JSON supported.</p>
          </div>
          <div className="bg-card/50 border border-border rounded-xl p-5 backdrop-blur-sm hover:border-muted-foreground transition-colors">
            <Zap className="w-6 h-6 mb-3 text-muted-foreground" />
            <h3 className="font-semibold mb-1 text-sm">Instant Extrusion</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">Powered by Vision AI to detect walls and rooms in seconds.</p>
          </div>
          <div className="bg-card/50 border border-border rounded-xl p-5 backdrop-blur-sm hover:border-muted-foreground transition-colors">
            <MousePointer2 className="w-6 h-6 mb-3 text-muted-foreground" />
            <h3 className="font-semibold mb-1 text-sm">Interactive 3D</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">Smooth orbiting, panning, and rendering engine built for the web.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
