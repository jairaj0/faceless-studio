import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import { join } from "path";
import { tmpdir } from "os";
import { mkdtemp, writeFile, rm, readFile } from "fs/promises";
import { spawn } from "child_process";
import type {
  ExportRequest,
  ExportProgress,
  ExportResult,
} from "../shared/export";
import { startPreviewServer, stopPreviewServer } from "./previewServer";
import ffmpegStatic from "ffmpeg-static";

// Bundled ffmpeg binary (works in packaged app). In an asar build the binary
// lives in app.asar.unpacked. Falls back to a system ffmpeg on PATH.
const FFMPEG =
  (ffmpegStatic ?? "ffmpeg").replace("app.asar", "app.asar.unpacked");

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function getFfmpegVersion(): Promise<string> {
  return new Promise((resolve) => {
    const proc = spawn(FFMPEG, ["-version"]);
    let out = "";
    proc.stdout.on("data", (d) => (out += d.toString()));
    proc.on("error", () => resolve("ffmpeg NOT found on PATH"));
    proc.on("close", () => resolve(out.split("\n")[0]?.trim() || "unknown"));
  });
}

/** URL/file for the headless render page (dev server vs packaged). */
function loadRenderPage(win: BrowserWindow): Promise<void> {
  const devUrl = process.env["ELECTRON_RENDERER_URL"];
  if (devUrl) return win.loadURL(`${devUrl}/render.html`);
  return win.loadFile(join(__dirname, "../renderer/render.html"));
}

async function waitForRenderReady(win: BrowserWindow): Promise<void> {
  for (let i = 0; i < 200; i++) {
    try {
      const ready = await win.webContents.executeJavaScript("!!window.__ready");
      if (ready) return;
    } catch {
      /* page still loading */
    }
    await delay(50);
  }
  throw new Error("Render page failed to become ready");
}

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  aac: "audio/aac",
  ogg: "audio/ogg",
};

async function pickMedia(parent: BrowserWindow | null, kind: "image" | "audio") {
  const filters =
    kind === "image"
      ? [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "gif", "svg"] }]
      : [{ name: "Audio", extensions: ["mp3", "wav", "m4a", "aac", "ogg"] }];
  const opts = { properties: ["openFile" as const], filters };
  const res = parent
    ? await dialog.showOpenDialog(parent, opts)
    : await dialog.showOpenDialog(opts);
  if (res.canceled || !res.filePaths[0]) return null;
  const p = res.filePaths[0];
  const buf = await readFile(p);
  const ext = p.split(".").pop()?.toLowerCase() ?? "";
  const mime = MIME[ext] ?? (kind === "image" ? "image/png" : "audio/mpeg");
  return {
    dataUrl: `data:${mime};base64,${buf.toString("base64")}`,
    path: p,
    name: p.split("/").pop() ?? "file",
  };
}

function encodeWithFfmpeg(
  framesDir: string,
  fps: number,
  total: number,
  outPath: string,
  onProgress: (p: ExportProgress) => void,
  audioPath?: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      "-y",
      "-framerate",
      String(fps),
      "-i",
      join(framesDir, "frame-%05d.png"),
    ];
    if (audioPath) args.push("-i", audioPath);
    args.push(
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-crf",
      "18",
      "-preset",
      "medium",
    );
    if (audioPath) args.push("-c:a", "aac", "-b:a", "192k", "-shortest");
    args.push("-movflags", "+faststart", outPath);
    const ff = spawn(FFMPEG, args);
    ff.stderr.on("data", (d) => {
      const m = /frame=\s*(\d+)/.exec(d.toString());
      if (m) {
        const f = Number(m[1]);
        onProgress({
          phase: "encoding",
          pct: 90 + Math.min(10, (f / total) * 10),
        });
      }
    });
    ff.on("error", reject);
    ff.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error("ffmpeg exited " + code)),
    );
  });
}

