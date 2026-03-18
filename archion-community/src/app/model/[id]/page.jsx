"use client";

import ModelViewer from "../../Components/ModelViewer";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function ModelPage() {

  const params = useParams();
  const id = params.id;
  const [template, setTemplate] = useState(null);

  useEffect(() => {
    async function loadTemplate() {
      const res = await fetch(`http://localhost:5000/templates/${id}`);
      const data = await res.json();
    

      setTemplate(data);
    }
    loadTemplate();
  }, [id]);
  useEffect(() => {
  fetch(`http://localhost:5000/templates/${id}/view`, {
    method: "POST"
  });
}, []);
useEffect(() => {
  if (!id) return;

  fetch(`http://localhost:5000/templates/${id}/view`, {
    method: "POST"
  })
  .then(res => res.json())
  .then(data => console.log("View updated:", data))
  .catch(err => console.error(err));

}, [id]);

  if (!template) {
    return (
      <div className="flex items-center justify-center h-screen text-zinc-400">
        Loading...
      </div>
    );
  }
      

  const modelUrl = `http://localhost:5000${template.modelUrl}`;// later from backend

  return (

    <div className="w-full min-h-screen bg-black text-white">

      {/* Back Button */}
      <div className="p-6">
        <button
          onClick={() => window.location.href = "/"}
          className="px-4 py-2 bg-zinc-700 rounded hover:bg-zinc-600"
        >
          ← Back to Library
        </button>
      </div>

      {/* Viewer Section */}
      <div className="flex flex-col items-center">

        {/* Model Viewer Box */}
        <div className="w-[600px] h-[600px] bg-zinc-900 rounded-xl shadow-xl">
          <ModelViewer modelUrl={modelUrl} />
        </div>

        {/* Download Button */}
        <a
          href={modelUrl}
          download
          className="mt-6 px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-500 transition"
        >
          Download Model
        </a>

      </div>

    </div>
  );
}