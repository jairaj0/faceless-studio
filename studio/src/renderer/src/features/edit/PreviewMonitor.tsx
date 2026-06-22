import { useEffect, useRef, useState } from "react";
import { useEditor } from "../../store/editor";
import { drawFrame, getImage, getVideo, localTime, pauseVideos, visibleClipsAt } from "./composite";
import { syncAudio, stopAudio } from "./audioPreview";
import { CodeOverlay } from "./CodeOverlay";
import { importImages } from "./importActions";

export function fmtTime(ms: number): string {
  const s = Math.max(0, ms) / 1000;
  const m = Math.floor(s / 60);
  const rem = s - m * 60;
  return `${m}:${rem.toFixed(1).padStart(4, "0")}`;
}

export function PreviewMonitor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const media = useEditor((s) => s.media);
  const tracks = useEditor((s) => s.tracks);
  const comp = useEditor((s) => s.comp);
  const playhead = useEditor((s) => s.playhead);
  const playing = useEditor((s) => s.playing);
  const duration = useEditor((s) => s.duration());
  const togglePlay = useEditor((s) => s.togglePlay);
  const hasClips = tracks.some((t) => t.clips.length > 0);

  // Draw the current frame whenever anything visible changes.
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawFrame(ctx, comp, media, tracks, playhead);

    // If any visible image hasn't decoded yet, redraw once it loads.
    for (const clip of visibleClipsAt(tracks, playhead)) {
      const m = media.find((x) => x.id === clip.mediaId);
      if (m?.kind !== "image") continue;
      const img = getImage(m.src);
      if (!img.complete || !img.naturalWidth)
        img.onload = () => drawFrame(ctx, comp, media, tracks, playhead);
    }
  }, [comp, media, tracks, playhead]);

  // While paused, park every visible video on the exact frame under the playhead.
  useEffect(() => {
    if (playing) return;
    const ctx = canvasRef.current?.getContext("2d");
    for (const clip of visibleClipsAt(tracks, playhead)) {
      const m = media.find((x) => x.id === clip.mediaId);
      if (m?.kind !== "video") continue;
      const v = getVideo(m.src);
      v.pause();
      const target = localTime(clip, m, playhead);
      if (Math.abs(v.currentTime - target) > 0.04) {
        const on = (): void => {
          v.removeEventListener("seeked", on);
          if (ctx) drawFrame(ctx, comp, media, tracks, playhead);
        };
        v.addEventListener("seeked", on);
        v.currentTime = target;
      }
    }
  }, [playing, playhead, tracks, media, comp]);

  // Playback clock. The playhead is the master clock (advances by real time);
  // every visible video is nudged/seeked to stay in sync with it. This supports
  // multiple simultaneous videos (picture-in-picture across tracks).
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number): void => {
      const dt = now - last;
      last = now;
      const st = useEditor.getState();
      const total = st.duration();
      const next = st.playhead + dt;

      // Sync videos to the playhead.
      const keep = new Set<string>();
      for (const clip of visibleClipsAt(st.tracks, next)) {
        const m = st.media.find((x) => x.id === clip.mediaId);
        if (m?.kind !== "video") continue;
        keep.add(m.src);
        const v = getVideo(m.src);
        const target = localTime(clip, m, next);
        if (Math.abs(v.currentTime - target) > 0.3) v.currentTime = target; // re-sync on drift
        if (v.paused) void v.play();
      }
      pauseVideos(keep); // pause anything no longer on screen
      syncAudio(st.audio?.src ?? null, st.audioMix, st.audio?.duration ?? 0, next, true);

      if (next >= total) {
        st.setPlayhead(total);
        st.pause();
        pauseVideos();
        stopAudio();
        return;
      }
      st.setPlayhead(next);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // Pause audio whenever playback stops.
  useEffect(() => {
    if (!playing) stopAudio();
  }, [playing]);

  // Pause any playing video/audio when the monitor unmounts.
  useEffect(() => {
    return () => {
      pauseVideos();
      stopAudio();
    };
  }, []);

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
          position: "relative",
        }}
      >
        {!hasClips ? (
          <EmptyState />
        ) : (
          <>
            <canvas
              ref={(el) => {
                canvasRef.current = el;
                setCanvasEl(el);
              }}
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
            <CodeOverlay canvas={canvasEl} />
          </>
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

// Onboarding shown when the timeline is empty — quick ways to start a project.
function EmptyState() {
  const addBackgroundClip = useEditor((s) => s.addBackgroundClip);
  const addTextClip = useEditor((s) => s.addTextClip);
  const addCodeClip = useEditor((s) => s.addCodeClip);
  const actions: { label: string; hint: string; run: () => void }[] = [
    { label: "🖼  Import media", hint: "image / video", run: () => void importImages() },
    { label: "▦  Animated background", hint: "B", run: () => addBackgroundClip() },
    { label: "T  Text layer", hint: "T", run: () => addTextClip() },
    { label: "</>  Code layer", hint: "L · HTML / React + gsap", run: () => addCodeClip() },
  ];
  return (
    <div style={{ textAlign: "center", color: "var(--fg-2)", maxWidth: 320 }}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Faceless Studio</div>
      <div style={{ fontSize: 12, color: "var(--fg-3)", marginBottom: 18 }}>
        Start your animation — everything is resolution-independent and exports frame-accurately.
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.run}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "10px 14px",
              fontSize: 13,
              color: "var(--fg)",
              background: "var(--bg-1)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              cursor: "pointer",
              textAlign: "left",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            <span>{a.label}</span>
            <span style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{a.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default PreviewMonitor;
