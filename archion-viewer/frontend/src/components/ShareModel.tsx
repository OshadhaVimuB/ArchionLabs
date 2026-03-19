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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden bg-black border border-white/20 max-h-[90vh]"
            >
                {/* Header gradient bar */}
                <div
                    className="h-[3px] bg-white"
                />

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div
                            className="p-2 rounded-xl bg-white/10 border border-white/20"
                        >
                            <Share2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white">Share Model</h2>
                            <p className="text-xs text-gray-400">
                                Secure token-based sharing
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-6 gap-1 mb-1 border-b border-white/10">
                    {[
                        { key: "create", label: "Create Link", icon: Plus },
                        { key: "manage", label: `Manage (${shares.length})`, icon: Eye },
                    ].map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setTab(key as "create" | "manage")}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors relative -mb-[1px] ${
                                tab === key ? "text-white border-b-2 border-white" : "text-gray-400 border-b-2 border-transparent hover:text-gray-300"
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="px-6 pb-6 overflow-y-auto max-h-[65vh]">
                    {/* ---- CREATE TAB ---- */}
                    {tab === "create" && (
                        <div className="pt-5 space-y-5">
                            {generatedUrl ? (
                                /* Success state */
                                <div className="space-y-4">
                                    <div
                                        className="rounded-xl p-4 flex items-start gap-3 bg-white/5 border border-white/20"
                                    >
                                        <Check className="w-5 h-5 shrink-0 mt-0.5 text-white" />
                                        <div>
                                            <p className="text-sm font-semibold text-white">Share link created!</p>
                                            <p className="text-xs mt-0.5 text-gray-400">
                                                Expires in {expiryDays} day{expiryDays !== 1 ? "s" : ""}
                                                {passwordEnabled && " · Password protected"}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold mb-2 block text-gray-400">
                                            Share URL
                                        </label>
                                        <div
                                            className="flex items-center gap-2 rounded-xl p-3 bg-white/5 border border-white/10"
                                        >
                                            <Link className="w-4 h-4 shrink-0 text-white" />
                                            <span
                                                className="flex-1 text-xs truncate font-mono text-gray-300"
                                            >
                                                {generatedUrl}
                                            </span>
                                            <button
                                                onClick={handleCopy}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                                    copied ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
                                                }`}
                                            >
                                                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                {copied ? "Copied!" : "Copy"}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleNewShare}
                                        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
                                    >
                                        Create Another Link
                                    </button>
                                </div>
                            ) : (
                                /* Configuration form */
                                <>
                                    {/* Expiry */}
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-semibold mb-3 text-gray-400">
                                            <Calendar className="w-3.5 h-3.5" />
                                            Link Expiry
                                        </label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {EXPIRY_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => setExpiryDays(opt.value)}
                                                    className={`py-2 rounded-xl text-xs font-semibold transition-all border ${
                                                        expiryDays === opt.value 
                                                            ? "bg-white text-black border-white" 
                                                            : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"
                                                    }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Password Protection */}
                                    <div
                                        className={`rounded-xl p-4 space-y-3 border ${
                                            passwordEnabled ? "bg-white/10 border-white/30" : "bg-white/5 border-white/10"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {passwordEnabled
                                                    ? <Lock className="w-4 h-4 text-white" />
                                                    : <Unlock className="w-4 h-4 text-gray-400" />
                                                }
                                                <span className={`text-sm font-semibold ${passwordEnabled ? "text-white" : "text-gray-400"}`}>
                                                    Password Protection
                                                </span>
                                            </div>
                                            {/* Toggle switch */}
                                            <button
                                                onClick={() => {
                                                    setPasswordEnabled(!passwordEnabled);
                                                    if (passwordEnabled) setPassword("");
                                                }}
                                                className={`relative w-11 h-6 rounded-full transition-all ${
                                                    passwordEnabled ? "bg-white" : "bg-white/20"
                                                }`}
                                            >
                                                <span
                                                    className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform ${
                                                        passwordEnabled ? "bg-black translate-x-[20px]" : "bg-white translate-x-0"
                                                    }`}
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
                                                    className="w-full px-3 py-2.5 rounded-lg text-sm pr-10 bg-black border border-white/20 text-white outline-none focus:border-white focus:ring-1 focus:ring-white"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Watermark text */}
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-semibold mb-2 text-gray-400">
                                            <Shield className="w-3.5 h-3.5" />
                                            Watermark Text
                                        </label>
                                        <input
                                            type="text"
                                            value={watermarkText}
                                            onChange={(e) => setWatermarkText(e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-xl text-sm bg-black border border-white/20 text-gray-200 outline-none focus:border-white focus:ring-1 focus:ring-white font-mono text-[11px]"
                                        />
                                        <p className="text-xs mt-1.5 text-gray-500">
                                            This text will repeat across the entire model view as an irreplaceable watermark.
                                        </p>
                                    </div>

                                    {/* Security summary */}
                                    <div
                                        className="rounded-xl p-3 flex items-start gap-3 bg-white/5 border border-white/10"
                                    >
                                        <Shield className="w-4 h-4 shrink-0 mt-0.5 text-white" />
                                        <p className="text-xs leading-relaxed text-gray-400">
                                            Link expires after <strong className="text-white">{expiryDays} day{expiryDays !== 1 ? "s" : ""}</strong>.
                                            {passwordEnabled ? " Password is SHA-256 hashed." : " No password required."}{" "}
                                            The 3D model view will be stamped with a dual-layer watermark that cannot be removed by the viewer.
                                        </p>
                                    </div>

                                    {createError && (
                                        <div
                                            className="flex items-center gap-2 rounded-xl p-3 bg-white border border-white text-black"
                                        >
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            <p className="text-xs font-semibold">{createError}</p>
                                        </div>
                                    )}

                                    {/* Create button */}
                                    <button
                                        onClick={handleCreate}
                                        disabled={isCreating || (passwordEnabled && !password.trim())}
                                        className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border border-white/20 ${
                                            (isCreating || (passwordEnabled && !password.trim())) 
                                                ? "bg-white/10 text-gray-400 cursor-not-allowed" 
                                                : "bg-white text-black hover:bg-gray-200"
                                        }`}
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
                                    <Link className="w-10 h-10 mx-auto mb-3 opacity-20 text-white" />
                                    <p className="text-sm text-gray-400">
                                        No active share links yet.
                                    </p>
                                    <button
                                        onClick={() => setTab("create")}
                                        className="mt-4 text-xs underline text-white hover:text-gray-300"
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
                                            className={`rounded-xl p-4 border ${
                                                expired ? "bg-white/5 border-white/5 opacity-60" : "bg-white/10 border-white/20"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={`w-2 h-2 rounded-full ${expired ? "bg-white/40" : "bg-white"}`}
                                                    />
                                                    <span className="text-sm font-semibold text-white truncate max-w-[180px]">
                                                        {share.modelName}
                                                    </span>
                                                    {share.passwordHash && (
                                                        <Lock className="w-3 h-3 text-gray-300" />
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleRevoke(share.token)}
                                                    title="Revoke link"
                                                    className="p-1.5 rounded-lg transition-colors text-white/50 hover:text-white bg-white/10 hover:bg-white/20"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2">
                                                    <Clock className={`w-3 h-3 ${expired ? "text-gray-500" : "text-gray-400"}`} />
                                                    <span className={`text-xs ${expired ? "text-gray-500" : "text-gray-400"}`}>
                                                        {expired ? "Expired" : getRemainingTime(share)}
                                                    </span>
                                                    <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                                                        {share.accessCount} view{share.accessCount !== 1 ? "s" : ""}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Link className="w-3 h-3 shrink-0 text-white/40" />
                                                    <span className="text-xs truncate font-mono text-gray-400">
                                                        ...{share.token.slice(-12)}
                                                    </span>
                                                    {!expired && (
                                                        <button
                                                            onClick={async () => {
                                                                await navigator.clipboard.writeText(buildShareUrl(share.token));
                                                            }}
                                                            className="ml-auto text-xs flex items-center gap-1 px-2 py-0.5 rounded text-black bg-white hover:bg-gray-200 transition-colors"
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
