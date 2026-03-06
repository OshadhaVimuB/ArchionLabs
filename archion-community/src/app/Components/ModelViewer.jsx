"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import { Suspense, useEffect } from "react";


function Model({ url }) {

  const { scene } = useGLTF(url);

  useEffect(() => {
    return () => {
      useGLTF.clear(url);
    };
  }, [url]);

  return <primitive object={scene} scale={1} />;
}

export default function ModelViewer({ modelUrl }) {

  if (!modelUrl) return null;

  return (
    <Canvas
      camera={{ position: [4, 4, 6], fov: 60 }}
      style={{ height: "100%", width: "100%" }}
    >
      <ambientLight intensity={1} />
      <directionalLight position={[5,5,5]} />

      <Suspense fallback={null}>
        <Model url={modelUrl} />
      </Suspense>

      <OrbitControls />

      <Environment preset="city" />
    </Canvas>
  );
}