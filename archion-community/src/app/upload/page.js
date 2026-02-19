"use client";
import Navbar from "../Components/Navbar";

import { useState } from "react";

export default function UploadTemplate() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [designer, setDesigner] = useState("");
  const [file, setFile] = useState(null);

  function handleFileChange(e) {
    setFile(e.target.files[0]);
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white px-10 py-12">
      <div className="max-w-6xl mx-auto grid grid-cols-2 gap-16">
        {/* LEFT SIDE FORM */}
        <div className="space-y-6">
          <h1 className="text-2xl font-bold mb-6">Upload New Template</h1>

          <div>
            <label className="block text-sm mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 rounded bg-zinc-800 border border-zinc-700 focus:outline-none focus:border-blue-500"
              placeholder="Enter template title"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="4"
              className="w-full px-4 py-2 rounded bg-zinc-800 border border-zinc-700 focus:outline-none focus:border-blue-500"
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
              type="text"
              value={designer}
              onChange={(e) => setDesigner(e.target.value)}
              className="w-full px-4 py-2 rounded bg-zinc-800 border border-zinc-700"
              placeholder="Enter your name"
            />
          </div>

          <button className="px-6 py-2 bg-blue-600 rounded hover:bg-blue-500 transition">
            Save Details
          </button>
        </div>

        {/* RIGHT SIDE FILE UPLOAD */}
        <div className="space-y-8">

          <div className="bg-zinc-800 rounded-lg p-8 border border-zinc-700 text-center">
            <label className="block mb-4 text-sm">Upload 3D Model (.glb)</label>

            <input
              type="file"
              accept=".glb,.gltf,.zip"
              onChange={handleFileChange}
              className="mb-4"
            />

            {file && (
              <p className="text-zinc-400 text-sm">
                Selected: {file.name}
              </p>
            )}
          </div>

          <div className="bg-zinc-800 rounded-lg p-10 text-center border border-zinc-700">
            <p className="text-zinc-400">
              Live Preview Coming Soon
            </p>
          </div>

          <div className="flex justify-between">
            <button className="px-6 py-2 bg-zinc-700 rounded hover:bg-zinc-600">
              Cancel
            </button>

            <button className="px-6 py-2 bg-green-600 rounded hover:bg-green-500">
              Upload Template
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}