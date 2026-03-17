"use client";

import { useEffect, useState } from "react";

interface Template {
  id: number;
  title: string;
  author: string;
  modelUrl: string;
  createdAt: string;
}

export function CommunitySection() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_ARCHION_COMMUNITY_API_URL || "http://localhost:5000"}/templates`
        );

        if (!res.ok) {
          setError("Failed to load community templates");
          return;
        }

        const data = await res.json();
        setTemplates(data.templates || []);
      } catch {
        setError("Service unavailable");
      } finally {
        setLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  return (
    <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">🌐</span>
        <div>
          <h3 className="text-lg font-semibold text-white">Archion Community</h3>
          <p className="text-sm text-neutral-500">Shared 3D model templates</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-neutral-500 text-sm py-4">
          <div className="w-4 h-4 border-2 border-neutral-600 border-t-white rounded-full animate-spin" />
          Loading templates...
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && templates.length === 0 && (
        <p className="text-neutral-600 text-sm py-4">No community templates yet.</p>
      )}

      {!loading && !error && templates.length > 0 && (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-[#0a0a0a] border border-neutral-800 rounded-xl p-3 hover:border-neutral-700 transition-colors"
            >
              <p className="text-sm text-white font-medium">{template.title}</p>
              <p className="text-xs text-neutral-500 mt-1">by {template.author}</p>
              <p className="text-xs text-neutral-600 mt-1">
                {new Date(template.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
