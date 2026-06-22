// Media that can be brought into a project. `dataUrl` is filled by main for
// images/audio (small enough to base64). Video is returned as path-only — the
// renderer turns it into a Blob URL (via media:bytes) to avoid huge base64.

export type MediaKind = "image" | "audio" | "video";

export interface ImportedMedia {
  kind: MediaKind;
  name: string;
  path: string; // absolute path on disk (used by ffmpeg on export)
  dataUrl?: string; // base64 data URL for image/audio; absent for video
}
