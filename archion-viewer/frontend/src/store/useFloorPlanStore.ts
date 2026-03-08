/**
 * Zustand store for global floor-plan application state.
 *
 * Manages the current floor plan, loading states, and error handling.
 */

import { create } from "zustand";
import type { FloorPlan, ChatMessage } from "@/types/floorplan";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FloorPlanState {
    /** The currently active floor plan (null until one is loaded). */
    floorPlan: FloorPlan | null;
    /** ID of the persisted project. */
    projectId: string | null;
    /** Chronological chat messages. */
    messages: ChatMessage[];
    /** True while an API call is in flight. */
    isLoading: boolean;
    /** Last error message, if any. */
    error: string | null;
}

export interface FloorPlanActions {
    /** Set the floor plan. */
    setFloorPlan: (fp: FloorPlan) => void;
    /** Set the project ID. */
    setProjectId: (id: string) => void;
    /** Add a chat message. */
    addMessage: (msg: ChatMessage) => void;
    /** Set loading state. */
    setLoading: (loading: boolean) => void;
    /** Set error message. */
    setError: (error: string | null) => void;
    /** Clear the current error. */
    clearError: () => void;
    /** Clear messages. */
    clearMessages: () => void;
    /** Reset the entire store to its initial state. */
    reset: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const initialState: FloorPlanState = {
    floorPlan: null,
    projectId: null,
    messages: [],
    isLoading: false,
    error: null,
};

export const useFloorPlanStore = create<FloorPlanState & FloorPlanActions>((set) => ({
    ...initialState,

    setFloorPlan: (fp) => set({ floorPlan: fp }),
    setProjectId: (id) => set({ projectId: id }),
    addMessage: (msg) =>
        set((state) => ({
            messages: [...state.messages, msg],
        })),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
    clearMessages: () => set({ messages: [] }),
    reset: () => set(initialState),
}));
