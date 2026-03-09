"use client";

/**
 * Viewer3D – Interactive 3D rendering of a generated floor plan.
 *
 * Uses @react-three/fiber and @react-three/drei to render extruded
 * walls, floor tiles, door openings, and translucent windows with
 * proper lighting, shadows, and orbit controls.
 *
 * Subscribes to the Zustand store for floor plan data.
 */

import React, { useMemo, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";
import { useFloorPlanStore } from "@/store/useFloorPlanStore";
import type {
    FloorPlan,
    Level,
    Room,
    Wall,
    Door,
    Window as FPWindow,
    RoomType,
} from "@/types/floorplan";
import "./Viewer3D.css";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WALL_HEIGHT = 2.8;
const FLOOR_THICKNESS = 0.05;
const DOOR_HEIGHT = 2.1;
const WINDOW_HEIGHT = 1.2;
const WINDOW_BOTTOM = 0.9;
const WALL_THICKNESS_EXT = 0.20;
const WALL_THICKNESS_INT = 0.15;

/** Room-type → fill colour map. */
const ROOM_COLORS: Record<RoomType, string> = {
    living_room: "#3b82f6",
    bedroom: "#8b5cf6",
    bathroom: "#06b6d4",
    kitchen: "#f59e0b",
    dining_room: "#10b981",
    garage: "#6b7280",
    hallway: "#a78bfa",
    closet: "#78716c",
    laundry: "#14b8a6",
    office: "#6366f1",
    balcony: "#22d3ee",
    entrance: "#f97316",
    storage: "#9ca3af",
    other: "#64748b",
};

const WALL_COLOR = "#d1d5db";
const DOOR_COLOR = "#facc15";
const WINDOW_COLOR = "#38bdf8";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computePlanBounds(level: Level | undefined) {
    if (!level) return { minX: 0, maxX: 20, minY: 0, maxY: 15 };

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    const addPoint = (x: number, y: number) => {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    };

    level.rooms.forEach(r => {
        addPoint(r.bounding_box.min_point.x, r.bounding_box.min_point.y);
        addPoint(r.bounding_box.max_point.x, r.bounding_box.max_point.y);
    });
    level.walls.forEach(w => {
        addPoint(w.start.x, w.start.y);
        addPoint(w.end.x, w.end.y);
    });
    level.doors.forEach(d => {
        addPoint(d.position.x, d.position.y);
    });
    level.windows.forEach(w => {
        addPoint(w.position.x, w.position.y);
    });

    if (minX === Infinity) {
        return { minX: 0, maxX: 20, minY: 0, maxY: 15 };
    }

    const padding = 2;
    return {
        minX: minX - padding,
        maxX: maxX + padding,
        minY: minY - padding,
        maxY: maxY + padding
    };
}

function isPointOnWall(p: { x: number, y: number }, wall: Wall, tolerance = 0.05): number | null {
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) return null;

    // Parameter t along the line
    const t = ((p.x - wall.start.x) * dx + (p.y - wall.start.y) * dy) / (length * length);
    if (t < 0 || t > 1) return null; // Outside segment bounds

    const projX = wall.start.x + t * dx;
    const projY = wall.start.y + t * dy;
    const dist = Math.sqrt((p.x - projX) ** 2 + (p.y - projY) ** 2);

    if (dist <= tolerance) {
        return t * length; // Return scalar distance from start
    }
    return null;
}

// ---------------------------------------------------------------------------
// Sub-components (inside Canvas)
// ---------------------------------------------------------------------------

/** A single floor tile for a room. */
const FloorTile: React.FC<{ room: Room }> = ({ room }) => {
    const bb = room.bounding_box;
    const w = bb.max_point.x - bb.min_point.x;
    const d = bb.max_point.y - bb.min_point.y;
    const cx = bb.min_point.x + w / 2;
    const cz = bb.min_point.y + d / 2;
    const color = ROOM_COLORS[room.room_type] ?? ROOM_COLORS.other;

    return (
        <mesh
            position={[cx, FLOOR_THICKNESS / 2, cz]}
            receiveShadow
        >
            <boxGeometry args={[w, FLOOR_THICKNESS, d]} />
            <meshStandardMaterial color={color} opacity={0.85} transparent />
        </mesh>
    );
};

