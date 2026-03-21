"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useEffect, useState } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

function Model({ url }) {
  const [model, setModel] = useState(null);

  useEffect(() => {
    const loader = new GLTFLoader();

    loader.load(
      url,
      (gltf) => {
        setModel(gltf.scene);
      },
      undefined,
      (error) => {
        console.error("GLTF LOAD ERROR:", error); // 🔥 REAL ERROR
      }
    );
  }, [url]);

  if (!model) return null;

  return <primitive object={model} scale={1.2} />;
}

export default function ModelViewer({ modelUrl }) {

  if (!modelUrl) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-400">
        No model
      </div>
    );
  }

  return (
    <Canvas camera={{ position: [2, 2, 2], fov: 50 }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 3, 3]} />

      <Suspense fallback={null}>
        <Model url={modelUrl} />
      </Suspense>

      <OrbitControls />
    </Canvas>
  );
}