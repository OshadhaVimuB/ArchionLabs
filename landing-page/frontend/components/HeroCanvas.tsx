"use client";

import { useEffect, useRef } from "react";

const HORIZON_RATIO = 0.4;
const FOCAL_LENGTH = 350;
const CAM_Y = 150;
const GRID_ALPHA_BOTTOM = 0.18;
const AGENT_COUNT = 50;
const AGENT_COLORS = ["#2563eb", "#0ea5e9", "#4f46e5", "#0f172a"];
const WORLD_X_MAX = 1200;

interface Agent {
    x: number;
    z: number;
    targetX: number;
    targetZ: number;
    speed: number;
    color: string;
    radius: number;
    waitTimer: number;
    walkCycle: number;
}

function randIn(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

function sampleDepth() {
    const r = Math.random();
    if (r < 0.1) return randIn(120, 220);
    if (r < 0.7) return randIn(320, 720);
    if (r < 0.95) return randIn(720, 1200);
    return randIn(1200, 1800);
}

function sampleX() {
    const r = Math.random();
    if (r < 0.4) return randIn(-WORLD_X_MAX, -600);
    if (r < 0.8) return randIn(600, WORLD_X_MAX);
    return randIn(-600, 600);
}

function shuffledColorPool(count: number) {
    const pool: string[] = [];
    while (pool.length < count) pool.push(...AGENT_COLORS);
    pool.length = count;
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
}

function hexToRgb(hex: string) {
    const bigint = parseInt(hex.slice(1), 16);
    const rr = (bigint >> 16) & 255;
    const gg = (bigint >> 8) & 255;
    const bb = bigint & 255;
    return `${rr},${gg},${bb}`;
}

function drawHuman(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    color: string,
    alpha: number,
    cycle: number
) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const stride = Math.sin(cycle) * 0.6;
    const armSwing = Math.sin(cycle + Math.PI) * 0.6;
    const bob = Math.abs(Math.sin(cycle)) * 1.5;
    const sway = Math.sin(cycle * 0.5) * 0.05;

    const hipY = -22 - bob;
    const shoulderY = -44 - bob;
    const headY = -58 - bob;

    const thighLen = 14;
    const LEG_WIDTH = 6;
    const BODY_WIDTH = 10;
    const ARM_WIDTH = 4;

    // Left leg
    ctx.lineWidth = LEG_WIDTH;
    const kneeX_L = -2 + Math.sin(stride) * 4;
    const footX_L = -2 + Math.sin(stride) * 10;
    ctx.beginPath();
    ctx.moveTo(-2, hipY);
    ctx.lineTo(kneeX_L, hipY + thighLen);
    ctx.lineTo(footX_L, -bob * 0.2);
    ctx.stroke();

    // Right leg
    const kneeX_R = 2 - Math.sin(stride) * 4;
    const footX_R = 2 - Math.sin(stride) * 10;
    ctx.beginPath();
    ctx.moveTo(2, hipY);
    ctx.lineTo(kneeX_R, hipY + thighLen);
    ctx.lineTo(footX_R, -bob * 0.2);
    ctx.stroke();

    // Body
    ctx.save();
    ctx.rotate(sway);
    ctx.lineWidth = BODY_WIDTH;
    ctx.beginPath();
    ctx.moveTo(0, hipY);
    ctx.lineTo(0, shoulderY);
    ctx.stroke();
    ctx.restore();

    // Head
    ctx.beginPath();
    ctx.arc(0, headY + 3, 7, 0, Math.PI * 2);
    ctx.fill();

    // Left arm
    ctx.lineWidth = ARM_WIDTH;
    const elbowX_L = -3 + Math.sin(armSwing) * 4;
    const handX_L = -3 + Math.sin(armSwing) * 10;
    ctx.beginPath();
    ctx.moveTo(-3, shoulderY);
    ctx.lineTo(elbowX_L, shoulderY + 7);
    ctx.lineTo(handX_L, shoulderY + 15);
    ctx.stroke();

    // Right arm
    const elbowX_R = 3 - Math.sin(armSwing) * 4;
    const handX_R = 3 - Math.sin(armSwing) * 10;
    ctx.beginPath();
    ctx.moveTo(3, shoulderY);
    ctx.lineTo(elbowX_R, shoulderY + 7);
    ctx.lineTo(handX_R, shoulderY + 15);
    ctx.stroke();

    ctx.restore();
}