/** A single wall mesh that cuts holes for doors and windows dynamically. */
const WallMesh: React.FC<{ wall: Wall, level: Level }> = ({ wall, level }) => {
    const { start, end, is_exterior } = wall;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length < 0.01) return null;

    const thickness = is_exterior ? WALL_THICKNESS_EXT : WALL_THICKNESS_INT;
    const angle = Math.atan2(dy, dx);

    const shape = useMemo(() => {
        const s = new THREE.Shape();
        s.moveTo(0, 0);
        s.lineTo(length, 0);
        s.lineTo(length, WALL_HEIGHT);
        s.lineTo(0, WALL_HEIGHT);
        s.lineTo(0, 0);

        // Cut holes for doors
        level.doors.forEach(door => {
            const dist = isPointOnWall(door.position, wall);
            if (dist !== null) {
                const hole = new THREE.Path();
                const hw = door.width / 2;
                const hx1 = Math.max(0, dist - hw);
                const hx2 = Math.min(length, dist + hw);
                hole.moveTo(hx1, 0);
                hole.lineTo(hx2, 0);
                hole.lineTo(hx2, DOOR_HEIGHT);
                hole.lineTo(hx1, DOOR_HEIGHT);
                hole.lineTo(hx1, 0);
                s.holes.push(hole);
            }
        });

        // Cut holes for windows
        level.windows.forEach(win => {
            const dist = isPointOnWall(win.position, wall);
            if (dist !== null) {
                const hole = new THREE.Path();
                const hw = win.width / 2;
                const hx1 = Math.max(0, dist - hw);
                const hx2 = Math.min(length, dist + hw);
                hole.moveTo(hx1, WINDOW_BOTTOM);
                hole.lineTo(hx2, WINDOW_BOTTOM);
                hole.lineTo(hx2, WINDOW_BOTTOM + WINDOW_HEIGHT);
                hole.lineTo(hx1, WINDOW_BOTTOM + WINDOW_HEIGHT);
                hole.lineTo(hx1, WINDOW_BOTTOM);
                s.holes.push(hole);
            }
        });

        return s;
    }, [length, wall, level.doors, level.windows]);

    return (
        <group position={[start.x, 0, start.y]} rotation={[0, -angle, 0]}>
            <mesh position={[0, 0, -thickness / 2]} castShadow receiveShadow>
                <extrudeGeometry args={[shape, { depth: thickness, bevelEnabled: false }]} />
                <meshStandardMaterial
                    color={WALL_COLOR}
                    opacity={0.9}
                    transparent
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
};



/** A translucent window panel. */
const WindowMesh: React.FC<{ win: FPWindow }> = ({ win }) => {
    const dx = win.wall_end.x - win.wall_start.x;
    const dy = win.wall_end.y - win.wall_start.y;
    const angle = Math.atan2(dy, dx);

    return (
        <mesh
            position={[
                win.position.x,
                WINDOW_BOTTOM + WINDOW_HEIGHT / 2,
                win.position.y,
            ]}
            rotation={[0, -angle, 0]}
        >
            <boxGeometry args={[win.width, WINDOW_HEIGHT, 0.05]} />
            <meshStandardMaterial
                color={WINDOW_COLOR}
                opacity={0.3}
                transparent
                side={THREE.DoubleSide}
            />
        </mesh>
    );
};

/** Ground plane for receiving shadows. */
const GroundPlane: React.FC<{ cx: number; cy: number; width: number; depth: number }> = ({
    cx,
    cy,
    width,
    depth,
}) => (
    <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[cx, -0.01, cy]}
        receiveShadow
    >
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
            color="#1a1a2e"
            side={THREE.DoubleSide}
        />
    </mesh>
);

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

