"use client";

/**
 * FloorPlanViewer2D – Interactive 2D SVG rendering of a generated floor plan.
 *
 * Subscribes to the Zustand store. When a floor plan exists it renders rooms,
 * walls, doors, windows, a grid background, and text labels inside an SVG
 * that scales to fit its container. When no plan exists a friendly empty-state
 * placeholder is shown instead.
 */

import React from "react";
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
import "./FloorPlanViewer2D.css";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Pixels per metre – controls SVG scale. */
const SCALE = 50;

/** Extra padding (px) around the rendered floor plan. */
const PADDING = 40;

/** Room-type → fill colour map (curated, harmonious). */
const ROOM_COLORS: Record<RoomType, string> = {
  living_room: "#3b82f6",   // vivid blue
  bedroom:     "#8b5cf6",   // lavender purple
  bathroom:    "#06b6d4",   // cyan
  kitchen:     "#f59e0b",   // warm amber
  dining_room: "#10b981",   // emerald
  garage:      "#6b7280",   // slate
  hallway:     "#a78bfa",   // soft violet
  closet:      "#78716c",   // stone
  laundry:     "#14b8a6",   // teal
  office:      "#6366f1",   // indigo
  balcony:     "#22d3ee",   // light cyan
  entrance:    "#f97316",   // orange
  storage:     "#9ca3af",   // cool grey
  other:       "#64748b",   // grey-blue
};

/** Wall colours & stroke widths. */
const EXTERIOR_WALL_WIDTH = 4;
const INTERIOR_WALL_WIDTH = 2;
const WALL_COLOR = "#e2e8f0";

/** Door / window visual constants. */
const DOOR_COLOR = "#facc15";      // gold
const WINDOW_COLOR = "#38bdf8";    // sky-blue
const DOOR_RENDER_WIDTH = 3;
const WINDOW_RENDER_WIDTH = 3;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a metre value to an SVG-pixel value. */
const m = (v: number) => v * SCALE;

/** Format an area value nicely. */
const fmtArea = (area: number | null, bb?: Room["bounding_box"]) => {
  if (area !== null && area !== undefined) return `${area.toFixed(1)} m²`;
  if (bb) {
    const w = bb.max_point.x - bb.min_point.x;
    const h = bb.max_point.y - bb.min_point.y;
    return `${(w * h).toFixed(1)} m²`;
  }
  return "";
};

/** Unique room types present in a level (for the legend). */
const uniqueRoomTypes = (rooms: Room[]): RoomType[] => {
  const seen = new Set<RoomType>();
  rooms.forEach((r) => seen.add(r.room_type));
  return Array.from(seen);
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** 1-metre grid pattern rendered via SVG <pattern>. */
const GridPattern: React.FC = () => (
  <defs>
    <pattern
      id="grid-pattern"
      width={SCALE}
      height={SCALE}
      patternUnits="userSpaceOnUse"
    >
      <path
        d={`M ${SCALE} 0 L 0 0 0 ${SCALE}`}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1"
      />
    </pattern>
  </defs>
);

/** SVG rendering of a single Room rectangle + labels. */
const RoomRect: React.FC<{ room: Room }> = ({ room }) => {
  const { bounding_box: bb, room_type, name, area } = room;
  const x = m(bb.min_point.x);
  const y = m(bb.min_point.y);
  const w = m(bb.max_point.x - bb.min_point.x);
  const h = m(bb.max_point.y - bb.min_point.y);
  const cx = x + w / 2;
  const cy = y + h / 2;
  const fill = ROOM_COLORS[room_type] ?? ROOM_COLORS.other;

  // Dynamic font size based on room dimensions
  const fontSize = Math.max(10, Math.min(14, Math.min(w, h) / 6));

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={fill}
        fillOpacity={0.35}
        stroke={fill}
        strokeWidth={1.5}
        rx={3}
        ry={3}
      />
      <text className="viewer2d-room-name" x={cx} y={cy - 8} fontSize={fontSize}>
        {name}
      </text>
      <text className="viewer2d-room-area" x={cx} y={cy + 10}>
        {fmtArea(area, bb)}
      </text>
    </g>
  );
};

/** SVG rendering of a Wall line. */
const WallLine: React.FC<{ wall: Wall }> = ({ wall }) => (
  <line
    x1={m(wall.start.x)}
    y1={m(wall.start.y)}
    x2={m(wall.end.x)}
    y2={m(wall.end.y)}
    stroke={WALL_COLOR}
    strokeWidth={wall.is_exterior ? EXTERIOR_WALL_WIDTH : INTERIOR_WALL_WIDTH}
    strokeLinecap="round"
  />
);

