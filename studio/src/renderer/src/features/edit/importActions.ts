import { useEditor } from "../../store/editor";
import type { ImportedMedia, MediaKind } from "../../../../shared/media";

// Shared by the Media Bin buttons and the File-menu commands so there's one
// import path. Images can be multi-selected; audio is a single track.
export async function importImages(): Promise<void> {
  const items = await window.api.media.import("image");
  if (items?.length) useEditor.getState().addMedia(items);
}

export async function importAudio(): Promise<void> {
  const items = await window.api.media.import("audio");
  if (items?.[0]) useEditor.getState().setAudio(items[0]);
}

const IMAGE_EXT = ["png", "jpg", "jpeg", "webp", "gif", "svg"];
const AUDIO_EXT = ["mp3", "wav", "m4a", "aac", "ogg"];

function kindOf(file: File): MediaKind | "video" | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("video/")) return "video";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (IMAGE_EXT.includes(ext)) return "image";
  if (AUDIO_EXT.includes(ext)) return "audio";
  if (["mp4", "mov", "webm", "mkv", "avi"].includes(ext)) return "video";
  return null;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export interface DropResult {
  images: number;
  audio: number;
  video: number; // not supported yet — counted so the UI can tell the user
  skipped: number;
}

/** Handle files dropped onto the Media Bin. Images + audio only for now. */
export async function importDroppedFiles(files: FileList | File[]): Promise<DropResult> {
  const res: DropResult = { images: 0, audio: 0, video: 0, skipped: 0 };
  const images: ImportedMedia[] = [];
  let audio: ImportedMedia | null = null;

  for (const f of Array.from(files)) {
    const kind = kindOf(f);
    if (kind === "video") {
      res.video++;
      continue;
    }
    if (kind !== "image" && kind !== "audio") {
      res.skipped++;
      continue;
    }
    // Electron exposes the absolute path on dropped File objects — needed by
    // ffmpeg on export. The data URL drives the in-app preview.
    const path = (f as unknown as { path?: string }).path ?? "";
    const media: ImportedMedia = { kind, name: f.name, path, dataUrl: await readAsDataUrl(f) };
    if (kind === "image") images.push(media);
    else audio = media;
  }

  const st = useEditor.getState();
  if (images.length) {
    st.addMedia(images);
    res.images = images.length;
  }
  if (audio) {
    st.setAudio(audio);
    res.audio = 1;
  }
  return res;
}
