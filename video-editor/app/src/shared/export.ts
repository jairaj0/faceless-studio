import type { Scene } from "../renderer/src/scene/types";

export interface ExportRequest {
  scene: Scene;
  scale: number; // multiplier of the scene's logical size (1=1080p, 2=4K, 4=8K)
  fps: number;
  audioPath?: string; // optional audio file to mux into the export
}

export interface ImportedImage {
  dataUrl: string;
  path: string;
  name: string;
}

export interface ImportedAudio {
  dataUrl: string;
  path: string;
  name: string;
}

export interface ExportProgress {
  phase: "capture" | "encoding" | "done";
  pct: number; // 0..100
  frame?: number;
  total?: number;
}

export interface ExportResult {
  ok?: boolean;
  canceled?: boolean;
  filePath?: string;
  width?: number;
  height?: number;
  error?: string;
}
