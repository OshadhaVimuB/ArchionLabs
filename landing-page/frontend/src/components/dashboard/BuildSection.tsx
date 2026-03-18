"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export function BuildSection() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_ARCHION_BUILD_API_URL || "http://localhost:8000"}/api/v1/generate/projects`,
          {
            headers: {
              Authorization: `Bearer ${session?.access_token || ""}`,
            },
          }
        );

        if (res.status === 401) {
          setError("Not authorized");
          return;
        }

        if (!res.ok) {
          setError("Failed to load projects");
          return;
        }

        const data = await res.json();
        setProjects(data.projects || []);
      } catch {
        setError("Service unavailable");
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  return (
    <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏗️</span>
          <div>
            <h3 className="text-lg font-semibold text-white">Archion Build</h3>
            <p className="text-sm text-neutral-500">AI-powered floor plan generation</p>
          </div>
        </div>
        <a
          href={process.env.NEXT_PUBLIC_ARCHION_BUILD_FRONTEND_URL || "http://localhost:3001"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-full transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105"
        >
          Open App
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-neutral-500 text-sm py-4">
          <div className="w-4 h-4 border-2 border-neutral-600 border-t-white rounded-full animate-spin" />
          Loading projects...
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <p className="text-neutral-600 text-sm py-4">No projects yet. Create your first floor plan!</p>
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-[#0a0a0a] border border-neutral-800 rounded-xl p-3 hover:border-neutral-700 transition-colors"
            >
              <p className="text-sm text-white font-medium">{project.name}</p>
              {project.description && (
                <p className="text-xs text-neutral-500 mt-1 line-clamp-1">{project.description}</p>
              )}
              <p className="text-xs text-neutral-600 mt-1">
                {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
