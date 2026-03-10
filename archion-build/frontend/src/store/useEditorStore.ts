import { create } from 'zustand';
import type {
    EditorTool,
    CanvasTransform,
    FloorPlan,
    Point2D,
    Wall,
    Door,
    Window,
    Room,
    TextElement,
    PropertyType,
} from '../types/floorplan';

// ── History snapshot for undo/redo ──
interface HistoryEntry {
    floorPlan: FloorPlan;
    label: string;
}

interface EditorStore {
    // ── Active tool ──
    activeTool: EditorTool;
    setActiveTool: (tool: EditorTool) => void;

    // ── Canvas transform ──
    transform: CanvasTransform;
    setTransform: (t: Partial<CanvasTransform>) => void;
    resetTransform: () => void;

    // ── Grid & Snap ──
    showGrid: boolean;
    toggleGrid: () => void;
    snapToGrid: boolean;
    toggleSnap: () => void;
    gridSize: number; // meters

    // ── Selection ──
    selectedIds: string[];
    setSelectedIds: (ids: string[]) => void;
    hoveredId: string | null;
    setHoveredId: (id: string | null) => void;

    // ── In-progress drawing ──
    wallDrawPoints: Point2D[];
    addWallDrawPoint: (p: Point2D) => void;
    clearWallDraw: () => void;

    roomDrawStart: Point2D | null;
    setRoomDrawStart: (p: Point2D | null) => void;

    // ── Specifications ──
    totalArea: number;
    setTotalArea: (a: number) => void;
    numBedrooms: number;
    setNumBedrooms: (n: number) => void;
    numBathrooms: number;
    setNumBathrooms: (n: number) => void;
    numKitchens: number;
    setNumKitchens: (n: number) => void;
    propertyType: PropertyType;
    setPropertyType: (t: PropertyType) => void;
    numLevels: number;
    setNumLevels: (n: number) => void;

    // ── History (undo/redo) ──
    undoStack: HistoryEntry[];
    redoStack: HistoryEntry[];
    pushHistory: (fp: FloorPlan, label: string) => void;
    undo: (currentFp: FloorPlan) => FloorPlan | null;
    redo: (currentFp: FloorPlan) => FloorPlan | null;

    // ── Floor plan mutations ──
    addWall: (fp: FloorPlan, wall: Wall) => FloorPlan;
    addDoor: (fp: FloorPlan, door: Door) => FloorPlan;
    addWindow: (fp: FloorPlan, win: Window) => FloorPlan;
    addRoom: (fp: FloorPlan, room: Room) => FloorPlan;
    addText: (fp: FloorPlan, text: TextElement) => FloorPlan;
    updateRoom: (fp: FloorPlan, id: string, updates: Partial<Room>) => FloorPlan;
    updateText: (fp: FloorPlan, id: string, updates: Partial<TextElement>) => FloorPlan;
    removeElement: (fp: FloorPlan, id: string) => FloorPlan;
    moveElement: (fp: FloorPlan, id: string, delta: Point2D) => FloorPlan;
}

const DEFAULT_TRANSFORM: CanvasTransform = { zoom: 40, panX: 0, panY: 0 };
const MAX_HISTORY = 50;

