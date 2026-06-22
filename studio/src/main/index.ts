import { app, BrowserWindow } from "electron";
import { join } from "path";
import { registerProjectIpc } from "./ipc/project";
import { registerMediaIpc } from "./ipc/media";
import { registerExportIpc } from "./ipc/export";
import { ffmpegVersion } from "./services/ffmpeg";

// Backend (Electron main). IPC handlers are registered per-domain under ipc/.

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    backgroundColor: "#1a1a1a",
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
  registerProjectIpc();
  registerMediaIpc();
  registerExportIpc();
  console.log("[main] ffmpeg ->", await ffmpegVersion());
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
