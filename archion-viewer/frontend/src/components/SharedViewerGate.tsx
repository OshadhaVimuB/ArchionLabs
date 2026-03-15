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
                    <meshStandardMaterial color="#6366f1" wireframe />
                </mesh>
            )}

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[30, 30]} />
                <meshStandardMaterial color="#18181b" side={THREE.DoubleSide} />
            </mesh>
            <gridHelper args={[30, 30, 0x52525b, 0x27272a]} position={[0, 0.01, 0]} />

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
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#09090b" }}>
            {/* Background blobs */}
            <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "40%", height: "40%", background: "rgba(99,102,241,0.08)", filter: "blur(100px)", borderRadius: "50%", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "40%", height: "40%", background: "rgba(139,92,246,0.08)", filter: "blur(100px)", borderRadius: "50%", pointerEvents: "none" }} />

            <div
                className="relative max-w-sm w-full rounded-2xl p-8"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}
            >
                {/* Top gradient line */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg,#6366f1,#8b5cf6,#ec4899)", borderRadius: "2px 2px 0 0" }} />

                <div className="text-center mb-8">
                    <div
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                        style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}
                    >
                        <Lock className="w-7 h-7" style={{ color: "#818cf8" }} />
                    </div>
                    <h1 className="text-xl font-bold text-white mb-2">Password Required</h1>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
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
                            className="w-full px-4 py-3 rounded-xl text-white text-sm pr-12"
                            style={{
                                background: "rgba(255,255,255,0.05)",
                                border: `1px solid ${wrongPassword ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.12)"}`,
                                outline: "none",
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => setShow(!show)}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                            style={{ color: "rgba(255,255,255,0.35)" }}
                        >
                            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    {wrongPassword && (
                        <div className="flex items-center gap-2" style={{ color: "#fca5a5" }}>
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <p className="text-xs">Incorrect password. Please try again.</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !pw.trim()}
                        className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                        style={{
                            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                            color: "#fff",
                            opacity: (isLoading || !pw.trim()) ? 0.5 : 1,
                            cursor: (isLoading || !pw.trim()) ? "not-allowed" : "pointer",
                            boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
                        }}
                    >
                        {isLoading ? (
                            <><RefreshCw className="w-4 h-4 animate-spin" /> Verifying...</>
                        ) : (
                            <><Key className="w-4 h-4" /> Unlock Model</>
                        )}
                    </button>
                </form>

                <div className="mt-6 flex items-center justify-center gap-2" style={{ color: "rgba(255,255,255,0.2)" }}>
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
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#09090b" }}>
            <div
                className="max-w-sm w-full rounded-2xl p-8 text-center"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
                <div
                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                    {status === "expired" ? (
                        <Clock className="w-7 h-7" style={{ color: "#f87171" }} />
                    ) : (
                        <AlertTriangle className="w-7 h-7" style={{ color: "#f87171" }} />
                    )}
                </div>
                <h1 className="text-xl font-bold text-white mb-2">
                    {status === "expired" ? "Link Expired" : "Link Not Found"}
                </h1>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {status === "expired"
                        ? "This shared model link has expired. Please ask the sender to generate a new share link."
                        : "This share link is invalid or has been revoked. Please check the URL and try again."}
                </p>
                <div className="mt-6 flex items-center justify-center gap-2" style={{ color: "rgba(255,255,255,0.2)" }}>
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
            <div className="min-h-screen flex items-center justify-center" style={{ background: "#09090b" }}>
                <div className="text-center">
                    <div className="inline-block w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Validating share token…</p>
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
            <div className="relative w-screen h-screen bg-[#09090b] overflow-hidden">
                {/* 3D Viewer */}
                <Canvas
                    shadows
                    camera={{ position: [10, 10, 10], fov: 50, near: 0.1, far: 1000 }}
                    gl={{ antialias: true }}
                    style={{ width: "100%", height: "100%", display: "block", background: "#09090b" }}
                >
                    <SharedModelScene config={allowedConfig} />
                </Canvas>

                {/* Watermark — dual layer, on top of canvas */}
                <WatermarkOverlay text={allowedConfig.watermarkText} />

                {/* Minimal top bar */}
                <div
                    className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-3 z-30"
                    style={{ background: "linear-gradient(to bottom, rgba(9,9,11,0.85), transparent)", pointerEvents: "none" }}
                >
                    <div className="flex items-center gap-2.5">
                        <div
                            className="p-1.5 rounded-lg"
                            style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.2)" }}
                        >
                            <Shield className="w-4 h-4" style={{ color: "#818cf8" }} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">{allowedConfig.modelName}</p>
                            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                                Shared via Archion Viewer · View only
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation hint */}
                <div
                    className="absolute bottom-5 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs z-30 pointer-events-none"
                    style={{
                        background: "rgba(9,9,11,0.7)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.45)",
                        backdropFilter: "blur(8px)",
                    }}
                >
                    Drag to orbit · Scroll to zoom · Right-drag to pan
                </div>
            </div>
        );
    }

    return null;
};

export default SharedViewerGate;
