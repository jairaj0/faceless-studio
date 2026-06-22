import { app, dialog, BrowserWindow } from "electron";
import { writeFile, readFile } from "fs/promises";
import { join } from "path";
import type { SaveResult, OpenResult } from "../../shared/project";

const FILTERS = [{ name: "Faceless Studio Project", extensions: ["json"] }];

export async function saveProjectFile(
  parent: BrowserWindow | null,
  json: string,
  path?: string,
): Promise<SaveResult> {
  let target = path;
  if (!target) {
    const opts = {
      title: "Save Project",
      defaultPath: join(app.getPath("documents"), "Untitled.fstudio.json"),
      filters: FILTERS,
    };
    const res = parent
      ? await dialog.showSaveDialog(parent, opts)
      : await dialog.showSaveDialog(opts);
    if (res.canceled || !res.filePath) return { canceled: true };
    target = res.filePath;
  }
  await writeFile(target, json, "utf-8");
  return { path: target };
}

export async function openProjectFile(
  parent: BrowserWindow | null,
): Promise<OpenResult | null> {
  const opts = { properties: ["openFile" as const], filters: FILTERS };
  const res = parent
    ? await dialog.showOpenDialog(parent, opts)
    : await dialog.showOpenDialog(opts);
  if (res.canceled || !res.filePaths[0]) return null;
  return { path: res.filePaths[0], json: await readFile(res.filePaths[0], "utf-8") };
}
