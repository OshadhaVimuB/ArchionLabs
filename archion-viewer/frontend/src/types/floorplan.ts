/**
 * Shared type definitions for the Archion 3D Model Viewer.
 */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