const FloorPlanScene: React.FC<{ floorPlan: FloorPlan }> = ({ floorPlan }) => {
    const level: Level | undefined = floorPlan.levels[0];

    const bounds = useMemo(() => computePlanBounds(level), [level]);
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    const planW = bounds.maxX - bounds.minX;
    const planD = bounds.maxY - bounds.minY;

    // Camera target — centre of the plan
    const target = useMemo<[number, number, number]>(
        () => [cx, 0, cy],
        [cx, cy],
    );

    if (!level) return null;

    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight
                position={[cx + planW / 2 + 5, 15, cy + planD / 2 + 5]}
                intensity={1.2}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-left={-planW}
                shadow-camera-right={planW}
                shadow-camera-top={planD}
                shadow-camera-bottom={-planD}
            />
            <directionalLight
                position={[cx - 5, 10, cy - 5]}
                intensity={0.4}
            />

            {/* Ground & Grid */}
            <GroundPlane cx={cx} cy={cy} width={planW} depth={planD} />

            {/* Grid overlay */}
            <gridHelper
                args={[Math.max(planW, planD) + 10, Math.max(planW, planD) + 10, 0x444444, 0x444444]}
                position={[cx, 0.01, cy]}
            />

            {/* Floor tiles */}
            {level.rooms.map((room, i) => (
                <FloorTile key={`floor-${i}`} room={room} />
            ))}

            {/* Walls */}
            {level.walls.map((wall, i) => (
                <WallMesh key={`wall-${i}`} wall={wall} level={level} />
            ))}



            {/* Windows */}
            {level.windows.map((win, i) => (
                <WindowMesh key={`win-${i}`} win={win} />
            ))}

            {/* Controls */}
            <OrbitControls
                target={target}
                maxPolarAngle={Math.PI / 2.05}
                minDistance={3}
                maxDistance={60}
                enableDamping
                dampingFactor={0.08}
            />
        </>
    );
};

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

const EmptyState: React.FC = () => (
    <div className="viewer3d-empty">
        <svg
            className="viewer3d-empty-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
        >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
        </svg>
        <h2>No 3D Model Yet</h2>
        <p>Generate a floor plan first, then switch to the 3D view to explore it.</p>
    </div>
);

// ---------------------------------------------------------------------------
// Export Handler
// ---------------------------------------------------------------------------

const ExportHandler: React.FC = () => {
    const { scene } = useThree();
    const floorPlan = useFloorPlanStore((s) => s.floorPlan);

    useEffect(() => {
        const handleExport = () => {
            import("three-stdlib").then(({ GLTFExporter }) => {
                const exporter = new GLTFExporter();
                exporter.parse(
                    scene,
                    (gltf) => {
                        const output = gltf as ArrayBuffer;
                        const blob = new Blob([output], { type: "application/octet-stream" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.style.display = "none";
                        a.href = url;
                        // Use the floor plan name or a default
                        const fileName = floorPlan?.name ? `${floorPlan.name.replace(/\s+/g, "_")}.glb` : "Archion_FloorPlan.glb";
                        a.download = fileName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    },
                    (error) => {
                        console.error("An error happened during GLTF parsing", error);
                    },
                    { binary: true } // Export as GLB
                );
            });
        };

        window.addEventListener("export3d", handleExport);
        return () => window.removeEventListener("export3d", handleExport);
    }, [scene, floorPlan?.name]);

    return null;
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const Viewer3D: React.FC = () => {
    const floorPlan = useFloorPlanStore((s) => s.floorPlan);

    if (!floorPlan) {
        return (
            <div className="viewer3d-container">
                <EmptyState />
            </div>
        );
    }

    const level = floorPlan.levels[0];
    const bounds = computePlanBounds(level);
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    const planW = bounds.maxX - bounds.minX;
    const planD = bounds.maxY - bounds.minY;
    const camDist = Math.max(planW, planD) * 1.2 || 10;

    return (
        <div className="viewer3d-container">
            <Canvas
                shadows
                camera={{
                    position: [cx + camDist * 0.6, Math.max(camDist * 0.5, 5), cy + camDist * 0.6],
                    fov: 50,
                    near: 0.1,
                    far: Math.max(200, camDist * 3),
                }}
                gl={{ antialias: true, preserveDrawingBuffer: true }}
            >
                <FloorPlanScene floorPlan={floorPlan} />
                <ExportHandler />
            </Canvas>

            <div className="viewer3d-controls-hint">
                🖱️ Drag to orbit · Scroll to zoom · Right-drag to pan
            </div>
        </div>
    );
};

export default Viewer3D;
