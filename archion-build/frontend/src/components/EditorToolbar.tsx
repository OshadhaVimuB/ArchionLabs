"use client";

import React, { useEffect, useState, useRef } from "react";
import { useFloorPlanStore } from "@/store/useFloorPlanStore";
import { useEditorStore } from "@/store/useEditorStore";
import { extractFloorPlan } from "@/services/api";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { jsPDF } from "jspdf";
import {
    Box, Code2, Download, Layers, Upload, Loader2,
    MousePointer2, Minus, Plus, Maximize, Grid3x3,
    Undo2, Redo2, Trash2, PenLine, DoorOpen, SquareStack,
    Image as ImageIcon, FileText, Square, Type, Play, Globe
} from "lucide-react";
import type { EditorTool } from "@/types/floorplan";

interface ToolDef {
    id: EditorTool;
    icon: React.ReactNode;
    label: string;
    shortcut: string;
}

const TOOLS: ToolDef[] = [
    { id: 'select', icon: <MousePointer2 className="h-4 w-4" />, label: 'Select', shortcut: 'V' },
    { id: 'wall', icon: <PenLine className="h-4 w-4" />, label: 'Draw Wall', shortcut: 'W' },
    { id: 'room', icon: <Square className="h-4 w-4" />, label: 'Draw Room', shortcut: 'R' },
    { id: 'door', icon: <DoorOpen className="h-4 w-4" />, label: 'Add Door', shortcut: 'D' },
    { id: 'window', icon: <SquareStack className="h-4 w-4" />, label: 'Add Window', shortcut: 'N' },
    { id: 'text', icon: <Type className="h-4 w-4" />, label: 'Add Text', shortcut: 'T' },
    { id: 'eraser', icon: <Trash2 className="h-4 w-4" />, label: 'Eraser', shortcut: 'E' },
];

