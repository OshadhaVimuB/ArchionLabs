"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BarChart3,
    X,
    Activity,
    Gauge,
    Users,
    TrendingUp,
    Loader2,
} from "lucide-react";

type AnalyticsLite = {
    summary: { avg_velocity_ms: number };
    congestion_index: { percentage: number };
    efficiency_score: { average: number };
    flow_rate: { time_sec: number; agents_per_minute: number }[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";


// Metric Card


function MetricCard({
                        icon,
                        label,
                        value,
                        unit,
                        color = "text-cyan-400",
                        status,
                    }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    unit: string;
    color?: string;
    status?: "good" | "warning" | "critical";
}) {
    const statusDot =
        status === "good"
            ? "bg-green-400"
            : status === "warning"
                ? "bg-yellow-400"
                : status === "critical"
                    ? "bg-red-400"
                    : null;

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
            <div className="mb-1 flex items-center gap-1.5">
                {icon}
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
          {label}
        </span>
                {statusDot && <span className={`ml-auto h-2 w-2 rounded-full ${statusDot}`} />}
            </div>

            <p className={`text-lg font-bold ${color}`}>
                {value}
                <span className="ml-1 text-xs text-zinc-500">{unit}</span>
            </p>
        </div>
    );
}


// Efficiency Gauge (SVG)


function describeArc(
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number,
): string {
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy - r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy - r * Math.sin(endAngle);
    const largeArc = Math.abs(startAngle - endAngle) > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 0 ${x2} ${y2}`;
}

function EfficiencyGauge({ score }: { score: number }) {
    const pct = Math.max(0, Math.min(1, score));

    const r = 45;
    const cx = 60;
    const cy = 55;
    const startAngle = Math.PI;
    const endAngle = 0;
    const totalArc = Math.PI;

    const bgPath = describeArc(cx, cy, r, startAngle, endAngle);
    const fillAngle = startAngle - totalArc * pct;
    const fillPath = describeArc(cx, cy, r, startAngle, fillAngle);

    let color = "#DC2626"; // red
    if (pct >= 0.8) color = "#16a34a"; // green
    else if (pct >= 0.6) color = "#EAB308"; // yellow

    return (
        <div className="flex flex-col items-center">
            <svg viewBox="0 0 120 65" className="h-16 w-full">
                <path
                    d={bgPath}
                    fill="none"
                    stroke="#27272a"
                    strokeWidth="8"
                    strokeLinecap="round"
                />
                <path
                    d={fillPath}
                    fill="none"
                    stroke={color}
                    strokeWidth="8"
                    strokeLinecap="round"
                />
                <text
                    x={cx}
                    y={50}
                    textAnchor="middle"
                    fill="#e4e4e7"
                    fontSize="16"
                    fontWeight="bold"
                >
                    {(pct * 100).toFixed(0)}%
                </text>
                <text
                    x={cx}
                    y={62}
                    textAnchor="middle"
                    fill="#71717a"
                    fontSize="7"
                >
                    Efficiency
                </text>
            </svg>
        </div>
    );
}


// Main Component


export function AnalyticsDashboard({
                                       analyticsData,
                                       loading,
                                       onRequestAnalytics,
                                   }: {
    analyticsData: AnalyticsLite | null;
    loading: boolean;
    onRequestAnalytics: () => void;
}) {
    const [panelOpen, setPanelOpen] = useState(false);

    const handleToggle = useCallback(() => {
        setPanelOpen((p) => !p);
    }, []);

    const avgFlowRate =
        analyticsData && analyticsData.flow_rate.length > 0
            ? analyticsData.flow_rate.reduce((s, p) => s + p.agents_per_minute, 0) /
            analyticsData.flow_rate.length
            : 0;

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

                        {/* Scrollable content */}
                        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3 pb-24">
                            {loading && !analyticsData ? (
                                <div className="flex flex-col items-center gap-3 py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                                    <p className="text-xs text-zinc-400">Computing analytics...</p>
                                </div>
                            ) : !analyticsData ? (
                                <div className="flex flex-col items-center gap-3 py-12">
                                    <Activity className="h-8 w-8 text-zinc-600" />
                                    <p className="text-xs text-zinc-500">No analytics data yet</p>

                                    <button
                                        onClick={onRequestAnalytics}
                                        className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs text-white hover:bg-cyan-500"
                                    >
                                        Compute Analytics
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* KPI cards*/}
                                    <div className="grid grid-cols-2 gap-2">
                                        <MetricCard
                                            icon={<Activity className="h-3.5 w-3.5 text-cyan-400" />}
                                            label="Avg Velocity"
                                            value={analyticsData.summary.avg_velocity_ms.toFixed(2)}
                                            unit="m/s"
                                        />

                                        <MetricCard
                                            icon={<Users className="h-3.5 w-3.5 text-orange-400" />}
                                            label="Congestion"
                                            value={analyticsData.congestion_index.percentage.toFixed(1)}
                                            unit="%"
                                            color={
                                                analyticsData.congestion_index.percentage > 30
                                                    ? "text-red-400"
                                                    : analyticsData.congestion_index.percentage > 15
                                                        ? "text-yellow-400"
                                                        : "text-green-400"
                                            }
                                            status={
                                                analyticsData.congestion_index.percentage > 30
                                                    ? "critical"
                                                    : analyticsData.congestion_index.percentage > 15
                                                        ? "warning"
                                                        : "good"
                                            }
                                        />

                                        <MetricCard
                                            icon={<Gauge className="h-3.5 w-3.5 text-emerald-400" />}
                                            label="Efficiency"
                                            value={(analyticsData.efficiency_score.average * 100).toFixed(1)}
                                            unit="%"
                                            color={
                                                analyticsData.efficiency_score.average >= 0.8
                                                    ? "text-green-400"
                                                    : analyticsData.efficiency_score.average >= 0.6
                                                        ? "text-yellow-400"
                                                        : "text-red-400"
                                            }
                                            status={
                                                analyticsData.efficiency_score.average >= 0.8
                                                    ? "good"
                                                    : analyticsData.efficiency_score.average >= 0.6
                                                        ? "warning"
                                                        : "critical"
                                            }
                                        />

                                        <MetricCard
                                            icon={<TrendingUp className="h-3.5 w-3.5 text-blue-400" />}
                                            label="Flow Rate"
                                            value={avgFlowRate.toFixed(1)}
                                            unit="agents/min"
                                        />
                                    </div>

                                    {/* ---- Efficiency gauge ---- */}
                                    <div>
                                        <h4 className="mb-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                                            Path Efficiency
                                        </h4>
                                        <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
                                            <EfficiencyGauge score={analyticsData.efficiency_score.average} />
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 text-xs text-zinc-500">

                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}