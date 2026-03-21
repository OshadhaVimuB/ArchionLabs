/**
 * Architectural Drawing Symbols – ISO 128 / ISO 7519 compliant
 * 
 * Each function draws a standard architectural symbol onto a Canvas 2D context.
 * All coordinates are in meters (matching the floor plan coordinate system).
 * The canvas transform (zoom/pan) is applied externally before calling these.
 */

const BG_COLOR = '#0a0a0a';

// ── Wall ──────────────────────────────────────────────────────────────────

export function drawWall(
    ctx: CanvasRenderingContext2D,
    x1: number, y1: number,
    x2: number, y2: number,
    thickness: number,
    isExterior: boolean,
    color: string,
) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Exterior walls get a second thinner outline
    if (isExterior) {
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness + 0.04;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
    ctx.restore();
}

// ── Door (ISO 7519 - quarter-circle arc showing swing) ───────────────────

export function drawDoor(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    width: number,
    rotation: number, // radians
    color: string,
    selected: boolean,
) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    const w = width || 0.8;

    // Door opening gap (break in wall) – use canvas background color
    ctx.strokeStyle = selected ? '#f8fafc' : BG_COLOR;
    ctx.lineWidth = 0.22;
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(w / 2, 0);
    ctx.stroke();

    // Door leaf (straight line from hinge) – thicker for visibility
    ctx.strokeStyle = selected ? '#e2e8f0' : color;
    ctx.lineWidth = 0.06;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(-w / 2, w);
    ctx.stroke();

    // Arc showing swing direction (ISO standard) – thicker dashed line
    ctx.strokeStyle = selected ? '#e2e8f0' : color;
    ctx.lineWidth = 0.035;
    ctx.setLineDash([0.06, 0.06]);
    ctx.beginPath();
    ctx.arc(-w / 2, 0, w, Math.PI / 2, 0, true);
    ctx.stroke();
    ctx.setLineDash([]);

    // Hinge dot
    ctx.fillStyle = selected ? '#e2e8f0' : color;
    ctx.beginPath();
    ctx.arc(-w / 2, 0, 0.06, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// ── Sliding Door ─────────────────────────────────────────────────────────

export function drawSlidingDoor(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    width: number,
    rotation: number,
    color: string,
    selected: boolean,
) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    const w = width || 1.2;

    // Opening gap
    ctx.strokeStyle = selected ? '#f8fafc' : BG_COLOR;
    ctx.lineWidth = 0.22;
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(w / 2, 0);
    ctx.stroke();

    // Sliding panels (two dashed lines) – thicker
    ctx.strokeStyle = selected ? '#e2e8f0' : color;
    ctx.lineWidth = 0.06;
    ctx.setLineDash([0.08, 0.04]);
    ctx.beginPath();
    ctx.moveTo(-w / 2, -0.08);
    ctx.lineTo(0, -0.08);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0.08);
    ctx.lineTo(w / 2, 0.08);
    ctx.stroke();
    ctx.setLineDash([]);

    // Arrow
    ctx.fillStyle = selected ? '#e2e8f0' : color;
    ctx.beginPath();
    ctx.moveTo(w / 4, 0);
    ctx.lineTo(w / 4 - 0.1, -0.08);
    ctx.lineTo(w / 4 - 0.1, 0.08);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

// ── Window (ISO 7519 - break in wall with two parallel lines) ────────────

