import { ipcMain, BrowserWindow } from "electron";
import { saveProjectFile, openProjectFile } from "../services/fileSystem";

export function registerProjectIpc(): void {
  ipcMain.handle("project:save", (e, p: { json: string; path?: string }) =>
    saveProjectFile(BrowserWindow.fromWebContents(e.sender), p.json, p.path),
  );
  ipcMain.handle("project:open", (e) =>
    openProjectFile(BrowserWindow.fromWebContents(e.sender)),
  );
}
