"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Shield, Lock, Eye, EyeOff, AlertTriangle, Clock, Key, RefreshCw } from "lucide-react";
import { validateShareAccess } from "@/lib/shareManager";
import WatermarkOverlay from "@/components/WatermarkOverlay";
import type { ShareConfig, ShareAccessResult } from "@/types/sharing";
// Reuse the model scene from Viewer3D (same loader logic, embedded here independently)
import { GLTFLoader, FBXLoader, OBJLoader, STLLoader, MTLLoader } from "three-stdlib";

// ---------------------------------------------------------------------------
// Lightweight shared model loader (no Zustand store)
// ---------------------------------------------------------------------------

function SharedModelScene({ config }: { config: ShareConfig }) {
    const [model, setModel] = useState<THREE.Object3D | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setLoadError(null);

        const load = async () => {
            try {
                // Reconstruct blob URL from the stored data URL
                const response = await fetch(config.modelDataUrl);
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);

                let result: THREE.Object3D;
                const { modelFormat, mtlText } = config;

                if (modelFormat === "gltf") {
                    const loader = new GLTFLoader();
                    const gltf = await new Promise<{ scene: THREE.Group }>((res, rej) =>
                        loader.load(blobUrl, res, undefined, rej)
                    );
                    result = gltf.scene;
                } else if (modelFormat === "fbx") {
                    const loader = new FBXLoader();
                    result = await new Promise<THREE.Group>((res, rej) =>
                        loader.load(blobUrl, res, undefined, rej)
                    );
                } else if (modelFormat === "obj") {
                    const objLoader = new OBJLoader();
                    if (mtlText) {
                        try {
                            const mtlLoader = new MTLLoader();
                            const materials = mtlLoader.parse(mtlText, "");
                            materials.preload();
                            objLoader.setMaterials(materials);
                        } catch {/* ignore */ }
                    }
                    result = await new Promise<THREE.Group>((res, rej) =>
                        objLoader.load(blobUrl, res, undefined, rej)
                    );
                } else if (modelFormat === "stl") {
                    const loader = new STLLoader();
                    const geometry = await new Promise<THREE.BufferGeometry>((res, rej) =>
                        loader.load(blobUrl, res, undefined, rej)
                    );
                    result = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: "#d1d5db" }));
                } else {
                    throw new Error(`Unsupported format: ${modelFormat}`);
                }

                // Normalize model size
                const box = new THREE.Box3().setFromObject(result);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = maxDim > 0 ? 10 / maxDim : 1;
                result.scale.multiplyScalar(scale);

                const box2 = new THREE.Box3().setFromObject(result);
                const center2 = box2.getCenter(new THREE.Vector3());
                result.position.sub(center2);
                result.position.y += box2.getSize(new THREE.Vector3()).y / 2;

                URL.revokeObjectURL(blobUrl);

                if (!cancelled) {
                    setModel(result);
                }
            } catch (err) {
                if (!cancelled) {
                    setLoadError(err instanceof Error ? err.message : "Failed to load model");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [config]);

    return (
        <>
            <ambientLight intensity={0.6} />
            <directionalLight position={[15, 15, 15]} intensity={1.2} castShadow />
            <directionalLight position={[-10, 8, -10]} intensity={0.4} />
            <hemisphereLight args={["#b1e1ff", "#b97a20", 0.3]} />

            {model && <primitive object={model} />}

            {loading && (
                <mesh position={[0, 1, 0]}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color="#ffffff" wireframe />
                </mesh>
            )}

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[30, 30]} />
                <meshStandardMaterial color="#000000" side={THREE.DoubleSide} />
            </mesh>
            <gridHelper args={[30, 30, 0x333333, 0x222222]} position={[0, 0.01, 0]} />

            <OrbitControls
                makeDefault
                minDistance={0.3}
                maxDistance={150}
                enableDamping
                dampingFactor={0.1}
                enablePan
                enableZoom
                maxPolarAngle={Math.PI}
                minPolarAngle={0}
            />
        </>
    );
}

// ---------------------------------------------------------------------------
// Password Entry Screen
// ---------------------------------------------------------------------------

interface PasswordScreenProps {
    onSubmit: (password: string) => void;
    isLoading: boolean;
    wrongPassword: boolean;
}

