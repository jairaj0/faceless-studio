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

async function pickMedia(
  parent: BrowserWindow | null,
  kind: MediaKind,
): Promise<ImportedMedia[] | null> {
  const filters =
    kind === "image"
      ? [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "gif", "svg"] }]
      : [{ name: "Audio", extensions: ["mp3", "wav", "m4a", "aac", "ogg"] }];
  // Images can be multi-selected; audio is a single track.
  const properties =
    kind === "image" ? (["openFile", "multiSelections"] as const) : (["openFile"] as const);
  const opts = { properties: [...properties], filters };

  const res = parent
    ? await dialog.showOpenDialog(parent, opts)
    : await dialog.showOpenDialog(opts);
  if (res.canceled || res.filePaths.length === 0) return null;

  const out: ImportedMedia[] = [];
  for (const p of res.filePaths) {
    const buf = await readFile(p);
    const ext = extname(p).slice(1).toLowerCase();
    const mime = MIME[ext] ?? (kind === "image" ? "image/png" : "audio/mpeg");
    out.push({
      kind,
      name: basename(p),
      path: p,
      dataUrl: `data:${mime};base64,${buf.toString("base64")}`,
    });
  }
  return out;
}

export function registerMediaIpc(): void {
  ipcMain.handle("media:import", (e, kind: MediaKind) =>
    pickMedia(BrowserWindow.fromWebContents(e.sender), kind),
  );
}
