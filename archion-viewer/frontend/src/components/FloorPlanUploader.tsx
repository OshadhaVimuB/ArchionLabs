"use client";

import React, { useRef, useState } from "react";
import { useFloorPlanStore } from "@/store/useFloorPlanStore";
import { processModelFiles } from "@/lib/floorPlanProcessor";
import { UploadCloud } from "lucide-react";

interface ModelUploaderProps {
  onUploadStart?: () => void;
  onUploadComplete?: () => void;
}

export default function FloorPlanUploader({
  onUploadStart,
  onUploadComplete,
}: ModelUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { setModel, setLoading, setError } = useFloorPlanStore();

  const handleFilesUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    try {
      onUploadStart?.();
      setLoading(true);
      setError("");

      const fileArray = Array.from(files);
      const { url, format, name, mtlText, textureMap } = await processModelFiles(fileArray);
      setModel(url, format, name, mtlText, textureMap);
      onUploadComplete?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to process file";
      setError(errorMessage);
      console.error("Upload error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFilesUpload(files);
    }
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

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFilesUpload(files);
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept=".gltf,.glb,.obj,.fbx,.stl,.mtl,.jpg,.jpeg,.png,.tga,.bmp"
        onChange={handleFileInputChange}
        className="hidden"
        aria-label="Upload 3D model files"
        multiple
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${isDragging
          ? "border-white bg-white/10 scale-[1.02]"
          : "border-white/20 hover:border-white bg-black hover:bg-white/5"
          }`}
      >
        <div className="p-4 bg-white rounded-full mb-4 shadow-sm transition-transform group-hover:scale-110">
          <UploadCloud className="w-8 h-8 text-black" />
        </div>

        <p className="text-sm font-semibold mb-2 text-white">
          Click to upload or drag and drop
        </p>

        <p className="text-xs text-gray-400 max-w-xs mx-auto">
          Supported 3D formats: FBX, OBJ, STL, glTF (.gltf, .glb).
        </p>
        <p className="text-xs text-gray-400 mt-1">
          For OBJ files, select .obj + .mtl + texture files together for correct colors.
        </p>
      </div>
    </div>
  );
}
