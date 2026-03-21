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
  const [filter, setFilter] = useState("Recent");
  const [selectedCategory, setSelectedCategory] = useState("");

  const itemsPerPage = 8;

  // 🔄 LOAD ALL TEMPLATES (NO PAGINATION HERE)
  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch(`http://localhost:5000/templates`);
        const data = await res.json();
        setTemplates(data.templates || []);
      } catch (error) {
        console.error("Failed to load templates:", error);
        setTemplates([]);
      }
    }

    loadTemplates();
  }, []);

  // 🔁 RESET PAGE WHEN FILTER CHANGES
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCategory, selectedDate, filter]);

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

  // 🔥 FILTERING
  let filteredTemplates = [...templates];

  // 🔍 Search
  if (searchTerm) {
    filteredTemplates = filteredTemplates.filter((t) =>
      t.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // 📂 Category
  if (selectedCategory) {
    filteredTemplates = filteredTemplates.filter(t =>
      t.category?.toLowerCase().trim() === selectedCategory.toLowerCase().trim()
    );
  }

  // 📅 Date
  if (selectedDate) {
    filteredTemplates = filteredTemplates.filter(t =>
      new Date(t.createdAt).toDateString() === selectedDate.toDateString()
    );
  }

  // ⭐ Sorting
  if (filter === "Top") {
    filteredTemplates = filteredTemplates.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  }

  if (filter === "Trending") {
    filteredTemplates = filteredTemplates.sort((a, b) => (b.views || 0) - (a.views || 0));
  }

  if (filter === "Recent") {
    filteredTemplates = filteredTemplates.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  // 🔥 PAGINATION (AFTER FILTERING)
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;

  const currentTemplates = filteredTemplates.slice(start, end);

  return (
    <div className="min-h-screen bg-zinc-900 text-white">

      <div className="px-8 mt-6">
        <h1 className="text-2xl font-semibold">Community Library</h1>
      </div>

      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filter={filter}
        setFilter={setFilter}
        setSelectedDate={setSelectedDate}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center px-4 sm:px-8 mt-6 mb-6">

        <Link href="/upload">
          <button className="px-4 py-2 bg-white text-black rounded hover:bg-zinc-200 transition">
            + Upload Template
          </button>
        </Link>

        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-white text-black rounded hover:bg-zinc-200 transition"
        >
          {deleteMode ? "Confirm Delete" : "Delete Template"}
        </button>

      </div>

      <div className="px-8">

        {/* ✅ USE PAGINATED DATA */}
        <TemplateGrid
          templates={currentTemplates}
          deleteMode={deleteMode}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
        />

        {/* PAGINATION */}
        <div className="flex justify-center gap-4 mt-10">

          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 bg-zinc-700 rounded"
          >
            Previous
          </button>

          <span className="px-4 py-2 text-zinc-300">
            Page {page}
          </span>

          <button
            onClick={() => {
              if (end < filteredTemplates.length) {
                setPage(page + 1);
              }
            }}
            className="px-4 py-2 bg-zinc-700 rounded"
          >
            Next
          </button>

        </div>

      </div>

    </div>
  );
}