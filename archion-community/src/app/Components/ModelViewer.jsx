"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense } from "react";
import { Orbit } from "next/font/google";

function Model({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={1.2} />;
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
    <Canvas
      camera={{ position: [2, 2, 2], fov: 50 }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 3, 3]} />

      <Suspense fallback={null}>
        <Model url={modelUrl} />
      </Suspense>
      <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} autoRotate autoRotateSpeed={20}/>
    </Canvas>
  );
}