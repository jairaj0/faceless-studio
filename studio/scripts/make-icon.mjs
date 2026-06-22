// Generates the Faceless Studio app icon — no external deps, raw RGBA encoded to
// PNG via Node's zlib, 2× supersampled for clean edges. Renders into a rounded
// "squircle" with the app's violet→teal gradient.
//
// Usage:
//   node scripts/make-icon.mjs            → writes build/icon.png (default variant)
//   node scripts/make-icon.mjs A out.png  → writes a specific variant to a path
//   node scripts/make-icon.mjs --previews → writes build/preview-{A,B,C}.png
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const S = 1024; // output size
const SS = 2; // supersample factor
const N = S * SS;

const DEFAULT_VARIANT = "B";

// ---- colour helpers -------------------------------------------------------
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// 3-stop diagonal gradient (violet → blue → teal).
const G0 = hex("#7B4CFF");
const G1 = hex("#2E8CF0");
const G2 = hex("#15C8A6");
function gradient(t) {
  return t < 0.5 ? mix(G0, G1, t / 0.5) : mix(G1, G2, (t - 0.5) / 0.5);
}

// Superellipse (squircle) membership in full-res coords (0..S).
const CENTER = S / 2;
const HALF = 466;
const POW = 4.2;
function inSquircle(x, y) {
  const dx = Math.abs(x - CENTER) / HALF;
  const dy = Math.abs(y - CENTER) / HALF;
  return Math.pow(dx, POW) + Math.pow(dy, POW) <= 1;
}

// Point-in-triangle (sharp edges; SS smooths them).
function inTri(px, py, t) {
  const sign = (ax, ay, bx, by, cx, cy) => (ax - cx) * (by - cy) - (bx - cx) * (ay - cy);
  const d1 = sign(px, py, t[0][0], t[0][1], t[1][0], t[1][1]);
  const d2 = sign(px, py, t[1][0], t[1][1], t[2][0], t[2][1]);
  const d3 = sign(px, py, t[2][0], t[2][1], t[0][0], t[0][1]);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}
const inDiamond = (px, py, cx, cy, r) => Math.abs(px - cx) + Math.abs(py - cy) <= r;

// ---- the white "mark" per variant ----------------------------------------
// Returns {a} white-ink alpha at a point, or 0.
const PLAY = [
  [430, 330],
  [430, 694],
  [735, 522],
];

function markAlpha(variant, x, y) {
  if (variant === "A") {
    // Classic bold play triangle.
    return inTri(x, y, PLAY) ? 1 : 0;
  }
  if (variant === "B") {
    // Play triangle above a keyframe track (3 diamonds + connector) — ties to
    // the app's ◆ keyframe identity: "animation playback".
    const play = [
      [430, 300],
      [430, 628],
      [712, 464],
    ];
    if (inTri(x, y, play)) return 1;
    const ty = 760;
    if (y > ty - 4 && y < ty + 4 && x > 372 && x < 652) return 0.6; // connector
    const ds = [
      [382, ty, 34],
      [512, ty, 40],
      [642, ty, 34],
    ];
    for (const [cx, cy, r] of ds) if (inDiamond(x, y, cx, cy, r)) return 0.95;
    return 0;
  }
  // Variant C — aperture ring + centred play (camera/lens = "studio").
  const dx = x - CENTER;
  const dy = y - CENTER;
  const dist = Math.hypot(dx, dy);
  const ring = 322;
  if (dist > ring - 30 && dist < ring + 30) return 0.95;
  const play = [
    [445, 372],
    [445, 652],
    [690, 512],
  ];
  if (inTri(x, y, play)) return 1;
  return 0;
}

// ---- render ---------------------------------------------------------------
function render(variant) {
  const out = Buffer.alloc(S * S * 4);
  for (let oy = 0; oy < S; oy++) {
    for (let ox = 0; ox < S; ox++) {
      let aR = 0, aG = 0, aB = 0, aA = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = ox + (sx + 0.5) / SS;
          const y = oy + (sy + 0.5) / SS;
          if (!inSquircle(x, y)) continue;
          let [r, g, b] = gradient((x + y) / (2 * S));
          // soft top-left sheen for depth
          const hl = clamp01(1 - Math.hypot(x - 330, y - 290) / 760) * 0.14;
          r = r + (255 - r) * hl;
          g = g + (255 - g) * hl;
          b = b + (255 - b) * hl;
          // white ink
          const ink = markAlpha(variant, x, y);
          if (ink > 0) {
            r = r + (255 - r) * ink;
            g = g + (255 - g) * ink;
            b = b + (255 - b) * ink;
          }
          aR += r; aG += g; aB += b; aA += 1;
        }
      }
      const i = (oy * S + ox) * 4;
      const samples = SS * SS;
      if (aA > 0) {
        out[i] = Math.round(aR / aA);
        out[i + 1] = Math.round(aG / aA);
        out[i + 2] = Math.round(aB / aA);
        out[i + 3] = Math.round((aA / samples) * 255);
      }
    }
  }
  return out;
}

// ---- PNG encode -----------------------------------------------------------
function crc32(b) {
  let c = ~0;
  for (let i = 0; i < b.length; i++) {
    c ^= b[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td) >>> 0);
  return Buffer.concat([len, td, crc]);
}
function toPng(rgba) {
  const raw = Buffer.alloc(S * (S * 4 + 1));
  for (let y = 0; y < S; y++) {
    raw[y * (S * 4 + 1)] = 0;
    rgba.copy(raw, y * (S * 4 + 1) + 1, y * S * 4, (y + 1) * S * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(S, 0);
  ihdr.writeUInt32BE(S, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
void N;

function write(variant, path) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, toPng(render(variant)));
  console.log("Wrote", path, `(variant ${variant})`);
}

const arg = process.argv[2];
if (arg === "--previews") {
  for (const v of ["A", "B", "C"]) write(v, join(ROOT, "build", `preview-${v}.png`));
} else if (arg && process.argv[3]) {
  write(arg, join(ROOT, process.argv[3]));
} else {
  write(arg || DEFAULT_VARIANT, join(ROOT, "build", "icon.png"));
}
