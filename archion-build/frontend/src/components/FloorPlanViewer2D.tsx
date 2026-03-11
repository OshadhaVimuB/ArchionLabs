import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useFloorPlanStore } from '../store/useFloorPlanStore';
import { useEditorStore } from '../store/useEditorStore';
import { ROOM_COLORS, FURNITURE_DEFAULTS } from '../types/floorplan';
import type { Point2D, Wall, FloorPlan, Door, Window as FloorPlanWindow, FurnitureElement } from '../types/floorplan';
import {
  drawGrid,
  drawRoomFill,
  drawRoomLabel,
  drawWall,
  drawDoor,
  drawSlidingDoor,
  drawWindow,
  drawStaircase,
  drawDimensionLine,
  drawSelectionRect,
  drawText,
  drawTable,
  drawChair,
  drawBed,
  drawCupboard,
} from './architectural-symbols';

// ── Helpers ──────────────────────────────────────────────────────────────

function screenToWorld(
  sx: number, sy: number,
  canvas: HTMLCanvasElement,
  zoom: number, panX: number, panY: number,
): Point2D {
  const rect = canvas.getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  return {
    x: (sx - rect.left - cx - panX) / zoom,
    y: (sy - rect.top - cy - panY) / zoom,
  };
}

function snapToGridVal(val: number, gridSize: number): number {
  return Math.round(val / gridSize) * gridSize;
}

function snapPoint(p: Point2D, gridSize: number): Point2D {
  return {
    x: snapToGridVal(p.x, gridSize),
    y: snapToGridVal(p.y, gridSize),
  };
}

