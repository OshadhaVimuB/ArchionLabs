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

import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
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

/** A single wall mesh. */
const WallMesh: React.FC<{ wall: Wall }> = ({ wall }) => {
    const { start, end, is_exterior } = wall;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length < 0.01) return null;

    const thickness = is_exterior ? WALL_THICKNESS_EXT : WALL_THICKNESS_INT;
    const cx = (start.x + end.x) / 2;
    const cz = (start.y + end.y) / 2;
    const cy = WALL_HEIGHT / 2;
    const angle = Math.atan2(dy, dx);

    return (
        <mesh
            position={[cx, cy, cz]}
            rotation={[0, -angle, 0]}
            castShadow
            receiveShadow
        >
            <boxGeometry args={[length, WALL_HEIGHT, thickness]} />
            <meshStandardMaterial
                color={WALL_COLOR}
                opacity={0.9}
                transparent
                side={THREE.DoubleSide}
            />
        </mesh>
    );
};

/** A door indicator – a small coloured panel at reduced height. */
const DoorMesh: React.FC<{ door: Door }> = ({ door }) => {
    const dx = door.wall_end.x - door.wall_start.x;
    const dy = door.wall_end.y - door.wall_start.y;
    const angle = Math.atan2(dy, dx);

    return (
        <mesh
            position={[door.position.x, DOOR_HEIGHT / 2, door.position.y]}
            rotation={[0, -angle, 0]}
        >
            <boxGeometry args={[door.width, DOOR_HEIGHT, 0.08]} />
            <meshStandardMaterial
                color={DOOR_COLOR}
                opacity={0.5}
                transparent
            />
        </mesh>
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
const GroundPlane: React.FC<{ width: number; depth: number }> = ({
    width,
    depth,
}) => (
    <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[width / 2, -0.01, depth / 2]}
        receiveShadow
    >
        <planeGeometry args={[width + 4, depth + 4]} />
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

    const planW = floorPlan.width ?? 20;
    const planD = floorPlan.height ?? 15;

    // Camera target — centre of the plan
    const target = useMemo<[number, number, number]>(
        () => [planW / 2, 0, planD / 2],
        [planW, planD],
    );

    if (!level) return null;

    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight
                position={[planW + 5, 15, planD + 5]}
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
                position={[-5, 10, -5]}
                intensity={0.4}
            />

            {/* Ground */}
            <GroundPlane width={planW} depth={planD} />

            {/* Floor tiles */}
            {level.rooms.map((room, i) => (
                <FloorTile key={`floor-${i}`} room={room} />
            ))}

            {/* Walls */}
            {level.walls.map((wall, i) => (
                <WallMesh key={`wall-${i}`} wall={wall} />
            ))}

            {/* Doors */}
            {level.doors.map((door, i) => (
                <DoorMesh key={`door-${i}`} door={door} />
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

    const planW = floorPlan.width ?? 20;
    const planD = floorPlan.height ?? 15;
    const camDist = Math.max(planW, planD) * 1.2;

    return (
        <div className="viewer3d-container">
            <Canvas
                shadows
                camera={{
                    position: [planW / 2 + camDist * 0.6, camDist * 0.5, planD / 2 + camDist * 0.6],
                    fov: 50,
                    near: 0.1,
                    far: 200,
                }}
                gl={{ antialias: true }}
            >
                <FloorPlanScene floorPlan={floorPlan} />
            </Canvas>

            <div className="viewer3d-controls-hint">
                🖱️ Drag to orbit · Scroll to zoom · Right-drag to pan
            </div>
        </div>
    );
};

export default Viewer3D;