export default function EditorToolbar() {
    const { floorPlan, viewerTab, setViewerTab } = useFloorPlanStore();
    const {
        activeTool, setActiveTool,
        transform, setTransform, resetTransform,
        showGrid, toggleGrid,
        undoStack, redoStack, undo, redo,
        setSelectedIds
    } = useEditorStore();

    const zoomPercent = Math.round(transform.zoom * 2.5);

    const handleZoomIn = () => setTransform({ zoom: Math.min(200, transform.zoom * 1.25) });
    const handleZoomOut = () => setTransform({ zoom: Math.max(3, transform.zoom / 1.25) });
    const handleFitView = () => resetTransform();

    const { setFloorPlan } = useFloorPlanStore.getState();

    const [isEditingName, setIsEditingName] = useState(false);
    const [nameInput, setNameInput] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleNameClick = () => {
        if (!floorPlan) return;
        setNameInput(floorPlan.name || "Untitled Draft");
        setIsEditingName(true);
    };

    const handleNameSubmit = () => {
        if (floorPlan && nameInput.trim()) {
            setFloorPlan({ ...floorPlan, name: nameInput.trim() });
        }
        setIsEditingName(false);
    };

    const handleNameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleNameSubmit();
        if (e.key === 'Escape') setIsEditingName(false);
    };

    const handleUndo = () => {
        if (floorPlan) {
            const prev = undo(floorPlan);
            if (prev) setFloorPlan(prev);
        }
    };

    const handleRedo = () => {
        if (floorPlan) {
            const next = redo(floorPlan);
            if (next) setFloorPlan(next);
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (viewerTab !== '2d') return;

            const key = e.key.toLowerCase();
            if (key === 'v') setActiveTool('select');
            if (key === 'w') setActiveTool('wall');
            if (key === 'r') setActiveTool('room');
            if (key === 'd') setActiveTool('door');
            if (key === 'n') setActiveTool('window');
            if (key === 't') setActiveTool('text');
            if (key === 'e') setActiveTool('eraser');
            if (key === 'g') toggleGrid();
            if ((e.ctrlKey || e.metaKey) && key === 'a') {
                e.preventDefault();
                if (floorPlan?.levels?.[0]) {
                    const level = floorPlan.levels[0];
                    const allIds = [
                        ...level.walls.map(w => w.id),
                        ...level.rooms.map(r => r.id),
                        ...level.doors.map(d => d.id),
                        ...level.windows.map(w => w.id),
                        ...(level.texts || []).map(t => t.id)
                    ];
                    setSelectedIds(allIds);
                    setActiveTool('select');
                }
            }
            if (e.ctrlKey && key === 'z') { e.preventDefault(); handleUndo(); }
            if (e.ctrlKey && key === 'y') { e.preventDefault(); handleRedo(); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [activeTool, setActiveTool, toggleGrid, undo, redo, viewerTab, floorPlan, setSelectedIds]);

    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
                setIsExportMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleExportPNG = () => {
        setIsExportMenuOpen(false);
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${floorPlan?.name || "FloorPlan"}.png`;
        a.click();
    };

    const handleExportPDF = () => {
        setIsExportMenuOpen(false);
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/jpeg", 1.0);
        const pdf = new jsPDF({
            orientation: canvas.width > canvas.height ? "landscape" : "portrait",
            unit: "px",
            format: [canvas.width, canvas.height]
        });
        pdf.addImage(dataUrl, "JPEG", 0, 0, canvas.width, canvas.height);
        pdf.save(`${floorPlan?.name || "FloorPlan"}.pdf`);
    };

    const handleDownload3D = () => {
        setIsExportMenuOpen(false);
        window.dispatchEvent(new Event("export3d"));
    };

    const handleExportToSim = () => {
        setIsExportMenuOpen(false);
        alert("Export to Sim feature coming soon!");
    };

    const handleExportToViewer = () => {
        setIsExportMenuOpen(false);
        alert("Export to Viewer feature coming soon!");
    };

    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // check format
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf', 'application/dxf'];
        const isDxf = file.name.toLowerCase().endsWith('.dxf');
        if (!validTypes.includes(file.type) && !isDxf) {
            alert("Unsupported file type. Please upload PNG, JPG, PDF or DXF.");
            return;
        }

        setIsUploading(true);

        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const base64Data = (event.target?.result as string).split(',')[1];
                if (!base64Data) {
                    setIsUploading(false);
                    return;
                }

                try {
                    const response = await extractFloorPlan(
                        file.name,
                        file.type || (isDxf ? 'application/dxf' : 'application/octet-stream'),
                        base64Data
                    );

                    setFloorPlan(response.floorplan);
                } catch (error: any) {
                    console.error("Extraction error:", error);
                    alert(`Failed to extract floor plan: ${error.message}`);
                } finally {
                    setIsUploading(false);
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                }
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error(err);
            setIsUploading(false);
        }
    };

    const computedTotalArea = floorPlan?.levels?.[0]?.rooms?.reduce((acc, room) => acc + (room.area || 0), 0) || 0;
    const displayArea = computedTotalArea > 0 ? computedTotalArea : (floorPlan?.total_area || 0);

    return (
        <Card className="absolute top-4 right-4 z-10 flex flex-col items-center gap-2 p-2 shadow-lg min-w-[500px] border-border/50 bg-black backdrop-blur-md">
            <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-3 pl-2">
                    <div className="h-8 w-8 rounded-md bg-primary/20 flex items-center justify-center">
                        <Layers className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col min-w-[150px]">
                        {isEditingName ? (
                            <input
                                autoFocus
                                type="text"
                                className="text-sm font-semibold leading-none bg-background/50 border-none outline-none ring-1 ring-primary/50 rounded px-1 -ml-1 text-foreground"
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                onBlur={handleNameSubmit}
                                onKeyDown={handleNameKeyDown}
                            />
                        ) : (
                            <span
                                className="text-sm font-semibold leading-none cursor-pointer hover:underline decoration-muted-foreground underline-offset-4"
                                onClick={handleNameClick}
                                title="Click to rename"
                            >
                                {floorPlan?.name || "Untitled Draft"}
                            </span>
                        )}
                        <span className="text-xs text-muted-foreground mt-1">
                            {floorPlan ? `${Math.round(displayArea)} m²` : "Empty canvas"}
                        </span>
                    </div>
                </div>

                <Tabs value={viewerTab} onValueChange={(val) => setViewerTab(val as "2d" | "3d")} className="mx-4">
                    <TabsList className="grid w-[120px] grid-cols-2">
                        <TabsTrigger value="2d" className="text-xs">
                            <Code2 className="h-3 w-3 mr-1.5" /> 2D
                        </TabsTrigger>
                        <TabsTrigger value="3d" className="text-xs">
                            <Box className="h-3 w-3 mr-1.5" /> 3D
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex items-center gap-2 pr-2" ref={exportMenuRef}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".png,.jpg,.jpeg,.pdf,.dxf"
                        onChange={handleFileChange}
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={handleUploadClick}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                            <Upload className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        {isUploading ? "Extracting..." : "Upload"}
                    </Button>

                    <div className="relative">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            disabled={!floorPlan || isUploading}
                            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                        >
                            <Download className="h-3.5 w-3.5 mr-1.5" /> Export
                        </Button>

                        {isExportMenuOpen && (
                            <div className="absolute top-10 right-0 w-48 bg-popover border border-border shadow-md rounded-md overflow-hidden z-50 flex flex-col p-1">
                                {viewerTab === "2d" ? (
                                    <>
                                        <button
                                            className="flex items-center w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors"
                                            onClick={handleExportPNG}
                                        >
                                            <ImageIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                            Export as PNG
                                        </button>
                                        <button
                                            className="flex items-center w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors"
                                            onClick={handleExportPDF}
                                        >
                                            <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                                            Export as PDF
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            className="flex items-center w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors"
                                            onClick={handleDownload3D}
                                        >
                                            <Download className="h-4 w-4 mr-2 text-muted-foreground" />
                                            Download (GLB)
                                        </button>
                                        <button
                                            className="flex items-center w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors"
                                            onClick={handleExportToSim}
                                        >
                                            <Play className="h-4 w-4 mr-2 text-muted-foreground" />
                                            Export to Sim
                                        </button>
                                        <button
                                            className="flex items-center w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors"
                                            onClick={handleExportToViewer}
                                        >
                                            <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                                            Export to Viewer
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 2D Tools Row - Only show when in 2D mode */}
            {viewerTab === '2d' && (
                <div className="flex w-full items-center justify-between gap-2 px-2 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1">
                        {TOOLS.map((t) => (
                            <Button
                                key={t.id}
                                variant={activeTool === t.id ? "secondary" : "ghost"}
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setActiveTool(t.id)}
                                title={`${t.label} (${t.shortcut})`}
                            >
                                {t.icon}
                            </Button>
                        ))}
                    </div>

                    <Separator orientation="vertical" className="h-6" />

                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleUndo} disabled={undoStack.length === 0} title="Undo (Ctrl+Z)">
                            <Undo2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRedo} disabled={redoStack.length === 0} title="Redo (Ctrl+Y)">
                            <Redo2 className="h-4 w-4" />
                        </Button>
                    </div>

                    <Separator orientation="vertical" className="h-6" />

                    <div className="flex items-center gap-1 relative">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut} title="Zoom out (-)">
                            <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-xs font-mono w-10 text-center select-none">{zoomPercent}%</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn} title="Zoom in (+)">
                            <Plus className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleFitView} title="Fit to view">
                            <Maximize className="h-4 w-4" />
                        </Button>
                    </div>

                    <Separator orientation="vertical" className="h-6" />

                    <Button variant={showGrid ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={toggleGrid} title="Toggle Grid (G)">
                        <Grid3x3 className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </Card>
    );
}
