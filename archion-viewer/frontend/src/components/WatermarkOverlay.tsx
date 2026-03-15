"use client";

import React, { useEffect, useRef, useState } from "react";
import { generateWatermarkPatternDataUrl } from "@/lib/watermark";

interface WatermarkOverlayProps {
    text: string;
    opacity?: number;
}

/**
 * Full-coverage watermark overlay that sits ABOVE the Three.js canvas.
 *
 * Security design:
 * - Lives in the DOM (outside the WebGL canvas), so hiding the canvas element doesn't remove it.
 * - pointer-events: none so it doesn't block interaction.
 * - user-select: none + position: absolute + z-index ensures it covers the full viewer.
 * - The repeating pattern is generated on a hidden canvas and applied as a CSS background image.
 *   Even if the displayed image is blocked by a browser extension, the element itself is still
 *   rendered (transparent block), and the second layer inside the Three.js scene also stays.
 */
const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({
    text,
    opacity = 0.13,
}) => {
    const [patternDataUrl, setPatternDataUrl] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Generate the repeating tile pattern
        try {
            const dataUrl = generateWatermarkPatternDataUrl({
                text,
                opacity,
                fontSize: 13,
                angle: -35,
                color: "#ffffff",
                gap: 70,
            });
            setPatternDataUrl(dataUrl);
        } catch {
            // fallback: text-only CSS watermark
            setPatternDataUrl(null);
        }
    }, [text, opacity]);

    return (
        <>
            {/* Primary layer: canvas-pattern repeating background */}
            <div
                ref={containerRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 25,
                    pointerEvents: "none",
                    userSelect: "none",
                    overflow: "hidden",
                    backgroundImage: patternDataUrl ? `url(${patternDataUrl})` : undefined,
                    backgroundRepeat: "repeat",
                    backgroundSize: "auto",
                }}
            />

            {/* Secondary layer: raw SVG text grid — independent of the canvas pattern */}
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 26,
                    pointerEvents: "none",
                    userSelect: "none",
                    overflow: "hidden",
                    display: "flex",
                    flexWrap: "wrap",
                    alignContent: "flex-start",
                    gap: "0px",
                }}
            >
                {/* Build a grid of rotated text spans */}
                {Array.from({ length: 80 }).map((_, i) => (
                    <span
                        key={i}
                        style={{
                            display: "inline-block",
                            color: "rgba(255,255,255,0.07)",
                            fontSize: "11px",
                            fontWeight: 700,
                            fontFamily: '"Inter", sans-serif',
                            letterSpacing: "1.5px",
                            transform: "rotate(-35deg)",
                            transformOrigin: "center",
                            whiteSpace: "nowrap",
                            padding: "18px 14px",
                            flexShrink: 0,
                        }}
                    >
                        {text}
                    </span>
                ))}
            </div>

            {/* Corner branding stamp */}
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    bottom: "60px",
                    right: "16px",
                    zIndex: 27,
                    pointerEvents: "none",
                    userSelect: "none",
                    background: "rgba(0,0,0,0.35)",
                    backdropFilter: "blur(4px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    padding: "6px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                }}
            >
                {/* Archion logo SVG mark */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" />
                    <path d="M12 2V22M2 7L12 12L22 7" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                </svg>
                <span style={{
                    color: "rgba(255,255,255,0.45)",
                    fontSize: "10px",
                    fontWeight: 600,
                    fontFamily: '"Inter", sans-serif',
                    letterSpacing: "0.5px",
                }}>
                    ARCHION VIEWER · Protected
                </span>
            </div>
        </>
    );
};

export default WatermarkOverlay;
