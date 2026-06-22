import type { Clip, Composition } from "../../store/editor";

// Procedural animated backgrounds, drawn straight onto the 2D canvas. Every
// generator is a pure function of clip-local time, so the preview and the
// frame-by-frame ffmpeg export render identically at any resolution.

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(v || "000000", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgba([r, g, b]: [number, number, number], a: number): string {
  return `rgba(${r},${g},${b},${a})`;
}

// Deterministic pseudo-random in [0,1) from an integer seed (no global state →
// identical every frame).
function rnd(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

interface Cols {
  a: [number, number, number];
  b: [number, number, number];
  c: [number, number, number];
}

/** Draw a background clip's generator at clip-local time `localT` (ms). */
export function drawBackground(
  ctx: CanvasRenderingContext2D,
  comp: Composition,
  clip: Clip,
  localT: number,
): void {
  const spec = clip.bg;
  if (!spec) return;
  const { width: W, height: H } = comp;
  const t = (localT / 1000) * (spec.speed || 1); // seconds, speed-scaled
  const cols: Cols = { a: hexToRgb(spec.colorA), b: hexToRgb(spec.colorB), c: hexToRgb(spec.colorC) };

  ctx.save();
  switch (spec.preset) {
    case "aurora": aurora(ctx, W, H, t, cols); break;
    case "mesh": mesh(ctx, W, H, t, cols); break;
    case "linear": linear(ctx, W, H, t, cols); break;
    case "radial": radial(ctx, W, H, t, cols); break;
    case "beams": beams(ctx, W, H, t, cols); break;
    case "grid": grid(ctx, W, H, t, cols); break;
    case "dots": dots(ctx, W, H, t, cols); break;
    case "particles": particles(ctx, W, H, t, cols); break;
    case "starfield": starfield(ctx, W, H, t, cols); break;
    case "waves": waves(ctx, W, H, t, cols); break;
    default: solid(ctx, W, H, cols);
  }
  ctx.restore();
}

function fillBase(ctx: CanvasRenderingContext2D, W: number, H: number, c: [number, number, number]): void {
  ctx.fillStyle = rgba(c, 1);
  ctx.fillRect(0, 0, W, H);
}

function solid(ctx: CanvasRenderingContext2D, W: number, H: number, cols: Cols): void {
  fillBase(ctx, W, H, cols.c);
}

function aurora(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, cols: Cols): void {
  fillBase(ctx, W, H, cols.c);
  const blobs: [number, number, [number, number, number]][] = [
    [0.3 + 0.12 * Math.sin(t * 0.6), 0.3 + 0.1 * Math.cos(t * 0.5), cols.a],
    [0.7 + 0.12 * Math.cos(t * 0.4), 0.7 + 0.1 * Math.sin(t * 0.7), cols.b],
    [0.5 + 0.18 * Math.sin(t * 0.3 + 1), 0.5 + 0.14 * Math.cos(t * 0.45 + 2), cols.a],
  ];
  ctx.globalCompositeOperation = "lighter";
  for (const [fx, fy, col] of blobs) {
    const r = Math.max(W, H) * 0.55;
    const g = ctx.createRadialGradient(fx * W, fy * H, 0, fx * W, fy * H, r);
    g.addColorStop(0, rgba(col, 0.55));
    g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
}

function mesh(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, cols: Cols): void {
  const a = 0.5 + 0.5 * Math.sin(t * 0.5);
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, rgba(cols.a, 1));
  g.addColorStop(Math.min(0.9, 0.4 + 0.2 * a), rgba(cols.b, 1));
  g.addColorStop(1, rgba(cols.c, 1));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 3; i++) {
    const fx = 0.5 + 0.4 * Math.sin(t * 0.4 + i * 2.1);
    const fy = 0.5 + 0.4 * Math.cos(t * 0.35 + i * 1.7);
    const col = [cols.a, cols.b, cols.c][i];
    const r = Math.max(W, H) * 0.4;
    const rg = ctx.createRadialGradient(fx * W, fy * H, 0, fx * W, fy * H, r);
    rg.addColorStop(0, rgba(col, 0.35));
    rg.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
  }
}

function linear(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, cols: Cols): void {
  const ang = t * 0.3;
  const cx = W / 2;
  const cy = H / 2;
  const dx = Math.cos(ang) * W;
  const dy = Math.sin(ang) * H;
  const g = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
  g.addColorStop(0, rgba(cols.a, 1));
  g.addColorStop(1, rgba(cols.b, 1));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function radial(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, cols: Cols): void {
  fillBase(ctx, W, H, cols.c);
  const fx = 0.5 + 0.12 * Math.sin(t * 0.5);
  const fy = 0.4 + 0.08 * Math.cos(t * 0.6);
  const r = Math.max(W, H) * (0.55 + 0.05 * Math.sin(t));
  const g = ctx.createRadialGradient(fx * W, fy * H, 0, fx * W, fy * H, r);
  g.addColorStop(0, rgba(cols.a, 0.95));
  g.addColorStop(1, rgba(cols.c, 1));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function beams(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, cols: Cols): void {
  fillBase(ctx, W, H, cols.c);
  ctx.translate(W / 2, H / 2);
  ctx.rotate(t * 0.25);
  ctx.globalCompositeOperation = "lighter";
  const R = Math.hypot(W, H);
  const n = 10;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = a0 + Math.PI / n;
    const col = i % 2 === 0 ? cols.a : cols.b;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, R, a0, a1);
    ctx.closePath();
    ctx.fillStyle = rgba(col, 0.18);
    ctx.fill();
  }
}

function grid(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, cols: Cols): void {
  fillBase(ctx, W, H, cols.b);
  const step = H / 16;
  const off = (t * step * 0.4) % step;
  ctx.strokeStyle = rgba(cols.a, 0.5);
  ctx.lineWidth = Math.max(1, H / 1080);
  ctx.beginPath();
  for (let y = -step + off; y <= H; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  for (let x = 0; x <= W; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  ctx.stroke();
}

function dots(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, cols: Cols): void {
  fillBase(ctx, W, H, cols.b);
  const step = H / 22;
  const r = Math.max(1.5, H / 540);
  ctx.fillStyle = rgba(cols.a, 0.85);
  for (let yi = 0; yi * step <= H + step; yi++) {
    for (let xi = 0; xi * step <= W + step; xi++) {
      const wob = Math.sin(t * 1.5 + xi * 0.4 + yi * 0.3);
      const rr = r * (0.7 + 0.5 * (0.5 + 0.5 * wob));
      ctx.beginPath();
      ctx.arc(xi * step, yi * step, rr, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function particles(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, cols: Cols): void {
  fillBase(ctx, W, H, cols.b);
  const N = 70;
  const pts: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const sx = rnd(i);
    const sy = rnd(i + 99);
    const x = ((sx + t * 0.02 * (0.5 + rnd(i + 7))) % 1) * W;
    const y = ((sy + t * 0.015 * (0.5 + rnd(i + 13))) % 1) * H;
    pts.push([x, y]);
  }
  // connections
  ctx.strokeStyle = rgba(cols.a, 0.25);
  ctx.lineWidth = Math.max(1, H / 1080);
  const maxD = H * 0.16;
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
      if (d < maxD) {
        ctx.globalAlpha = 1 - d / maxD;
        ctx.beginPath();
        ctx.moveTo(pts[i][0], pts[i][1]);
        ctx.lineTo(pts[j][0], pts[j][1]);
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = rgba(cols.a, 0.9);
  const r = Math.max(1.5, H / 480);
  for (const [x, y] of pts) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function starfield(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, cols: Cols): void {
  fillBase(ctx, W, H, cols.c);
  const N = 160;
  ctx.fillStyle = rgba(cols.a, 1);
  for (let i = 0; i < N; i++) {
    const depth = 0.3 + rnd(i + 5) * 0.7;
    const x = rnd(i) * W;
    const y = ((rnd(i + 31) + t * 0.05 * depth) % 1) * H;
    const r = depth * (H / 720) * 1.4;
    ctx.globalAlpha = 0.4 + depth * 0.6;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function waves(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, cols: Cols): void {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, rgba(cols.c, 1));
  g.addColorStop(1, rgba(cols.a, 1));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "lighter";
  const layers = 3;
  for (let l = 0; l < layers; l++) {
    const col = l % 2 === 0 ? cols.a : cols.b;
    const amp = H * (0.05 + 0.03 * l);
    const baseY = H * (0.55 + 0.12 * l);
    const k = (Math.PI * 2) / W * (1 + l * 0.5);
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += Math.max(4, W / 240)) {
      const y = baseY + Math.sin(x * k + t * (1 + l * 0.4)) * amp;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fillStyle = rgba(col, 0.28);
    ctx.fill();
  }
}
