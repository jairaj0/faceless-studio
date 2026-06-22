import { useEffect, useState } from "react";
import { useEditor } from "../../store/editor";
import { drawFrame, preloadClips } from "../edit/composite";
import { fmtTime } from "../edit/PreviewMonitor";
import type { ExportProgress, ExportResult } from "../../../../shared/export";

// Heights are derived from the composition's aspect ratio so non-16:9 comps
// still export correctly.
const PRESETS = [
  { label: "720p", h: 720 },
  { label: "1080p", h: 1080 },
  { label: "4K", h: 2160 },
  { label: "8K", h: 4320 },
];

export function ExportWindow() {
  const media = useEditor((s) => s.media);
  const clips = useEditor((s) => s.clips);
  const comp = useEditor((s) => s.comp);
  const audio = useEditor((s) => s.audio);
  const duration = useEditor((s) => s.duration());

  const [presetH, setPresetH] = useState(1080);
  const [busy, setBusy] = useState(false);
  const [prog, setProg] = useState<ExportProgress | null>(null);
  const [result, setResult] = useState<ExportResult | null>(null);

  const ar = comp.width / comp.height;
  const W = Math.round((presetH * ar) / 2) * 2; // keep even for yuv420p
  const H = presetH;
  const total = Math.max(1, Math.round((duration / 1000) * comp.fps));
  const ready = clips.length > 0;

  useEffect(() => () => void window.api.export.cancel(), []);

  async function runExport(): Promise<void> {
    if (!ready || busy) return;
    setBusy(true);
    setResult(null);
    setProg({ phase: "capture", pct: 0, frame: 0, total });
    const stop = window.api.export.onProgress(setProg);
    try {
      await preloadClips(clips, media);
      await window.api.export.begin();

      const cv = document.createElement("canvas");
      cv.width = W;
      cv.height = H;
      const ctx = cv.getContext("2d");
      if (!ctx) throw new Error("Could not get a 2D canvas context");
      const frameComp = { ...comp, width: W, height: H };

      for (let i = 0; i < total; i++) {
        const t = (i / comp.fps) * 1000;
        drawFrame(ctx, frameComp, media, clips, t);
        await window.api.export.frame(i, cv.toDataURL("image/png"));
        setProg({ phase: "capture", pct: Math.round(((i + 1) / total) * 90), frame: i + 1, total });
      }

      const res = await window.api.export.encode({
        fps: comp.fps,
        total,
        width: W,
        height: H,
        audioPath: audio?.path,
      });
      setResult(res);
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      stop();
      setBusy(false);
      setProg(null);
    }
  }

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        padding: 24,
      }}
    >
      <div
        style={{
          width: 420,
          background: "var(--bg-1)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700 }}>Export Video</div>

        {/* Summary of what will be rendered from the Edit timeline */}
        <Row label="Timeline">
          {ready ? `${clips.length} clip${clips.length === 1 ? "" : "s"} · ${fmtTime(duration)}` : "empty"}
        </Row>
        <Row label="Audio">{audio ? audio.name : "none"}</Row>
        <Row label="Frame rate">{comp.fps} fps</Row>

        {/* Resolution */}
        <div>
          <div style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 6 }}>Resolution</div>
          <div style={{ display: "flex", gap: 6 }}>
            {PRESETS.map((p) => {
              const on = p.h === presetH;
              return (
                <button
                  key={p.h}
                  onClick={() => setPresetH(p.h)}
                  disabled={busy}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    fontSize: 12,
                    fontWeight: on ? 700 : 400,
                    color: on ? "#fff" : "var(--fg-2)",
                    background: on ? "var(--accent)" : "var(--bg-2)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    cursor: busy ? "default" : "pointer",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 6 }}>
            Output: {W}×{H} · {total} frames · MP4 (H.264)
          </div>
        </div>

        <button
          onClick={runExport}
          disabled={!ready || busy}
          style={{
            padding: "10px 0",
            fontSize: 13,
            fontWeight: 700,
            color: "#fff",
            background: !ready || busy ? "var(--bg-2)" : "var(--accent)",
            border: "none",
            borderRadius: 8,
            cursor: !ready || busy ? "default" : "pointer",
          }}
        >
          {busy ? "Exporting…" : ready ? "Export" : "Add clips in Edit first"}
        </button>

        {prog && (
          <div>
            <div style={{ height: 6, background: "var(--bg-2)", borderRadius: 3, overflow: "hidden" }}>
              <div
                style={{
                  width: `${prog.pct}%`,
                  height: "100%",
                  background: "var(--accent)",
                  transition: "width 0.1s linear",
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 6 }}>
              {prog.phase === "capture"
                ? `Rendering frame ${prog.frame}/${prog.total}`
                : prog.phase === "encoding"
                  ? "Encoding with ffmpeg…"
                  : "Done"}{" "}
              ({Math.round(prog.pct)}%)
            </div>
          </div>
        )}

        {result?.ok && (
          <div style={{ fontSize: 11, color: "#7bdba0" }}>✓ Saved: {result.filePath}</div>
        )}
        {result?.canceled && (
          <div style={{ fontSize: 11, color: "var(--fg-3)" }}>Export canceled.</div>
        )}
        {result?.error && (
          <div style={{ fontSize: 11, color: "#e06c75" }}>Error: {result.error}</div>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
      <span style={{ color: "var(--fg-3)" }}>{label}</span>
      <span style={{ color: "var(--fg-2)" }}>{children}</span>
    </div>
  );
}

export default ExportWindow;