export function drawWindow(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    width: number,
    rotation: number,
    color: string,
    selected: boolean,
) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    const w = width || 1.0;
    const glassGap = 0.08;

    // Wall break (background erase)
    ctx.strokeStyle = selected ? '#f8fafc' : BG_COLOR;
    ctx.lineWidth = 0.24;
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(w / 2, 0);
    ctx.stroke();

    // Two parallel glass pane lines – thicker and brighter
    ctx.strokeStyle = selected ? '#e2e8f0' : color;
    ctx.lineWidth = 0.04;
    ctx.beginPath();
    ctx.moveTo(-w / 2, -glassGap);
    ctx.lineTo(w / 2, -glassGap);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-w / 2, glassGap);
    ctx.lineTo(w / 2, glassGap);
    ctx.stroke();

    // End caps – thicker
    ctx.lineWidth = 0.04;
    ctx.beginPath();
    ctx.moveTo(-w / 2, -glassGap);
    ctx.lineTo(-w / 2, glassGap);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w / 2, -glassGap);
    ctx.lineTo(w / 2, glassGap);
    ctx.stroke();

    // Glass fill for extra visibility
    ctx.fillStyle = selected ? 'rgba(248, 250, 252, 0.15)' : 'rgba(56, 189, 248, 0.12)';
    ctx.fillRect(-w / 2, -glassGap, w, glassGap * 2);

    ctx.restore();
}

// ── Staircase (ISO 128 - parallel treads with UP arrow) ──────────────────

export function drawStaircase(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    width: number,
    length: number,
    rotation: number,
    numTreads: number,
    direction: 'up' | 'down',
    color: string,
    selected: boolean,
) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);

    const w = width || 1.0;
    const l = length || 3.0;
    const treads = numTreads || 12;
    const treadDepth = l / treads;

    // Fill background for visibility
    ctx.fillStyle = selected ? 'rgba(255, 255, 255, 0.1)' : 'rgba(245, 158, 11, 0.08)';
    ctx.fillRect(-w / 2, 0, w, l);

    // Outline – thicker
    ctx.strokeStyle = selected ? '#f8fafc' : color;
    ctx.lineWidth = 0.06;
    ctx.strokeRect(-w / 2, 0, w, l);

    // Tread lines – thicker
    ctx.lineWidth = 0.03;
    for (let i = 1; i < treads; i++) {
        const ty = i * treadDepth;
        ctx.beginPath();
        ctx.moveTo(-w / 2, ty);
        ctx.lineTo(w / 2, ty);
        ctx.stroke();
    }

    // Break line (diagonal at 60%)
    const breakY = l * 0.6;
    ctx.strokeStyle = selected ? '#f8fafc' : color;
    ctx.lineWidth = 0.04;
    ctx.beginPath();
    ctx.moveTo(-w / 2 - 0.1, breakY - 0.15);
    ctx.lineTo(w / 2 + 0.1, breakY + 0.15);
    ctx.stroke();

    // Direction arrow
    const arrowY = direction === 'up' ? l * 0.3 : l * 0.7;
    const arrowDir = direction === 'up' ? -1 : 1;
    ctx.strokeStyle = selected ? '#f8fafc' : color;
    ctx.lineWidth = 0.04;
    ctx.beginPath();
    ctx.moveTo(0, arrowY);
    ctx.lineTo(0, arrowY + arrowDir * l * 0.25);
    ctx.stroke();

    // Arrow head
    ctx.fillStyle = selected ? '#f8fafc' : color;
    const tipY = arrowY + arrowDir * l * 0.25;
    ctx.beginPath();
    ctx.moveTo(0, tipY + arrowDir * 0.15);
    ctx.lineTo(-0.1, tipY);
    ctx.lineTo(0.1, tipY);
    ctx.closePath();
    ctx.fill();

    // "UP" / "DN" label
    ctx.fillStyle = selected ? '#f8fafc' : color;
    ctx.font = `bold ${Math.min(w * 0.25, 0.25)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(direction === 'up' ? 'UP' : 'DN', 0, arrowY - arrowDir * 0.2);

    ctx.restore();
}

// ── Dimension Line ───────────────────────────────────────────────────────

export function drawDimensionLine(
    ctx: CanvasRenderingContext2D,
    x1: number, y1: number,
    x2: number, y2: number,
    offset: number,
    color: string,
) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // Perpendicular direction
    const nx = -Math.sin(angle) * offset;
    const ny = Math.cos(angle) * offset;

    const ax1 = x1 + nx, ay1 = y1 + ny;
    const ax2 = x2 + nx, ay2 = y2 + ny;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.02;
    ctx.fillStyle = color;

    // Extension lines
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(ax1, ay1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(ax2, ay2);
    ctx.stroke();

    // Dimension line
    ctx.beginPath();
    ctx.moveTo(ax1, ay1);
    ctx.lineTo(ax2, ay2);
    ctx.stroke();

    // Terminators (small perpendicular ticks)
    const tickLen = 0.1;
    const tx = Math.cos(angle) * tickLen;
    const ty = Math.sin(angle) * tickLen;
    // Left tick
    ctx.lineWidth = 0.025;
    ctx.beginPath();
    ctx.moveTo(ax1 - ty, ay1 + tx);
    ctx.lineTo(ax1 + ty, ay1 - tx);
    ctx.stroke();
    // Right tick
    ctx.beginPath();
    ctx.moveTo(ax2 - ty, ay2 + tx);
    ctx.lineTo(ax2 + ty, ay2 - tx);
    ctx.stroke();

    // Measurement text
    const mx = (ax1 + ax2) / 2;
    const my = (ay1 + ay2) / 2;
    const text = `${length.toFixed(2)}m`;

    ctx.save();
    ctx.translate(mx, my);
    let textAngle = angle;
    if (textAngle > Math.PI / 2 || textAngle < -Math.PI / 2) {
        textAngle += Math.PI;
    }
    ctx.rotate(textAngle);
    ctx.font = 'bold 0.18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(text, 0, -0.05);
    ctx.restore();

    ctx.restore();
}

// ── Room Fill ────────────────────────────────────────────────────────────

export function drawRoomFill(
    ctx: CanvasRenderingContext2D,
    minX: number, minY: number,
    w: number, h: number,
    fillColor: string,
    strokeColor: string,
    selected: boolean,
) {
    ctx.save();

    // Fill
    ctx.fillStyle = fillColor;
    ctx.fillRect(minX, minY, w, h);

    // Border
    ctx.strokeStyle = selected ? '#f8fafc' : strokeColor;
    ctx.lineWidth = selected ? 0.06 : 0.03;
    ctx.strokeRect(minX, minY, w, h);

    ctx.restore();
}

// ── Room Label ───────────────────────────────────────────────────────────

export function drawRoomLabel(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number,
    name: string,
    area: number,
    color: string,
    roomSize: number,
) {
    ctx.save();

    const fontSize = Math.max(roomSize * 0.1, 0.2);
    const areaFontSize = fontSize * 0.7;

    // Room name
    ctx.fillStyle = color;
    ctx.font = `600 ${fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, cx, cy - fontSize * 0.5);

    // Area
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.7;
    ctx.font = `400 ${areaFontSize}px "JetBrains Mono", monospace`;
    ctx.fillText(`${area.toFixed(1)} m²`, cx, cy + fontSize * 0.5);

    ctx.restore();
}

