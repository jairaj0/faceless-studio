import { spawn } from "child_process";
import ffmpegStatic from "ffmpeg-static";

// Bundled ffmpeg binary (works in a packaged app too — in an asar build the
// binary lives in app.asar.unpacked). Falls back to a system ffmpeg on PATH.
export const FFMPEG = (ffmpegStatic ?? "ffmpeg").replace("app.asar", "app.asar.unpacked");

export function ffmpegVersion(): Promise<string> {
  return new Promise((resolve) => {
    const proc = spawn(FFMPEG, ["-version"]);
    let out = "";
    proc.stdout.on("data", (d) => (out += d.toString()));
    proc.on("error", () => resolve("ffmpeg NOT found"));
    proc.on("close", () => resolve(out.split("\n")[0]?.trim() || "unknown"));
  });
}
