/**
 * Utility functions for the 3D viewer application.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes intelligently, handling conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Generate a unique ID.
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce a function.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get room display name.
 */
export function getRoomName(roomType: string): string {
  const names: Record<string, string> = {
    living_room: "Living Room",
    bedroom: "Bedroom",
    bathroom: "Bathroom",
    kitchen: "Kitchen",
    dining_room: "Dining Room",
    garage: "Garage",
    hallway: "Hallway",
    closet: "Closet",
    laundry: "Laundry",
    office: "Office",
    balcony: "Balcony",
    entrance: "Entrance",
    storage: "Storage",
    other: "Other",
  };

  return names[roomType] || "Unknown";
}

/**
 * Format area in square meters.
 */
export function formatArea(area: number | null): string {
  if (area === null || area === undefined) return "—";
  return `${area.toFixed(1)} m²`;
}

/**
 * Format dimensions.
 */
export function formatDimensions(width: number | null, height: number | null): string {
  if (width === null || width === undefined || height === null || height === undefined) {
    return "—";
  }
  return `${width.toFixed(1)}m × ${height.toFixed(1)}m`;
}
