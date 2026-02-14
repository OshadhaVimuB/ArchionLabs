"use client";
import { useState, useRef, useEffect } from "react";

export default function FilterBar({ searchTerm, setSearchTerm }) {
  const [active, setActive] = useState("Trending");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex items-center justify-between px-8 py-3 bg-zinc-900 text-white border-b border-zinc-800">

      {/* LEFT SIDE */}
      <div className="flex items-center gap-4 relative">

        {/* Filters Button */}
        <div ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
          >
            Filters ▾
          </button>

          {open && (
            <div className="absolute mt-2 bg-white text-black rounded shadow w-40">
              <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                Category
              </div>
              <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                Date
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <button
          onClick={() => setActive("Top")}
          className={`px-3 py-1 rounded ${
            active === "Top"
              ? "bg-white text-black"
              : "bg-zinc-800 hover:bg-zinc-700"
          }`}
        >
          Top
        </button>

        <button
          onClick={() => setActive("Trending")}
          className={`px-3 py-1 rounded ${
            active === "Trending"
              ? "bg-white text-black"
              : "bg-zinc-800 hover:bg-zinc-700"
          }`}
        >
          Trending
        </button>

        <button
          onClick={() => setActive("Recent")}
          className={`px-3 py-1 rounded ${
            active === "Recent"
              ? "bg-white text-black"
              : "bg-zinc-800 hover:bg-zinc-700"
          }`}
        >
          Recent
        </button>

      </div>

      {/* RIGHT SIDE */}
      <div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search"
          className="px-3 py-1 rounded bg-zinc-800 text-white"
        />
        <button onClick={() => console.log("Searching:", searchTerm)}
    className="px-4 py-1 bg-green-600 rounded hover:bg-green-500 transition">
  
    Search
  </button>
      </div>

    </div>
  );
}