export default function HeroCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const agentsRef = useRef<Agent[]>([]);
    const animFrameRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let width = 0;
        let height = 0;

        function createAgent(i: number, colorPool: string[], w: number): Agent {
            let x = 0,
                z = 0;
            for (let attempt = 0; attempt < 8; attempt++) {
                x = sampleX();
                z = sampleDepth();
                const scale = FOCAL_LENGTH / Math.max(1, z);
                const screenX = w / 2 + x * scale;
                if (attempt === 7 || screenX < w * 0.38 || screenX > w * 0.62) break;
            }
            return {
                x,
                z,
                targetX: sampleX(),
                targetZ: sampleDepth(),
                speed: 0.9 + Math.random() * 0.8,
                color: colorPool[i],
                radius: 11,
                waitTimer: 0,
                walkCycle: Math.random() * 10,
            };
        }

        function resize() {
            const parent = canvas!.parentElement;
            if (!parent) return;
            width = canvas!.width = parent.offsetWidth;
            height = canvas!.height = parent.offsetHeight;

            if (agentsRef.current.length === 0) {
                const colorPool = shuffledColorPool(AGENT_COUNT);
                agentsRef.current = [];
                for (let i = 0; i < AGENT_COUNT; i++) {
                    agentsRef.current.push(createAgent(i, colorPool, width));
                }
            }
        }

        function animate() {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);

            const cx = width / 2;
            const cy = height * HORIZON_RATIO;

            // Light Theme Floor Grid
            const gridGradient = ctx.createLinearGradient(0, cy, 0, height);
            gridGradient.addColorStop(0, "rgba(15, 23, 42, 0)");
            gridGradient.addColorStop(0.1, "rgba(15, 23, 42, 0.06)");
            gridGradient.addColorStop(1, `rgba(15, 23, 42, ${GRID_ALPHA_BOTTOM})`);
            ctx.strokeStyle = gridGradient;
            ctx.lineWidth = 1;
            ctx.beginPath();

            const spacingAtBottom = 250;
            const numLines = Math.ceil(width / spacingAtBottom) * 4;
            for (let i = -numLines; i <= numLines; i++) {
                const xOffset = i * spacingAtBottom;
                ctx.moveTo(cx + xOffset, height);
                ctx.lineTo(cx, cy);
            }
            const numHLines = 30;
            for (let i = 0; i < numHLines; i++) {
                const t = i / numHLines,
                    t2 = t * t;
                const lineY = cy + (height - cy) * t2;
                if (lineY > cy) {
                    ctx.moveTo(0, lineY);
                    ctx.lineTo(width, lineY);
                }
            }
            ctx.stroke();

            agentsRef.current.forEach((agent) => {
                if (agent.waitTimer > 0) {
                    agent.waitTimer--;
                    agent.walkCycle = 0;
                } else {
                    const dx = agent.targetX - agent.x;
                    const dz = agent.targetZ - agent.z;
                    const dist = Math.hypot(dx, dz);

                    if (dist < 5) {
                        agent.waitTimer = 30 + Math.random() * 60;
                        agent.targetX = sampleX();
                        agent.targetZ = sampleDepth();
                    } else {
                        agent.x += (dx / dist) * agent.speed;
                        agent.z += (dz / dist) * agent.speed;
                        agent.walkCycle += 0.14;
                    }
                }

                if (agent.z > 1200 && Math.random() < 0.8) {
                    agent.targetZ = randIn(350, 800);
                    agent.targetX =
                        agent.x < 0
                            ? randIn(-WORLD_X_MAX, -600)
                            : randIn(600, WORLD_X_MAX);
                }

                const zSafe = Math.max(1, agent.z);
                const scale = FOCAL_LENGTH / zSafe;
                const screenX = cx + agent.x * scale;
                const screenY = cy + CAM_Y * scale;

                let alpha = Math.max(0, 1 - (agent.z - 500) / 1500);
                alpha = Math.min(1, alpha);

                if (screenX > -50 && screenX < width + 50 && alpha > 0.05) {
                    const r = agent.radius * (scale * 2.5);
                    ctx.beginPath();
                    ctx.ellipse(screenX, screenY, r * 2.1, r * 0.7, 0, 0, Math.PI * 2);

                    const rgb = hexToRgb(agent.color);
                    const gradient = ctx.createRadialGradient(
                        screenX,
                        screenY,
                        0,
                        screenX,
                        screenY,
                        r * 2.0
                    );
                    gradient.addColorStop(0, `rgba(${rgb}, ${alpha * 0.4})`);
                    gradient.addColorStop(1, `rgba(${rgb}, 0)`);
                    ctx.fillStyle = gradient;
                    ctx.globalAlpha = 0.6 * alpha;
                    ctx.fill();
                    ctx.globalAlpha = 1;

                    drawHuman(ctx, screenX, screenY, scale, agent.color, alpha, agent.walkCycle);
                }
            });

            animFrameRef.current = requestAnimationFrame(animate);
        }

        window.addEventListener("resize", resize);
        resize();
        animate();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animFrameRef.current);
        };
    }, []);

    return <canvas ref={canvasRef} id="simulation-canvas" />;
}
