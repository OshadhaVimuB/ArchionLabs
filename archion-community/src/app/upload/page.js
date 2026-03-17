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
  const [invalidFile, setInvalidFile] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");

  // NEW STATES
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  function handleFileChange(e) {
    const selected = e.target.files[0];
    if (!selected) return;

    const allowedExtensions = [".glb", ".gltf"];
    const isValid = allowedExtensions.some(ext =>
      selected.name.toLowerCase().endsWith(ext)
    );

    if (!isValid) {
      setInvalidFile(true);
      setErrorMessage("Invalid file type. Please upload a .glb or .gltf file.");
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    setInvalidFile(false);
    setErrorMessage("");
    setFile(selected);

    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
  }

  // THUMBNAIL HANDLER
  function handleThumbnailChange(e) {
    const selected = e.target.files[0];
    if (selected.size > 5 * 1024 * 1024) {
      alert("Thumbnail must be smaller than 5MB");
      return;
}
    
    if (!selected) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];

    if (!allowedTypes.includes(selected.type)) {
      alert("Please upload PNG or JPG image");
      return;
    }

    setThumbnail(selected);
    setThumbnailPreview(URL.createObjectURL(selected));
  }

  function removeFile() {
    setFile(null);
    setPreviewUrl(null);

    const input = document.getElementById("fileInput");
    if (input) input.value = "";
  }

  const handleUpload = async () => {
    const errors = {};

    if (!title.trim()) errors.title = "Title is required";
    if (!description.trim()) errors.description = "Description is required";
    if (!category) errors.category = "Category is required";
    if (!designer.trim()) errors.designer = "Designer name is required";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Please fill the required fields");
      return;
    }

    setFieldErrors({});
    setFormError("");

    if (!file) {
      alert("Please select a 3D model file first");
      return;
    }

    const formData = new FormData();

    formData.append("title", title);
    formData.append("author", designer);
    formData.append("model", file);

    // ADD THUMBNAIL
    if (thumbnail) {
      formData.append("thumbnail", thumbnail);
    }

    try {
      const response = await fetch("http://localhost:5000/upload-model", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorData.error || "Upload failed: " + errorText);
      }

      alert("Model uploaded successfully!");
      window.location.href = "/";
    } catch (error) {
      console.error(error);
      const errorData = await response.json();
      alert(errorData.error || "Upload failed");
      
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white px-10 py-12">

      <div className="max-w-6xl mx-auto grid grid-cols-2 gap-16">

        {/* LEFT SIDE FORM */}
        <div className="space-y-6">

          {formError && (
            <div className="bg-red-500 text-white px-4 py-2 rounded mb-4">
              {formError}
            </div>
          )}

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
            {fieldErrors.title && (
              <p className="text-red-400 text-sm mt-1">{fieldErrors.title}</p>
            )}
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
            {fieldErrors.description && (
              <p className="text-red-400 text-sm mt-1">{fieldErrors.description}</p>
            )}
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
            {fieldErrors.category && (
              <p className="text-red-400 text-sm mt-1">{fieldErrors.category}</p>
            )}
          </div>

          <div>
            <label className="block text-sm mb-2">Designer Name</label>
            <input
              value={designer}
              onChange={(e) => setDesigner(e.target.value)}
              className="w-full px-4 py-2 rounded bg-zinc-800 border border-zinc-700"
              placeholder="Enter your name"
            />
            {fieldErrors.designer && (
              <p className="text-red-400 text-sm mt-1">{fieldErrors.designer}</p>
            )}
          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-8">

          {/* MODEL UPLOAD */}
          <div className="bg-zinc-800 rounded-lg p-8 border border-zinc-700 text-center">

            <p className="text-sm mb-4 text-zinc-400">
              Upload 3D Model (.glb/.gltf)
            </p>

            <div className="flex justify-center gap-4">

              <label className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded cursor-pointer">
                Choose File
                <input
                  id="fileInput"
                  type="file"
                  accept=".glb,.gltf"
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

          {/* THUMBNAIL UPLOAD */}
          <div className="bg-zinc-800 rounded-lg p-6 border border-zinc-700 text-center">

            <p className="text-sm mb-4 text-zinc-400">
              Upload Thumbnail Image (PNG/JPG)
            </p>

            <label className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded cursor-pointer">
              Choose Thumbnail
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleThumbnailChange}
                className="hidden"
              />
            </label>

            {thumbnailPreview && (
              <img
                src={thumbnailPreview}
                className="mt-4 rounded w-full h-[150px] object-cover border border-zinc-600"
              />
            )}

          </div>

          {/* MODEL PREVIEW */}
          <div className="bg-zinc-800 rounded-lg h-[300px] border border-zinc-700 overflow-hidden">

            {invalidFile ? (
              <div className="flex items-center justify-center h-full text-red-400">
                Invalid file type. Please upload a .glb or .gltf model.
              </div>
            ) : previewUrl ? (
              <ModelViewer modelUrl={previewUrl} />
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-400">
                Upload a model to preview
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