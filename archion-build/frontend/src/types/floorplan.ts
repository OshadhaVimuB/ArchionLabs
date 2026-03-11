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

export const ROOM_COLORS: Record<RoomType, string> = {
  living_room: "#FFDDC1",
  bedroom: "#C1E1C1",
  bathroom: "#C1D4FF",
  kitchen: "#FFE5B4",
  dining_room: "#FFD1DC",
  garage: "#D3D3D3",
  hallway: "#F0E68C",
  closet: "#E6E6FA",
  laundry: "#E0FFFF",
  office: "#F5DEB3",
  balcony: "#FFF0F5",
  entrance: "#FAF0E6",
  storage: "#DCDCDC",
  other: "#F5F5F5",
};

export type PropertyType = "apartment" | "house" | "office" | "commercial";

export type EditorTool = 'select' | 'wall' | 'room' | 'door' | 'window' | 'text' | 'eraser' | 'furniture';

export interface CanvasTransform {
  zoom: number;
  panX: number;
  panY: number;
}

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
// Furniture Elements
// ---------------------------------------------------------------------------

export type FurnitureType = 'table' | 'chair' | 'bed' | 'cupboard';

export type FurnitureCategory = 'living_room' | 'bedroom' | 'kitchen' | 'bathroom';

export interface FurnitureElement {
  id: string;
  type: FurnitureType;
  category: FurnitureCategory;
  position: Point2D;
  rotation: number;
  width: number;
  depth: number;
}

/** Default dimensions for each furniture type (meters). */
export const FURNITURE_DEFAULTS: Record<FurnitureType, { width: number; depth: number; label: string; category: FurnitureCategory }> = {
  table:    { width: 1.2, depth: 0.8, label: 'Table',    category: 'living_room' },
  chair:    { width: 0.5, depth: 0.5, label: 'Chair',    category: 'living_room' },
  bed:      { width: 1.4, depth: 2.0, label: 'Bed',      category: 'bedroom' },
  cupboard: { width: 1.0, depth: 0.5, label: 'Cupboard', category: 'bedroom' },
};

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
  furniture?: FurnitureElement[];
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
