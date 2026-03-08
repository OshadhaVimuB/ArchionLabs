/**
 * Floor Plan Processor - Converts 2D floor plans to 3D data structures with intelligent analysis
 * Uses image processing to detect walls and rooms from floor plan images
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FloorPlan, Level, Room, Wall, Door, Window, RoomType } from "@/types/floorplan";
import DxfParser from "dxf-parser";

/**
 * Generate ID for floor plan elements
 */
export function generateId(prefix: string = "elem"): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Process uploaded file and convert to floor plan
 */
export async function processFloorPlanFile(
  file: File
): Promise<FloorPlan> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".json")) {
    return processJsonFile(file);
  } else if (fileName.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
    return processImageFile(file);
  } else if (fileName.endsWith(".dxf")) {
    return processDxfFile(file);
  } else if (fileName.endsWith(".dwg")) {
    return processDwgFile(file);
  } else {
    throw new Error("Unsupported file type. Please upload JSON, image, or CAD files.");
  }
}

/**
 * Process JSON floor plan file
 */
async function processJsonFile(file: File): Promise<FloorPlan> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);

        // Validate basic structure
        if (!data.levels || !Array.isArray(data.levels)) {
          throw new Error("Invalid floor plan: missing levels array");
        }

        // Ensure it has the required structure
        const floorPlan: FloorPlan = {
          name: data.name || "Imported Floor Plan",
          levels: data.levels || [],
          total_area: data.total_area || 0,
          width: data.width || 10,
          height: data.height || 10,
          metadata: data.metadata || {},
        };

        resolve(floorPlan);
      } catch (error) {
        reject(new Error(`Failed to parse JSON: ${error}`));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/**
 * Process image file and create floor plan using intelligent wall detection
 */
async function processImageFile(file: File): Promise<FloorPlan> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const img = new Image();
        img.onload = () => {
          // Analyze image and create intelligent floor plan
          const floorPlan = analyzeFloorPlanImage(img, file.name);
          resolve(floorPlan);
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target?.result as string;
      } catch (error) {
        reject(new Error(`Failed to process image: ${error}`));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Analyze floor plan image and detect rooms and walls
 */
function analyzeFloorPlanImage(img: HTMLImageElement, fileName: string): FloorPlan {
  // Create canvas for image analysis
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot get canvas context");

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imageData.data;

  // Detect walls in the image
  const wallMap = detectWallsInImage(data, img.width, img.height);

  // Detect rooms (empty spaces between walls)
  const roomMap = detectRoomsFromWalls(wallMap, img.width, img.height);

  // Scale from pixel space to model space
  const pixelToModel = 0.2; // 1 model unit = 5 pixels
  const modelWidth = Math.max(10, img.width * pixelToModel);
  const modelHeight = Math.max(10, img.height * pixelToModel);

  // Extract geometric data
  const { rooms, walls } = extractFloorsAndWalls(
    roomMap,
    wallMap,
    modelWidth,
    modelHeight,
    pixelToModel
  );

  const level: Level = {
    level_number: 1,
    name: "Ground Floor",
    height: 2.8,
    rooms: rooms.length > 0 ? rooms : createDefaultRooms(modelWidth, modelHeight),
    walls: walls.length > 0 ? walls : createDefaultWalls(modelWidth, modelHeight),
    doors: createDefaultDoors(modelWidth, modelHeight),
    windows: createDefaultWindows(modelWidth, modelHeight),
    texts: [],
  };

  const totalArea = level.rooms.reduce((sum, room) => sum + (room.area || 0), 0);

  return {
    name: fileName.replace(/\.[^/.]+$/, ""),
    levels: [level],
    total_area: totalArea,
    width: modelWidth,
    height: modelHeight,
    metadata: {
      source: "image_upload",
      upload_date: new Date().toISOString(),
      original_size: `${img.width}×${img.height}px`,
      detection_method: "wall_analysis",
    },
  };
}

/**
 * Detect dark pixels (walls) in the image
 */
function detectWallsInImage(
  data: Uint8ClampedArray,
  width: number,
  height: number
): number[][] {
  const wallMap: number[][] = Array(height)
    .fill(null)
    .map(() => Array(width).fill(0));

  for (let i = 0; i < data.length; i += 4) {
    const pixelIdx = i / 4;
    const x = pixelIdx % width;
    const y = Math.floor(pixelIdx / width);

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Calculate brightness
    const brightness = (r + g + b) / 3;

    // Dark pixels (brightness < 120) are considered walls
    if (brightness < 120 && a > 200) {
      wallMap[y][x] = 1;
    }
  }

  // Clean up the wall map with morphological operations
  return cleanWallMap(wallMap, width, height);
}

/**
 * Clean wall map by removing noise
 */
function cleanWallMap(map: number[][], width: number, height: number): number[][] {
  const result = map.map(row => [...row]);

  // Remove isolated pixels
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (result[y][x] === 1) {
        const neighbors = [
          result[y - 1][x - 1],
          result[y - 1][x],
          result[y - 1][x + 1],
          result[y][x - 1],
          result[y][x + 1],
          result[y + 1][x - 1],
          result[y + 1][x],
          result[y + 1][x + 1],
        ];
        const wallCount = neighbors.filter(n => n === 1).length;
        if (wallCount < 3) {
          result[y][x] = 0;
        }
      }
    }
  }

  return result;
}

