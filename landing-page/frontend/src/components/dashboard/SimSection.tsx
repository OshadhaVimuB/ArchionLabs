"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AnalyticsData {
  summary?: {
    total_agents?: number;
    avg_speed?: number;
    max_density?: number;
  };
}

export function SimSection() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_ARCHION_SIM_API_URL || "http://localhost:8001"}/api/analytics`,
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
          setError("Failed to load analytics");
          return;
        }

        const data = await res.json();
        if (data.status === "done") {
          setAnalytics(data.data);
        } else {
          setAnalytics(null);
        }
      } catch {
        setError("Service unavailable");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  return (
    <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔬</span>
          <div>
            <h3 className="text-lg font-semibold text-white">Archion Sim</h3>
            <p className="text-sm text-neutral-500">Movement simulation & compliance</p>
          </div>
        </div>
        <a
          href={process.env.NEXT_PUBLIC_ARCHION_SIM_FRONTEND_URL || "http://localhost:3002"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-full transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-105"
        >
          Open App
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-neutral-500 text-sm py-4">
          <div className="w-4 h-4 border-2 border-neutral-600 border-t-white rounded-full animate-spin" />
          Loading analytics...
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && !analytics && (
        <p className="text-neutral-600 text-sm py-4">No simulation data yet. Upload a model and run a simulation!</p>
      )}

      {!loading && !error && analytics?.summary && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#0a0a0a] border border-neutral-800 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-white">{analytics.summary.total_agents || 0}</p>
            <p className="text-xs text-neutral-500 mt-1">Agents</p>
          </div>
          <div className="bg-[#0a0a0a] border border-neutral-800 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-white">{(analytics.summary.avg_speed || 0).toFixed(2)}</p>
            <p className="text-xs text-neutral-500 mt-1">Avg Speed</p>
          </div>
          <div className="bg-[#0a0a0a] border border-neutral-800 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-white">{(analytics.summary.max_density || 0).toFixed(2)}</p>
            <p className="text-xs text-neutral-500 mt-1">Max Density</p>
          </div>
        </div>
      )}
    </div>
  );
}