// ── Selection highlight ──────────────────────────────────────────────────

export function drawSelectionRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    w: number, h: number,
) {
    ctx.save();
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 0.04;
    ctx.setLineDash([0.1, 0.06]);
    ctx.strokeRect(x - 0.05, y - 0.05, w + 0.1, h + 0.1);
    ctx.setLineDash([]);

    // Corner handles
    const handleSize = 0.08;
    ctx.fillStyle = '#f8fafc';
    const corners = [
        [x, y], [x + w, y], [x, y + h], [x + w, y + h],
    ];
    for (const [cx, cy] of corners) {
        ctx.fillRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
    }
    ctx.restore();
}

// ── Text ─────────────────────────────────────────────────────────────────

export function drawText(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    text: string,
    fontSize: number,
    color: string,
    rotation: number,
    selected: boolean,
) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);

    ctx.fillStyle = color;
    ctx.font = `600 ${fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 0);

    if (selected) {
        const metrics = ctx.measureText(text);
        const w = metrics.width;
        const h = fontSize;
        const pad = fontSize * 0.2;

        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 0.04;
        ctx.setLineDash([0.1, 0.06]);
        ctx.strokeRect(-w / 2 - pad, -h / 2 - pad, w + pad * 2, h + pad * 2);
    }

    ctx.restore();
}

// ── Grid ─────────────────────────────────────────────────────────────────

export function drawGrid(
    ctx: CanvasRenderingContext2D,
    viewMinX: number, viewMinY: number,
    viewMaxX: number, viewMaxY: number,
    zoom: number,
) {
    ctx.save();

    // Determine grid spacing based on zoom level
    let majorSpacing = 1; // 1 meter
    if (zoom < 15) majorSpacing = 5;
    if (zoom < 5) majorSpacing = 10;
    if (zoom > 80) majorSpacing = 0.5;

    const minorSpacing = majorSpacing / 5;

    // Minor grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 0.01;
    const startMinX = Math.floor(viewMinX / minorSpacing) * minorSpacing;
    const startMinY = Math.floor(viewMinY / minorSpacing) * minorSpacing;

    ctx.beginPath();
    for (let x = startMinX; x <= viewMaxX; x += minorSpacing) {
        ctx.moveTo(x, viewMinY);
        ctx.lineTo(x, viewMaxY);
    }
    for (let y = startMinY; y <= viewMaxY; y += minorSpacing) {
        ctx.moveTo(viewMinX, y);
        ctx.lineTo(viewMaxX, y);
    }
    ctx.stroke();

    // Major grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 0.02;
    const startMajX = Math.floor(viewMinX / majorSpacing) * majorSpacing;
    const startMajY = Math.floor(viewMinY / majorSpacing) * majorSpacing;

    ctx.beginPath();
    for (let x = startMajX; x <= viewMaxX; x += majorSpacing) {
        ctx.moveTo(x, viewMinY);
        ctx.lineTo(x, viewMaxY);
    }
    for (let y = startMajY; y <= viewMaxY; y += majorSpacing) {
        ctx.moveTo(viewMinX, y);
        ctx.lineTo(viewMaxX, y);
    }
    ctx.stroke();

    // Origin cross
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 0.03;
    ctx.beginPath();
    ctx.moveTo(0, viewMinY);
    ctx.lineTo(0, viewMaxY);
    ctx.moveTo(viewMinX, 0);
    ctx.lineTo(viewMaxX, 0);
    ctx.stroke();

    ctx.restore();
}

// ── Furniture: Table (top-down) ──────────────────────────────────────────

export function drawTable(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    width: number, depth: number,
    rotation: number,
    selected: boolean,
) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);

    const w = width;
    const d = depth;
    const legR = Math.min(w, d) * 0.06;

    // Table top
    ctx.fillStyle = selected ? 'rgba(251, 191, 36, 0.25)' : 'rgba(251, 191, 36, 0.12)';
    ctx.fillRect(-w / 2, -d / 2, w, d);
    ctx.strokeStyle = selected ? '#fbbf24' : '#b45309';
    ctx.lineWidth = 0.04;
    ctx.strokeRect(-w / 2, -d / 2, w, d);

    // Legs (circles at corners)
    ctx.fillStyle = selected ? '#fbbf24' : '#92400e';
    const inset = legR + 0.04;
    const corners = [
        [-w / 2 + inset, -d / 2 + inset],
        [w / 2 - inset, -d / 2 + inset],
        [-w / 2 + inset, d / 2 - inset],
        [w / 2 - inset, d / 2 - inset],
    ];
    for (const [cx, cy] of corners) {
        ctx.beginPath();
        ctx.arc(cx, cy, legR, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

// ── Furniture: Chair (top-down) ──────────────────────────────────────────

export function drawChair(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    width: number, depth: number,
    rotation: number,
    selected: boolean,
) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);

    const w = width;
    const d = depth;

    // Seat
    ctx.fillStyle = selected ? 'rgba(251, 146, 60, 0.25)' : 'rgba(251, 146, 60, 0.12)';
    ctx.fillRect(-w / 2, -d / 2, w, d);
    ctx.strokeStyle = selected ? '#fb923c' : '#c2410c';
    ctx.lineWidth = 0.03;
    ctx.strokeRect(-w / 2, -d / 2, w, d);

    // Backrest (thick line at top)
    ctx.strokeStyle = selected ? '#fb923c' : '#9a3412';
    ctx.lineWidth = 0.08;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 0.02, -d / 2);
    ctx.lineTo(w / 2 - 0.02, -d / 2);
    ctx.stroke();

    // Legs
    ctx.fillStyle = selected ? '#fb923c' : '#7c2d12';
    const legR = 0.03;
    const inset = 0.06;
    const legs = [
        [-w / 2 + inset, -d / 2 + inset],
        [w / 2 - inset, -d / 2 + inset],
        [-w / 2 + inset, d / 2 - inset],
        [w / 2 - inset, d / 2 - inset],
    ];
    for (const [cx, cy] of legs) {
        ctx.beginPath();
        ctx.arc(cx, cy, legR, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

// ── Furniture: Bed (top-down) ────────────────────────────────────────────

export function drawBed(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    width: number, depth: number,
    rotation: number,
    selected: boolean,
) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);

    const w = width;
    const d = depth;

    // Mattress
    ctx.fillStyle = selected ? 'rgba(167, 139, 250, 0.25)' : 'rgba(167, 139, 250, 0.12)';
    const r = 0.06;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -d / 2, w, d, r);
    ctx.fill();
    ctx.strokeStyle = selected ? '#a78bfa' : '#6d28d9';
    ctx.lineWidth = 0.04;
    ctx.stroke();

    // Pillow area (rectangle at top)
    const pillowH = d * 0.18;
    ctx.fillStyle = selected ? 'rgba(196, 181, 253, 0.4)' : 'rgba(139, 92, 246, 0.2)';
    ctx.beginPath();
    ctx.roundRect(-w / 2 + 0.06, -d / 2 + 0.06, w - 0.12, pillowH, r);
    ctx.fill();
    ctx.strokeStyle = selected ? '#c4b5fd' : '#7c3aed';
    ctx.lineWidth = 0.025;
    ctx.stroke();

    // Blanket fold line
    ctx.strokeStyle = selected ? '#a78bfa' : '#7c3aed';
    ctx.lineWidth = 0.02;
    ctx.setLineDash([0.06, 0.04]);
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 0.08, -d / 2 + pillowH + 0.15);
    ctx.lineTo(w / 2 - 0.08, -d / 2 + pillowH + 0.15);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
}

// ── Furniture: Cupboard (top-down) ───────────────────────────────────────

export function drawCupboard(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    width: number, depth: number,
    rotation: number,
    selected: boolean,
) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);

    const w = width;
    const d = depth;

    // Body
    ctx.fillStyle = selected ? 'rgba(52, 211, 153, 0.25)' : 'rgba(52, 211, 153, 0.12)';
    ctx.fillRect(-w / 2, -d / 2, w, d);
    ctx.strokeStyle = selected ? '#34d399' : '#047857';
    ctx.lineWidth = 0.04;
    ctx.strokeRect(-w / 2, -d / 2, w, d);

    // Center divider
    ctx.strokeStyle = selected ? '#34d399' : '#065f46';
    ctx.lineWidth = 0.02;
    ctx.beginPath();
    ctx.moveTo(0, -d / 2 + 0.04);
    ctx.lineTo(0, d / 2 - 0.04);
    ctx.stroke();

    // Handles (small circles)
    ctx.fillStyle = selected ? '#34d399' : '#059669';
    ctx.beginPath();
    ctx.arc(-0.08, 0, 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0.08, 0, 0.04, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

