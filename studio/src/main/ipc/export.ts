import { ipcMain, BrowserWindow } from "electron";
import { beginExport, writeFrame, encodeExport, cancelExport } from "../services/exportSession";
import type { ExportEncodeRequest } from "../../shared/export";

export function registerExportIpc(): void {
  ipcMain.handle("export:begin", () => beginExport());
  ipcMain.handle("export:frame", (_e, p: { index: number; dataUrl: string }) =>
    writeFrame(p.index, p.dataUrl),
  );
  ipcMain.handle("export:encode", (e, req: ExportEncodeRequest) =>
    encodeExport(BrowserWindow.fromWebContents(e.sender), req, (pr) =>
      e.sender.send("export:progress", pr),
    ),
  );
  ipcMain.handle("export:cancel", () => cancelExport());
}
