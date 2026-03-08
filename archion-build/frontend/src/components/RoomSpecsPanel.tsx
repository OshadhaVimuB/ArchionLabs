"use client";

import React from "react";
import { useFloorPlanStore } from "@/store/useFloorPlanStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ListFilter } from "lucide-react";

export default function RoomSpecsPanel() {
    const { floorPlan } = useFloorPlanStore();

    if (!floorPlan || !floorPlan.levels.length) {
        return (
            <Card className="flex flex-col h-full border-r rounded-none border-y-0 border-l-0 bg-black">
                <CardHeader className="py-4 px-6 border-b bg-black space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                <line x1="12" y1="22.08" x2="12" y2="12" />
                            </svg>
                        </div>
                        <span className="font-bold text-xl tracking-tight text-foreground">Archion Build</span>
                    </div>
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground pt-2 border-t border-border/50">
                        <ListFilter className="h-4 w-4" />
                        Specifications
                    </CardTitle>
                </CardHeader>
                <div className="flex-1 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
                    No room data available. Generate a floor plan to see specifications.
                </div>
            </Card>
        );
    }

    const rooms = floorPlan.levels[0].rooms;
    const computedTotalArea = rooms.reduce((acc, room) => acc + (room.area || 0), 0);
    const displayArea = computedTotalArea > 0 ? computedTotalArea : (floorPlan.total_area || 0);

    return (
        <Card className="flex flex-col h-full border-r rounded-none border-y-0 border-l-0 bg-black">
            <CardHeader className="py-4 px-6 border-b bg-black space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                            <line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                    </div>
                    <span className="font-bold text-xl tracking-tight text-foreground">Archion Build</span>
                </div>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground pt-2 border-t border-border/50">
                    <ListFilter className="h-4 w-4" />
                    Specifications
                </CardTitle>
            </CardHeader>

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
        </Card>
    );
}
