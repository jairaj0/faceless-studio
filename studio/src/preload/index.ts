import { contextBridge, ipcRenderer } from "electron";
import type { SaveResult, OpenResult } from "../shared/project";

// The bridge. `window.api` grows per-domain each milestone.
const api = {
  project: {
    save: (json: string, path?: string): Promise<SaveResult> =>
      ipcRenderer.invoke("project:save", { json, path }),
    open: (): Promise<OpenResult | null> => ipcRenderer.invoke("project:open"),
  },
};

contextBridge.exposeInMainWorld("api", api);

export type Api = typeof api;
