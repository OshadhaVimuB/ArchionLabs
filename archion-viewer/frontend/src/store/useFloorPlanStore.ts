import { create } from "zustand";
import type { ChatMessage } from "@/types/floorplan";

// ---------------------------------------------------------------------------
// Annotation Types
// ---------------------------------------------------------------------------

export interface Annotation {
    id: string;
    /** 3D world position of the pin */
    position: [number, number, number];
    /** User-entered label text */
    label: string;
    /** Hex color for the pin */
    color: string;
    /** Timestamp */
    createdAt: string;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export interface ModelStoreState {
    modelUrl: string | null;
    modelFormat: string | null;
    modelName: string | null;
    mtlText: string | null;
    textureMap: Record<string, string> | null;
    projectId: string | null;
    messages: ChatMessage[];
    isLoading: boolean;
    error: string | null;
    /** Annotation state */
    annotations: Annotation[];
    annotationMode: boolean;
}

export interface ModelStoreActions {
    setModel: (
        url: string,
        format: string,
        name: string,
        mtlText?: string | null,
        textureMap?: Record<string, string> | null,
    ) => void;
    setProjectId: (id: string) => void;
    addMessage: (msg: ChatMessage) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
    clearMessages: () => void;
    reset: () => void;
    /** Annotation actions */
    setAnnotationMode: (enabled: boolean) => void;
    addAnnotation: (annotation: Annotation) => void;
    removeAnnotation: (id: string) => void;
    clearAnnotations: () => void;
}

const initialState: ModelStoreState = {
    modelUrl: null,
    modelFormat: null,
    modelName: null,
    mtlText: null,
    textureMap: null,
    projectId: null,
    messages: [],
    isLoading: false,
    error: null,
    annotations: [],
    annotationMode: false,
};

export const useFloorPlanStore = create<ModelStoreState & ModelStoreActions>((set) => ({
    ...initialState,

    setModel: (url, format, name, mtlText, textureMap) => set({
        modelUrl: url,
        modelFormat: format,
        modelName: name,
        mtlText: mtlText || null,
        textureMap: textureMap || null,
    }),
    setProjectId: (id) => set({ projectId: id }),
    addMessage: (msg) =>
        set((state) => ({
            messages: [...state.messages, msg],
        })),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
    clearMessages: () => set({ messages: [] }),
    reset: () => {
        set((state) => {
            if (state.modelUrl) URL.revokeObjectURL(state.modelUrl);
            if (state.textureMap) {
                Object.values(state.textureMap).forEach((blobUrl) => {
                    try { URL.revokeObjectURL(blobUrl); } catch { /* ignore */ }
                });
            }
            return initialState;
        });
    },
    // Annotation actions
    setAnnotationMode: (enabled) => set({ annotationMode: enabled }),
    addAnnotation: (annotation) =>
        set((state) => ({ annotations: [...state.annotations, annotation] })),
    removeAnnotation: (id) =>
        set((state) => ({ annotations: state.annotations.filter((a) => a.id !== id) })),
    clearAnnotations: () => set({ annotations: [] }),
}));
