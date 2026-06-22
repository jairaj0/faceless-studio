import { contextBridge, ipcRenderer } from "electron";
import type {
  ExportRequest,
  ExportProgress,
  ExportResult,
  ImportedImage,
  ImportedAudio,
} from "../shared/export";

/** Safe bridge between renderer (UI) and main (Node/ffmpeg). */
const api = {
  getFfmpegVersion: (): Promise<string> =>
    ipcRenderer.invoke("ffmpeg:version"),

  exportScene: (req: ExportRequest): Promise<ExportResult> =>
    ipcRenderer.invoke("export:start", req),

  onExportProgress: (cb: (p: ExportProgress) => void): (() => void) => {
    const listener = (_e: unknown, data: ExportProgress) => cb(data);
    ipcRenderer.on("export:progress", listener);
    return () => ipcRenderer.removeListener("export:progress", listener);
  },

  importImage: (): Promise<ImportedImage | null> =>
    ipcRenderer.invoke("media:importImage"),
  importAudio: (): Promise<ImportedAudio | null> =>
    ipcRenderer.invoke("media:importAudio"),

  startPreview: (scene: unknown): Promise<{ url: string }> =>
    ipcRenderer.invoke("preview:start", scene),
  stopPreview: (): Promise<boolean> => ipcRenderer.invoke("preview:stop"),

  saveProject: (
    json: string,
    path?: string,
  ): Promise<{ path?: string; canceled?: boolean }> =>
    ipcRenderer.invoke("project:save", { json, path }),
  openProject: (): Promise<{ path: string; json: string } | null> =>
    ipcRenderer.invoke("project:open"),
  autosaveProject: (json: string): Promise<boolean> =>
    ipcRenderer.invoke("project:autosave", json),
  loadAutosave: (): Promise<string | null> =>
    ipcRenderer.invoke("project:loadAutosave"),
  clearAutosave: (): Promise<boolean> =>
    ipcRenderer.invoke("project:clearAutosave"),
};

contextBridge.exposeInMainWorld("api", api);

export type Api = typeof api;
