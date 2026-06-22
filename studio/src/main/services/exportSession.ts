import { app, dialog, shell, BrowserWindow } from "electron";
import { join } from "path";
import { tmpdir } from "os";
import { mkdtemp, writeFile, rm } from "fs/promises";
import { spawn } from "child_process";
import { FFMPEG } from "./ffmpeg";
import type { ExportEncodeRequest, ExportProgress, ExportResult } from "../../shared/export";

// One export at a time. The renderer drives it: begin → frame×N → encode.
let framesDir: string | null = null;

export async function beginExport(): Promise<{ dir: string }> {
  await cancelExport(); // drop any stale session
  framesDir = await mkdtemp(join(tmpdir(), "fs-export-"));
  return { dir: framesDir };
}

export async function writeFrame(index: number, dataUrl: string): Promise<boolean> {
  if (!framesDir) throw new Error("No export session — call export:begin first");
  const b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const name = `frame-${String(index + 1).padStart(5, "0")}.png`;
  await writeFile(join(framesDir, name), Buffer.from(b64, "base64"));
  return true;
}

export async function cancelExport(): Promise<boolean> {
  if (framesDir) {
    await rm(framesDir, { recursive: true, force: true });
    framesDir = null;
  }
  return true;
}

function encode(
  dir: string,
  req: ExportEncodeRequest,
  outPath: string,
  onProgress: (p: ExportProgress) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = ["-y", "-framerate", String(req.fps), "-i", join(dir, "frame-%05d.png")];
    if (req.audioPath) args.push("-i", req.audioPath);
    args.push("-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium");
    if (req.audioPath) {
      // volume + fades, matching the Web Audio preview
      const af: string[] = [];
      if (req.audioVolume != null && req.audioVolume !== 1) af.push(`volume=${req.audioVolume}`);
      if (req.audioFadeIn) af.push(`afade=t=in:st=0:d=${req.audioFadeIn}`);
      if (req.audioFadeOut) {
        const vidDur = req.total / req.fps;
        af.push(`afade=t=out:st=${Math.max(0, vidDur - req.audioFadeOut).toFixed(3)}:d=${req.audioFadeOut}`);
      }
      if (af.length) args.push("-af", af.join(","));
      args.push("-c:a", "aac", "-b:a", "192k", "-shortest");
    }
    args.push("-movflags", "+faststart", outPath);

    const ff = spawn(FFMPEG, args);
    ff.stderr.on("data", (d) => {
      const m = /frame=\s*(\d+)/.exec(d.toString());
      if (m) {
        const f = Number(m[1]);
        onProgress({ phase: "encoding", pct: 90 + Math.min(10, (f / req.total) * 10) });
      }
    });
    ff.on("error", reject);
    ff.on("close", (code) => (code === 0 ? resolve() : reject(new Error("ffmpeg exited " + code))));
  });
}

export async function encodeExport(
  parent: BrowserWindow | null,
  req: ExportEncodeRequest,
  onProgress: (p: ExportProgress) => void,
): Promise<ExportResult> {
  if (!framesDir) return { error: "No export session" };
  const dir = framesDir;

  const opts = {
    title: "Export Video",
    defaultPath: join(app.getPath("downloads"), `faceless-${req.width}x${req.height}.mp4`),
    filters: [{ name: "MP4 Video", extensions: ["mp4"] }],
  };
  const save = parent
    ? await dialog.showSaveDialog(parent, opts)
    : await dialog.showSaveDialog(opts);
  if (save.canceled || !save.filePath) {
    await cancelExport();
    return { canceled: true };
  }

  try {
    await encode(dir, req, save.filePath, onProgress);
    onProgress({ phase: "done", pct: 100 });
    shell.showItemInFolder(save.filePath);
    return { ok: true, filePath: save.filePath };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  } finally {
    await cancelExport();
  }
}