async function runExport(
  parent: BrowserWindow | null,
  req: ExportRequest,
  onProgress: (p: ExportProgress) => void,
  outPath?: string,
): Promise<ExportResult> {
  const { scene, scale, fps } = req;
  const W = scene.width * scale;
  const H = scene.height * scale;

  let filePath: string;
  if (outPath) {
    filePath = outPath; // non-interactive (self-test)
  } else {
    const saveOpts = {
      title: "Export Video",
      defaultPath: join(app.getPath("downloads"), `faceless-${W}x${H}.mp4`),
      filters: [{ name: "MP4 Video", extensions: ["mp4"] }],
    };
    const save = parent
      ? await dialog.showSaveDialog(parent, saveOpts)
      : await dialog.showSaveDialog(saveOpts);
    if (save.canceled || !save.filePath) return { canceled: true };
    filePath = save.filePath;
  }

  const renderWin = new BrowserWindow({
    width: 960,
    height: 600,
    show: false,
    webPreferences: { offscreen: false },
  });

  let framesDir = "";
  try {
    await loadRenderPage(renderWin);
    await waitForRenderReady(renderWin);

    const wc = renderWin.webContents;
    const dbg = wc.debugger;
    try {
      dbg.attach("1.3");
    } catch {
      /* already attached */
    }
    await dbg.sendCommand("Page.enable");
    // Exact target pixels regardless of host display (mirrors the POC).
    await dbg.sendCommand("Emulation.setDeviceMetricsOverride", {
      width: scene.width,
      height: scene.height,
      deviceScaleFactor: scale,
      mobile: false,
    });

    await wc.executeJavaScript(`window.__loadScene(${JSON.stringify(scene)})`);

    framesDir = await mkdtemp(join(tmpdir(), "faceless-export-"));
    const total = Math.max(1, Math.round((scene.duration / 1000) * fps));

    for (let i = 0; i < total; i++) {
      const t = (i / fps) * 1000;
      await wc.executeJavaScript(`window.__seek(${t})`);
      const shot = (await dbg.sendCommand("Page.captureScreenshot", {
        format: "png",
      })) as { data: string };
      await writeFile(
        join(framesDir, `frame-${String(i + 1).padStart(5, "0")}.png`),
        Buffer.from(shot.data, "base64"),
      );
      onProgress({
        phase: "capture",
        pct: Math.round(((i + 1) / total) * 90),
        frame: i + 1,
        total,
      });
    }

    try {
      dbg.detach();
    } catch {
      /* ignore */
    }
    renderWin.destroy();

    await encodeWithFfmpeg(framesDir, fps, total, filePath, onProgress, req.audioPath);
    onProgress({ phase: "done", pct: 100 });

    if (!outPath) shell.showItemInFolder(filePath);
    return { ok: true, filePath, width: W, height: H };
  } catch (err) {
    if (!renderWin.isDestroyed()) renderWin.destroy();
    return { error: err instanceof Error ? err.message : String(err) };
  } finally {
    if (framesDir) await rm(framesDir, { recursive: true, force: true });
  }
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    backgroundColor: "#1e1e1e",
    title: "Faceless Studio",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  });

  win.on("ready-to-show", () => win.show());

  if (process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(async () => {
  ipcMain.handle("ffmpeg:version", () => getFfmpegVersion());

  ipcMain.handle("export:start", (event, req: ExportRequest) => {
    const parent = BrowserWindow.fromWebContents(event.sender);
    return runExport(parent, req, (p) => event.sender.send("export:progress", p));
  });

  ipcMain.handle("media:importImage", (event) =>
    pickMedia(BrowserWindow.fromWebContents(event.sender), "image"),
  );
  ipcMain.handle("media:importAudio", (event) =>
    pickMedia(BrowserWindow.fromWebContents(event.sender), "audio"),
  );

  ipcMain.handle("preview:start", (_event, scene) => startPreviewServer(scene));
  ipcMain.handle("preview:stop", () => {
    stopPreviewServer();
    return true;
  });

  const autosavePath = () => join(app.getPath("userData"), "autosave.json");

  ipcMain.handle(
    "project:save",
    async (event, payload: { json: string; path?: string }) => {
      let target = payload.path;
      if (!target) {
        const parent = BrowserWindow.fromWebContents(event.sender);
        const opts = {
          title: "Save Project",
          defaultPath: join(app.getPath("documents"), "project.fstudio.json"),
          filters: [{ name: "Faceless Studio Project", extensions: ["json"] }],
        };
        const res = parent
          ? await dialog.showSaveDialog(parent, opts)
          : await dialog.showSaveDialog(opts);
        if (res.canceled || !res.filePath) return { canceled: true };
        target = res.filePath;
      }
      await writeFile(target, payload.json, "utf-8");
      return { path: target };
    },
  );

  ipcMain.handle("project:open", async (event) => {
    const parent = BrowserWindow.fromWebContents(event.sender);
    const opts = {
      properties: ["openFile" as const],
      filters: [{ name: "Faceless Studio Project", extensions: ["json"] }],
    };
    const res = parent
      ? await dialog.showOpenDialog(parent, opts)
      : await dialog.showOpenDialog(opts);
    if (res.canceled || !res.filePaths[0]) return null;
    const json = await readFile(res.filePaths[0], "utf-8");
    return { path: res.filePaths[0], json };
  });

  ipcMain.handle("project:autosave", async (_e, json: string) => {
    try {
      await writeFile(autosavePath(), json, "utf-8");
    } catch {
      /* ignore */
    }
    return true;
  });

  ipcMain.handle("project:loadAutosave", async () => {
    try {
      return await readFile(autosavePath(), "utf-8");
    } catch {
      return null;
    }
  });

  ipcMain.handle("project:clearAutosave", async () => {
    try {
      await rm(autosavePath(), { force: true });
    } catch {
      /* ignore */
    }
    return true;
  });

  const version = await getFfmpegVersion();
  console.log("[main] ffmpeg ->", version);

  // Headless self-test of the export pipeline (no dialog, fixed output).
  if (process.env["FS_TEST_EXPORT"] === "1") {
    const testScene = {
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 500,
      background: "#0b0f1a",
      layers: [
        {
          id: "r",
          name: "Rect",
          type: "rect" as const,
          width: 600,
          height: 200,
          fill: "#8b7bff",
          radius: 24,
          transform: {
            x: 200,
            y: 440,
            opacity: [
              { t: 0, v: 0 },
              { t: 500, v: 1 },
            ],
          },
        },
        {
          id: "t",
          name: "Text",
          type: "text" as const,
          text: "Export self-test",
          fontSize: 90,
          fontWeight: 800,
          color: "#fff",
          transform: { x: 240, y: 480 },
        },
      ],
    };
    const out = join(tmpdir(), "fs-selftest-4k.mp4");
    const res = await runExport(
      null,
      { scene: testScene, scale: 2, fps: 30 },
      (p) => {
        if (p.phase !== "capture" || (p.frame ?? 0) % 5 === 0)
          console.log("[test]", p.phase, Math.round(p.pct) + "%");
      },
      out,
    );
    console.log("[test] RESULT", JSON.stringify(res));
    app.quit();
    return;
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
