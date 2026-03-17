"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface SharedModel {
  token: string;
  model_name: string;
  model_format: string;
  expires_at: string;
  access_count: number;
  share_url: string;
}

export function ViewerSection() {
  const [shares, setShares] = useState<SharedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchShares() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_ARCHION_VIEWER_API_URL || "http://localhost:8002"}/api/share`,
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
          setError("Failed to load shared models");
          return;
        }

        const data = await res.json();
        setShares(Array.isArray(data) ? data : []);
      } catch {
        setError("Service unavailable");
      } finally {
        setLoading(false);
      }
    }
    fetchShares();
  }, []);

  return (
    <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">👁️</span>
        <div>
          <h3 className="text-lg font-semibold text-white">Archion Viewer</h3>
          <p className="text-sm text-neutral-500">3D model viewing & sharing</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-neutral-500 text-sm py-4">
          <div className="w-4 h-4 border-2 border-neutral-600 border-t-white rounded-full animate-spin" />
          Loading shared models...
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && shares.length === 0 && (
        <p className="text-neutral-600 text-sm py-4">No shared models yet. Upload and share a 3D model!</p>
      )}

      {!loading && !error && shares.length > 0 && (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {shares.map((share) => (
            <div
              key={share.token}
              className="bg-[#0a0a0a] border border-neutral-800 rounded-xl p-3 hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-white font-medium">{share.model_name}</p>
                <span className="text-xs text-neutral-600 bg-neutral-800 px-2 py-0.5 rounded-full uppercase">
                  {share.model_format}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-neutral-500">{share.access_count} views</p>
                <p className="text-xs text-neutral-600">
                  Expires {new Date(share.expires_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
