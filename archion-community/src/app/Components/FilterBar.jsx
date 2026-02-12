"use client";

export default function FilterBar() {
  return (
    <div className="flex items-center justify-between px-8 py-3 bg-zinc-900 text-white border-b border-zinc-800">
      
      {/* LEFT SIDE */}
      <div className="flex items-center gap-4">
        <button>Filters</button>
        <button>Top</button>
        <button>Trending</button>
        <button>Recent</button>
      </div>

      {/* RIGHT SIDE */}
      <div>
        <input
          type="text"
          placeholder="Search"
          className="px-3 py-1 rounded bg-zinc-800 text-white"
        />
      </div>

    </div>
  );
}