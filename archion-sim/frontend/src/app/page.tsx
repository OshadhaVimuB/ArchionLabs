"use client";

import { useCallback, useState } from "react";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { ViolationPanel } from "@/components/ViolationMonitor";

export default function Home() {
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    const [complianceReport, setComplianceReport] = useState<any>(null);
    const [complianceLoading] = useState(false);

    const handleFocusViolation = (violation: any) => {
        console.log("Focus violation:", violation);
    };

    const handleRequestAnalytics = useCallback(() => {
        setAnalyticsLoading(true);

        setTimeout(() => {
            setAnalyticsData({
                summary: { avg_velocity_ms: 0.92 },
                congestion_index: { percentage: 18.4 },
                efficiency_score: { average: 0.76 },
                flow_rate: [
                    { time_sec: 0, agents_per_minute: 8 },
                    { time_sec: 5, agents_per_minute: 12 },
                    { time_sec: 10, agents_per_minute: 15 },
                ],
            });

            setComplianceReport({
                total_violations: 2,
                violations: [
                    {
                        id: "v1",
                        type: "corridor_width",
                        severity: "high",
                        coordinate: { x: 1, y: 2, z: 0 },
                        measured_value: 1.1,
                        required_value: 1.5,
                        description: "Corridor width is below the required minimum.",
                        regulation: "UDA Section 4.1.3",
                    },
                    {
                        id: "v2",
                        type: "door_width",
                        severity: "medium",
                        coordinate: { x: 3, y: 1, z: 0 },
                        measured_value: 0.8,
                        required_value: 0.9,
                        description: "Door width is below the required minimum.",
                        regulation: "UDA Section 4.2.1",
                    },
                ],
            });

            setAnalyticsLoading(false);
        }, 800);
    }, []);

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-zinc-950">
            <AnalyticsDashboard
                analyticsData={analyticsData}
                loading={analyticsLoading}
                onRequestAnalytics={handleRequestAnalytics}
            />

            <ViolationPanel
                report={complianceReport}
                loading={complianceLoading}
                onFocusViolation={handleFocusViolation}
            />
        </div>
    );
}