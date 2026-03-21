"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function EditTemplate() {

  const { id } = useParams();

  const [title, setTitle] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [author, setAuthor] = useState("");

  useEffect(() => {
    async function loadTemplate() {
      const res = await fetch(`http://localhost:5000/templates/${id}`);
      const data = await res.json();
      setTitle(data.title);
      setAuthor(data.author);
    }
    loadTemplate();
  }, [id]);

  const handleUpdate = async () => {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("author", author);
    

    if (thumbnail) {
      formData.append("thumbnail", thumbnail);
    }

    await fetch(`http://localhost:5000/templates/${id}`, {
      method: "PUT",
      body: formData
    });

    alert("Updated successfully!");
    window.location.href = "/";
  };

  return (
  <div className="min-h-screen bg-zinc-900 text-white flex justify-s
   items-start p-10">

    <div className="w-full max-w-lg bg-zinc-800 p-8 rounded-lg shadow-lg">

      <h1 className="text-2xl font-semibold mb-6">Edit Template</h1>

      {/* TITLE */}
      <div className="mb-4">
        <label className="block text-sm text-zinc-400 mb-1">
          Title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 rounded bg-zinc-700 border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter template title"
        />
      </div>

      {/* DESIGNER NAME */}
      <div className="mb-4">
        <label className="block text-sm text-zinc-400 mb-1">
          Designer Name
        </label>
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="w-full px-4 py-2 rounded bg-zinc-700 border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter designer name"
        />
      </div>

      {/* THUMBNAIL */}
      <div className="mb-6">
        <label className="block text-sm text-zinc-400 mb-1">
          Update Thumbnail (optional)
        </label>
        <input
          type="file"
          onChange={(e) => setThumbnail(e.target.files[0])}
          className="w-full text-sm text-zinc-300"
        />
      </div>

      {/* BUTTON */}
      <button
        onClick={handleUpdate}
        className="w-full py-2 bg-green-600 hover:bg-green-500 rounded text-white font-medium transition"
      >
        Save Changes
      </button>

    </div>

  </div>
);
}