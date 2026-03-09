"use client";

import { useState } from "react";
import ModelViewer from "../Components/ModelViewer";

export default function UploadTemplate() {

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [designer, setDesigner] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  function handleFileChange(e) {
  const selected = e.target.files[0];

  if (selected) {
    setFile(selected);

    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
  }
}
 function removeFile() {
  setFile(null);
  setPreviewUrl(null);

  const input = document.getElementById("fileInput");
  if (input) input.value = "";
}
const handleUpload = async () => {

  if (!file) {
    alert("Please select a 3D model file first");
    return;
  }

  const formData = new FormData();

  formData.append("title", title);
  formData.append("author", designer);
  formData.append("model", file);

  try {
    const response = await fetch("http://localhost:5000/upload-model", {
      method: "POST",
      body: formData
    });

    if (response.ok) {
      alert("Template uploaded!");
      window.location.href = "/";
    } else {
      alert("Upload failed");
    }

  } catch (error) {
    console.error(error);
    alert("Server connection failed");
  }
};

 
    

  return (
    <div className="min-h-screen bg-zinc-900 text-white px-10 py-12">

      <div className="max-w-6xl mx-auto grid grid-cols-2 gap-16">

        {/* LEFT SIDE FORM */}
        <div className="space-y-6">

          <h1 className="text-2xl font-bold mb-6">
            Upload New Template
          </h1>

          <div>
            <label className="block text-sm mb-2">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 rounded bg-zinc-800 border border-zinc-700"
              placeholder="Enter template title"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Description</label>
            <textarea
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded bg-zinc-800 border border-zinc-700"
              placeholder="Write description"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 rounded bg-zinc-800 border border-zinc-700"
            >
              <option value="">Select Category</option>
              <option>Interior</option>
              <option>Industrial</option>
              <option>Character</option>
              <option>Architecture</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2">Designer Name</label>
            <input
              value={designer}
              onChange={(e) => setDesigner(e.target.value)}
              className="w-full px-4 py-2 rounded bg-zinc-800 border border-zinc-700"
              placeholder="Enter your name"
            />
          </div>

          <button className="px-6 py-2 bg-blue-600 rounded hover:bg-blue-500">
            Save Details
          </button>

        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-8">

          {/* FILE UPLOAD BOX */}
          <div className="bg-zinc-800 rounded-lg p-8 border border-zinc-700 text-center">

            <p className="text-sm mb-4 text-zinc-400">
              Upload 3D Model (.glb)
            </p>

            <div className="flex justify-center gap-4">

              <label className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded cursor-pointer">
                Choose File
                <input
                  id="fileInput"
                  type="file"
                  accept=".glb,.gltf,.zip"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <button
                onClick={removeFile}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded"
              >
                Remove File
              </button>

            </div>

            {file && (
              <p className="mt-4 text-sm text-zinc-400">
                Selected: {file.name}
              </p>
            )}

          </div>

          {/* PREVIEW BOX */}
          <div className="bg-zinc-800 rounded-lg h-[300px] border border-zinc-700 overflow-hidden">

  {previewUrl ? (
    <ModelViewer modelUrl={previewUrl} />
  ) : (
    <div className="flex items-center justify-center h-full text-zinc-400">
      Live Preview
    </div>
  )}

</div>

          {/* BUTTONS */}
          <div className="flex justify-between">

            <button className="px-6 py-2 bg-zinc-700 rounded hover:bg-zinc-600">
              Cancel
            </button>

            <button
              onClick={handleUpload}
              className="px-6 py-2 bg-green-600 rounded hover:bg-green-500"
            >
              Upload Template
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}