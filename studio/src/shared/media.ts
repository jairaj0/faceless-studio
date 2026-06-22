// Media that can be brought into a project. Kept tiny on purpose — the renderer
// adds an `id` and (for images) natural dimensions on top of this.

export type MediaKind = "image" | "audio";

export interface ImportedMedia {
  kind: MediaKind;
  name: string;
  path: string; // absolute path on disk (used by ffmpeg on export)
  dataUrl: string; // base64 data URL (used for preview in the renderer)
}
