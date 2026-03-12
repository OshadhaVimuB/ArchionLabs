"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Canvas, useThree, useFrame, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { useFloorPlanStore, type Annotation } from "@/store/useFloorPlanStore";
import { GLTFLoader, FBXLoader, OBJLoader, STLLoader, MTLLoader } from "three-stdlib";

// ---------------------------------------------------------------------------
// useEffect-based Model Loader (works with blob URLs)
// ---------------------------------------------------------------------------

function useModelLoader(
    url: string,
    format: string,
    mtlText?: string | null,
    textureMap?: Record<string, string> | null,
) {
    const [model, setModel] = useState<THREE.Object3D | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!url || !format) return;

        setLoading(true);
        setError(null);
        setModel(null);

        const loadModel = async () => {
            try {
                let result: THREE.Object3D;

                if (format === "gltf") {
                    const loader = new GLTFLoader();
                    const gltf = await new Promise<{ scene: THREE.Group }>((resolve, reject) => {
                        loader.load(url, resolve, undefined, reject);
                    });
                    result = gltf.scene;
                } else if (format === "fbx") {
                    const loader = new FBXLoader();
                    result = await new Promise<THREE.Group>((resolve, reject) => {
                        loader.load(url, resolve, undefined, reject);
                    });
                } else if (format === "obj") {
                    const objLoader = new OBJLoader();

                    // Parse MTL materials directly from text if available
                    if (mtlText) {
                        try {
                            const manager = new THREE.LoadingManager();
                            if (textureMap) {
                                manager.setURLModifier((texUrl: string) => {
                                    const filename = texUrl.replace(/\\/g, "/").split("/").pop() || texUrl;
                                    return textureMap[filename] || textureMap[filename.toLowerCase()] || texUrl;
                                });
                            }

                            const mtlLoader = new MTLLoader(manager);
                            const materials = mtlLoader.parse(mtlText, "");
                            materials.preload();
                            objLoader.setMaterials(materials);
                        } catch (mtlErr) {
                            console.warn("MTL parsing failed, loading OBJ without materials:", mtlErr);
                        }
                    }

                    result = await new Promise<THREE.Group>((resolve, reject) => {
                        objLoader.load(url, resolve, undefined, reject);
                    });
                } else if (format === "stl") {
                    const loader = new STLLoader();
                    const geometry = await new Promise<THREE.BufferGeometry>((resolve, reject) => {
                        loader.load(url, resolve, undefined, reject);
                    });
                    const material = new THREE.MeshStandardMaterial({ color: "#d1d5db" });
                    result = new THREE.Mesh(geometry, material);
                } else {
                    throw new Error(`Unsupported format: ${format}`);
                }

                setModel(result);
            } catch (err) {
                console.error("Model loading error:", err);
                setError(err instanceof Error ? err.message : "Failed to load model");
            } finally {
                setLoading(false);
            }
        };

        loadModel();
    }, [url, format, mtlText, textureMap]);

    return { model, error, loading };
}

// ---------------------------------------------------------------------------
// Model Normalizer
// ---------------------------------------------------------------------------

function normalizeModel(object: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const TARGET = 10;
    const scale = maxDim > 0 ? TARGET / maxDim : 1;

    object.scale.multiplyScalar(scale);
    box.setFromObject(object);
    box.getCenter(center);

    object.position.sub(center);
    object.position.y += box.getSize(new THREE.Vector3()).y / 2;
}

// ---------------------------------------------------------------------------
// Camera Fly-in Setup
// ---------------------------------------------------------------------------

function CameraSetup({ gridSize }: { gridSize: number }) {
    const { camera } = useThree();
    const isAnimating = useRef(true);
    const startPos = useRef(new THREE.Vector3());
    const targetPos = useRef(new THREE.Vector3());
    const animStart = useRef(0);

    useEffect(() => {
        const dist = gridSize * 0.6;
        startPos.current.set(dist * 2, dist * 2.5, dist * 2);
        targetPos.current.set(dist * 0.7, dist * 0.5, dist * 0.7);
        camera.position.copy(startPos.current);
        camera.lookAt(0, 0, 0);
        animStart.current = performance.now();
        isAnimating.current = true;
    }, [gridSize, camera]);

    useFrame(() => {
        if (!isAnimating.current) return;
        const elapsed = (performance.now() - animStart.current) / 1000;
        const duration = 1.8;
        const t = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);

        camera.position.lerp(targetPos.current, ease * 0.08 + 0.02);
        camera.lookAt(0, 0, 0);

        if (t >= 1) {
            camera.position.copy(targetPos.current);
            camera.lookAt(0, 0, 0);
            camera.updateProjectionMatrix();
            isAnimating.current = false;
        }
    });

    return null;
}

// ---------------------------------------------------------------------------
// 3D Annotation Pin Component
// ---------------------------------------------------------------------------

const PIN_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

