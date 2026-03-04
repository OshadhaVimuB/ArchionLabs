"use client";

import ModelViewer from "../../Components/ModelViewer";
import { useParams } from "next/navigation";

export default function ModelPage() {

  const params = useParams();

  const modelUrl = "/models/test.glb"; // later this will come from backend

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center">

      <div className="w-full h-full">

        <ModelViewer modelUrl={modelUrl} />

      </div>

    </div>
  );
}