function hitTestWall(
  wx: Point2D, wy: Point2D, p: Point2D, threshold: number,
): boolean {
  const dx = wy.x - wx.x;
  const dy = wy.y - wx.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return false;
  let t = ((p.x - wx.x) * dx + (p.y - wx.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const closest = { x: wx.x + t * dx, y: wx.y + t * dy };
  const dist = Math.sqrt((p.x - closest.x) ** 2 + (p.y - closest.y) ** 2);
  return dist < threshold;
}

function hitTestRect(
  minX: number, minY: number, maxX: number, maxY: number,
  p: Point2D,
): boolean {
  return p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
}

function hitTestCircle(
  cx: number, cy: number, r: number, p: Point2D,
): boolean {
  return (p.x - cx) ** 2 + (p.y - cy) ** 2 <= r * r;
}

function getWallAngle(wall: Wall): number {
  return Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
}

function projectOntoWall(wall: Wall, p: Point2D): Point2D {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return wall.start;
  let t = ((p.x - wall.start.x) * dx + (p.y - wall.start.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return { x: wall.start.x + t * dx, y: wall.start.y + t * dy };
}

function isNearPoint(a: Point2D, b: Point2D, threshold: number): boolean {
  return Math.abs(a.x - b.x) < threshold && Math.abs(a.y - b.y) < threshold;
}

// ── Component ────────────────────────────────────────────────────────────

export default function FloorPlanViewer2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [forceRender, setForceRender] = useState({});

  const animRef = useRef<number>(0);
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStartWorld = useRef<Point2D>({ x: 0, y: 0 });
  const dragSelectStart = useRef<Point2D | null>(null);
  const mouseWorldRef = useRef<Point2D>({ x: 0, y: 0 });

  const { floorPlan, setFloorPlan } = useFloorPlanStore();
  const {
    activeTool,
    transform,
    setTransform,
    showGrid,
    snapToGrid,
    gridSize,
    selectedIds,
    setSelectedIds,
    wallDrawPoints,
    addWallDrawPoint,
    clearWallDraw,
    pushHistory,
    addWall,
    addDoor,
    addWindow,
    addRoom,
    addText,
    removeElement,
    moveElement,
    roomDrawStart,
    setRoomDrawStart,
    setActiveTool,
    placingFurnitureType,
    setPlacingFurnitureType,
    addFurniture,
    updateFurniture,
  } = useEditorStore();

  const level = floorPlan?.levels?.[0];

  // ── Resize observer ──
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // ── Render loop ──
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width;
    const h = canvas.height;
    const { zoom, panX, panY } = transform;

    // Clear
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    const currentLevel = floorPlan?.levels?.[0];

    // Transform: center of canvas is origin, then pan/zoom
    ctx.save();
    ctx.scale(dpr, dpr);
    const cw = w / dpr;
    const ch = h / dpr;
    ctx.translate(cw / 2 + panX, ch / 2 + panY);
    ctx.scale(zoom, zoom);

    // Visible world bounds
    const viewMinX = (-cw / 2 - panX) / zoom;
    const viewMinY = (-ch / 2 - panY) / zoom;
    const viewMaxX = (cw / 2 - panX) / zoom;
    const viewMaxY = (ch / 2 - panY) / zoom;

    // 1. Grid
    if (showGrid) {
      drawGrid(ctx, viewMinX, viewMinY, viewMaxX, viewMaxY, zoom);
    }

    if (currentLevel) {
      // 2. Room fills
      currentLevel.rooms.forEach((room) => {
        const roomColor = ROOM_COLORS[room.room_type] || '#95a5a6';
        const rw = room.bounding_box.max_point.x - room.bounding_box.min_point.x;
        const rh = room.bounding_box.max_point.y - room.bounding_box.min_point.y;
        const isSelected = selectedIds.includes(room.id);
        drawRoomFill(
          ctx,
          room.bounding_box.min_point.x, room.bounding_box.min_point.y,
          rw, rh,
          roomColor + '18',
          roomColor,
          isSelected,
        );
      });

      // 3. Walls
      currentLevel.walls.forEach((wall) => {
        const isSelected = selectedIds.includes(wall.id);
        drawWall(
          ctx,
          wall.start.x, wall.start.y,
          wall.end.x, wall.end.y,
          wall.is_exterior ? 0.15 : 0.10,
          wall.is_exterior,
          isSelected ? '#3b82f6' : (wall.is_exterior ? '#e2e8f0' : '#94a3b8'),
        );
      });

      // 4. Doors – compute rotation from parent wall
      const findWallById = (id: string) => currentLevel.walls.find(w => w.id === id);

      // Helper to find nearest wall directly here since it uses currentLevel
      const findNearestWallLocal = (p: Point2D): Wall | null => {
        let best: Wall | null = null;
        let bestDist = Infinity;
        for (const wall of currentLevel.walls) {
          const proj = projectOntoWall(wall, p);
          const dist = Math.sqrt((p.x - proj.x) ** 2 + (p.y - proj.y) ** 2);
          if (dist < bestDist) {
            bestDist = dist;
            best = wall;
          }
        }
        return best;
      };

      currentLevel.doors.forEach((door) => {
        const isSelected = selectedIds.includes(door.id);
        // archion doors don't have wall_id by default, we match by proximity if missing, 
        // but actually archion Door has wall_start/end. We can calculate rotation from that!
        const rotation = Math.atan2(door.wall_end.y - door.wall_start.y, door.wall_end.x - door.wall_start.x);

        drawDoor(ctx, door.position.x, door.position.y, door.width, rotation, '#10b981', isSelected);
      });

      // 5. Windows
      currentLevel.windows.forEach((win) => {
        const isSelected = selectedIds.includes(win.id);
        const rotation = Math.atan2(win.wall_end.y - win.wall_start.y, win.wall_end.x - win.wall_start.x);

        drawWindow(ctx, win.position.x, win.position.y, win.width, rotation, '#38bdf8', isSelected);
      });

      // 7. Room labels (on top)
      currentLevel.rooms.forEach((room) => {
        const roomColor = ROOM_COLORS[room.room_type] || '#95a5a6';
        const rw = room.bounding_box.max_point.x - room.bounding_box.min_point.x;
        const rh = room.bounding_box.max_point.y - room.bounding_box.min_point.y;
        const cx = (room.bounding_box.min_point.x + room.bounding_box.max_point.x) / 2;
        const cy = (room.bounding_box.min_point.y + room.bounding_box.max_point.y) / 2;
        drawRoomLabel(ctx, cx, cy, room.name, room.area || (rw * rh), roomColor, Math.min(rw, rh));
      });

      // Furniture elements
      if (currentLevel.furniture) {
        currentLevel.furniture.forEach((f) => {
          const isSelected = selectedIds.includes(f.id);
          switch (f.type) {
            case 'table': drawTable(ctx, f.position.x, f.position.y, f.width, f.depth, f.rotation, isSelected); break;
            case 'chair': drawChair(ctx, f.position.x, f.position.y, f.width, f.depth, f.rotation, isSelected); break;
            case 'bed': drawBed(ctx, f.position.x, f.position.y, f.width, f.depth, f.rotation, isSelected); break;
            case 'cupboard': drawCupboard(ctx, f.position.x, f.position.y, f.width, f.depth, f.rotation, isSelected); break;
          }
        });
      }

      // Texts
      if (currentLevel.texts) {
        currentLevel.texts.forEach((text) => {
          const isSelected = selectedIds.includes(text.id);
          drawText(ctx, text.position.x, text.position.y, text.text, text.fontSize, text.color, text.rotation, isSelected);
        });
      }

      // 8. Dimension lines on selected walls
      currentLevel.walls
        .filter((w) => selectedIds.includes(w.id))
        .forEach((wall) => {
          drawDimensionLine(
            ctx,
            wall.start.x, wall.start.y,
            wall.end.x, wall.end.y,
            0.4,
            '#3b82f6',
          );
        });

      // 9. Selection highlights on rooms
      currentLevel.rooms
        .filter((r) => selectedIds.includes(r.id))
        .forEach((room) => {
          const rw = room.bounding_box.max_point.x - room.bounding_box.min_point.x;
          const rh = room.bounding_box.max_point.y - room.bounding_box.min_point.y;
          drawSelectionRect(ctx, room.bounding_box.min_point.x, room.bounding_box.min_point.y, rw, rh);
        });
    }

    // 10. In-progress wall drawing
    if (wallDrawPoints.length > 0) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 0.1;
      ctx.lineCap = 'round';
      ctx.setLineDash([0.1, 0.08]);

      ctx.beginPath();
      ctx.moveTo(wallDrawPoints[0].x, wallDrawPoints[0].y);
      for (let i = 1; i < wallDrawPoints.length; i++) {
        ctx.lineTo(wallDrawPoints[i].x, wallDrawPoints[i].y);
      }
      // Line to cursor
      const mouse = mouseWorldRef.current;
      ctx.lineTo(mouse.x, mouse.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw points
      ctx.fillStyle = '#3b82f6';
      wallDrawPoints.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 0.08, 0, Math.PI * 2);
        ctx.fill();
      });

      // Close indicator: if cursor is near first point, show snap ring
      if (wallDrawPoints.length >= 3) {
        const first = wallDrawPoints[0];
        if (isNearPoint(mouse, first, 0.3)) {
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 0.04;
          ctx.beginPath();
          ctx.arc(first.x, first.y, 0.15, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // Tool cursor preview
    if (activeTool === 'wall' && wallDrawPoints.length === 0) {
      const mouse = mouseWorldRef.current;
      ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 0.06, 0, Math.PI * 2);
      ctx.fill();
    }

    if (activeTool === 'room' && roomDrawStart) {
      const mouse = mouseWorldRef.current;
      const minX = Math.min(roomDrawStart.x, mouse.x);
      const minY = Math.min(roomDrawStart.y, mouse.y);
      const maxX = Math.max(roomDrawStart.x, mouse.x);
      const maxY = Math.max(roomDrawStart.y, mouse.y);

      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 0.05;
      ctx.beginPath();
      ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
    }

    if (activeTool === 'select' && dragSelectStart.current) {
      const mouse = mouseWorldRef.current;
      const start = dragSelectStart.current;
      const minX = Math.min(start.x, mouse.x);
      const minY = Math.min(start.y, mouse.y);
      const maxX = Math.max(start.x, mouse.x);
      const maxY = Math.max(start.y, mouse.y);

      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
      ctx.lineWidth = 0.05 / zoom;
      ctx.beginPath();
      ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
    }

    ctx.restore();

    // ── Help text ──
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'right';
    const helpTexts: Record<string, string[]> = {
      select: ['Click  Select & drag elements', 'Shift + Drag  Pan canvas'],
      wall: ['Click  Place wall point', 'Click first point  Close & finish wall', 'Right-click  Finish open wall', 'Esc  Cancel'],
      room: ['Drag  Draw rectangular room'],
      door: ['Click on wall  Place door'],
      furniture: ['Click  Place furniture element'],
      window: ['Click on wall  Place window'],
      text: ['Click  Place text'],
      eraser: ['Click  Delete element'],
    };
    const lines = helpTexts[activeTool] || [];
    lines.forEach((line, i) => {
      ctx.fillText(line, cw - 16, ch - 16 - (lines.length - 1 - i) * 16);
    });
    ctx.restore();

    animRef.current = requestAnimationFrame(render);
  }, [floorPlan, transform, showGrid, selectedIds, wallDrawPoints, activeTool, roomDrawStart, isDragging, forceRender]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [render]);

  // ── Find element hit detection ──
  const findNearestWall = useCallback((p: Point2D): Wall | null => {
    const lvl = floorPlan?.levels?.[0];
    if (!lvl) return null;
    let best: Wall | null = null;
    let bestDist = Infinity;
    for (const wall of lvl.walls) {
      const proj = projectOntoWall(wall, p);
      const dist = Math.sqrt((p.x - proj.x) ** 2 + (p.y - proj.y) ** 2);
      if (dist < bestDist) {
        bestDist = dist;
        best = wall;
      }
    }
    return best;
  }, [floorPlan]);

  const findElementAt = useCallback((wp: Point2D): string | null => {
    const lvl = floorPlan?.levels?.[0];
    if (!lvl) return null;

    // Check furniture first (small, on-top targets)
    if (lvl.furniture) {
      for (const f of lvl.furniture) {
        if (hitTestRect(f.position.x - f.width / 2, f.position.y - f.depth / 2, f.position.x + f.width / 2, f.position.y + f.depth / 2, wp)) return f.id;
      }
    }
    // Check doors/windows first (small targets)
    for (const door of lvl.doors) {
      if (hitTestCircle(door.position.x, door.position.y, 0.5, wp)) return door.id;
    }
    for (const win of lvl.windows) {
      if (hitTestRect(win.position.x - win.width / 2, win.position.y - 0.2, win.position.x + win.width / 2, win.position.y + 0.2, wp)) return win.id;
    }
    // Texts
    if (lvl.texts) {
      for (const text of lvl.texts) {
        const halfW = (text.text.length * text.fontSize * 0.6) / 2;
        const halfH = text.fontSize / 2;
        if (hitTestRect(text.position.x - halfW, text.position.y - halfH, text.position.x + halfW, text.position.y + halfH, wp)) return text.id;
      }
    }
    // Walls
    for (const wall of lvl.walls) {
      if (hitTestWall(wall.start, wall.end, wp, 0.2)) return wall.id;
    }
    // Rooms
    for (const room of lvl.rooms) {
      if (hitTestRect(room.bounding_box.min_point.x, room.bounding_box.min_point.y, room.bounding_box.max_point.x, room.bounding_box.max_point.y, wp)) return room.id;
    }
    return null;
  }, [floorPlan]);

  const findWallAt = useCallback((wp: Point2D): Wall | null => {
    const lvl = floorPlan?.levels?.[0];
    if (!lvl) return null;
    for (const wall of lvl.walls) {
      if (hitTestWall(wall.start, wall.end, wp, 0.3)) return wall;
    }
    return null;
  }, [floorPlan]);

  // ── Helpers inside Component ──
  const getOrCreatePlan = useCallback((): FloorPlan => {
    if (floorPlan) return floorPlan;
    return {
      name: "Untitled Plan",
      total_area: 0,
      width: null,
      height: null,
      metadata: {},
      levels: [{ level_number: 0, name: 'Ground Floor', height: 2.8, rooms: [], walls: [], doors: [], windows: [], texts: [] }],
    };
  }, [floorPlan]);

  // ── Finalize wall drawing ──
  const finalizeWalls = useCallback((points: Point2D[]) => {
    if (points.length < 2) return;

    const currentPlan = getOrCreatePlan();

    pushHistory(currentPlan, 'Draw walls');
    let updated = currentPlan;
    for (let i = 0; i < points.length - 1; i++) {
      const newWall: Wall = {
        id: `wall_${Date.now()}_${i}`,
        start: points[i],
        end: points[i + 1],
        thickness: 0.15,
        is_exterior: false,
      };
      updated = addWall(updated, newWall);
    }
    setFloorPlan(updated);
    clearWallDraw();
  }, [getOrCreatePlan, pushHistory, addWall, setFloorPlan, clearWallDraw]);

  // ── Mouse handlers ──
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!hasInteracted) setHasInteracted(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Focus the container so it can receive keyboard events like Delete/Backspace
    containerRef.current?.focus();

    const { zoom, panX, panY } = useEditorStore.getState().transform;
    const wp = screenToWorld(e.clientX, e.clientY, canvas, zoom, panX, panY);

    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      isPanning.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
      return;
    }

    if (e.button === 2 && activeTool === 'wall') {
      const currentPoints = useEditorStore.getState().wallDrawPoints;
      if (currentPoints.length >= 2) {
        finalizeWalls(currentPoints);
      } else {
        clearWallDraw();
      }
      return;
    }

    if (e.button !== 0) return;

    if (activeTool === 'select') {
      const hitId = findElementAt(wp);
      if (hitId) {
        if (e.ctrlKey) {
          const ids = selectedIds.includes(hitId)
            ? selectedIds.filter((id) => id !== hitId)
            : [...selectedIds, hitId];
          setSelectedIds(ids);
        } else {
          // If clicking an already selected item, don't clear selection so we can drag the whole group
          if (!selectedIds.includes(hitId)) {
            setSelectedIds([hitId]);
          }
        }
        isDragging.current = true;
        dragStartWorld.current = wp;
      } else {
        setSelectedIds([]);
        // Start drag select
        dragSelectStart.current = wp;
        isDragging.current = true;
      }
    } else if (activeTool === 'wall') {
      const sp = snapToGrid ? snapPoint(wp, gridSize) : wp;
      const currentPoints = useEditorStore.getState().wallDrawPoints;

      if (currentPoints.length >= 3 && isNearPoint(sp, currentPoints[0], 0.3)) {
        const closedPoints = [...currentPoints, currentPoints[0]];
        finalizeWalls(closedPoints);
        return;
      }

      if (currentPoints.length >= 2) {
        const lastPt = currentPoints[currentPoints.length - 1];
        if (isNearPoint(sp, lastPt, 0.15)) {
          finalizeWalls(currentPoints);
          return;
        }
      }

      const hitWall = findWallAt(wp);
      if (hitWall && currentPoints.length > 0) {
        const projected = projectOntoWall(hitWall, wp);
        addWallDrawPoint(projected);
        finalizeWalls([...currentPoints, projected]);
        return;
      }

      addWallDrawPoint(sp);
    } else if (activeTool === 'door' && floorPlan) {
      const wall = findWallAt(wp);
      if (wall) {
        pushHistory(floorPlan, 'Add door');
        const projected = projectOntoWall(wall, wp);
        const newDoor: Door = {
          id: `door_${Date.now()}`,
          position: projected,
          width: 0.9,
          wall_start: wall.start,
          wall_end: wall.end,
          is_exterior: false,
        };
        setFloorPlan(addDoor(floorPlan, newDoor));
      }
    } else if (activeTool === 'window' && floorPlan) {
      const wall = findWallAt(wp);
      if (wall) {
        pushHistory(floorPlan, 'Add window');
        const projected = projectOntoWall(wall, wp);
        const newWin: FloorPlanWindow = {
          id: `win_${Date.now()}`,
          position: projected,
          width: 1.2,
          wall_start: wall.start,
          wall_end: wall.end,
        };
        setFloorPlan(addWindow(floorPlan, newWin));
      }
    } else if (activeTool === 'eraser' && floorPlan) {
      const hitId = findElementAt(wp);
      if (hitId) {
        pushHistory(floorPlan, 'Delete element');
        setFloorPlan(removeElement(floorPlan, hitId));
      }
    } else if (activeTool === 'room') {
      const sp = snapToGrid ? snapPoint(wp, gridSize) : wp;
      setRoomDrawStart(sp);
      isDragging.current = true;
    } else if (activeTool === 'text') {
      const currentPlan = getOrCreatePlan();
      pushHistory(currentPlan, 'Add text');
      const newText = {
        id: `text_${Date.now()}`,
        text: 'Text',
        position: wp,
        fontSize: 0.8,
        color: '#ffffff',
        rotation: 0,
      };
      setFloorPlan(addText(currentPlan, newText));
      setSelectedIds([newText.id]);
      setActiveTool('select');
    } else if (activeTool === 'furniture' && placingFurnitureType) {
      const currentPlan = getOrCreatePlan();
      const defaults = FURNITURE_DEFAULTS[placingFurnitureType];
      pushHistory(currentPlan, `Add ${defaults.label}`);
      const sp = snapToGrid ? snapPoint(wp, gridSize) : wp;
      const newFurniture: FurnitureElement = {
        id: `furn_${Date.now()}`,
        type: placingFurnitureType,
        category: defaults.category,
        position: sp,
        rotation: 0,
        width: defaults.width,
        depth: defaults.depth,
      };
      setFloorPlan(addFurniture(currentPlan, newFurniture));
      setSelectedIds([newFurniture.id]);
      setActiveTool('select');
      setPlacingFurnitureType(null);
    }
  }, [activeTool, floorPlan, selectedIds, snapToGrid, gridSize, findElementAt, findWallAt, setFloorPlan, setSelectedIds, addWallDrawPoint, pushHistory, addDoor, addWindow, addText, removeElement, clearWallDraw, finalizeWalls, setRoomDrawStart, setActiveTool, getOrCreatePlan, placingFurnitureType, addFurniture, setPlacingFurnitureType]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isPanning.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      const { panX, panY } = useEditorStore.getState().transform;
      setTransform({ panX: panX + dx, panY: panY + dy });
      return;
    }

    const { zoom, panX, panY } = useEditorStore.getState().transform;
    const wp = screenToWorld(e.clientX, e.clientY, canvas, zoom, panX, panY);
    const sp = snapToGrid ? snapPoint(wp, gridSize) : wp;
    mouseWorldRef.current = sp;

    if (isDragging.current && floorPlan && selectedIds.length > 0 && activeTool === 'select' && !dragSelectStart.current) {
      const dx = sp.x - dragStartWorld.current.x;
      const dy = sp.y - dragStartWorld.current.y;
      if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
        let updated = floorPlan;
        for (const id of selectedIds) {
          updated = moveElement(updated, id, { x: dx, y: dy });
        }
        setFloorPlan(updated);
        dragStartWorld.current = sp;
      }
    } else if (activeTool === 'room' && isDragging.current) {
      // Force a re-render so the draw rectangle updates interactively
      setForceRender({});
    } else if (activeTool === 'select' && dragSelectStart.current && isDragging.current) {
      // Force a re-render so the drag selection rectangle updates interactively
      setForceRender({});
    }
  }, [floorPlan, selectedIds, snapToGrid, gridSize, setTransform, setFloorPlan, moveElement, activeTool]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning.current) {
      isPanning.current = false;
    }
    if (isDragging.current) {
      isDragging.current = false;
      if (floorPlan && activeTool === 'select' && !dragSelectStart.current) {
        pushHistory(floorPlan, 'Move element');
      }
    }

    if (activeTool === 'select' && dragSelectStart.current) {
      if (floorPlan?.levels?.[0]) {
        const canvas = canvasRef.current;
        if (canvas) {
          const { zoom, panX, panY } = useEditorStore.getState().transform;
          const wp = screenToWorld(e.clientX, e.clientY, canvas, zoom, panX, panY);
          const start = dragSelectStart.current;

          const minX = Math.min(start.x, wp.x);
          const minY = Math.min(start.y, wp.y);
          const maxX = Math.max(start.x, wp.x);
          const maxY = Math.max(start.y, wp.y);

          // Only select if there was an actual drag (not just a click)
          if (maxX - minX > 0.1 || maxY - minY > 0.1) {
            const level = floorPlan.levels[0];
            const newSelectedIds: string[] = [];

            // Helper to check if a point is inside the rect
            const isPointInRect = (p: Point2D) => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;

            // Check walls (if either start or end is in rect)
            level.walls.forEach(w => {
              if (isPointInRect(w.start) || isPointInRect(w.end)) {
                newSelectedIds.push(w.id);
              }
            });

            // Check rooms (if their bounding box intersects our select rect)
            level.rooms.forEach(r => {
              const rMinX = r.bounding_box.min_point.x;
              const rMinY = r.bounding_box.min_point.y;
              const rMaxX = r.bounding_box.max_point.x;
              const rMaxY = r.bounding_box.max_point.y;
              // AABB intersection check:  not (A is completely left of B, or right, or above, or below)
              if (!(rMaxX < minX || rMinX > maxX || rMaxY < minY || rMinY > maxY)) {
                newSelectedIds.push(r.id);
              }
            });

            // Check doors
            level.doors.forEach(d => {
              if (isPointInRect(d.position)) newSelectedIds.push(d.id);
            });

            // Check windows
            level.windows.forEach(w => {
              if (isPointInRect(w.position)) newSelectedIds.push(w.id);
            });

            // Check texts
            if (level.texts) {
              level.texts.forEach(t => {
                if (isPointInRect(t.position)) newSelectedIds.push(t.id);
              });
            }

            // Check furniture
            if (level.furniture) {
              level.furniture.forEach(f => {
                if (isPointInRect(f.position)) newSelectedIds.push(f.id);
              });
            }

            if (e.ctrlKey) {
              // Merge with existing selection if Ctrl is held
              const merged = new Set([...selectedIds, ...newSelectedIds]);
              setSelectedIds(Array.from(merged));
            } else {
              setSelectedIds(newSelectedIds);
            }
          }
        }
      }
      dragSelectStart.current = null;
    }

    if (activeTool === 'room' && roomDrawStart) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { zoom, panX, panY } = useEditorStore.getState().transform;
      const wp = screenToWorld(e.clientX, e.clientY, canvas, zoom, panX, panY);
      const sp = snapToGrid ? snapPoint(wp, gridSize) : wp;

      if (Math.abs(sp.x - roomDrawStart.x) > 0.1 && Math.abs(sp.y - roomDrawStart.y) > 0.1) {
        const currentPlan = getOrCreatePlan();
        pushHistory(currentPlan, 'Add room');

        const minX = Math.min(roomDrawStart.x, sp.x);
        const minY = Math.min(roomDrawStart.y, sp.y);
        const maxX = Math.max(roomDrawStart.x, sp.x);
        const maxY = Math.max(roomDrawStart.y, sp.y);

        const newRoom = {
          id: `room_${Date.now()}`,
          name: 'Room',
          room_type: 'other' as const,
          bounding_box: {
            min_point: { x: minX, y: minY },
            max_point: { x: maxX, y: maxY },
          },
          area: (maxX - minX) * (maxY - minY),
          vertices: null,
        };
        setFloorPlan(addRoom(currentPlan, newRoom));
        setSelectedIds([newRoom.id]);
        setActiveTool('select');
      }
      setRoomDrawStart(null);
      isDragging.current = false;
    }
  }, [floorPlan, pushHistory, activeTool, roomDrawStart, snapToGrid, gridSize, setFloorPlan, addRoom, setSelectedIds, setActiveTool, setRoomDrawStart, getOrCreatePlan]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { zoom } = useEditorStore.getState().transform;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.max(3, Math.min(200, zoom * factor));
    setTransform({ zoom: newZoom });
  }, [setTransform]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      const currentPoints = useEditorStore.getState().wallDrawPoints;
      if (currentPoints.length > 0) {
        clearWallDraw();
      } else if (activeTool === 'furniture') {
        setPlacingFurnitureType(null);
        setActiveTool('select');
      } else {
        setRoomDrawStart(null);
        setSelectedIds([]);
      }
    }
    if (e.key === 'Enter') {
      const currentPoints = useEditorStore.getState().wallDrawPoints;
      if (activeTool === 'wall' && currentPoints.length >= 2) {
        finalizeWalls(currentPoints);
      }
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0 && floorPlan) {
      // Prevent browser "back" navigation on Backspace
      if (e.key === 'Backspace') {
        e.preventDefault();
      }
      pushHistory(floorPlan, 'Delete elements');
      let updated = floorPlan;
      for (const id of selectedIds) {
        updated = removeElement(updated, id);
      }
      setFloorPlan(updated);
      setSelectedIds([]);
    }
    // Rotate selected furniture by 90° with R key
    if (e.key === 'r' && activeTool === 'select' && selectedIds.length > 0 && floorPlan) {
      const lvl = floorPlan.levels?.[0];
      if (lvl?.furniture) {
        let updated = floorPlan;
        let didRotate = false;
        for (const id of selectedIds) {
          const furn = lvl.furniture.find(f => f.id === id);
          if (furn) {
            if (!didRotate) { pushHistory(floorPlan, 'Rotate furniture'); didRotate = true; }
            updated = updateFurniture(updated, id, { rotation: (furn.rotation + 90) % 360 });
          }
        }
        if (didRotate) setFloorPlan(updated);
      }
    }
  }, [clearWallDraw, setSelectedIds, selectedIds, floorPlan, pushHistory, removeElement, setFloorPlan, activeTool, finalizeWalls, updateFurniture, setPlacingFurnitureType, setActiveTool, setRoomDrawStart]);

  const cursorMap: Record<string, string> = {
    select: 'default',
    wall: 'crosshair',
    room: 'crosshair',
    door: 'copy',
    window: 'copy',
    text: 'text',
    eraser: 'not-allowed',
    furniture: 'copy',
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {(!hasInteracted && (!floorPlan || !level || (level.rooms.length === 0 && level.walls.length === 0 && level.doors.length === 0 && level.windows.length === 0)) && wallDrawPoints.length === 0) && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 10 }}>
          <div className="text-muted-foreground opacity-50 text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-4">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 3v18" />
            </svg>
            <h3 className="text-lg font-medium mb-1">Canvas Ready</h3>
            <p className="text-sm">Generate a floor plan or use the tools above to draw.</p>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className="w-full h-full outline-none"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={{ backgroundColor: '#0a0a0a' }}
      >
        <canvas
          ref={canvasRef}
          style={{ cursor: cursorMap[activeTool] || 'default', touchAction: 'none' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
    </div>
  );
}
