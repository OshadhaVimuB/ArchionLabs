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
    <div className="p-10 text-white bg-zinc-900 min-h-screen">

      <h1 className="text-xl mb-4">Edit Template</h1>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="block mb-4 p-2 bg-zinc-800"
      />
 
      <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author"/>



      <input
        type="file"
        onChange={(e) => setThumbnail(e.target.files[0])}
        className="mb-4"
      />

      <button
        onClick={handleUpdate}
        className="bg-green-600 px-4 py-2 rounded"
      >
        Save Changes
      </button>

    </div>
  );
}