function PasswordScreen({ onSubmit, isLoading, wrongPassword }: PasswordScreenProps) {
    const [pw, setPw] = useState("");
    const [show, setShow] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pw.trim()) onSubmit(pw.trim());
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-black">
            {/* Background blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 blur-[100px] rounded-full pointer-events-none" />

            <div
                className="relative max-w-sm w-full rounded-2xl p-8 bg-black/80 border border-white/20 backdrop-blur-md shadow-2xl"
            >
                {/* Top line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-white rounded-t-2xl" />

                <div className="text-center mb-8">
                    <div
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-white/10 border border-white/20"
                    >
                        <Lock className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-white mb-2">Password Required</h1>
                    <p className="text-sm text-gray-400">
                        This shared 3D model is password protected. Enter the password provided by the sender.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <input
                            autoFocus
                            type={show ? "text" : "password"}
                            value={pw}
                            onChange={(e) => setPw(e.target.value)}
                            placeholder="Enter password..."
                            className={`w-full px-4 py-3 rounded-xl text-white text-sm pr-12 bg-white/5 border ${wrongPassword ? "border-red-500" : "border-white/20"} outline-none focus:border-white focus:ring-1 focus:ring-white`}
                        />
                        <button
                            type="button"
                            onClick={() => setShow(!show)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    {wrongPassword && (
                        <div className="flex items-center gap-2 text-red-400">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <p className="text-xs">Incorrect password. Please try again.</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !pw.trim()}
                        className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all border border-white/20 ${
                            (isLoading || !pw.trim()) 
                                ? "bg-white/10 text-gray-400 cursor-not-allowed" 
                                : "bg-white text-black hover:bg-gray-200"
                        }`}
                    >
                        {isLoading ? (
                            <><RefreshCw className="w-4 h-4 animate-spin" /> Verifying...</>
                        ) : (
                            <><Key className="w-4 h-4" /> Unlock Model</>
                        )}
                    </button>
                </form>

                <div className="mt-6 flex items-center justify-center gap-2 text-gray-500">
                    <Shield className="w-3 h-3" />
                    <span className="text-xs">Protected by Archion Viewer</span>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Expired / Not-Found Screen
// ---------------------------------------------------------------------------

function ExpiredScreen({ status }: { status: "expired" | "notFound" }) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-black">
            <div
                className="max-w-sm w-full rounded-2xl p-8 text-center bg-black/80 border border-white/20 shadow-2xl backdrop-blur-md"
            >
                <div
                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-red-500/10 border border-red-500/20"
                >
                    {status === "expired" ? (
                        <Clock className="w-7 h-7 text-red-500" />
                    ) : (
                        <AlertTriangle className="w-7 h-7 text-red-500" />
                    )}
                </div>
                <h1 className="text-xl font-bold text-white mb-2">
                    {status === "expired" ? "Link Expired" : "Link Not Found"}
                </h1>
                <p className="text-sm text-gray-400">
                    {status === "expired"
                        ? "This shared model link has expired. Please ask the sender to generate a new share link."
                        : "This share link is invalid or has been revoked. Please check the URL and try again."}
                </p>
                <div className="mt-6 flex items-center justify-center gap-2 text-gray-500">
                    <Shield className="w-3 h-3" />
                    <span className="text-xs">Protected by Archion Viewer</span>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Gate Component
// ---------------------------------------------------------------------------

interface SharedViewerGateProps {
    token: string;
}

const SharedViewerGate: React.FC<SharedViewerGateProps> = ({ token }) => {
    const [phase, setPhase] = useState<
        "loading" | "passwordRequired" | "wrongPassword" | "allowed" | "expired" | "notFound"
    >("loading");
    const [allowedConfig, setAllowedConfig] = useState<ShareConfig | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    // Initial validation (no password)
    useEffect(() => {
        const check = async () => {
            const result = await validateShareAccess(token);
            applyResult(result);
        };
        check();
    }, [token]);

    const applyResult = (result: ShareAccessResult) => {
        if (result.status === "allowed") {
            setAllowedConfig(result.config);
            setPhase("allowed");
        } else if (result.status === "passwordRequired") {
            setPhase("passwordRequired");
        } else if (result.status === "expired") {
            setPhase("expired");
        } else {
            setPhase("notFound");
        }
    };

    const handlePasswordSubmit = useCallback(async (password: string) => {
        setIsVerifying(true);
        const result = await validateShareAccess(token, password);
        setIsVerifying(false);
        if (result.status === "wrongPassword") {
            setPhase("wrongPassword");
        } else {
            applyResult(result);
        }
    }, [token]);

    // -- Render --

    if (phase === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-center">
                    <div className="inline-block w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin mb-4" />
                    <p className="text-sm text-gray-400">Validating share token…</p>
                </div>
            </div>
        );
    }

    if (phase === "expired" || phase === "notFound") {
        return <ExpiredScreen status={phase} />;
    }

    if (phase === "passwordRequired" || phase === "wrongPassword") {
        return (
            <PasswordScreen
                onSubmit={handlePasswordSubmit}
                isLoading={isVerifying}
                wrongPassword={phase === "wrongPassword"}
            />
        );
    }

    if (phase === "allowed" && allowedConfig) {
        return (
            <div className="relative w-screen h-screen bg-black overflow-hidden">
                {/* 3D Viewer */}
                <Canvas
                    shadows
                    camera={{ position: [10, 10, 10], fov: 50, near: 0.1, far: 1000 }}
                    gl={{ antialias: true }}
                    style={{ width: "100%", height: "100%", display: "block", background: "#000000" }}
                >
                    <SharedModelScene config={allowedConfig} />
                </Canvas>

                {/* Watermark — dual layer, on top of canvas */}
                <WatermarkOverlay text={allowedConfig.watermarkText} />

                {/* Minimal top bar */}
                <div
                    className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-3 z-30 bg-gradient-to-b from-black/85 to-transparent pointer-events-none"
                >
                    <div className="flex items-center gap-2.5">
                        <div
                            className="p-1.5 rounded-lg bg-white/10 border border-white/20"
                        >
                            <Shield className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">{allowedConfig.modelName}</p>
                            <p className="text-xs text-gray-400">
                                Shared via Archion Viewer · View only
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation hint */}
                <div
                    className="absolute bottom-5 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs z-30 pointer-events-none bg-black/70 border border-white/20 text-gray-400 backdrop-blur-md"
                >
                    Drag to orbit · Scroll to zoom · Right-drag to pan
                </div>
            </div>
        );
    }

    return null;
};

export default SharedViewerGate;
