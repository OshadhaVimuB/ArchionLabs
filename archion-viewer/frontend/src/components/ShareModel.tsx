"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Share2, Copy, Check, Lock, Unlock, Calendar, Eye,
    Trash2, X, Link, Clock, Shield, Plus, ChevronDown, AlertCircle
} from "lucide-react";
import {
    createShareToken,
    buildShareUrl,
    listShareTokens,
    revokeShareToken,
    isShareExpired,
    getRemainingTime,
    blobUrlToDataUrl,
} from "@/lib/shareManager";
import { generateWatermarkText } from "@/lib/watermark";
import type { ShareConfig } from "@/types/sharing";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const EXPIRY_OPTIONS = [
    { label: "1 Day", value: 1 },
    { label: "3 Days", value: 3 },
    { label: "7 Days", value: 7 },
    { label: "14 Days", value: 14 },
    { label: "30 Days", value: 30 },
];

interface ShareModalProps {
    modelUrl: string;
    modelFormat: string;
    modelName: string;
    mtlText?: string | null;
    onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({
    modelUrl,
    modelFormat,
    modelName,
    mtlText,
    onClose,
}) => {
    // -- Create form state --
    const [tab, setTab] = useState<"create" | "manage">("create");
    const [expiryDays, setExpiryDays] = useState(7);
    const [passwordEnabled, setPasswordEnabled] = useState(false);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [watermarkText, setWatermarkText] = useState(() => generateWatermarkText(modelName));
    const [isCreating, setIsCreating] = useState(false);
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    // -- Manage tab state --
    const [shares, setShares] = useState<ShareConfig[]>([]);

    const refreshShares = useCallback(() => {
        setShares(listShareTokens());
    }, []);

    useEffect(() => {
        refreshShares();
    }, [refreshShares]);

    // -- Create share --
    const handleCreate = async () => {
        setIsCreating(true);
        setCreateError(null);
        try {
            // Convert blob URL → base64 data URL for persistence
            const modelDataUrl = await blobUrlToDataUrl(modelUrl);

            const config = await createShareToken({
                modelDataUrl,
                modelFormat,
                modelName,
                mtlText,
                expiryDays,
                password: passwordEnabled && password.trim() ? password.trim() : undefined,
                watermarkText: watermarkText.trim() || generateWatermarkText(modelName),
            });

            setGeneratedUrl(buildShareUrl(config.token));
            refreshShares();
        } catch (err) {
            setCreateError(err instanceof Error ? err.message : "Failed to create share link");
        } finally {
            setIsCreating(false);
        }
    };

    const handleCopy = async () => {
        if (!generatedUrl) return;
        await navigator.clipboard.writeText(generatedUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRevoke = (token: string) => {
        revokeShareToken(token);
        refreshShares();
    };

    const handleNewShare = () => {
        setGeneratedUrl(null);
        setPassword("");
        setPasswordEnabled(false);
    };

    return (
        // Backdrop
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
                style={{
                    background: "rgba(9,9,11,0.97)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    maxHeight: "90vh",
                }}
            >
                {/* Header gradient bar */}
                <div
                    style={{
                        height: "3px",
                        background: "linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)",
                    }}
                />

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div
                            className="p-2 rounded-xl"
                            style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)" }}
                        >
                            <Share2 className="w-5 h-5" style={{ color: "#818cf8" }} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white">Share Model</h2>
                            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                                Secure token-based sharing
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-6 gap-1 mb-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {[
                        { key: "create", label: "Create Link", icon: Plus },
                        { key: "manage", label: `Manage (${shares.length})`, icon: Eye },
                    ].map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setTab(key as "create" | "manage")}
                            className="flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors relative"
                            style={{
                                color: tab === key ? "#818cf8" : "rgba(255,255,255,0.4)",
                                borderBottom: tab === key ? "2px solid #6366f1" : "2px solid transparent",
                                marginBottom: "-1px",
                            }}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="px-6 pb-6 overflow-y-auto" style={{ maxHeight: "65vh" }}>
                    {/* ---- CREATE TAB ---- */}
                    {tab === "create" && (
                        <div className="pt-5 space-y-5">
                            {generatedUrl ? (
                                /* Success state */
                                <div className="space-y-4">
                                    <div
                                        className="rounded-xl p-4 flex items-start gap-3"
                                        style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
                                    >
                                        <Check className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#10b981" }} />
                                        <div>
                                            <p className="text-sm font-semibold text-white">Share link created!</p>
                                            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                                                Expires in {expiryDays} day{expiryDays !== 1 ? "s" : ""}
                                                {passwordEnabled && " · Password protected"}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold mb-2 block" style={{ color: "rgba(255,255,255,0.5)" }}>
                                            Share URL
                                        </label>
                                        <div
                                            className="flex items-center gap-2 rounded-xl p-3"
                                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                                        >
                                            <Link className="w-4 h-4 shrink-0" style={{ color: "#6366f1" }} />
                                            <span
                                                className="flex-1 text-xs truncate font-mono"
                                                style={{ color: "rgba(255,255,255,0.7)" }}
                                            >
                                                {generatedUrl}
                                            </span>
                                            <button
                                                onClick={handleCopy}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                                style={{
                                                    background: copied ? "rgba(16,185,129,0.2)" : "rgba(99,102,241,0.2)",
                                                    color: copied ? "#10b981" : "#818cf8",
                                                    border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "rgba(99,102,241,0.3)"}`,
                                                }}
                                            >
                                                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                {copied ? "Copied!" : "Copy"}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleNewShare}
                                        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors"
                                        style={{
                                            background: "rgba(255,255,255,0.04)",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                            color: "rgba(255,255,255,0.6)",
                                        }}
                                    >
                                        Create Another Link
                                    </button>
                                </div>
                            ) : (
                                /* Configuration form */
                                <>
                                    {/* Expiry */}
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-semibold mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>
                                            <Calendar className="w-3.5 h-3.5" />
                                            Link Expiry
                                        </label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {EXPIRY_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => setExpiryDays(opt.value)}
                                                    className="py-2 rounded-xl text-xs font-semibold transition-all"
                                                    style={{
                                                        background: expiryDays === opt.value ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.04)",
                                                        border: `1px solid ${expiryDays === opt.value ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.07)"}`,
                                                        color: expiryDays === opt.value ? "#818cf8" : "rgba(255,255,255,0.5)",
                                                    }}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Password Protection */}
                                    <div
                                        className="rounded-xl p-4 space-y-3"
                                        style={{
                                            background: passwordEnabled ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0.03)",
                                            border: `1px solid ${passwordEnabled ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.07)"}`,
                                        }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {passwordEnabled
                                                    ? <Lock className="w-4 h-4" style={{ color: "#818cf8" }} />
                                                    : <Unlock className="w-4 h-4" style={{ color: "rgba(255,255,255,0.35)" }} />
                                                }
                                                <span className="text-sm font-semibold" style={{ color: passwordEnabled ? "#c7d2fe" : "rgba(255,255,255,0.6)" }}>
                                                    Password Protection
                                                </span>
                                            </div>
                                            {/* Toggle switch */}
                                            <button
                                                onClick={() => {
                                                    setPasswordEnabled(!passwordEnabled);
                                                    if (passwordEnabled) setPassword("");
                                                }}
                                                className="relative w-11 h-6 rounded-full transition-all"
                                                style={{
                                                    background: passwordEnabled ? "#6366f1" : "rgba(255,255,255,0.1)",
                                                    border: "none",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                <span
                                                    className="absolute top-1 left-1 w-4 h-4 rounded-full transition-transform bg-white"
                                                    style={{ transform: passwordEnabled ? "translateX(20px)" : "translateX(0)" }}
                                                />
                                            </button>
                                        </div>
                                        {passwordEnabled && (
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="Enter password for this link..."
                                                    className="w-full px-3 py-2.5 rounded-lg text-sm pr-10"
                                                    style={{
                                                        background: "rgba(255,255,255,0.05)",
                                                        border: "1px solid rgba(255,255,255,0.12)",
                                                        color: "#fff",
                                                        outline: "none",
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                                    style={{ color: "rgba(255,255,255,0.4)" }}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Watermark text */}
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                                            <Shield className="w-3.5 h-3.5" />
                                            Watermark Text
                                        </label>
                                        <input
                                            type="text"
                                            value={watermarkText}
                                            onChange={(e) => setWatermarkText(e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-xl text-sm"
                                            style={{
                                                background: "rgba(255,255,255,0.04)",
                                                border: "1px solid rgba(255,255,255,0.08)",
                                                color: "rgba(255,255,255,0.7)",
                                                outline: "none",
                                                fontFamily: "monospace",
                                                fontSize: "11px",
                                            }}
                                        />
                                        <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                                            This text will repeat across the entire model view as an irreplaceable watermark.
                                        </p>
                                    </div>

                                    {/* Security summary */}
                                    <div
                                        className="rounded-xl p-3 flex items-start gap-3"
                                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                                    >
                                        <Shield className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#a5b4fc" }} />
                                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>
                                            Link expires after <strong style={{ color: "#c7d2fe" }}>{expiryDays} day{expiryDays !== 1 ? "s" : ""}</strong>.
                                            {passwordEnabled ? " Password is SHA-256 hashed." : " No password required."}{" "}
                                            The 3D model view will be stamped with a dual-layer watermark that cannot be removed by the viewer.
                                        </p>
                                    </div>

                                    {createError && (
                                        <div
                                            className="flex items-center gap-2 rounded-xl p-3"
                                            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}
                                        >
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            <p className="text-xs">{createError}</p>
                                        </div>
                                    )}

                                    {/* Create button */}
                                    <button
                                        onClick={handleCreate}
                                        disabled={isCreating || (passwordEnabled && !password.trim())}
                                        className="w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                                        style={{
                                            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                            color: "#fff",
                                            opacity: (isCreating || (passwordEnabled && !password.trim())) ? 0.5 : 1,
                                            cursor: (isCreating || (passwordEnabled && !password.trim())) ? "not-allowed" : "pointer",
                                            boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
                                        }}
                                    >
                                        {isCreating ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Link className="w-4 h-4" />
                                                Generate Share Link
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* ---- MANAGE TAB ---- */}
                    {tab === "manage" && (
                        <div className="pt-5 space-y-3">
                            {shares.length === 0 ? (
                                <div className="text-center py-10">
                                    <Link className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: "#fff" }} />
                                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                                        No active share links yet.
                                    </p>
                                    <button
                                        onClick={() => setTab("create")}
                                        className="mt-4 text-xs underline"
                                        style={{ color: "#818cf8" }}
                                    >
                                        Create your first share link →
                                    </button>
                                </div>
                            ) : (
                                shares.map((share) => {
                                    const expired = isShareExpired(share);
                                    return (
                                        <div
                                            key={share.token}
                                            className="rounded-xl p-4"
                                            style={{
                                                background: expired ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
                                                border: `1px solid ${expired ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.08)"}`,
                                                opacity: expired ? 0.6 : 1,
                                            }}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ background: expired ? "#ef4444" : "#10b981" }}
                                                    />
                                                    <span className="text-sm font-semibold text-white truncate max-w-[180px]">
                                                        {share.modelName}
                                                    </span>
                                                    {share.passwordHash && (
                                                        <Lock className="w-3 h-3" style={{ color: "#a5b4fc" }} />
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleRevoke(share.token)}
                                                    title="Revoke link"
                                                    className="p-1.5 rounded-lg transition-colors"
                                                    style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)" }}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-3 h-3" style={{ color: expired ? "#ef4444" : "rgba(255,255,255,0.35)" }} />
                                                    <span className="text-xs" style={{ color: expired ? "#fca5a5" : "rgba(255,255,255,0.45)" }}>
                                                        {expired ? "Expired" : getRemainingTime(share)}
                                                    </span>
                                                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}>
                                                        {share.accessCount} view{share.accessCount !== 1 ? "s" : ""}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Link className="w-3 h-3 shrink-0" style={{ color: "rgba(255,255,255,0.2)" }} />
                                                    <span className="text-xs truncate font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
                                                        ...{share.token.slice(-12)}
                                                    </span>
                                                    {!expired && (
                                                        <button
                                                            onClick={async () => {
                                                                await navigator.clipboard.writeText(buildShareUrl(share.token));
                                                            }}
                                                            className="ml-auto text-xs flex items-center gap-1 px-2 py-0.5 rounded"
                                                            style={{ color: "#818cf8", background: "rgba(99,102,241,0.1)" }}
                                                        >
                                                            <Copy className="w-2.5 h-2.5" /> Copy
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