/**
 * Detect rooms using flood fill algorithm
 */
function detectRoomsFromWalls(
  wallMap: number[][],
  width: number,
  height: number
): number[][] {
  const roomMap: number[][] = Array(height)
    .fill(null)
    .map(() => Array(width).fill(0));

  let roomId = 1;

  for (let y = 10; y < height - 10; y++) {
    for (let x = 10; x < width - 10; x++) {
      if (wallMap[y][x] === 0 && roomMap[y][x] === 0) {
        const area = floodFillRoom(wallMap, roomMap, x, y, roomId, width, height);
        if (area > 100) {
          // Only count rooms larger than 100 pixels
          roomId++;
        } else {
          // Undo the flood fill if room is too small
          for (let ry = 0; ry < height; ry++) {
            for (let rx = 0; rx < width; rx++) {
              if (roomMap[ry][rx] === roomId) {
                roomMap[ry][rx] = 0;
              }
            }
          }
        }
      }
    }
  }

  return roomMap;
}

/**
 * Flood fill a room and return its area
 */
function floodFillRoom(
  wallMap: number[][],
  roomMap: number[][],
  startX: number,
  startY: number,
  roomId: number,
  width: number,
  height: number
): number {
  const queue: Array<[number, number]> = [[startX, startY]];
  const visited = new Set<string>();
  let area = 0;

  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    const key = `${x},${y}`;

    if (visited.has(key)) continue;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (wallMap[y][x] === 1 || roomMap[y][x] !== 0) continue;

    visited.add(key);
    roomMap[y][x] = roomId;
    area++;

    // Add neighbors (4-connected)
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return area;
}

/**
 * Extract rooms and walls from detection maps
 */
function extractFloorsAndWalls(
  roomMap: number[][],
  wallMap: number[][],
  modelWidth: number,
  modelHeight: number,
  pixelToModel: number
): { rooms: Room[]; walls: Wall[] } {
  const rooms: Room[] = [];
  const roomIds = new Set<number>();

  // Collect all room IDs
  for (const row of roomMap) {
    for (const cell of row) {
      if (cell > 0) roomIds.add(cell);
    }
  }

  const roomTypes: RoomType[] = [
    "living_room",
    "bedroom",
    "kitchen",
    "bathroom",
    "dining_room",
  ];

  let roomIndex = 0;
  for (const roomId of roomIds) {
    const bounds = calculateRoomBounds(roomMap, roomId);
    if (!bounds) continue;

    const minX = bounds.minX * pixelToModel;
    const minY = bounds.minY * pixelToModel;
    const maxX = bounds.maxX * pixelToModel;
    const maxY = bounds.maxY * pixelToModel;
    const area = (maxX - minX) * (maxY - minY);

    if (area < 0.5) continue; // Skip very small rooms

    const roomType = roomTypes[roomIndex % roomTypes.length] as RoomType;
    rooms.push({
      id: generateId("room"),
      name: `Room ${roomIndex + 1}`,
      room_type: roomType,
      bounding_box: {
        min_point: { x: minX, y: minY },
        max_point: { x: maxX, y: maxY },
      },
      area,
      vertices: null,
    });

    roomIndex++;
  }

  // Extract walls
  const walls: Wall[] = extractWallSegments(wallMap, pixelToModel);

  return { rooms, walls };
}