/** SVG rendering of a Door indicator. */
const DoorMark: React.FC<{ door: Door }> = ({ door }) => {
  const px = m(door.position.x);
  const py = m(door.position.y);
  const halfW = m(door.width) / 2;

  // Determine orientation from wall_start / wall_end
  const isHorizontal =
    Math.abs(door.wall_start.y - door.wall_end.y) < 0.01;

  // Door gap line
  const x1 = isHorizontal ? px - halfW : px;
  const y1 = isHorizontal ? py : py - halfW;
  const x2 = isHorizontal ? px + halfW : px;
  const y2 = isHorizontal ? py : py + halfW;

  // Small arc to indicate swing direction
  const arcRadius = halfW * 0.7;
  const arcPath = isHorizontal
    ? `M ${px - halfW} ${py} A ${arcRadius} ${arcRadius} 0 0 1 ${px + halfW} ${py}`
    : `M ${px} ${py - halfW} A ${arcRadius} ${arcRadius} 0 0 1 ${px} ${py + halfW}`;

  return (
    <g>
      {/* Background "gap" to cover the wall underneath */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="var(--surface, #141414)"
        strokeWidth={EXTERIOR_WALL_WIDTH + 2}
        strokeLinecap="butt"
      />
      {/* Door indicator line */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={DOOR_COLOR}
        strokeWidth={DOOR_RENDER_WIDTH}
        strokeLinecap="round"
      />
      {/* Swing arc */}
      <path
        d={arcPath}
        fill="none"
        stroke={DOOR_COLOR}
        strokeWidth={1}
        strokeDasharray="3 3"
        opacity={0.6}
      />
    </g>
  );
};

/** SVG rendering of a Window indicator. */
const WindowMark: React.FC<{ window: FPWindow }> = ({ window: win }) => {
  const px = m(win.position.x);
  const py = m(win.position.y);
  const halfW = m(win.width) / 2;

  const isHorizontal =
    Math.abs(win.wall_start.y - win.wall_end.y) < 0.01;

  const x1 = isHorizontal ? px - halfW : px;
  const y1 = isHorizontal ? py : py - halfW;
  const x2 = isHorizontal ? px + halfW : px;
  const y2 = isHorizontal ? py : py + halfW;

  return (
    <g>
      {/* Background gap */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="var(--surface, #141414)"
        strokeWidth={EXTERIOR_WALL_WIDTH + 2}
        strokeLinecap="butt"
      />
      {/* Window indicator – double stroke */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={WINDOW_COLOR}
        strokeWidth={WINDOW_RENDER_WIDTH}
        strokeLinecap="round"
      />
      {/* Thin inner line for "glass" effect */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#ffffff"
        strokeWidth={1}
        strokeLinecap="round"
        opacity={0.35}
      />
    </g>
  );
};

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

const EmptyState: React.FC = () => (
  <div className="viewer2d-empty">
    <svg
      className="viewer2d-empty-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="9" x2="9" y2="21" />
    </svg>
    <h2>No Floor Plan Yet</h2>
    <p>Generate a floor plan to see it rendered here as an interactive 2D blueprint.</p>
  </div>
);

// ---------------------------------------------------------------------------
// Legend
// ---------------------------------------------------------------------------

const Legend: React.FC<{ roomTypes: RoomType[] }> = ({ roomTypes }) => (
  <div className="viewer2d-legend">
    {roomTypes.map((rt) => (
      <span key={rt} className="viewer2d-legend-item">
        <span
          className="viewer2d-legend-swatch"
          style={{ backgroundColor: ROOM_COLORS[rt] ?? ROOM_COLORS.other }}
        />
        {rt.replace(/_/g, " ")}
      </span>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const FloorPlanViewer2D: React.FC = () => {
  const floorPlan = useFloorPlanStore((s) => s.floorPlan);

  if (!floorPlan) {
    return (
      <div className="viewer2d-container">
        <EmptyState />
      </div>
    );
  }

  // Use the first level only for now
  const level: Level | undefined = floorPlan.levels[0];
  if (!level) {
    return (
      <div className="viewer2d-container">
        <EmptyState />
      </div>
    );
  }

  const { rooms, walls, doors, windows } = level;

  // Compute SVG viewBox from floor plan dimensions
  const planW = floorPlan.width ?? 20;
  const planH = floorPlan.height ?? 15;
  const svgW = m(planW) + PADDING * 2;
  const svgH = m(planH) + PADDING * 2;

  const legendTypes = uniqueRoomTypes(rooms);

  return (
    <div className="viewer2d-container">
      <svg
        className="viewer2d-svg"
        viewBox={`${-PADDING} ${-PADDING} ${svgW} ${svgH}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid */}
        <GridPattern />
        <rect
          x={-PADDING}
          y={-PADDING}
          width={svgW}
          height={svgH}
          fill="url(#grid-pattern)"
        />

        {/* Rooms */}
        {rooms.map((room, i) => (
          <RoomRect key={`room-${i}`} room={room} />
        ))}

        {/* Walls */}
        {walls.map((wall, i) => (
          <WallLine key={`wall-${i}`} wall={wall} />
        ))}

        {/* Doors (rendered above walls to overlay) */}
        {doors.map((door, i) => (
          <DoorMark key={`door-${i}`} door={door} />
        ))}

        {/* Windows (rendered above walls to overlay) */}
        {windows.map((win, i) => (
          <WindowMark key={`win-${i}`} window={win} />
        ))}
      </svg>

      {/* Floating legend */}
      {legendTypes.length > 0 && <Legend roomTypes={legendTypes} />}
    </div>
  );
};

export default FloorPlanViewer2D;
