"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Loader2, Flame } from "lucide-react";
import gsap from "gsap";
import ModelRenderer from "@/components/ModelRenderer";
import type { Trajectories, SimPhase, Violation, DensityHeatmap, ViewMode, RoleConfig } from "@/types/simulation";


// CameraController — sets initial camera position based on boundaries, exposes OrbitControls ref
function CameraController({
  boundaries,
  controlsRef,
}: {
  boundaries: number[][];
  controlsRef?: React.MutableRefObject<any>;
}) {
  const { camera } = useThree();
  const internalRef = useRef<any>(null);

  // Sync external ref
  useEffect(() => {
    if (controlsRef && internalRef.current) {
      controlsRef.current = internalRef.current;
    }
  });

  useEffect(() => {
    if (boundaries.length === 0) return;

    // Compute extents from boundary data (the authoritative coordinate source)
    const xs = boundaries.map((p) => p[0]);
    const ys = boundaries.map((p) => p[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cz = -(Math.min(...ys) + Math.max(...ys)) / 2;
    const cy = 0;
    const spanX = Math.max(...xs) - Math.min(...xs);
    const spanY = Math.max(...ys) - Math.min(...ys);
    const span = Math.max(spanX, spanY, 1);

    // Camera distance sized to the boundary — tight fit with ~20% breathing room
    const fov = 50 * (Math.PI / 180);
    const dist = (span / 2) / Math.tan(fov / 2) * 1.2;
    camera.position.set(cx + dist * 0.35, dist * 0.7, cz + dist * 0.45);
    camera.lookAt(cx, cy, cz);
    camera.updateProjectionMatrix();

    if (internalRef.current) {
      internalRef.current.target.set(cx, cy, cz);
      internalRef.current.update();
    }
  }, [boundaries, camera]);

  return (
    <OrbitControls
      ref={internalRef}
      makeDefault
      enableDamping
      dampingFactor={0.1}
      maxPolarAngle={Math.PI / 2.1}
      minDistance={1}
      maxDistance={200}
    />
  );
}


// CameraFocuser — GSAP animation to fly camera to a violation
function CameraFocuser({
  target,
  controlsRef,
  onComplete,
}: {
  target: { x: number; y: number; z: number } | null;
  controlsRef: React.MutableRefObject<any>;
  onComplete: () => void;
}) {
  const { camera } = useThree();

  useEffect(() => {
    if (!target || !controlsRef.current) return;

    const controls = controlsRef.current;

    // Target position in Three.js coords: [x, z_height, -y]
    const tx = target.x;
    const tz = -target.y;
    const ty = 0;

    // Camera orbit: 5m distance, 45 degrees elevation
    const distance = 5;
    const elevation = Math.PI / 4;
    const camX = tx + distance * Math.cos(elevation);
    const camY = ty + distance * Math.sin(elevation);
    const camZ = tz + distance * Math.cos(elevation) * 0.5;

    // Disable orbit controls during animation
    controls.enabled = false;

    gsap.to(camera.position, {
      x: camX,
      y: camY,
      z: camZ,
      duration: 1.5,
      ease: "power2.inOut",
    });

    gsap.to(controls.target, {
      x: tx,
      y: ty,
      z: tz,
      duration: 1.5,
      ease: "power2.inOut",
      onUpdate: () => {
        camera.lookAt(controls.target);
        controls.update();
      },
      onComplete: () => {
        controls.enabled = true;
        onComplete();
      },
    });
  }, [target, camera, controlsRef, onComplete]);

  return null;
}


// FloorPlane — renders the exact boundary polygon as a flat mesh, with a thin outline

function FloorPlane({ boundaries }: { boundaries: number[][] }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    if (boundaries.length === 0) return s;
    s.moveTo(boundaries[0][0], boundaries[0][1]);
    for (let i = 1; i < boundaries.length; i++) {
      s.lineTo(boundaries[i][0], boundaries[i][1]);
    }
    s.closePath();
    return s;
  }, [boundaries]);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <mesh receiveShadow>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial color="#2a2a4a" side={THREE.DoubleSide} />
      </mesh>
      {/* Boundary outline */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array(
                boundaries.flatMap((p) => [p[0], p[1], 0.02]),
              ),
              3,
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#22d3ee" linewidth={2} />
      </line>
    </group>
  );
}


const WALL_HEIGHT = 2.5;
const WALL_THICKNESS = 0.08;

