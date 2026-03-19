"use client";

import React from "react";
import { useRouter } from "next/navigation";
import FloorPlanUploader from "@/components/FloorPlanUploader";
import { useFloorPlanStore } from "@/store/useFloorPlanStore";
import { Eye, Upload, FileBox, Gauge, Orbit, AlertCircle } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const { error, clearError } = useFloorPlanStore();

  const handleUploadComplete = () => {
    // Navigate to viewer page
    router.push("/viewer");
  };



  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-3xl w-full z-10 space-y-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-white text-black rounded-full border border-white/20 mb-2 shadow-sm">
            <Eye className="w-8 h-8" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            Archion Viewer 3D
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Upload your architectural 3D models and explore them instantly in our high-performance viewer.
          </p>
        </div>

        <div className="bg-black/80 backdrop-blur-xl border border-white/20 hover:border-white/40 shadow-2xl rounded-3xl p-6 sm:p-10 transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
              <Upload className="w-5 h-5 text-white" />
              Upload 3D Model
            </h2>
            <div className="flex items-center gap-2 text-xs font-medium text-black bg-white px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Ready
            </div>
          </div>

          <FloorPlanUploader
            onUploadStart={() => clearError()}
            onUploadComplete={handleUploadComplete}
          />

          {error && (
            <div className="mt-6 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group bg-black border border-white/20 rounded-2xl p-6 hover:shadow-lg hover:border-white transition-all duration-300">
            <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileBox className="w-6 h-6 text-black" />
            </div>
            <h3 className="font-semibold mb-2 text-white">Standard Formats</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Native support for FBX, OBJ, STL, and glTF models directly in the browser.
            </p>
          </div>
          <div className="group bg-black border border-white/20 rounded-2xl p-6 hover:shadow-lg hover:border-white transition-all duration-300">
            <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Gauge className="w-6 h-6 text-black" />
            </div>
            <h3 className="font-semibold mb-2 text-white">High Performance</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Optimized rendering pipeline to load and display complex architectures instantly.
            </p>
          </div>
          <div className="group bg-black border border-white/20 rounded-2xl p-6 hover:shadow-lg hover:border-white transition-all duration-300">
            <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Orbit className="w-6 h-6 text-black" />
            </div>
            <h3 className="font-semibold mb-2 text-white">Interactive Orbiting</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Smooth camera controls to pan, zoom, and inspect every detail.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

