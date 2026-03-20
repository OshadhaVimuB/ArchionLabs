/**
 * Zustand store for global floor-plan application state.
 *
 * Manages the current floor plan, chat message history,
 * view modes, and loading / error indicators.
 */

import { create } from "zustand";

import type { FloorPlan, ChatMessage } from "@/types/floorplan";
import { generateFloorPlan } from "@/services/api";
import { saveRecentProject } from "@/services/recentProjects";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ViewMode = "generate" | "view2d" | "view3d";
export type ViewerTab = "2d" | "3d";

export interface FloorPlanState {
    /** The currently active floor plan (null until one is generated). */
    floorPlan: FloorPlan | null;
    /** ID of the persisted project. */
    projectId: string | null;
    /** Chronological chat messages. */
    messages: ChatMessage[];
    /** Top-level UI mode. */
    viewMode: ViewMode;
    /** Active tab within the canvas viewer. */
    viewerTab: ViewerTab;
    /** True while an API call is in flight. */
    isLoading: boolean;
    /** Last error message, if any. */
    error: string | null;
}

export interface FloorPlanActions {
    /** Send a prompt to the backend, generate a floor plan, and update state. */
    generatePlan: (prompt: string, model?: string) => Promise<void>;
    /** Switch the top-level view mode. */
    setViewMode: (mode: ViewMode) => void;
    /** Switch the viewer tab (2D / 3D). */
    setViewerTab: (tab: ViewerTab) => void;
    /** Clear the current error. */
    clearError: () => void;
    /** Update the entire floor plan (used by Editor). */
    setFloorPlan: (fp: FloorPlan) => void;
    /** Reset the entire store to its initial state. */
    reset: () => void;
    /** Clear the current chat history. */
    clearChat: () => void;
}

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const initialState: FloorPlanState = {
    floorPlan: null,
    projectId: null,
    messages: [],
    viewMode: "generate",
    viewerTab: "2d",
    isLoading: false,
    error: null,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useFloorPlanStore = create<FloorPlanState & FloorPlanActions>()(
    (set, get) => ({
        ...initialState,

        // -- Actions -----------------------------------------------------------

        generatePlan: async (prompt: string, model?: string) => {
            // Append user message
            const userMessage: ChatMessage = {
                role: "user",
                content: prompt,
                timestamp: Date.now(),
            };

            set((state) => ({
                messages: [...state.messages, userMessage],
                isLoading: true,
                error: null,
            }));

            try {
                const currentFloorPlan = get().floorPlan;
                const response = await generateFloorPlan(prompt, model, currentFloorPlan || undefined);

                const assistantMessage: ChatMessage = {
                    role: "assistant",
                    content: response.message,
                    timestamp: Date.now(),
                };

                set((state) => ({
                    floorPlan: response.floorplan,
                    projectId: response.project_id,
                    messages: [...state.messages, assistantMessage],
                    viewMode: "view2d",
                    isLoading: false,
                }));

                // Save to landing-page dashboard as a recent project
                saveRecentProject(
                    response.floorplan.name || `Plan — ${response.project_id.slice(0, 8)}`,
                    prompt,
                    response.project_id,
                );
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : "An unknown error occurred";

                const errorMessage: ChatMessage = {
                    role: "assistant",
                    content: `Error: ${message}`,
                    timestamp: Date.now(),
                };

                set((state) => ({
                    messages: [...state.messages, errorMessage],
                    isLoading: false,
                    error: message,
                }));
            }
        },

        setViewMode: (mode) => set({ viewMode: mode }),

        setViewerTab: (tab) => set({ viewerTab: tab }),

        setFloorPlan: (fp) => set({ floorPlan: fp }),

        clearError: () => set({ error: null }),

        reset: () => set({ ...initialState }),

        clearChat: () => set({ messages: [], error: null }),
    }),
);
