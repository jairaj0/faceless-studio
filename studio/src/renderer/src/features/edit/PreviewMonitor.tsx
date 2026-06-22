import { useEffect, useRef } from "react";
import { useEditor } from "../../store/editor";
import { drawFrame, getImage, clipAt } from "./composite";

export function fmtTime(ms: number): string {
  const s = Math.max(0, ms) / 1000;
  const m = Math.floor(s / 60);
  const rem = s - m * 60;
  return `${m}:${rem.toFixed(1).padStart(4, "0")}`;
}

export function PreviewMonitor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const media = useEditor((s) => s.media);
  const clips = useEditor((s) => s.clips);
  const comp = useEditor((s) => s.comp);
  const playhead = useEditor((s) => s.playhead);
  const playing = useEditor((s) => s.playing);
  const duration = useEditor((s) => s.duration());
  const setPlayhead = useEditor((s) => s.setPlayhead);
  const togglePlay = useEditor((s) => s.togglePlay);
  const pause = useEditor((s) => s.pause);

  // Draw the current frame whenever anything visible changes.
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    drawFrame(ctx, comp, media, clips, playhead);

    // If the active image hasn't decoded yet, redraw once it loads.
    const clip = clipAt(clips, playhead);
    const m = clip && media.find((x) => x.id === clip.mediaId);
    if (m) {
      const img = getImage(m.dataUrl);
      if (!img.complete || !img.naturalWidth) {
        img.onload = () => drawFrame(ctx, comp, media, clips, playhead);
      }
    }
  }, [comp, media, clips, playhead]);

  // Playback clock.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number): void => {
      const dt = now - last;
      last = now;
      const next = useEditor.getState().playhead + dt;
      if (next >= duration) {
        setPlayhead(duration);
        pause();
        return;
      }
      setPlayhead(next);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, duration, setPlayhead, pause]);

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          background: "#0d0d0d",
        }}
      >
        {clips.length === 0 ? (
          <p style={{ color: "var(--fg-3)", fontSize: 12 }}>
            Add media to the timeline to see a preview.
          </p>
        ) : (
          <canvas
            ref={canvasRef}
            width={comp.width}
            height={comp.height}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
              borderRadius: 2,
            }}
          />
        )}
      </div>

      {/* Transport */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          height: 40,
          padding: "0 14px",
          borderTop: "1px solid var(--border)",
          background: "var(--bg-1)",
        }}
      >
        <button
          onClick={togglePlay}
          disabled={duration === 0}
          style={{
            width: 30,
            height: 24,
            fontSize: 12,
            color: "var(--fg)",
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: 5,
            cursor: duration === 0 ? "default" : "pointer",
            opacity: duration === 0 ? 0.5 : 1,
          }}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <span style={{ fontSize: 11, color: "var(--fg-2)", fontVariantNumeric: "tabular-nums" }}>
          {fmtTime(playhead)} / {fmtTime(duration)}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--fg-3)" }}>
          {comp.width}×{comp.height} · {comp.fps}fps
        </span>
      </div>
    </div>
  );
}

export default PreviewMonitor;
