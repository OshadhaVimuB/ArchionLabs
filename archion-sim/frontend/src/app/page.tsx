"use client";

import { useCallback, useState } from "react";
import { AnalyticsDashboard } from "../components/AnalyticsDashboard";
import { ViolationPanel } from "../components/ViolationMonitor";


export default function Home() {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    const [complianceReport, setComplianceReport] = useState<any>(null);
    const [complianceLoading, setComplianceLoading] = useState(false);

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
                flow_rate: [],
            });

            // fake violation data for now
            setComplianceReport({
                total_violations: 2,
                violations: [
                    { id: "v1", type: "corridor_width", severity: "high" },
                    { id: "v2", type: "door_width", severity: "medium" },
                ],
            });

            setAnalyticsLoading(false);
        }, 800);

    }, []);

    return (
        <div className="relative h-screen w-screen bg-zinc-950">
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