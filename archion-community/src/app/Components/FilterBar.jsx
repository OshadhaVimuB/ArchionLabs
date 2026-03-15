"use client";
import { useState, useRef, useEffect } from "react";

export default function FilterBar({
  searchTerm,
  setSearchTerm,
  setSelectedDate,
  filter,
  setFilter
}) {

  const [open, setOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
        setShowCalendar(false);
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

        {/* Filters dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
          >
            Filters ▾
          </button>

          {open && (
            <div className="absolute mt-2 bg-white text-black rounded shadow w-40 z-50">

              <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                Category
              </div>

              {/* Date option */}
              <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer relative">
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="w-full text-left"
                >
                  Date
                </button>
                {showCalendar && (
                  <div className="absolute top-full left-0 mt-2 bg-zinc-800 p-3 rounded shadow-lg z-50">
                    <input
                      type="date"
                      onChange={(e) => {
                        setSelectedDate(new Date(e.target.value));
                        setShowCalendar(false);
                      }}
                      className="bg-zinc-700 text-white p-2 rounded"
                    />
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Top button */}
        <button
          onClick={() => setFilter("Top")}
          className={`px-3 py-1 rounded ${
            filter === "Top"
              ? "bg-white text-black"
              : "bg-zinc-800 hover:bg-zinc-700"
          }`}
        >
          Top
        </button>

        {/* Trending button */}
        <button
          onClick={() => setFilter("Trending")}
          className={`px-3 py-1 rounded ${
            filter === "Trending"
              ? "bg-white text-black"
              : "bg-zinc-800 hover:bg-zinc-700"
          }`}
        >
          Trending
        </button>

        {/* Recent button */}
        <button
          onClick={() => setFilter("Recent")}
          className={`px-3 py-1 rounded ${
            filter === "Recent"
              ? "bg-white text-black"
              : "bg-zinc-800 hover:bg-zinc-700"
          }`}
        >
          Recent
        </button>

      </div>

      {/* RIGHT SIDE */}
      <div className="flex gap-2">

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search"
          className="px-3 py-1 rounded bg-zinc-800 text-white"
        />

        <button
          onClick={() => console.log("Searching:", searchTerm)}
          className="px-4 py-1 bg-green-600 rounded hover:bg-green-500 transition"
        >
          Search
        </button>

      </div>

    </div>
  );
}