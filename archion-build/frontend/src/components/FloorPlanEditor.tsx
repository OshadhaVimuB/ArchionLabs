"use client";

import React from "react";
import { useFloorPlanStore } from "@/store/useFloorPlanStore";
import EditorToolbar from "./EditorToolbar";
import DesignAssistant from "./DesignAssistant";
import RoomSpecsPanel from "./RoomSpecsPanel";
import FloorPlanViewer2D from "./FloorPlanViewer2D";
import Viewer3D from "./Viewer3D";
import ElementPropertiesPanel from "./ElementPropertiesPanel";

export default function FloorPlanEditor() {
    const { viewerTab } = useFloorPlanStore();

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden">

            {/* Left Panel: Specifications */}
            <div className="w-[320px] flex-shrink-0 h-full relative z-20">
                <RoomSpecsPanel />
            </div>

            {/* Center Panel: Canvas & Toolbar */}
            <div className="flex-1 relative h-full flex flex-col bg-black">
                <EditorToolbar />

                <div className="flex-1 w-full h-full relative">
                    {viewerTab === "2d" ? (
                        <div className="w-full h-full p-4 flex items-center justify-center relative">
                            <div className="w-full h-full overflow-hidden rounded-xl border shadow-inner bg-background/50 relative">
                                <FloorPlanViewer2D />
                                <ElementPropertiesPanel />
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full p-4 flex items-center justify-center">
                            <div className="w-full h-full overflow-hidden rounded-xl border shadow-inner bg-background/50 relative">
                                <Viewer3D />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Design Assistant */}
            <div className="w-[380px] flex-shrink-0 h-full relative z-20">
                <DesignAssistant />
            </div>

        </div>
    );
}
