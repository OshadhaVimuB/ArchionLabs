"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";

function Model({ url }) {
  const { scene } = useGLTF(url);

  return <primitive object={scene} scale={1} />;
}

export default function ModelViewer({ modelUrl }) {

  return (
    <Canvas camera={{ position: [2,2,3], fov: 50 }}>

      <ambientLight intensity={1} />
      <directionalLight position={[5,5,5]} />

      <Model url={modelUrl} />

      <OrbitControls
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
      />

      <Environment preset="city" />

    </Canvas>
  );
}