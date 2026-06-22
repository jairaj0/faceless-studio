import { ipcMain, dialog, BrowserWindow } from "electron";
import { readFile } from "fs/promises";
import { basename, extname } from "path";
import type { ImportedMedia, MediaKind } from "../../shared/media";

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

const EXT: Record<MediaKind, string[]> = {
  image: ["png", "jpg", "jpeg", "webp", "gif", "svg"],
  audio: ["mp3", "wav", "m4a", "aac", "ogg"],
  video: ["mp4", "mov", "webm", "mkv", "avi", "m4v"],
};

async function pickMedia(
  parent: BrowserWindow | null,
  kind: MediaKind,
): Promise<ImportedMedia[] | null> {
  const filters = [{ name: kind[0].toUpperCase() + kind.slice(1), extensions: EXT[kind] }];
  // Audio is a single track; images/video can be multi-selected.
  const properties =
    kind === "audio" ? (["openFile"] as const) : (["openFile", "multiSelections"] as const);
  const opts = { properties: [...properties], filters };

  const res = parent
    ? await dialog.showOpenDialog(parent, opts)
    : await dialog.showOpenDialog(opts);
  if (res.canceled || res.filePaths.length === 0) return null;

  const out: ImportedMedia[] = [];
  for (const p of res.filePaths) {
    const item: ImportedMedia = { kind, name: basename(p), path: p };
    // Video stays path-only (renderer streams it as a Blob). Image/audio base64.
    if (kind !== "video") {
      const buf = await readFile(p);
      const ext = extname(p).slice(1).toLowerCase();
      const mime = MIME[ext] ?? (kind === "image" ? "image/png" : "audio/mpeg");
      item.dataUrl = `data:${mime};base64,${buf.toString("base64")}`;
    }
    out.push(item);
  }
  return out;
}

export function registerMediaIpc(): void {
  ipcMain.handle("media:import", (e, kind: MediaKind) =>
    pickMedia(BrowserWindow.fromWebContents(e.sender), kind),
  );
  // Raw bytes for a path (used to build a Blob URL for video imported via dialog).
  ipcMain.handle("media:bytes", (_e, path: string) => readFile(path));
}
