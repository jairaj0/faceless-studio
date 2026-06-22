// Generates build/icon.png (1024×1024) with no external deps — raw RGBA encoded
// to PNG via Node's zlib. A rounded dark-violet→teal gradient tile with a white
// play triangle: the Faceless Studio mark. electron-builder derives .icns/.ico.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const S = 1024;
const buf = Buffer.alloc(S * S * 4);

const lerp = (a, b, t) => a + (b - a) * t;
const A = [0x6c, 0x4c, 0xff]; // violet
const B = [0x16, 0xc4, 0xa8]; // teal
const radius = 180; // rounded-corner radius

// Signed distance to the rounded-square edge (for anti-aliased corners).
function cornerAlpha(x, y) {
  const dx = Math.max(radius - x, x - (S - radius), 0);
  const dy = Math.max(radius - y, y - (S - radius), 0);
  const d = Math.hypot(dx, dy) - radius;
  return Math.max(0, Math.min(1, 0.5 - d)); // ~1px feather
}

// Play triangle, centred, optically nudged right.
const tri = [
  [410, 320],
  [410, 704],
  [740, 512],
];
function inTriangle(px, py) {
  const sign = (ax, ay, bx, by, cx, cy) => (ax - cx) * (by - cy) - (bx - cx) * (ay - cy);
  const d1 = sign(px, py, tri[0][0], tri[0][1], tri[1][0], tri[1][1]);
  const d2 = sign(px, py, tri[1][0], tri[1][1], tri[2][0], tri[2][1]);
  const d3 = sign(px, py, tri[2][0], tri[2][1], tri[0][0], tri[0][1]);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

for (let y = 0; y < S; y++) {
  for (let x = 0; x < S; x++) {
    const i = (y * S + x) * 4;
    const t = (x + y) / (2 * S); // diagonal gradient
    let r = lerp(A[0], B[0], t);
    let g = lerp(A[1], B[1], t);
    let b = lerp(A[2], B[2], t);
    if (inTriangle(x, y)) {
      r = g = b = 255;
    }
    const a = Math.round(cornerAlpha(x, y) * 255);
    buf[i] = Math.round(r);
    buf[i + 1] = Math.round(g);
    buf[i + 2] = Math.round(b);
    buf[i + 3] = a;
  }
}

// Add the per-row PNG filter byte (0 = none).
const raw = Buffer.alloc(S * (S * 4 + 1));
for (let y = 0; y < S; y++) {
  raw[y * (S * 4 + 1)] = 0;
  buf.copy(raw, y * (S * 4 + 1) + 1, y * S * 4, (y + 1) * S * 4);
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td) >>> 0);
  return Buffer.concat([len, td, crc]);
}

function crc32(b) {
  let c = ~0;
  for (let i = 0; i < b.length; i++) {
    c ^= b[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c;
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(S, 0);
ihdr.writeUInt32BE(S, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // RGBA
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "build", "icon.png");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, png);
console.log("Wrote", out, png.length, "bytes");
