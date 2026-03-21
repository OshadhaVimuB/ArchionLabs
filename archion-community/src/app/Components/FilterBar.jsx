"use client";
import { useState, useRef, useEffect } from "react";

export default function FilterBar({
  searchTerm,
  setSearchTerm,
  setSelectedDate,
  filter,
  setFilter,
  selectedCategory,
  setSelectedCategory
}) {

  const [open, setOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
        setShowCalendar(false);
        setShowCategory(false);
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
            <div className="absolute mt-2 bg-white text-black rounded shadow w-44 z-50">

              {/* CATEGORY */}
              <div className="relative">

                <div
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between"
                  onClick={() => setShowCategory(!showCategory)}
                >
                  Category ▶
                </div>

                {showCategory && (
                  <div className="absolute left-full top-0 ml-1 bg-white text-black rounded shadow w-48 z-50">

                    {[
                      { name: "All", icon: "📁" },
                      { name: "Walls", icon: "🧱" },
                      { name: "Stairs", icon: "🪜" },
                      { name: "Doors", icon: "🚪" },
                      { name: "Windows", icon: "🪟" },
                      { name: "Furniture", icon: "🛋" },
                      { name: "Lighting", icon: "💡" },
                      { name: "Flooring", icon: "🪵" },
                      { name: "Roof", icon: "🏠" },
                      { name: "Exterior", icon: "🌳" },
                      { name: "Decor", icon: "🖼" }
                    ].map((item) => (
                      <div
                        key={item.name}
                        onClick={() => {
                          setSelectedCategory(item.name === "All" ? "" : item.name);
                          setShowCategory(false);
                          setOpen(false);
                        }}
                        className={`px-3 py-2 cursor-pointer flex items-center gap-2 hover:bg-gray-100 ${
                          selectedCategory === item.name ||
                          (item.name === "All" && selectedCategory === "")
                            ? "bg-blue-100 font-semibold"
                            : ""
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.name}</span>
                      </div>
                    ))}

                  </div>
                )}
              </div>

              {/* DATE */}
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
                        setOpen(false);
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
      <div className="flex flex-wrap gap-2">

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