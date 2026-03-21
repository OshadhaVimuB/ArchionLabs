"use client";

import { Suspense, useEffect, useRef } from "react";
import { useLoader } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

const PLACEHOLDER_COLORS = new Set([
  0x008b8b, // DarkCyan
  0x0080ff, // Azure
  0x0891b2, // teal-500
  0x06b6d4, // cyan-500
  0x22d3ee, // cyan-400
  0x2a2a4a, // dark blue-purple (our floor color)
  0x1a1a3a, // overlay floor color
]);

function isPlaceholderColor(hex: number): boolean {
  // Check exact matches
  if (PLACEHOLDER_COLORS.has(hex)) return true;
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;

  if (r < 30 && g > 100 && b > 150) return true;
  return false;
}

function filterPlaceholderMeshes(root: THREE.Object3D) {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mat = obj.material as THREE.MeshStandardMaterial;
    if (!mat?.color) return;

    const hex = mat.color.getHex();
    if (isPlaceholderColor(hex)) {
      obj.visible = false;
      console.log(
        `[ModelRenderer] Hiding placeholder mesh: "${obj.name}" (color: #${hex.toString(16).padStart(6, "0")})`,
      );
    }
  });
}

const MODEL_Y_LIFT = -0.5;

function computeAlignedPosition(
  root: THREE.Object3D,
  centerOffset?: [number, number],
): THREE.Vector3 {
  const box = new THREE.Box3().setFromObject(root);

  if (centerOffset) {

    // Use geometry pipeline's center for XZ alignment
    const [cx, cy] = centerOffset;
    return new THREE.Vector3(-cx, -box.min.y + MODEL_Y_LIFT, cy);
  }

  // Fallback: use bounding box center
  const center = box.getCenter(new THREE.Vector3());
  return new THREE.Vector3(-center.x, -box.min.y + MODEL_Y_LIFT, -center.z);
}


// GltfModel — loads .glb / .gltf 
function GltfModel({
  url,
  centerOffset,
}: {
  url: string;
  centerOffset?: [number, number];
}) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!groupRef.current) return;

    scene.position.set(0, 0, 0);

    filterPlaceholderMeshes(scene);

    // Align model XZ with boundary coordinates, ground at Y=MODEL_Y_LIFT
    const pos = computeAlignedPosition(scene, centerOffset);
    scene.position.copy(pos);
  }, [scene, centerOffset]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}


// ObjModel — loads .obj 

function ObjModel({
  url,
  centerOffset,
}: {
  url: string;
  centerOffset?: [number, number];
}) {
  const obj = useLoader(OBJLoader, url);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!groupRef.current) return;

    // Reset to origin before computing bounds (same reason as GltfModel)
    obj.position.set(0, 0, 0);

    // Apply fallback material where none exists
    const fallbackMat = new THREE.MeshStandardMaterial({
      color: "#8899aa",
      roughness: 0.6,
      metalness: 0.2,
    });

    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (
          !child.material ||
          (child.material as THREE.Material).type === "MeshBasicMaterial"
        ) {
          child.material = fallbackMat;
        }
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Filter out blue/teal placeholder meshes
    filterPlaceholderMeshes(obj);

    // Align model XZ with boundary coordinates, ground at Y=0
    const pos = computeAlignedPosition(obj, centerOffset);
    obj.position.copy(pos);
  }, [obj, centerOffset]);

  return (
    <group ref={groupRef}>
      <primitive object={obj} />
    </group>
  );
}


// ModelRenderer — public entry point, picks the right loader

interface ModelRendererProps {
  url: string;
  format: "obj" | "glb" | "gltf";
  centerOffset?: [number, number];
}

export default function ModelRenderer({ url, format, centerOffset }: ModelRendererProps) {
  return (
    <Suspense fallback={null}>
      {format === "obj" ? (
        <ObjModel url={url} centerOffset={centerOffset} />
      ) : (
        <GltfModel url={url} centerOffset={centerOffset} />
      )}
    </Suspense>
  );
}
