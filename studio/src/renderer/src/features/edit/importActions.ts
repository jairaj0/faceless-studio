import { useEditor, type NewMedia } from "../../store/editor";
import { probeDuration } from "./composite";
import type { MediaKind } from "../../../../shared/media";

const IMAGE_EXT = ["png", "jpg", "jpeg", "webp", "gif", "svg"];
const AUDIO_EXT = ["mp3", "wav", "m4a", "aac", "ogg"];
const VIDEO_EXT = ["mp4", "mov", "webm", "mkv", "avi", "m4v"];

// After a video is in the bin, fill its natural duration so a new clip defaults
// to the full length.
function fillVideoDuration(id: string, src: string): void {
  void probeDuration(src).then((ms) => {
    if (ms) useEditor.getState().setMediaDuration(id, ms);
  });
}

// ---- Dialog-based import (buttons + File menu) -----------------------------

export async function importImages(): Promise<void> {
  const items = await window.api.media.import("image");
  if (!items?.length) return;
  useEditor.getState().addMedia(
    items.map((m) => ({ kind: m.kind, name: m.name, path: m.path, src: m.dataUrl ?? "" })),
  );
}

export async function importAudio(): Promise<void> {
  const items = await window.api.media.import("audio");
  const m = items?.[0];
  if (!m) return;
  useEditor.getState().setAudio({ kind: m.kind, name: m.name, path: m.path, src: m.dataUrl ?? "" });
}

export async function importVideos(): Promise<void> {
  const items = await window.api.media.import("video");
  if (!items?.length) return;
  for (const m of items) {
    const bytes = await window.api.media.bytes(m.path);
    const src = URL.createObjectURL(new Blob([bytes as BlobPart]));
    const [added] = useEditor.getState().addMedia([
      { kind: "video", name: m.name, path: m.path, src, isBlob: true },
    ]);
    fillVideoDuration(added.id, src);
  }
}

// ---- Drag & drop ----------------------------------------------------------

function kindOf(file: File): MediaKind | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("video/")) return "video";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (IMAGE_EXT.includes(ext)) return "image";
  if (AUDIO_EXT.includes(ext)) return "audio";
  if (VIDEO_EXT.includes(ext)) return "video";
  return null;
}

export interface DropResult {
  images: number;
  audio: number;
  videos: number;
  skipped: number;
}

/** Handle files dropped onto the Media Bin (blob URLs — clean for canvas). */
export async function importDroppedFiles(files: FileList | File[]): Promise<DropResult> {
  const res: DropResult = { images: 0, audio: 0, videos: 0, skipped: 0 };
  const images: NewMedia[] = [];
  let audio: NewMedia | null = null;
  const videos: NewMedia[] = [];

  for (const f of Array.from(files)) {
    const kind = kindOf(f);
    if (!kind) {
      res.skipped++;
      continue;
    }
    // Electron exposes the absolute path on dropped File objects (needed by
    // ffmpeg). The blob URL drives in-app preview and stays same-origin so the
    // export canvas isn't tainted.
    const path = (f as unknown as { path?: string }).path ?? "";
    const item: NewMedia = { kind, name: f.name, path, src: URL.createObjectURL(f), isBlob: true };
    if (kind === "image") images.push(item);
    else if (kind === "audio") audio = item;
    else videos.push(item);
  }

  const st = useEditor.getState();
  if (images.length) {
    st.addMedia(images);
    res.images = images.length;
  }
  if (videos.length) {
    const added = st.addMedia(videos);
    added.forEach((m) => fillVideoDuration(m.id, m.src));
    res.videos = videos.length;
  }
  if (audio) {
    st.setAudio(audio);
    res.audio = 1;
  }
  return res;
}
