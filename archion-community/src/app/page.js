"use client";

import Link from "next/link";
import FilterBar from "./Components/FilterBar";
import TemplateGrid from "./Components/TemplateGrid";
import { useState, useEffect } from "react";

export default function Home() {

  const [templates, setTemplates] = useState([]);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filter, setFilter] = useState("recent");

  // 🔄 LOAD TEMPLATES
  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch(`http://localhost:5000/templates?page=${page}&limit=8`);
        const data = await res.json();
        setTemplates(data.templates || []);
      } catch (error) {
        console.error("Failed to load templates:", error);
        setTemplates([]);
      }
    }

    loadTemplates();
  }, [page]);

  // 🗑 DELETE FUNCTION
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
      setTemplates(data.templates);

    } else {
      setDeleteMode(true);
    }
  };

  // 🔥 FILTERING LOGIC (CORRECT PLACE)
  let filteredTemplates = [...templates];

  // 🔍 Search
  if (searchTerm) {
    filteredTemplates = filteredTemplates.filter((t) =>
      t.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // 📅 Date filter
  if (selectedDate) {
    filteredTemplates = filteredTemplates.filter((t) =>
      t.createdAt.startsWith(selectedDate)
    );
  }

  // ⭐ Sorting
  if (filter === "Top") {
    filteredTemplates.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  }

  if (filter === "Recent") {
    filteredTemplates.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  if (filter === "Trending") {
    filteredTemplates.sort((a, b) => {
      const scoreA =
        (a.likes || 0) -
        (Date.now() - new Date(a.createdAt)) / 10000000;

      const scoreB =
        (b.likes || 0) -
        (Date.now() - new Date(b.createdAt)) / 10000000;

      return scoreB - scoreA;
    });
  }

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
        filter={filter}
        setFilter={setFilter}
        setSelectedDate={setSelectedDate}
      />

      {/* BUTTON SECTION */}
      <div className="flex justify-between items-center px-8 mt-6 mb-6">

        {/* Upload */}
        <Link href="/upload">
          <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded text-white">
            + Upload Template
          </button>
        </Link>

        {/* Delete */}
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
          templates={filteredTemplates}  // ✅ FIXED
          searchTerm={searchTerm}
          deleteMode={deleteMode}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          filter={filter}
        />

        {/* PAGINATION */}
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