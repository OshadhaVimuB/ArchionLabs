"use client";

import React, { useState } from "react";
import { useFloorPlanStore } from "@/store/useFloorPlanStore";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ListFilter, LayoutGrid } from "lucide-react";
import ElementsPanel from "./ElementsPanel";

type SidebarTab = "specifications" | "elements";

export default function RoomSpecsPanel() {
    const { floorPlan } = useFloorPlanStore();
    const [activeTab, setActiveTab] = useState<SidebarTab>("specifications");

    const rooms = floorPlan?.levels?.[0]?.rooms ?? [];
    const computedTotalArea = rooms.reduce((acc, room) => acc + (room.area || 0), 0);
    const displayArea = computedTotalArea > 0 ? computedTotalArea : (floorPlan?.total_area || 0);

    return (
        <Card className="flex flex-col h-full border-r rounded-none border-y-0 border-l-0 bg-black">
            {/* ── Header ── */}
            <CardHeader className="py-4 px-6 border-b bg-black space-y-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-transparent">
                        <img src="/favicon.svg" alt="ArchionLabs" className="h-6 w-6 object-contain" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-foreground">Archion Build</span>
                </div>

                {/* ── Tab Switcher ── */}
                <div className="flex gap-1 p-1 rounded-lg bg-muted/30 border border-border/40">
                    <button
                        onClick={() => setActiveTab("specifications")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                            activeTab === "specifications"
                                ? "bg-primary/15 text-primary shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        }`}
                    >
                        <ListFilter className="h-3.5 w-3.5" />
                        Specs
                    </button>
                    <button
                        onClick={() => setActiveTab("elements")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                            activeTab === "elements"
                                ? "bg-primary/15 text-primary shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        }`}
                    >
                        <LayoutGrid className="h-3.5 w-3.5" />
                        Elements
                    </button>
                </div>
            </CardHeader>

            {/* ── Tab Content ── */}
            {activeTab === "specifications" ? (
                /* Specifications Tab */
                (!floorPlan || !floorPlan.levels.length || rooms.length === 0) ? (
                    <div className="flex-1 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
                        No room data available. Generate a floor plan to see specifications.
                    </div>
                ) : (
                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm mb-6 pb-4 border-b">
                                <div>
                                    <p className="text-muted-foreground font-medium">Total Area</p>
                                    <p className="text-lg font-semibold">{Math.round(displayArea)} m²</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground font-medium">Rooms</p>
                                    <p className="text-lg font-semibold">{rooms.length}</p>
                                </div>
                            </div>

                            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Room Dimensions</h3>

                            <div className="space-y-3">
                                {rooms.map((room, idx) => {
                                    const bb = room.bounding_box;
                                    const w = Math.round((bb.max_point.x - bb.min_point.x) * 10) / 10;
                                    const d = Math.round((bb.max_point.y - bb.min_point.y) * 10) / 10;
                                    const area = Math.round((room.area ?? 0) * 10) / 10;

                                    return (
                                        <div key={idx} className="bg-card border rounded-lg p-3 shadow-sm">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium text-sm capitalize">{room.name}</span>
                                                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{area} m²</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {w}m × {d}m
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </ScrollArea>
                )
            ) : (
                /* Elements Tab */
                <ElementsPanel />
            )}
        </Card>
    );
}
