"use client";

import React from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FurnitureType, FurnitureCategory } from "@/types/floorplan";
import { FURNITURE_DEFAULTS } from "@/types/floorplan";
import { Sofa, UtensilsCrossed, Bath, BedDouble } from "lucide-react";

// ── Category definitions ─────────────────────────────────────────────────

interface FurnitureItem {
    type: FurnitureType;
    label: string;
}

interface CategoryDef {
    id: FurnitureCategory;
    label: string;
    icon: React.ReactNode;
    items: FurnitureItem[];
}

const CATEGORIES: CategoryDef[] = [
    {
        id: "living_room",
        label: "Living Room Appliances",
        icon: <Sofa className="h-4 w-4" />,
        items: [
            { type: "table", label: "Table" },
            { type: "chair", label: "Chair" },
        ],
    },
    {
        id: "bedroom",
        label: "Bedroom Appliances",
        icon: <BedDouble className="h-4 w-4" />,
        items: [
            { type: "bed", label: "Bed" },
            { type: "cupboard", label: "Cupboard" },
        ],
    },
    {
        id: "kitchen",
        label: "Kitchen Appliances",
        icon: <UtensilsCrossed className="h-4 w-4" />,
        items: [],
    },
    {
        id: "bathroom",
        label: "Bathroom Appliances",
        icon: <Bath className="h-4 w-4" />,
        items: [],
    },
];

// ── Small SVG preview icons for each furniture type ──────────────────────

function FurnitureIcon({ type }: { type: FurnitureType }) {
    const size = 32;
    const p = 4; // padding

    switch (type) {
        case "table":
            return (
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" className="text-amber-400">
                    <rect x={p} y={p} width={size - p * 2} height={size - p * 2} rx={2} stroke="currentColor" strokeWidth={1.5} />
                    <circle cx={p + 3} cy={p + 3} r={1.5} fill="currentColor" />
                    <circle cx={size - p - 3} cy={p + 3} r={1.5} fill="currentColor" />
                    <circle cx={p + 3} cy={size - p - 3} r={1.5} fill="currentColor" />
                    <circle cx={size - p - 3} cy={size - p - 3} r={1.5} fill="currentColor" />
                </svg>
            );
        case "chair":
            return (
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" className="text-orange-400">
                    <rect x={p + 2} y={p + 6} width={size - p * 2 - 4} height={size - p * 2 - 6} rx={2} stroke="currentColor" strokeWidth={1.5} />
                    <line x1={p + 2} y1={p + 2} x2={size - p - 2} y2={p + 2} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
                </svg>
            );
        case "bed":
            return (
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" className="text-violet-400">
                    <rect x={p} y={p} width={size - p * 2} height={size - p * 2} rx={2} stroke="currentColor" strokeWidth={1.5} />
                    <rect x={p + 2} y={p + 2} width={size - p * 2 - 4} height={6} rx={1} fill="currentColor" opacity={0.4} />
                </svg>
            );
        case "cupboard":
            return (
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" className="text-emerald-400">
                    <rect x={p} y={p} width={size - p * 2} height={size - p * 2} rx={2} stroke="currentColor" strokeWidth={1.5} />
                    <line x1={size / 2} y1={p + 2} x2={size / 2} y2={size - p - 2} stroke="currentColor" strokeWidth={1} />
                    <circle cx={size / 2 - 4} cy={size / 2} r={1.5} fill="currentColor" />
                    <circle cx={size / 2 + 4} cy={size / 2} r={1.5} fill="currentColor" />
                </svg>
            );
    }
}

// ── Component ────────────────────────────────────────────────────────────

export default function ElementsPanel() {
    const { activeTool, placingFurnitureType, setActiveTool, setPlacingFurnitureType } = useEditorStore();

    const handleSelect = (type: FurnitureType) => {
        if (activeTool === "furniture" && placingFurnitureType === type) {
            // Deselect
            setActiveTool("select");
            setPlacingFurnitureType(null);
        } else {
            setActiveTool("furniture");
            setPlacingFurnitureType(type);
        }
    };

    return (
        <ScrollArea className="flex-1">
            <div className="p-4 space-y-5">
                {CATEGORIES.map((cat) => (
                    <div key={cat.id}>
                        {/* Category header */}
                        <div className="flex items-center gap-2 mb-3">
                            <div className="h-6 w-6 rounded-md bg-primary/15 flex items-center justify-center text-primary">
                                {cat.icon}
                            </div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {cat.label}
                            </h3>
                        </div>

                        {cat.items.length === 0 ? (
                            <p className="text-xs text-muted-foreground/60 italic pl-8 pb-2">
                                Coming soon
                            </p>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {cat.items.map((item) => {
                                    const isActive =
                                        activeTool === "furniture" &&
                                        placingFurnitureType === item.type;
                                    const defaults = FURNITURE_DEFAULTS[item.type];

                                    return (
                                        <button
                                            key={item.type}
                                            onClick={() => handleSelect(item.type)}
                                            className={`
                                                group relative flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all duration-200
                                                ${isActive
                                                    ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                                                    : "border-border/50 bg-card hover:border-primary/40 hover:bg-primary/5"
                                                }
                                            `}
                                        >
                                            <FurnitureIcon type={item.type} />
                                            <span className={`text-xs font-medium ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}>
                                                {item.label}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground/60">
                                                {defaults.width}m × {defaults.depth}m
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}

                {/* Placement hint */}
                {activeTool === "furniture" && placingFurnitureType && (
                    <div className="mt-4 p-3 rounded-lg border border-primary/30 bg-primary/5 text-center">
                        <p className="text-xs text-primary font-medium">
                            Click on the canvas to place{" "}
                            <span className="capitalize">{placingFurnitureType}</span>
                        </p>
                    </div>
                )}
            </div>
        </ScrollArea>
    );
}
