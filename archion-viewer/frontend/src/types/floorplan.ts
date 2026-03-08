/**
 * TypeScript type definitions for architectural floor plan primitives.
 *
 * These types mirror the backend Pydantic models and serve as the single source
 * of truth on the frontend for 3D visualization.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type RoomType =
  | "living_room"
  | "bedroom"
  | "bathroom"
  | "kitchen"
  | "dining_room"
  | "garage"
  | "hallway"
  | "closet"
  | "laundry"
  | "office"
  | "balcony"
  | "entrance"
  | "storage"
  | "other";

export const ROOM_COLORS: Record<RoomType, string> = {
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

export type PropertyType = "apartment" | "house" | "office" | "commercial";

// ---------------------------------------------------------------------------
// Geometry Primitives
// ---------------------------------------------------------------------------

export interface Point2D {
  x: number;
  y: number;
}

export interface BoundingBox {
  min_point: Point2D;
  max_point: Point2D;
}

// ---------------------------------------------------------------------------
// Architectural Elements
// ---------------------------------------------------------------------------

export interface Wall {
  id: string;
  start: Point2D;
  end: Point2D;
  thickness: number;
  is_exterior: boolean;
}

export interface Door {
  id: string;
  position: Point2D;
  width: number;
  wall_start: Point2D;
  wall_end: Point2D;
  is_exterior: boolean;
}

export interface Window {
  id: string;
  position: Point2D;
  width: number;
  wall_start: Point2D;
  wall_end: Point2D;
}

export interface Room {
  id: string;
  name: string;
  room_type: RoomType;
  bounding_box: BoundingBox;
  area: number | null;
  vertices: Point2D[] | null;
}

export interface TextElement {
  id: string;
  text: string;
  position: Point2D;
  fontSize: number;
  color: string;
  rotation: number;
}

// ---------------------------------------------------------------------------
// Composite Structures
// ---------------------------------------------------------------------------

export interface Level {
  level_number: number;
  name: string;
  height: number;
  rooms: Room[];
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  texts?: TextElement[];
}

export interface FloorPlan {
  name: string;
  levels: Level[];
  total_area: number | null;
  width: number | null;
  height: number | null;
  metadata: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// API Payloads
// ---------------------------------------------------------------------------

export interface GenerateRequest {
  prompt: string;
  model?: string;
  current_floorplan?: FloorPlan;
}

export interface GenerateResponse {
  floor_plan: FloorPlan;
  project_id: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
