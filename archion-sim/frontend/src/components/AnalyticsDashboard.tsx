"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, X, Activity, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function AnalyticsDashboard({
                                       analyticsData,
                                       loading,
                                       onRequestAnalytics,
                                   }: {
    analyticsData: any;
    loading: boolean;
    onRequestAnalytics: () => void;
}) {
    const [panelOpen, setPanelOpen] = useState(false);

    const handleToggle = useCallback(() => {
        setPanelOpen((p) => {
            if (!p && !analyticsData && !loading) {
                onRequestAnalytics();
            }
            return !p;
        });
    }, [analyticsData, loading, onRequestAnalytics]);

    return (
        <>
            {/* Floating button */}
            <button
                onClick={handleToggle}
                className="absolute bottom-24 left-4 z-20 flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/90 px-4 py-3 shadow-2xl backdrop-blur-md transition hover:bg-zinc-800"
            >
                <BarChart3 className="h-5 w-5 text-cyan-400" />
                <span className="text-xs font-medium text-zinc-300">Analytics</span>
            </button>

            {/* Sliding panel */}
            <AnimatePresence>
                {panelOpen && (
                    <motion.div
                        initial={{ x: -400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -400, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="absolute bottom-0 left-0 top-0 z-30 flex w-[380px] flex-col overflow-hidden border-r border-zinc-700 bg-zinc-950/95 backdrop-blur-xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-cyan-400" />
                                <h3 className="text-sm font-semibold text-zinc-200">
                                    Analytics Dashboard
                                </h3>
                            </div>

                            <button
                                onClick={() => setPanelOpen(false)}
                                className="rounded-md p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 px-4 py-6">
                            {loading && !analyticsData ? (
                                <div className="flex flex-col items-center gap-3 py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                                    <p className="text-xs text-zinc-400">
                                        Computing analytics...
                                    </p>
                                </div>
                            ) : !analyticsData ? (
                                <div className="flex flex-col items-center gap-3 py-12">
                                    <Activity className="h-8 w-8 text-zinc-600" />
                                    <p className="text-xs text-zinc-500">
                                        No analytics data yet
                                    </p>

                                    <button
                                        onClick={onRequestAnalytics}
                                        className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs text-white hover:bg-cyan-500"
                                    >
                                        Compute Analytics
                                    </button>
                                </div>
                            ) : (
                                <div className="text-xs text-zinc-400 text-center py-12">

                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}