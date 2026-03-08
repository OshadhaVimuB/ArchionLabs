"use client";

import React, { useState, useEffect } from "react";
import { useFloorPlanStore } from "@/store/useFloorPlanStore";
import { useEditorStore } from "@/store/useEditorStore";
import { Card } from "@/components/ui/card";
import { ROOM_COLORS, RoomType } from "@/types/floorplan";

export default function ElementPropertiesPanel() {
    const { floorPlan, setFloorPlan } = useFloorPlanStore();
    const { selectedIds, updateRoom, updateText } = useEditorStore();

    const [roomName, setRoomName] = useState("");
    const [roomType, setRoomType] = useState<RoomType>("other");
    const [roomArea, setRoomArea] = useState<number | "">("");

    const [textContent, setTextContent] = useState("");
    const [textSize, setTextSize] = useState<number>(0.8);
    const [textColor, setTextColor] = useState("#ffffff");

    const level = floorPlan?.levels?.[0];
    const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;

    const selectedRoom = level && selectedId ? level.rooms.find(r => r.id === selectedId) : null;
    const selectedText = level && selectedId ? (level.texts || []).find(t => t.id === selectedId) : null;

    useEffect(() => {
        if (selectedRoom) {
            setRoomName(selectedRoom.name);
            setRoomType(selectedRoom.room_type);
            setRoomArea(selectedRoom.area ?? "");
        }
    }, [selectedRoom]);

    useEffect(() => {
        if (selectedText) {
            setTextContent(selectedText.text);
            setTextSize(selectedText.fontSize);
            setTextColor(selectedText.color);
        }
    }, [selectedText]);

    const handleRoomNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedId || !floorPlan) return;
        setRoomName(e.target.value);
        setFloorPlan(updateRoom(floorPlan, selectedId, { name: e.target.value }));
    };

    const handleRoomTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (!selectedId || !floorPlan) return;
        const type = e.target.value as RoomType;
        setRoomType(type);
        setFloorPlan(updateRoom(floorPlan, selectedId, { room_type: type }));
    };

    const handleRoomAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedId || !floorPlan) return;
        const val = e.target.value;
        setRoomArea(val === "" ? "" : Number(val));
        setFloorPlan(updateRoom(floorPlan, selectedId, { area: val === "" ? null : Number(val) }));
    };

    const handleTextContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedId || !floorPlan) return;
        setTextContent(e.target.value);
        setFloorPlan(updateText(floorPlan, selectedId, { text: e.target.value }));
    };

    const handleTextSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedId || !floorPlan) return;
        const size = Number(e.target.value);
        setTextSize(size);
        setFloorPlan(updateText(floorPlan, selectedId, { fontSize: size }));
    };

    const handleTextColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedId || !floorPlan) return;
        setTextColor(e.target.value);
        setFloorPlan(updateText(floorPlan, selectedId, { color: e.target.value }));
    };

    if (!selectedRoom && !selectedText) return null;

    return (
        <Card className="absolute top-4 left-4 z-20 w-64 p-4 shadow-lg bg-black/80 backdrop-blur-md border border-border/50 text-foreground flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Properties</h3>

            {selectedRoom && (
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1 text-xs">
                        <label className="text-muted-foreground">Name</label>
                        <input
                            type="text"
                            className="bg-background/50 border border-border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
                            value={roomName}
                            onChange={handleRoomNameChange}
                        />
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                        <label className="text-muted-foreground">Type (Color)</label>
                        <select
                            className="bg-background/50 border border-border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary capitalize"
                            value={roomType}
                            onChange={handleRoomTypeChange}
                        >
                            {Object.keys(ROOM_COLORS).map(type => (
                                <option key={type} value={type} className="capitalize">{type.replace('_', ' ')}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                        <label className="text-muted-foreground">Area Override (m²)</label>
                        <input
                            type="number"
                            step="0.1"
                            className="bg-background/50 border border-border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
                            value={roomArea}
                            onChange={handleRoomAreaChange}
                        />
                    </div>
                </div>
            )}

            {selectedText && (
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1 text-xs">
                        <label className="text-muted-foreground">Text Content</label>
                        <input
                            type="text"
                            className="bg-background/50 border border-border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
                            value={textContent}
                            onChange={handleTextContentChange}
                        />
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                        <label className="text-muted-foreground">Font Size</label>
                        <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            className="bg-background/50 border border-border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
                            value={textSize}
                            onChange={handleTextSizeChange}
                        />
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                        <label className="text-muted-foreground">Color</label>
                        <input
                            type="color"
                            className="bg-transparent border-none rounded p-0 w-full h-6 cursor-pointer"
                            value={textColor}
                            onChange={handleTextColorChange}
                        />
                    </div>
                </div>
            )}
        </Card>
    );
}