export const useEditorStore = create<EditorStore>((set, get) => ({
    // ── Active tool ──
    activeTool: 'select',
    setActiveTool: (tool) => {
        set({ activeTool: tool, wallDrawPoints: [], roomDrawStart: null });
    },

    // ── Canvas transform ──
    transform: { ...DEFAULT_TRANSFORM },
    setTransform: (t) =>
        set((s) => ({ transform: { ...s.transform, ...t } })),
    resetTransform: () => set({ transform: { ...DEFAULT_TRANSFORM } }),

    // ── Grid & Snap ──
    showGrid: true,
    toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
    snapToGrid: true,
    toggleSnap: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
    gridSize: 0.5,

    // ── Selection ──
    selectedIds: [],
    setSelectedIds: (ids) => set({ selectedIds: ids }),
    hoveredId: null,
    setHoveredId: (id) => set({ hoveredId: id }),

    // ── In-progress drawing ──
    wallDrawPoints: [],
    addWallDrawPoint: (p) =>
        set((s) => ({ wallDrawPoints: [...s.wallDrawPoints, p] })),
    clearWallDraw: () => set({ wallDrawPoints: [] }),

    roomDrawStart: null,
    setRoomDrawStart: (p) => set({ roomDrawStart: p }),

    // ── Specifications ──
    totalArea: 85,
    setTotalArea: (a) => set({ totalArea: a }),
    numBedrooms: 2,
    setNumBedrooms: (n) => set({ numBedrooms: n }),
    numBathrooms: 1,
    setNumBathrooms: (n) => set({ numBathrooms: n }),
    numKitchens: 1,
    setNumKitchens: (n) => set({ numKitchens: n }),
    propertyType: 'apartment',
    setPropertyType: (t) => set({ propertyType: t }),
    numLevels: 1,
    setNumLevels: (n) => set({ numLevels: n }),

    // ── History ──
    undoStack: [],
    redoStack: [],
    pushHistory: (fp, label) =>
        set((s) => ({
            undoStack: [...s.undoStack.slice(-MAX_HISTORY), { floorPlan: structuredClone(fp), label }],
            redoStack: [],
        })),
    undo: (currentFp) => {
        const { undoStack } = get();
        if (undoStack.length === 0) return null;
        const entry = undoStack[undoStack.length - 1];
        set((s) => ({
            undoStack: s.undoStack.slice(0, -1),
            redoStack: [...s.redoStack, { floorPlan: structuredClone(currentFp), label: entry.label }],
        }));
        return structuredClone(entry.floorPlan);
    },
    redo: (currentFp) => {
        const { redoStack } = get();
        if (redoStack.length === 0) return null;
        const entry = redoStack[redoStack.length - 1];
        set((s) => ({
            redoStack: s.redoStack.slice(0, -1),
            undoStack: [...s.undoStack, { floorPlan: structuredClone(currentFp), label: entry.label }],
        }));
        return structuredClone(entry.floorPlan);
    },

    // ── Floor plan mutations (pure functions, return new FloorPlan) ──
    addWall: (fp, wall) => {
        const level = fp.levels[0];
        if (!level) return fp;
        return {
            ...fp,
            levels: [{
                ...level,
                walls: [...level.walls, wall]
            }]
        }
    },
    addDoor: (fp, door) => {
        const level = fp.levels[0];
        if (!level) return fp;
        return {
            ...fp,
            levels: [{
                ...level,
                doors: [...level.doors, door]
            }]
        }
    },
    addWindow: (fp, win) => {
        const level = fp.levels[0];
        if (!level) return fp;
        return {
            ...fp,
            levels: [{
                ...level,
                windows: [...level.windows, win]
            }]
        }
    },
    addRoom: (fp, room) => {
        const level = fp.levels[0];
        if (!level) return fp;
        return {
            ...fp,
            levels: [{
                ...level,
                rooms: [...level.rooms, room]
            }]
        }
    },
    addText: (fp, text) => {
        const level = fp.levels[0];
        if (!level) return fp;
        return {
            ...fp,
            levels: [{
                ...level,
                texts: [...(level.texts || []), text]
            }]
        }
    },
    updateRoom: (fp, id, updates) => {
        const level = fp.levels[0];
        if (!level) return fp;
        return {
            ...fp,
            levels: [{
                ...level,
                rooms: level.rooms.map(r => r.id === id ? { ...r, ...updates } : r)
            }]
        }
    },
    updateText: (fp, id, updates) => {
        const level = fp.levels[0];
        if (!level) return fp;
        return {
            ...fp,
            levels: [{
                ...level,
                texts: (level.texts || []).map(t => t.id === id ? { ...t, ...updates } : t)
            }]
        }
    },
    removeElement: (fp, id) => {
        const level = fp.levels[0];
        if (!level) return fp;
        return {
            ...fp,
            levels: [{
                ...level,
                walls: level.walls.filter((w) => w.id !== id),
                rooms: level.rooms.filter((r) => r.id !== id),
                doors: level.doors.filter((d) => d.id !== id),
                windows: level.windows.filter((w) => w.id !== id),
                texts: (level.texts || []).filter((t) => t.id !== id),
            }]
        }
    },
    moveElement: (fp, id, delta) => {
        const level = fp.levels[0];
        if (!level) return fp;

        const movePoint = (p: Point2D): Point2D => ({
            x: p.x + delta.x,
            y: p.y + delta.y,
        });

        return {
            ...fp,
            levels: [{
                ...level,
                walls: level.walls.map((w) =>
                    w.id === id
                        ? { ...w, start: movePoint(w.start), end: movePoint(w.end) }
                        : w
                ),
                doors: level.doors.map((d) =>
                    d.id === id ? { ...d, position: movePoint(d.position), wall_start: movePoint(d.wall_start), wall_end: movePoint(d.wall_end) } : d
                ),
                windows: level.windows.map((w) =>
                    w.id === id ? { ...w, position: movePoint(w.position), wall_start: movePoint(w.wall_start), wall_end: movePoint(w.wall_end) } : w
                ),
                rooms: level.rooms.map((r) => {
                    if (r.id === id) {
                        const minP = movePoint(r.bounding_box.min_point);
                        const maxP = movePoint(r.bounding_box.max_point);
                        return {
                            ...r,
                            bounding_box: { min_point: minP, max_point: maxP },
                            area: (maxP.x - minP.x) * (maxP.y - minP.y),
                            vertices: r.vertices ? r.vertices.map(movePoint) : null,
                        };
                    }
                    return r;
                }),
                texts: (level.texts || []).map((t) =>
                    t.id === id ? { ...t, position: movePoint(t.position) } : t
                ),
            }]
        };
    },
}));
