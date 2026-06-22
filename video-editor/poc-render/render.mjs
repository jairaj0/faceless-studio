// POC: web animation (real Chrome) -> frames -> ffmpeg -> MP4 at 1080p / 4K / 8K.
// Proves: ONE resolution-independent webpage renders sharp at ANY resolution,
// and a normal machine can export 4K/8K offline (just takes longer).
import { spawn } from "node:child_process";
import { mkdir, rm, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SCENE = `file://${path.join(__dirname, "scene.html")}`;

const JOBS = [
  { label: "1080p", scale: 1, fps: 30, durationMs: 4000 },
  { label: "4K", scale: 2, fps: 30, durationMs: 4000 },
  { label: "8K", scale: 4, fps: 24, durationMs: 2000 },
];

const pad = (n) => String(n).padStart(5, "0");
const ms = (n) => `${(n / 1000).toFixed(1)}s`;

function ffmpeg(args) {
  return new Promise((resolve, reject) => {
    const p = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "ignore"] });
    p.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error("ffmpeg exit " + code)),
    );
    p.on("error", reject);
  });
}

async function fileSizeMB(f) {
  const { stat } = await import("node:fs/promises");
  const s = await stat(f);
  return (s.size / (1024 * 1024)).toFixed(1);
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"],
  });
  const page = await browser.newPage();
  await page.goto(SCENE, { waitUntil: "load" });
  await page.waitForFunction("window.__ready === true");
  const duration = await page.evaluate("window.DURATION");

  const results = [];

  for (const job of JOBS) {
    const W = 1920 * job.scale;
    const H = 1080 * job.scale;
    const framesDir = path.join(__dirname, `frames_${job.label}`);
    await rm(framesDir, { recursive: true, force: true });
    await mkdir(framesDir, { recursive: true });

    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: job.scale,
    });

    const total = Math.round((job.durationMs / 1000) * job.fps);
    const dMs = Math.min(job.durationMs, duration);

    const tStart = Date.now();
    for (let i = 0; i < total; i++) {
      const t = (i / job.fps) * 1000 * (dMs / job.durationMs);
      await page.evaluate((tt) => window.seek(tt), t);
      await page.screenshot({
        path: path.join(framesDir, `frame-${pad(i + 1)}.png`),
      });
    }
    const captureMs = Date.now() - tStart;

    const out = path.join(__dirname, `out_${job.label}.mp4`);
    const eStart = Date.now();
    await ffmpeg([
      "-y",
      "-framerate",
      String(job.fps),
      "-i",
      path.join(framesDir, "frame-%05d.png"),
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-crf",
      "18",
      "-movflags",
      "+faststart",
      out,
    ]);
    const encodeMs = Date.now() - eStart;
    const sizeMB = await fileSizeMB(out);

    const r = {
      label: job.label,
      res: `${W}x${H}`,
      frames: total,
      fps: job.fps,
      capture: captureMs,
      encode: encodeMs,
      total: captureMs + encodeMs,
      perFrame: Math.round(captureMs / total),
      sizeMB,
      out: path.basename(out),
    };
    results.push(r);
    console.log(
      `[${r.label}] ${r.res} | ${r.frames}f @${r.fps} | capture ${ms(r.capture)} (${r.perFrame}ms/frame) | encode ${ms(r.encode)} | ${r.sizeMB}MB | ${r.out}`,
    );
    // cleanup frames to save disk
    const files = await readdir(framesDir);
    if (files.length) await rm(framesDir, { recursive: true, force: true });
  }

  await browser.close();

  console.log("\n===== SUMMARY =====");
  console.log("res        frames  capture    encode    total     size");
  for (const r of results) {
    console.log(
      `${r.label.padEnd(6)} ${r.res.padEnd(10)} ${String(r.frames).padEnd(6)} ${ms(r.capture).padEnd(9)} ${ms(r.encode).padEnd(9)} ${ms(r.total).padEnd(9)} ${r.sizeMB}MB`,
    );
  }
}

run().catch((e) => {
  console.error("POC failed:", e);
  process.exit(1);
});