/**
 * Calculate bounding box of a room
 */
function calculateRoomBounds(
  roomMap: number[][],
  roomId: number
): { minX: number; maxX: number; minY: number; maxY: number } | null {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;

  for (let y = 0; y < roomMap.length; y++) {
    for (let x = 0; x < roomMap[y].length; x++) {
      if (roomMap[y][x] === roomId) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }

  return minX === Infinity ? null : { minX, maxX, minY, maxY };
}

/**
 * Extract continuous wall segments from wall map
 */
function extractWallSegments(wallMap: number[][], pixelToModel: number): Wall[] {
  const walls: Wall[] = [];
  const processed = new Set<string>();

  for (let y = 0; y < wallMap.length; y++) {
    for (let x = 0; x < wallMap[y].length; x++) {
      if (wallMap[y][x] === 0 || processed.has(`${x},${y}`)) continue;

      // Find wall segment endpoints
      let endX = x,
        endY = y;
      let isHorizontal = false,
        isVertical = false;

      // Check horizontal direction
      while (
        endX + 1 < wallMap[y].length &&
        wallMap[y][endX + 1] === 1 &&
        !processed.has(`${endX + 1},${y}`)
      ) {
        endX++;
        isHorizontal = true;
      }

      // Check vertical direction
      while (
        endY + 1 < wallMap.length &&
        wallMap[endY + 1][x] === 1 &&
        !processed.has(`${x},${endY + 1}`)
      ) {
        endY++;
        isVertical = true;
      }

      if (isHorizontal || isVertical || (endX > x + 2 || endY > y + 2)) {
        const startX = x * pixelToModel;
        const startY = y * pixelToModel;
        const finishX = endX * pixelToModel;
        const finishY = endY * pixelToModel;

        // Only add if segment is long enough
        const length = Math.sqrt(Math.pow(finishX - startX, 2) + Math.pow(finishY - startY, 2));
        if (length > 1) {
          walls.push({
            id: generateId("wall"),
            start: { x: startX, y: startY },
            end: { x: finishX, y: finishY },
            thickness: 0.15,
            is_exterior: false,
          });
        }

        // Mark as processed
        for (let px = x; px <= endX; px++) {
          processed.add(`${px},${y}`);
        }
        for (let py = y; py <= endY; py++) {
          processed.add(`${x},${py}`);
        }
      }
    }
  }

  return walls;
}


/**
 * Create default rooms if detection fails
 */
function createDefaultRooms(width: number, height: number): Room[] {
  return [
    {
      id: generateId("room"),
      name: "Room 1",
      room_type: "living_room",
      bounding_box: {
        min_point: { x: 0, y: 0 },
        max_point: { x: width / 2, y: height / 2 },
      },
      area: (width / 2) * (height / 2),
      vertices: null,
    },
    {
      id: generateId("room"),
      name: "Room 2",
      room_type: "kitchen",
      bounding_box: {
        min_point: { x: width / 2, y: 0 },
        max_point: { x: width, y: height / 2 },
      },
      area: (width / 2) * (height / 2),
      vertices: null,
    },
    {
      id: generateId("room"),
      name: "Room 3",
      room_type: "bedroom",
      bounding_box: {
        min_point: { x: 0, y: height / 2 },
        max_point: { x: width / 2, y: height },
      },
      area: (width / 2) * (height / 2),
      vertices: null,
    },
    {
      id: generateId("room"),
      name: "Room 4",
      room_type: "bathroom",
      bounding_box: {
        min_point: { x: width / 2, y: height / 2 },
        max_point: { x: width, y: height },
      },
      area: (width / 2) * (height / 2),
      vertices: null,
    },
  ];
}

/**
 * Create default walls
 */
function createDefaultWalls(width: number, height: number): Wall[] {
  return [
    {
      id: generateId("wall"),
      start: { x: 0, y: 0 },
      end: { x: width, y: 0 },
      thickness: 0.2,
      is_exterior: true,
    },
    {
      id: generateId("wall"),
      start: { x: width, y: 0 },
      end: { x: width, y: height },
      thickness: 0.2,
      is_exterior: true,
    },
    {
      id: generateId("wall"),
      start: { x: width, y: height },
      end: { x: 0, y: height },
      thickness: 0.2,
      is_exterior: true,
    },
    {
      id: generateId("wall"),
      start: { x: 0, y: height },
      end: { x: 0, y: 0 },
      thickness: 0.2,
      is_exterior: true,
    },
    {
      id: generateId("wall"),
      start: { x: width / 2, y: 0 },
      end: { x: width / 2, y: height },
      thickness: 0.15,
      is_exterior: false,
    },
    {
      id: generateId("wall"),
      start: { x: 0, y: height / 2 },
      end: { x: width, y: height / 2 },
      thickness: 0.15,
      is_exterior: false,
    },
  ];
}

/**
 * Create default doors
 */
function createDefaultDoors(width: number, height: number): Door[] {
  return [
    {
      id: generateId("door"),
      position: { x: width / 4, y: 0 },
      width: 0.9,
      wall_start: { x: 0, y: 0 },
      wall_end: { x: width / 2, y: 0 },
      is_exterior: true,
    },
  ];
}

/**
 * Create default windows
 */
function createDefaultWindows(width: number, height: number): Window[] {
  return [
    {
      id: generateId("window"),
      position: { x: width * 0.75, y: 0 },
      width: 1.2,
      wall_start: { x: width / 2, y: 0 },
      wall_end: { x: width, y: 0 },
    },
  ];
}

/**
 * Create a sample floor plan for testing
 */
export function createSampleFloorPlan(): FloorPlan {
  return {
    name: "Sample Floor Plan",
    levels: [
      {
        level_number: 1,
        name: "Ground Floor",
        height: 3,
        rooms: [
          {
            id: generateId("room"),
            name: "Living Room",
            room_type: "living_room",
            bounding_box: {
              min_point: { x: 0, y: 0 },
              max_point: { x: 6, y: 5 },
            },
            area: 30,
            vertices: null,
          },
          {
            id: generateId("room"),
            name: "Kitchen",
            room_type: "kitchen",
            bounding_box: {
              min_point: { x: 6, y: 0 },
              max_point: { x: 10, y: 4 },
            },
            area: 16,
            vertices: null,
          },
          {
            id: generateId("room"),
            name: "Bedroom",
            room_type: "bedroom",
            bounding_box: {
              min_point: { x: 0, y: 5 },
              max_point: { x: 4, y: 9 },
            },
            area: 16,
            vertices: null,
          },
          {
            id: generateId("room"),
            name: "Bathroom",
            room_type: "bathroom",
            bounding_box: {
              min_point: { x: 4, y: 5 },
              max_point: { x: 6, y: 7 },
            },
            area: 4,
            vertices: null,
          },
        ],
        walls: [
          {
            id: generateId("wall"),
            start: { x: 0, y: 0 },
            end: { x: 10, y: 0 },
            thickness: 0.2,
            is_exterior: true,
          },
          {
            id: generateId("wall"),
            start: { x: 10, y: 0 },
            end: { x: 10, y: 9 },
            thickness: 0.2,
            is_exterior: true,
          },
          {
            id: generateId("wall"),
            start: { x: 10, y: 9 },
            end: { x: 0, y: 9 },
            thickness: 0.2,
            is_exterior: true,
          },
          {
            id: generateId("wall"),
            start: { x: 0, y: 9 },
            end: { x: 0, y: 0 },
            thickness: 0.2,
            is_exterior: true,
          },
          {
            id: generateId("wall"),
            start: { x: 6, y: 0 },
            end: { x: 6, y: 5 },
            thickness: 0.15,
            is_exterior: false,
          },
          {
            id: generateId("wall"),
            start: { x: 4, y: 5 },
            end: { x: 4, y: 9 },
            thickness: 0.15,
            is_exterior: false,
          },
        ],
        doors: [
          {
            id: generateId("door"),
            position: { x: 5.5, y: 0 },
            width: 0.9,
            wall_start: { x: 0, y: 0 },
            wall_end: { x: 10, y: 0 },
            is_exterior: true,
          },
        ],
        windows: [
          {
            id: generateId("window"),
            position: { x: 3, y: 0 },
            width: 1.2,
            wall_start: { x: 0, y: 0 },
            wall_end: { x: 10, y: 0 },
          },
        ],
        texts: [],
      },
    ],
    total_area: 66,
    width: 10,
    height: 9,
    metadata: {},
  };
}

// DXF CAD file support
export async function processDxfFile(file: File): Promise<FloorPlan> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parser = new DxfParser();
        const dxf = parser.parseSync(text);
        if (!dxf || !Array.isArray(dxf.entities)) throw new Error('Invalid DXF file');
        // Extract lines and polylines as walls
        const walls = [];
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const entity of dxf.entities) {
          if (
            entity.type === 'LINE' &&
            'start' in entity && entity.start &&
            'end' in entity && entity.end
          ) {
            const start = entity.start as { x: number; y: number };
            const end = entity.end as { x: number; y: number };
            const x1 = start.x, y1 = start.y;
            const x2 = end.x, y2 = end.y;
            minX = Math.min(minX, x1, x2);
            minY = Math.min(minY, y1, y2);
            maxX = Math.max(maxX, x1, x2);
            maxY = Math.max(maxY, y1, y2);
            walls.push({
              id: generateId('wall'),
              start: { x: x1, y: y1 },
              end: { x: x2, y: y2 },
              thickness: 0.2,
              is_exterior: false,
            });
          } else if (
            (entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') &&
            (("vertices" in entity && Array.isArray((entity as any).vertices)) || ("points" in entity && Array.isArray((entity as any).points)))
          ) {
            const points = ("vertices" in entity && Array.isArray((entity as any).vertices))
              ? (entity as any).vertices
              : ("points" in entity && Array.isArray((entity as any).points))
                ? (entity as any).points
                : [];
            for (let i = 0; i < points.length - 1; i++) {
              const p1 = points[i], p2 = points[i + 1];
              if (p1 && p2 && typeof p1.x === 'number' && typeof p1.y === 'number' && typeof p2.x === 'number' && typeof p2.y === 'number') {
                minX = Math.min(minX, p1.x, p2.x);
                minY = Math.min(minY, p1.y, p2.y);
                maxX = Math.max(maxX, p1.x, p2.x);
                maxY = Math.max(maxY, p1.y, p2.y);
                walls.push({
                  id: generateId('wall'),
                  start: { x: p1.x, y: p1.y },
                  end: { x: p2.x, y: p2.y },
                  thickness: 0.2,
                  is_exterior: false,
                });
              }
            }
          }
        }
        // Create a bounding box room for preview
        if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
          minX = 0; minY = 0; maxX = 10; maxY = 10;
        }
        const room = {
          id: generateId('room'),
          name: 'DXF Room',
          room_type: 'living_room' as RoomType,
          bounding_box: {
            min_point: { x: minX, y: minY },
            max_point: { x: maxX, y: maxY },
          },
          area: (maxX - minX) * (maxY - minY),
          vertices: null,
        };
        const level: Level = {
          level_number: 1,
          name: 'DXF Level',
          height: 3,
          rooms: [room],
          walls,
          doors: [],
          windows: [],
          texts: [],
        };
        resolve({
          name: file.name.replace(/\.[^/.]+$/, ""),
          levels: [level],
          total_area: room.area,
          width: maxX - minX,
          height: maxY - minY,
          metadata: { source: "dxf_upload", upload_date: new Date().toISOString() },
        });
      } catch (err) {
        reject(new Error('Failed to parse DXF: ' + (err instanceof Error ? err.message : String(err))));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// DWG CAD file support
export async function processDwgFile(file: File): Promise<FloorPlan> {
  // DWG parsing is not supported in-browser. Show a friendly error.
  throw new Error("DWG CAD support is not available in this version. Please use DXF, JSON, or image files.");
}

