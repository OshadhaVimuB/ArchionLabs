/**
 * File Processor - Handles 3D model formats (FBX, OBJ, STL, GLTF)
 * Supports multi-file selection for OBJ+MTL+Texture bundles.
 */

export interface ProcessedModel {
  url: string;
  format: string;
  name: string;
  /** Raw MTL text content (for OBJ models) */
  mtlText?: string;
  /** Map of texture filename → blob URL */
  textureMap?: Record<string, string>;
}

// Image/texture extensions that can accompany OBJ+MTL
const TEXTURE_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".tga", ".bmp", ".gif", ".tiff", ".tif", ".webp",
];

export async function processModelFiles(
  files: File[]
): Promise<ProcessedModel> {
  let modelFile: File | null = null;
  let mtlFile: File | null = null;
  const textureFiles: File[] = [];

  for (const file of files) {
    const name = file.name.toLowerCase();

    if (name.endsWith(".mtl")) {
      mtlFile = file;
    } else if (
      name.endsWith(".gltf") ||
      name.endsWith(".glb") ||
      name.endsWith(".obj") ||
      name.endsWith(".fbx") ||
      name.endsWith(".stl")
    ) {
      modelFile = file;
    } else if (TEXTURE_EXTENSIONS.some((ext) => name.endsWith(ext))) {
      textureFiles.push(file);
    }
  }

  if (!modelFile) {
    throw new Error(
      "No supported model file found. Please upload GLTF, GLB, OBJ, FBX, or STL files."
    );
  }

  const fileName = modelFile.name.toLowerCase();
  let format = "";
  if (fileName.endsWith(".gltf") || fileName.endsWith(".glb")) {
    format = "gltf";
  } else if (fileName.endsWith(".obj")) {
    format = "obj";
  } else if (fileName.endsWith(".fbx")) {
    format = "fbx";
  } else if (fileName.endsWith(".stl")) {
    format = "stl";
  }

  const url = URL.createObjectURL(modelFile);
  let mtlText: string | undefined;
  let textureMap: Record<string, string> | undefined;

  if (format === "obj" && mtlFile) {
    // Read the MTL file as raw text
    mtlText = await mtlFile.text();

    // Build texture map: filename → blob URL (both original and lowercase keys)
    if (textureFiles.length > 0) {
      textureMap = {};
      for (const texFile of textureFiles) {
        const blobUrl = URL.createObjectURL(texFile);
        textureMap[texFile.name] = blobUrl;
        textureMap[texFile.name.toLowerCase()] = blobUrl;
      }
    }
  }

  return { url, format, name: modelFile.name, mtlText, textureMap };
}

// Keep backward compat alias
export async function processFloorPlanFile(
  file: File
): Promise<ProcessedModel> {
  return processModelFiles([file]);
}

export function createSampleFloorPlan() {
  throw new Error("Sample model not configured for 3D Viewer yet.");
}