function getRandomPinColor() {
    return PIN_COLORS[Math.floor(Math.random() * PIN_COLORS.length)];
}

function AnnotationPin({ annotation }: { annotation: Annotation }) {
    const [hovered, setHovered] = useState(false);
    const { removeAnnotation, annotationMode } = useFloorPlanStore();
    const [x, y, z] = annotation.position;

    return (
        <group position={[x, y, z]}>
            {/* Pin stem */}
            <mesh position={[0, 0.3, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
                <meshStandardMaterial color={annotation.color} />
            </mesh>
            {/* Pin head sphere */}
            <mesh
                position={[0, 0.65, 0]}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                onClick={(e) => {
                    if (annotationMode) {
                        e.stopPropagation();
                        removeAnnotation(annotation.id);
                    }
                }}
            >
                <sphereGeometry args={[hovered ? 0.18 : 0.14, 16, 16]} />
                <meshStandardMaterial
                    color={annotation.color}
                    emissive={annotation.color}
                    emissiveIntensity={hovered ? 0.6 : 0.3}
                />
            </mesh>
            {/* Floating label */}
            <Html
                position={[0, 1.0, 0]}
                center
                distanceFactor={15}
                style={{ pointerEvents: "none" }}
            >
                <div
                    style={{
                        background: "rgba(0,0,0,0.85)",
                        color: "#fff",
                        padding: "4px 10px",
                        borderRadius: "8px",
                        fontSize: "11px",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        border: `1.5px solid ${annotation.color}`,
                        backdropFilter: "blur(8px)",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
                        transform: "translateY(-4px)",
                    }}
                >
                    {annotation.label}
                </div>
            </Html>
        </group>
    );
}

// ---------------------------------------------------------------------------
// Module-level ref for annotation click communication
// ---------------------------------------------------------------------------

const annotationClickRef: {
    current: ((event: ThreeEvent<MouseEvent>) => void) | null;
} = { current: null };

// ---------------------------------------------------------------------------
// Floating input for new annotations (rendered inside the Canvas)
// ---------------------------------------------------------------------------

function AnnotationFloatingInput() {
    const { annotationMode, addAnnotation } = useFloorPlanStore();
    const [pendingPos, setPendingPos] = useState<[number, number, number] | null>(null);
    const [inputValue, setInputValue] = useState("");

    const handleModelClick = useCallback(
        (event: ThreeEvent<MouseEvent>) => {
            if (!annotationMode) return;
            event.stopPropagation();
            if (event.intersections.length > 0) {
                const point = event.intersections[0].point;
                setPendingPos([point.x, point.y, point.z]);
                setInputValue("");
            }
        },
        [annotationMode]
    );

    // Keep the ref updated
    useEffect(() => {
        annotationClickRef.current = handleModelClick;
        return () => { annotationClickRef.current = null; };
    }, [handleModelClick]);

    const confirmAnnotation = useCallback(() => {
        if (!pendingPos || !inputValue.trim()) return;
        addAnnotation({
            id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            position: pendingPos,
            label: inputValue.trim(),
            color: getRandomPinColor(),
            createdAt: new Date().toISOString(),
        });
        setPendingPos(null);
        setInputValue("");
    }, [pendingPos, inputValue, addAnnotation]);

    const cancelAnnotation = useCallback(() => {
        setPendingPos(null);
        setInputValue("");
    }, []);

    if (!pendingPos) return null;

    return (
        <group position={pendingPos}>
            <Html center distanceFactor={12} style={{ pointerEvents: "auto" }}>
                <div
                    style={{
                        background: "rgba(9,9,11,0.95)",
                        border: "1px solid rgba(99,102,241,0.5)",
                        borderRadius: "12px",
                        padding: "12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        minWidth: "200px",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                        backdropFilter: "blur(12px)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <input
                        autoFocus
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") confirmAnnotation();
                            if (e.key === "Escape") cancelAnnotation();
                        }}
                        placeholder="Enter annotation..."
                        style={{
                            background: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: "8px",
                            padding: "8px 10px",
                            color: "#fff",
                            fontSize: "13px",
                            outline: "none",
                            width: "100%",
                        }}
                    />
                    <div style={{ display: "flex", gap: "6px" }}>
                        <button
                            onClick={confirmAnnotation}
                            style={{
                                flex: 1,
                                background: "#6366f1",
                                color: "#fff",
                                border: "none",
                                borderRadius: "8px",
                                padding: "6px 0",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            Add
                        </button>
                        <button
                            onClick={cancelAnnotation}
                            style={{
                                flex: 1,
                                background: "rgba(255,255,255,0.08)",
                                color: "#aaa",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "8px",
                                padding: "6px 0",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Html>
        </group>
    );
}

// ---------------------------------------------------------------------------
// Scene Setup
// ---------------------------------------------------------------------------

const ModelScene = ({
    url, format, mtlText, textureMap,
}: {
    url: string;
    format: string;
    mtlText?: string | null;
    textureMap?: Record<string, string> | null;
}) => {
    const { model, error, loading } = useModelLoader(url, format, mtlText, textureMap);
    const { annotations, annotationMode } = useFloorPlanStore();
    const [gridSize, setGridSize] = useState(30);

    useEffect(() => {
        if (!model) return;
        normalizeModel(model);

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const footprint = Math.max(size.x, size.z);
        const newGridSize = Math.ceil((footprint * 1.5) / 10) * 10 || 30;
        setGridSize(newGridSize);
    }, [model]);

    return (
        <>
            <ambientLight intensity={0.6} />
            <directionalLight
                position={[15, 15, 15]}
                intensity={1.2}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
            />
            <directionalLight position={[-10, 8, -10]} intensity={0.4} />
            <hemisphereLight args={["#b1e1ff", "#b97a20", 0.3]} />

            {/* Model — always rendered once, with annotation click handler */}
            {model && (
                <>
                    <primitive
                        object={model}
                        onClick={(e: ThreeEvent<MouseEvent>) => {
                            if (annotationMode && annotationClickRef.current) {
                                annotationClickRef.current(e);
                            }
                        }}
                    />
                    <CameraSetup gridSize={gridSize} />
                </>
            )}

            {/* Annotation floating input */}
            {annotationMode && <AnnotationFloatingInput />}

            {/* Render annotation pins */}
            {annotations.map((ann) => (
                <AnnotationPin key={ann.id} annotation={ann} />
            ))}

            {/* Loading indicator */}
            {loading && (
                <mesh position={[0, 1, 0]}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color="#6366f1" wireframe />
                </mesh>
            )}

            {/* Error indicator */}
            {error && (
                <mesh position={[0, 1, 0]}>
                    <boxGeometry args={[2, 2, 2]} />
                    <meshStandardMaterial color="#ef4444" wireframe />
                </mesh>
            )}

            {/* Ground Plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[gridSize, gridSize]} />
                <meshStandardMaterial color="#18181b" side={THREE.DoubleSide} />
            </mesh>

            {/* Grid */}
            <gridHelper args={[gridSize, gridSize, 0x52525b, 0x27272a]} position={[0, 0.01, 0]} />

            <OrbitControls
                makeDefault
                minDistance={0.3}
                maxDistance={gridSize * 5}
                enableDamping
                dampingFactor={0.1}
                rotateSpeed={1}
                panSpeed={0.8}
                enablePan
                zoomSpeed={1.2}
                enableZoom
                maxPolarAngle={Math.PI}
                minPolarAngle={0}
                autoRotate={false}
                touches={{
                    ONE: THREE.TOUCH.ROTATE,
                    TWO: THREE.TOUCH.DOLLY_PAN,
                }}
                mouseButtons={{
                    LEFT: THREE.MOUSE.ROTATE,
                    MIDDLE: THREE.MOUSE.DOLLY,
                    RIGHT: THREE.MOUSE.PAN,
                }}
            />
        </>
    );
};

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

const EmptyState: React.FC = () => (
    <div className="flex flex-col items-center justify-center w-full h-full text-center text-muted-foreground">
        <svg
            className="w-16 h-16 mb-4 opacity-50"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
        >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
        </svg>
        <h2 className="text-xl font-bold text-foreground">No 3D Model Loaded</h2>
        <p className="mt-2 text-sm">Upload a supported model format to explore it in 3D.</p>
    </div>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const Viewer3D: React.FC = () => {
    const { modelUrl, modelFormat, mtlText, textureMap, annotationMode } = useFloorPlanStore();

    if (!modelUrl) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-background">
                <EmptyState />
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-background relative z-10">
            <Canvas
                shadows
                camera={{
                    position: [10, 10, 10],
                    fov: 50,
                    near: 0.1,
                    far: 1000,
                }}
                gl={{ antialias: true }}
                style={{
                    background: '#09090b',
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    cursor: annotationMode ? 'crosshair' : 'grab',
                }}
            >
                <ModelScene url={modelUrl} format={modelFormat || ""} mtlText={mtlText} textureMap={textureMap} />
            </Canvas>

            {annotationMode && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs bg-indigo-500/90 backdrop-blur-md px-4 py-2 rounded-full border border-indigo-400/50 shadow-lg text-white font-semibold z-30 animate-pulse">
                    Click on the model to place an annotation
                </div>
            )}

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs bg-card/80 backdrop-blur-md px-4 py-2 rounded-full border border-border shadow-md pointer-events-none text-muted-foreground z-20">
                {annotationMode
                    ? "Click model to annotate · Press Esc to cancel"
                    : "Drag to orbit · Scroll to zoom · Right-drag to pan"
                }
            </div>
        </div>
    );
};

export default Viewer3D;
