"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
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
    <nav className="flex items-center justify-between px-8 py-4 bg-black text-white">
      
      {/* Logo */}
      <div className="flex items-center gap-2 text-xl font-semibold">
        <span className="text-2xl">▲</span>
        <span>ArchionLabs</span>
      </div>

      {/* Links */}
      <div className="flex items-center gap-8 text-sm relative">

        {/* Products Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="hover:text-gray-300"
          >
            Products ▾
          </button>

          {open && (
            <div className="absolute top-8 left-0 bg-white text-black rounded shadow-lg w-40 py-2">
              <Link
                href="/"
                className="block px-4 py-2 hover:bg-gray-100"
              >
                
              </Link>
              <Link
                href="/"
                className="block px-4 py-2 hover:bg-gray-100"
              >
                
              </Link>
            </div>
          )}
        </div>

        <Link href="#" className="hover:text-gray-300">
          How it works
        </Link>

        <Link href="#" className="hover:text-gray-300">
          Pricing
        </Link>

        <Link href="/templates" className="hover:text-gray-300">
          Community
        </Link>

      </div>
    </nav>
  );
}