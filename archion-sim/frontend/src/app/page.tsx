"use client";

import { useCallback, useState } from "react";
import { AnalyticsDashboard } from "../components/AnalyticsDashboard";

export default function Home() {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleRequestAnalytics = useCallback(() => {
        setLoading(true);

        // Temporary mock request
        setTimeout(() => {
            setAnalyticsData({});
            setLoading(false);
        }, 1000);
    }, []);

    return (
        <div className="relative h-screen w-screen bg-zinc-950">
            <AnalyticsDashboard
                analyticsData={analyticsData}
                loading={loading}
                onRequestAnalytics={handleRequestAnalytics}
            />
        </div>
    );
}