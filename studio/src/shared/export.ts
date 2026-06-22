// Export contract between renderer and main.
//
// The renderer composites each frame onto a fixed-size canvas and ships the PNG
// to main (export:frame). main writes them to a temp dir, then ffmpeg encodes
// the sequence to mp4 (export:encode). This keeps export robust to mixed source
// image sizes — every frame is already normalised to the target resolution.

export interface ExportEncodeRequest {
  fps: number;
  total: number; // number of frames written
  width: number;
  height: number;
  audioPath?: string; // optional audio track to mux in
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
  error?: string;
}