function Walls({ boundaries }: { boundaries: number[][] }) {
  const wallGeometries = useMemo(() => {
    if (boundaries.length < 2) return [];

    const walls: THREE.ExtrudeGeometry[] = [];
    for (let i = 0; i < boundaries.length - 1; i++) {
      const [x1, y1] = boundaries[i];
      const [x2, y2] = boundaries[i + 1];

      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 0.001) continue;

      const nx = (-dy / len) * (WALL_THICKNESS / 2);
      const ny = (dx / len) * (WALL_THICKNESS / 2);

      const shape = new THREE.Shape();
      shape.moveTo(x1 - nx, y1 - ny);
      shape.lineTo(x2 - nx, y2 - ny);
      shape.lineTo(x2 + nx, y2 + ny);
      shape.lineTo(x1 + nx, y1 + ny);
      shape.closePath();

      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: WALL_HEIGHT,
        bevelEnabled: false,
      });
      walls.push(geo);
    }
    return walls;
  }, [boundaries]);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      {wallGeometries.map((geo, idx) => (
        <mesh key={idx} geometry={geo} castShadow receiveShadow>
          <meshStandardMaterial
            color="#1e293b"
            emissive="#0891b2"
            emissiveIntensity={0.15}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}


function ObstacleWalls({ obstacles }: { obstacles: number[][] }) {
  const wallGeometries = useMemo(() => {
    const geos: THREE.ExtrudeGeometry[] = [];
    for (const seg of obstacles) {
      if (seg.length < 4) continue;
      const [x1, y1, x2, y2] = seg;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 0.001) continue;

      const nx = (-dy / len) * (WALL_THICKNESS / 2);
      const ny = (dx / len) * (WALL_THICKNESS / 2);

      const shape = new THREE.Shape();
      shape.moveTo(x1 - nx, y1 - ny);
      shape.lineTo(x2 - nx, y2 - ny);
      shape.lineTo(x2 + nx, y2 + ny);
      shape.lineTo(x1 + nx, y1 + ny);
      shape.closePath();

      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: WALL_HEIGHT * 0.6,
        bevelEnabled: false,
      });
      geos.push(geo);
    }
    return geos;
  }, [obstacles]);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      {wallGeometries.map((geo, idx) => (
        <mesh key={idx} geometry={geo} castShadow receiveShadow>
          <meshStandardMaterial
            color="#334155"
            emissive="#06b6d4"
            emissiveIntensity={0.1}
            transparent
            opacity={0.55}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}


function StaticAgents({ boundaries }: { boundaries: number[][] }) {
  const positions = useMemo(() => {
    if (boundaries.length < 2) return [];
    const xs = boundaries.map((p) => p[0]);
    const ys = boundaries.map((p) => p[1]);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    const cx = (xMin + xMax) / 2;
    const cy = (yMin + yMax) / 2;
    const rx = (xMax - xMin) * 0.25;
    const ry = (yMax - yMin) * 0.25;

    return [
      [cx, cy],
      [cx + rx, cy],
      [cx - rx, cy],
      [cx, cy + ry],
      [cx, cy - ry],
    ];
  }, [boundaries]);

  return (
    <group>
      {positions.map(([x, y], i) => (
        <mesh key={i} position={[x, 0.15, -y]} castShadow>
          <capsuleGeometry args={[0.06, 0.18, 4, 8]} />
          <meshStandardMaterial
            color="#9ca3af"
            emissive="#334155"
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}


const LERP_SPEED = 10;
const CONFLICT_ZONE_RADIUS_SQ = 2.0 * 2.0;

const _standardColor = new THREE.Color("#2563eb");
const _specialistColor = new THREE.Color("#eab308");
const _conflictColor = new THREE.Color("#ef4444");

// Procedural 3D Walkable Human component
const WalkingAgent = ({
  id,
  trajectories,
  frameRef,
  frameKeys,
  violations,
}: {
  id: string;
  trajectories: Trajectories;
  frameRef: React.MutableRefObject<number>;
  frameKeys: string[];
  violations: Violation[];
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const bodyGroupRef = useRef<THREE.Group>(null);
  const legLRef = useRef<THREE.Group>(null);
  const legRRef = useRef<THREE.Group>(null);
  const armLRef = useRef<THREE.Group>(null);
  const armRRef = useRef<THREE.Group>(null);

  const cycleRef = useRef(Math.random() * Math.PI * 2);
  const currentPos = useRef(new THREE.Vector3());
  const currentRotation = useRef(0);
  const isVisible = useRef(false);

  // Material and geometry reused per agent
  const [material] = useMemo(() => [new THREE.MeshStandardMaterial({
    roughness: 0.7,
    metalness: 0.2
  })], []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const frameIdx = Math.min(frameRef.current, frameKeys.length - 1);
    const frameKey = frameKeys[frameIdx];
    const frameData = trajectories[frameKey];
    const agentData = frameData?.[id];

    if (!agentData) {
      if (isVisible.current) {
        groupRef.current.visible = false;
        isVisible.current = false;
      }
      return;
    }

    if (!isVisible.current) {
      groupRef.current.visible = true;
      isVisible.current = true;
      // Initialize position on first appear
      currentPos.current.set(agentData.pos[0], 0, -agentData.pos[1]);
    }

    const targetX = agentData.pos[0];
    const targetZ = -agentData.pos[1];

    // Smooth movement lerp
    const t = 1 - Math.exp(-LERP_SPEED * delta);
    const dx = targetX - currentPos.current.x;
    const dz = targetZ - currentPos.current.z;
    const speed = Math.sqrt(dx * dx + dz * dz);

    currentPos.current.x += dx * t;
    currentPos.current.z += dz * t;
    groupRef.current.position.set(currentPos.current.x, 0, currentPos.current.z);

    // Rotation and Animation cycle
    if (speed > 0.005) {
      const targetRotation = Math.atan2(dx, dz);
      let diff = targetRotation - currentRotation.current;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      currentRotation.current += diff * t;
      groupRef.current.rotation.y = currentRotation.current;

      cycleRef.current += speed * 12 * delta;
    }

    const cycle = cycleRef.current;
    const stride = Math.sin(cycle) * 0.6;
    const armSwing = Math.sin(cycle + Math.PI) * 0.6;
    const bob = Math.abs(Math.sin(cycle)) * 0.03;

    // Apply procedural animation transforms
    if (bodyGroupRef.current) bodyGroupRef.current.position.y = 0.8 + bob;
    if (legLRef.current) legLRef.current.rotation.x = stride;
    if (legRRef.current) legRRef.current.rotation.x = -stride;
    if (armLRef.current) armLRef.current.rotation.x = armSwing;
    if (armRRef.current) armRRef.current.rotation.x = -armSwing;

    // Dynamic coloring based on role and conflict
    let inConflict = false;
    for (const v of violations) {
      const vX = v.coordinate.x;
      const vZ = -v.coordinate.y;
      const dSq = (currentPos.current.x - vX) ** 2 + (currentPos.current.z - vZ) ** 2;
      if (dSq < CONFLICT_ZONE_RADIUS_SQ) {
        inConflict = true;
        break;
      }
    }

    const targetColor = inConflict
      ? _conflictColor
      : (agentData.type === "specialist" ? _specialistColor : _standardColor);

    if (!material.color.equals(targetColor)) {
      material.color.copy(targetColor);
      material.emissive.copy(targetColor).multiplyScalar(0.2);
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Body Part Hierarchy */}
      <group ref={bodyGroupRef}>
        {/* Torso */}
        <mesh position={[0, 0.35, 0]} castShadow material={material}>
          <capsuleGeometry args={[0.07, 0.5, 4, 8]} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 0.75, 0]} castShadow material={material}>
          <sphereGeometry args={[0.1, 8, 8]} />
        </mesh>
        {/* Arm L */}
        <group ref={armLRef} position={[-0.12, 0.6, 0]}>
          <mesh position={[0, -0.2, 0]} castShadow material={material}>
            <capsuleGeometry args={[0.04, 0.4, 4, 8]} />
          </mesh>
        </group>
        {/* Arm R */}
        <group ref={armRRef} position={[0.12, 0.6, 0]}>
          <mesh position={[0, -0.2, 0]} castShadow material={material}>
            <capsuleGeometry args={[0.04, 0.4, 4, 8]} />
          </mesh>
        </group>
      </group>
      {/* Leg L */}
      <group ref={legLRef} position={[-0.07, 0.8, 0]}>
        <mesh position={[0, -0.35, 0]} castShadow material={material}>
          <capsuleGeometry args={[0.05, 0.7, 4, 8]} />
        </mesh>
      </group>
      {/* Leg R */}
      <group ref={legRRef} position={[0.07, 0.8, 0]}>
        <mesh position={[0, -0.35, 0]} castShadow material={material}>
          <capsuleGeometry args={[0.05, 0.7, 4, 8]} />
        </mesh>
      </group>
    </group>
  );
};

function AgentSwarm({
  trajectories,
  frameRef,
  violations = [],
}: {
  trajectories: Trajectories | null;
  frameRef: React.MutableRefObject<number>;
  violations?: Violation[];
}) {
  const frameKeys = useMemo(
    () => trajectories ? Object.keys(trajectories).sort((a, b) => Number(a) - Number(b)) : [],
    [trajectories],
  );

  // Stable set of all agent IDs that appear in the sim
  const allAgentIds = useMemo(() => {
    if (!trajectories) return [];
    const ids = new Set<string>();
    Object.values(trajectories).forEach(frame => {
      Object.keys(frame).forEach(id => ids.add(id));
    });
    return Array.from(ids);
  }, [trajectories]);

  if (!trajectories) return null;

  return (
    <group>
      {allAgentIds.map((id) => (
        <WalkingAgent
          key={id}
          id={id}
          trajectories={trajectories}
          frameRef={frameRef}
          frameKeys={frameKeys}
          violations={violations}
        />
      ))}
    </group>
  );
}

// ViewModeController — animate camera between 3D perspective and 2D top-down

function ViewModeController({
  viewMode,
  boundaries,
  controlsRef,
}: {
  viewMode: ViewMode;
  boundaries: number[][];
  controlsRef: React.MutableRefObject<any>;
}) {
  const { camera } = useThree();
  const prevMode = useRef(viewMode);

  useEffect(() => {
    if (viewMode === prevMode.current) return;
    prevMode.current = viewMode;
    if (boundaries.length === 0 || !controlsRef.current) return;

    const controls = controlsRef.current;

    const xs = boundaries.map((p) => p[0]);
    const ys = boundaries.map((p) => p[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cz = -(Math.min(...ys) + Math.max(...ys)) / 2;
    const spanX = Math.max(...xs) - Math.min(...xs);
    const spanY = Math.max(...ys) - Math.min(...ys);
    const span = Math.max(spanX, spanY, 1);

    // Kill any ongoing camera tweens
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(controls.target);
    controls.enabled = false;

    if (viewMode === "2d") {
      const height = span * 1.2;
      gsap.to(camera.position, {
        x: cx, y: height, z: cz,
        duration: 1.0,
        ease: "power2.inOut",
      });
      gsap.to(controls.target, {
        x: cx, y: 0, z: cz,
        duration: 1.0,
        ease: "power2.inOut",
        onUpdate: () => { camera.lookAt(controls.target); controls.update(); },
        onComplete: () => {
          controls.maxPolarAngle = 0.01;
          controls.minPolarAngle = 0;
          controls.enabled = true;
          controls.update();
        },
      });
    } else {
      const fov = 50 * (Math.PI / 180);
      const dist = (span / 2) / Math.tan(fov / 2) * 1.2;
      gsap.to(camera.position, {
        x: cx + dist * 0.35, y: dist * 0.7, z: cz + dist * 0.45,
        duration: 1.0,
        ease: "power2.inOut",
      });
      gsap.to(controls.target, {
        x: cx, y: 0, z: cz,
        duration: 1.0,
        ease: "power2.inOut",
        onUpdate: () => { camera.lookAt(controls.target); controls.update(); },
        onComplete: () => {
          controls.maxPolarAngle = Math.PI / 2.1;
          controls.minPolarAngle = 0;
          controls.enabled = true;
          controls.update();
        },
      });
    }
  }, [viewMode, boundaries, camera, controlsRef]);

  return null;
}

// BoundaryGrid — grid lines clipped to the building polygon

/** Find x-intersections of a horizontal line y=lineY with polygon edges. */
function scanlineIntersections(
  poly: number[][],
  lineY: number,
): number[] {
  const xs: number[] = [];
  for (let i = 0; i < poly.length - 1; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[i + 1];
    if ((y1 <= lineY && y2 > lineY) || (y2 <= lineY && y1 > lineY)) {
      const t = (lineY - y1) / (y2 - y1);
      xs.push(x1 + t * (x2 - x1));
    }
  }
  return xs.sort((a, b) => a - b);
}

/** Find y-intersections of a vertical line x=lineX with polygon edges. */
function scanlineIntersectionsV(
  poly: number[][],
  lineX: number,
): number[] {
  const ys: number[] = [];
  for (let i = 0; i < poly.length - 1; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[i + 1];
    if ((x1 <= lineX && x2 > lineX) || (x2 <= lineX && x1 > lineX)) {
      const t = (lineX - x1) / (x2 - x1);
      ys.push(y1 + t * (y2 - y1));
    }
  }
  return ys.sort((a, b) => a - b);
}

function BoundaryGrid({ boundaries }: { boundaries: number[][] }) {
  const lineSegments = useMemo(() => {
    if (boundaries.length < 3) return new Float32Array(0);

    // Ensure polygon is closed
    const poly = [...boundaries];
    if (
      poly[0][0] !== poly[poly.length - 1][0] ||
      poly[0][1] !== poly[poly.length - 1][1]
    ) {
      poly.push(poly[0]);
    }

    const xs = poly.map((p) => p[0]);
    const ys = poly.map((p) => p[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const span = Math.max(maxX - minX, maxY - minY, 1);

    // Adaptive spacing: ~1m for small buildings, wider for large
    const spacing = span < 5 ? 0.5 : span < 20 ? 1 : 2;

    const verts: number[] = [];

    // Horizontal lines (constant y) — in boundary 2D space
    for (
      let y = Math.ceil(minY / spacing) * spacing;
      y <= maxY;
      y += spacing
    ) {
      const hits = scanlineIntersections(poly, y);
      // Pair up entry/exit points
      for (let i = 0; i + 1 < hits.length; i += 2) {
        // Boundary 2D [x,y] → Three.js [x, 0, -y]
        verts.push(hits[i], 0, -y, hits[i + 1], 0, -y);
      }
    }

    // Vertical lines (constant x)
    for (
      let x = Math.ceil(minX / spacing) * spacing;
      x <= maxX;
      x += spacing
    ) {
      const hits = scanlineIntersectionsV(poly, x);
      for (let i = 0; i + 1 < hits.length; i += 2) {
        verts.push(x, 0, -hits[i], x, 0, -hits[i + 1]);
      }
    }

    return new Float32Array(verts);
  }, [boundaries]);

  if (lineSegments.length === 0) return null;

  return (
    <lineSegments position={[0, 0.005, 0]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[lineSegments, 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#333333" />
    </lineSegments>
  );
}

// HeatmapOverlay — density visualization on the floor plane

function HeatmapOverlay({
  heatmapData,
  visible,
}: {
  heatmapData: DensityHeatmap;
  visible: boolean;
}) {
  const texture = useMemo(() => {
    if (!visible) return null;

    const { grid, shape } = heatmapData;
    const [rows, cols] = shape;
    if (rows === 0 || cols === 0) return null;

    const data = new Uint8Array(rows * cols * 4);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = grid[r]?.[c] ?? 0;
        // Color scale: blue (0) -> yellow (0.5) -> red (1)
        let red: number, green: number, blue: number;
        if (val < 0.5) {
          const t = val * 2;
          red = Math.floor(t * 255);
          green = Math.floor(t * 255);
          blue = Math.floor((1 - t) * 255);
        } else {
          const t = (val - 0.5) * 2;
          red = 255;
          green = Math.floor((1 - t) * 255);
          blue = 0;
        }
        const alpha = val > 0.01 ? Math.floor(0.6 * 255) : 0;

        // Flip row index for texture (OpenGL origin is bottom-left)
        const idx = ((rows - 1 - r) * cols + c) * 4;
        data[idx] = red;
        data[idx + 1] = green;
        data[idx + 2] = blue;
        data[idx + 3] = alpha;
      }
    }

    const tex = new THREE.DataTexture(data, cols, rows, THREE.RGBAFormat);
    tex.needsUpdate = true;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }, [heatmapData, visible]);

  if (!visible || !texture) return null;

  const { bounds } = heatmapData;
  const width = bounds.max_x - bounds.min_x;
  const height = bounds.max_y - bounds.min_y;
  const centerX = (bounds.min_x + bounds.max_x) / 2;
  const centerZ = -((bounds.min_y + bounds.max_y) / 2);

  return (
    <mesh position={[centerX, 0.005, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.6}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Note: the main SimViewer component is defined at the end to ensure all sub-components are available. 
// SimViewer — public component

interface SimViewerProps {
  boundaries: number[][];              // buffered (for navigation)
  rawBoundaries: number[][];           // exact unbuffered (for rendering)
  obstacles: number[][];               // [[x1,y1,x2,y2], ...]
  trajectories: Trajectories | null;
  frameRef: React.MutableRefObject<number>;
  phase: SimPhase;
  modelUrl?: string;
  modelFormat?: "obj" | "glb" | "gltf";
  centerOffset?: [number, number];
  violations?: Violation[];
  highlightedViolationId?: string | null;
  focusTarget?: { x: number; y: number; z: number } | null;
  onFocusComplete?: () => void;
  heatmapData?: DensityHeatmap | null;
  showHeatmap?: boolean;
  onToggleHeatmap?: () => void;
  viewMode?: ViewMode;
  roles?: RoleConfig[];
  setRoles?: React.Dispatch<React.SetStateAction<RoleConfig[]>>;
  activeRoleId?: string | null;
}

export default function SimViewer({
  boundaries,
  rawBoundaries,
  obstacles,
  trajectories,
  frameRef,
  phase,
  modelUrl,
  modelFormat,
  centerOffset,
  violations = [],
  highlightedViolationId = null,
  focusTarget = null,
  onFocusComplete,
  heatmapData = null,
  showHeatmap = false,
  onToggleHeatmap,
  viewMode = "3d",
}: SimViewerProps) {
  const isProcessing = phase === "uploading";
  const hasModel = !!(modelUrl && modelFormat);
  const controlsRef = useRef<any>(null);

  // Use raw boundaries for rendering (exact wall positions), fall back to buffered
  const renderBounds = rawBoundaries?.length > 0 ? rawBoundaries : boundaries;

  return (
    <div className="relative w-full h-full">
      <Canvas
        shadows
        camera={{ position: [10, 10, 10], fov: 50, near: 0.1, far: 500 }}
      >
        <color attach="background" args={["#0f0f1a"]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1.0} castShadow />
        <hemisphereLight args={["#334155", "#0f172a", 0.3]} />

        {/* 3D Model — when uploaded, this IS the visual.
            No blue floor/wall overlay is rendered on top. */}
        {hasModel ? (
          <ModelRenderer url={modelUrl} format={modelFormat} centerOffset={centerOffset} />
        ) : (
          <>
            {/* Fallback: boundary-derived floor and walls when no 3D model */}
            <FloorPlane boundaries={renderBounds} />
            <Walls boundaries={renderBounds} />
            {obstacles.length > 0 && <ObstacleWalls obstacles={obstacles} />}
          </>
        )}

        {/* Agents (InstancedMesh) */}
        <AgentSwarm
          trajectories={trajectories}
          frameRef={frameRef}
          violations={violations}
        />

        {/* 2D/3D view mode controller */}
        <ViewModeController
          viewMode={viewMode}
          boundaries={renderBounds}
          controlsRef={controlsRef}
        />

        {/* Density heatmap overlay */}
        {heatmapData && showHeatmap && (
          <HeatmapOverlay heatmapData={heatmapData} visible={showHeatmap} />
        )}

        {/* Camera focus animator */}
        {onFocusComplete && (
          <CameraFocuser
            target={focusTarget}
            controlsRef={controlsRef}
            onComplete={onFocusComplete}
          />
        )}

        <BoundaryGrid boundaries={renderBounds} />
        <CameraController boundaries={renderBounds} controlsRef={controlsRef} />
      </Canvas>

      {/* Heatmap toggle button */}
      {heatmapData && onToggleHeatmap && (
        <button
          onClick={onToggleHeatmap}
          className={`absolute top-4 right-4 z-10 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
            showHeatmap
              ? "border-cyan-500 bg-cyan-500/20 text-cyan-300"
              : "border-zinc-700 bg-zinc-900/90 text-zinc-400 hover:bg-zinc-800"
          }`}
        >
          <Flame className="h-4 w-4" />
          {showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
        </button>
      )}

      {/* Heatmap legend */}
      {showHeatmap && heatmapData && (
        <div className="absolute bottom-32 right-4 z-10 rounded-lg border border-zinc-700 bg-zinc-900/90 px-3 py-2 backdrop-blur-md">
          <p className="mb-1 text-[10px] font-mono text-zinc-400">
            Pedestrian Density
          </p>
          <div
            className="h-2 w-24 rounded-full"
            style={{
              background:
                "linear-gradient(to right, #0000ff, #ffff00, #ff0000)",
            }}
          />
          <div className="mt-0.5 flex justify-between text-[8px] text-zinc-500">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-3 rounded-xl bg-zinc-900/80 px-8 py-6 border border-zinc-700">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            <p className="text-sm font-medium text-zinc-300">
              Processing Model…
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
