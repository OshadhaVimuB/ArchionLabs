"use client";

import React, { useRef, useState } from "react";
import { useFloorPlanStore } from "@/store/useFloorPlanStore";
import { processFloorPlanFile } from "@/lib/floorPlanProcessor";
import { UploadCloud } from "lucide-react";

interface FloorPlanUploaderProps {
  onUploadStart?: () => void;
  onUploadComplete?: () => void;
}

export default function FloorPlanUploader({
  onUploadStart,
  onUploadComplete,
}: FloorPlanUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { setFloorPlan, setLoading, setError } = useFloorPlanStore();

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    try {
      onUploadStart?.();
      setLoading(true);
      setError("");

      // Process the file
      const floorPlan = await processFloorPlanFile(file);
      setFloorPlan(floorPlan);
      onUploadComplete?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to process file";
      setError(errorMessage);
      console.error("Upload error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.png,.jpg,.jpeg,.gif,.webp,.dxf,.dwg"
        onChange={handleFileInputChange}
        className="hidden"
        aria-label="Upload floor plan file"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border hover:border-muted-foreground bg-muted/30 hover:bg-muted/50"
          }`}
      >
        <div className="p-4 bg-background rounded-full border border-border mb-4 shadow-sm">
          <UploadCloud className="w-8 h-8 text-muted-foreground" />
        </div>

        <p className="text-sm font-semibold mb-2 text-card-foreground">
          Click to upload or drag and drop
        </p>

        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          Supported formats include JSON, PNG, JPG, WebP, DXF.
        </p>
      </div>

      <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground">
        <p className="font-semibold text-foreground mb-1">JSON Expected Schema:</p>
        <code className="block mt-2 font-mono bg-background text-foreground p-3 rounded-md border border-border text-[10px] overflow-x-auto whitespace-pre">
          {`{
  "name": "Project Name",
  "levels": [{ "rooms": [], "walls": [] }]
}`}
        </code>
      </div>
    </div>
  );
}
