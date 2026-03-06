"use client";

import { useState, useRef } from "react";
import ModelViewer from "./ModelViewer";

export default function UploadTemplate() {

  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileName, setFileName] = useState("");

  const fileInputRef = useRef(null);

  function handleFileChange(e) {

    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);

    setPreviewUrl(url);
    setFileName(file.name);
  }

  function removeFile() {

    setPreviewUrl(null);
    setFileName("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function openFilePicker() {
    fileInputRef.current.click();
  }

  return (
    <div className="px-8 py-6 bg-zinc-900 min-h-screen text-white">

      <h1 className="text-2xl font-semibold mb-6">
        Upload New Template
      </h1>

      <div className="grid grid-cols-2 gap-8">

        {/* LEFT SIDE */}
        <div className="space-y-5">

          <div>
            <label className="text-sm text-zinc-400">Title</label>

            <input
              className="w-full mt-1 p-3 bg-zinc-800 rounded border border-zinc-700"
              placeholder="Enter template title"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400">Description</label>

            <textarea
              className="w-full mt-1 p-3 bg-zinc-800 rounded border border-zinc-700"
              placeholder="Write description"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400">Category</label>

            <select className="w-full mt-1 p-3 bg-zinc-800 rounded border border-zinc-700">

              <option>Select Category</option>
              <option>Architecture</option>
              <option>Character</option>
              <option>Furniture</option>
              <option>Game Assets</option>

            </select>

          </div>

          <div>
            <label className="text-sm text-zinc-400">Designer Name</label>

            <input
              className="w-full mt-1 p-3 bg-zinc-800 rounded border border-zinc-700"
              placeholder="Enter your name"
            />
          </div>

          <button className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded">
            Save Details
          </button>

        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-5">

          {/* UPLOAD BOX */}
          <div className="bg-zinc-800 rounded-lg p-6 text-center border border-zinc-700">

            <p className="text-sm text-zinc-400 mb-3">
              Upload 3D Model (.glb)
            </p>

            {/* hidden input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".glb"
              onChange={handleFileChange}
              className="hidden"
            />

            {!fileName ? (

              <button
                onClick={openFilePicker}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded"
              >
                Choose File
              </button>

            ) : (

              <div className="space-y-3">

                <p className="text-zinc-300 text-sm">
                  Selected: {fileName}
                </p>

                <div className="flex justify-center gap-3">

                  <button
                    onClick={openFilePicker}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded"
                  >
                    Change File
                  </button>

                  <button
                    onClick={removeFile}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded"
                  >
                    Remove File
                  </button>

                </div>

              </div>

            )}

          </div>

          {/* LIVE PREVIEW */}
          <div className="bg-zinc-800 rounded-lg h-[300px] border border-zinc-700">

            {previewUrl ? (

              <ModelViewer modelUrl={previewUrl} />

            ) : (

              <div className="flex items-center justify-center h-full text-zinc-400">
                Live Preview
              </div>

            )}



          </div>

          <div className="flex justify-between">

            <button className="px-4 py-2 bg-zinc-600 rounded">
              Cancel
            </button>

            <button className="px-5 py-2 bg-green-600 hover:bg-green-500 rounded">
              Upload Template
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}