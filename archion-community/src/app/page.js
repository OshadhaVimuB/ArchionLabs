"use client";

import Link from "next/link";
import FilterBar from "./Components/FilterBar";
import TemplateGrid from "./Components/TemplateGrid";
import { useState, useEffect } from "react";

export default function Home() {

  const [templates, setTemplates] = useState([]);
  const[page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {

  async function loadTemplates() {

    try {
      const res = await fetch(`http://localhost:5000/templates?page=${page}`);
      const data = await res.json();

      console.log("Loaded templates:", data);

      setTemplates(data);

    } catch (error) {
      console.error("Failed to load templates:", error);
    }

  }

  loadTemplates();

}, [page]);

  const handleDelete = async () => {

    if (deleteMode) {

      for (let id of selectedIds) {
        await fetch(`http://localhost:5000/templates/${id}`, {
          method: "DELETE"
        });
      }

      setSelectedIds([]);
      setDeleteMode(false);

      const res = await fetch("http://localhost:5000/templates");
      const data = await res.json();
      setTemplates(data);

    } else {
      setDeleteMode(true);
    }

  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white">

      {/* PAGE TITLE */}
      <div className="px-8 mt-6">
        <h1 className="text-2xl font-semibold">Community Library</h1>
      </div>

      {/* FILTER BAR */}
      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {/* BUTTON SECTION */}
      <div className="flex justify-between items-center px-8 mt-6 mb-6">

        {/* LEFT SIDE */}
        <Link href="/upload">
          <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded text-white">
            + Upload Template
          </button>
        </Link>

        {/* RIGHT SIDE */}
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white"
        >
          {deleteMode ? "Confirm Delete" : "Delete Template"}
        </button>

      </div>

      {/* TEMPLATE GRID */}
      <div className="px-8">

        <TemplateGrid
          templates={templates}
          searchTerm={searchTerm}
          deleteMode={deleteMode}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
        />

        <div className="flex justify-center gap-4 mt-10">

<button
onClick={() => setPage(page - 1)}
disabled={page === 1}
className="px-4 py-2 bg-zinc-700 rounded hover:bg-zinc-600"
>
Previous
</button>

<span className="px-4 py-2 text-zinc-300">
Page {page}
</span>

<button
onClick={() => setPage(page + 1)}
className="px-4 py-2 bg-zinc-700 rounded hover:bg-zinc-600"
>
Next
</button>

</div>
        


      </div>

    </div>
  );
}