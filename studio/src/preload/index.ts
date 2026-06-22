import { contextBridge, ipcRenderer } from "electron";
import type { SaveResult, OpenResult, RecoverySnapshot } from "../shared/project";
import type { ImportedMedia, MediaKind } from "../shared/media";
import type { ExportEncodeRequest, ExportProgress, ExportResult } from "../shared/export";

// The bridge. `window.api` grows per-domain each milestone.
const api = {
  project: {
    save: (json: string, path?: string): Promise<SaveResult> =>
      ipcRenderer.invoke("project:save", { json, path }),
    open: (): Promise<OpenResult | null> => ipcRenderer.invoke("project:open"),
  },
  recovery: {
    write: (json: string, name: string): Promise<boolean> =>
      ipcRenderer.invoke("recovery:write", { json, name }),
    read: (): Promise<RecoverySnapshot | null> => ipcRenderer.invoke("recovery:read"),
    clear: (): Promise<boolean> => ipcRenderer.invoke("recovery:clear"),
  },
  media: {
    import: (kind: MediaKind): Promise<ImportedMedia[] | null> =>
      ipcRenderer.invoke("media:import", kind),
    bytes: (path: string): Promise<Uint8Array> => ipcRenderer.invoke("media:bytes", path),
  },
  export: {
    begin: (): Promise<{ dir: string }> => ipcRenderer.invoke("export:begin"),
    frame: (index: number, dataUrl: string): Promise<boolean> =>
      ipcRenderer.invoke("export:frame", { index, dataUrl }),
    encode: (req: ExportEncodeRequest): Promise<ExportResult> =>
      ipcRenderer.invoke("export:encode", req),
    cancel: (): Promise<boolean> => ipcRenderer.invoke("export:cancel"),
    onProgress: (cb: (p: ExportProgress) => void): (() => void) => {
      const h = (_e: unknown, p: ExportProgress): void => cb(p);
      ipcRenderer.on("export:progress", h);
      return () => ipcRenderer.off("export:progress", h);
    },
  },
};

contextBridge.exposeInMainWorld("api", api);

export type Api = typeof api;
