"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Files,
  Trash2,
  Settings,
  Hexagon
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar({ user }: { user: any }) {
  const pathname = usePathname();

  return (
    <aside className="w-[280px] h-screen bg-zinc-50 dark:bg-[#09090b] border-r border-zinc-200 dark:border-zinc-800 flex flex-col hidden lg:flex text-zinc-900 dark:text-zinc-300 transition-colors">
      
      {/* Brand Logo & Name */}
      <div className="p-5 flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 mb-4 h-16">
        <div className="flex items-center justify-center w-8 h-8">
          <img src="/Assets/favicon.svg" alt="ArchionLabs Logo" className="w-8 h-8 object-contain" />
        </div>
        <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">ArchionLabs</span>
      </div>

      {/* Search */}
      <div className="px-4 pb-6">
        <div className="relative group">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search projects..." 
            className="w-full bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-md pl-9 pr-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-300 transition-all shadow-sm"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto mt-2">
        <ul className="space-y-1 px-3">
          {[
            { name: "All projects", icon: Files, href: "/dashboard" },
            { name: "Trash", icon: Trash2, href: "#" },
            { name: "Settings", icon: Settings, href: "#" },
          ].map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all",
                    isActive
                      ? "bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/30"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
