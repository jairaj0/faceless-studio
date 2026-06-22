import { ipcMain, BrowserWindow } from "electron";
import { saveProjectFile, openProjectFile } from "../services/fileSystem";
import { writeRecovery, readRecovery, clearRecovery } from "../services/recovery";

export function registerProjectIpc(): void {
  ipcMain.handle("project:save", (e, p: { json: string; path?: string }) =>
    saveProjectFile(BrowserWindow.fromWebContents(e.sender), p.json, p.path),
  );
  ipcMain.handle("project:open", (e) =>
    openProjectFile(BrowserWindow.fromWebContents(e.sender)),
  );
  ipcMain.handle("recovery:write", (_e, p: { json: string; name: string }) =>
    writeRecovery(p.json, p.name),
  );
  ipcMain.handle("recovery:read", () => readRecovery());
  ipcMain.handle("recovery:clear", () => clearRecovery());
}
