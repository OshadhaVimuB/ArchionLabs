/**
 * TypeScript type definitions for architectural floor plan primitives.
 *
 * These types mirror the backend Pydantic models defined in
 * backend/app/models/floorplan.py and serve as the single source
 * of truth on the frontend.
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
  start: Point2D;
  end: Point2D;
  thickness: number;
  is_exterior: boolean;
}

export interface Door {
  position: Point2D;
  width: number;
  wall_start: Point2D;
  wall_end: Point2D;
  is_exterior: boolean;
}

export interface Window {
  position: Point2D;
  width: number;
  wall_start: Point2D;
  wall_end: Point2D;
}

export interface Room {
  name: string;
  room_type: RoomType;
  bounding_box: BoundingBox;
  area: number | null;
  vertices: Point2D[] | null;
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
}

export interface GenerateResponse {
  project_id: string;
  floorplan: FloorPlan;
  message: string;
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}
