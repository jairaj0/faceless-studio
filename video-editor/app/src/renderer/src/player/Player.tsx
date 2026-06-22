import { useEffect, useRef, useState } from "react";
import type { Scene } from "../scene/types";
import { SceneRenderer } from "../scene/SceneRenderer";

function fmtTime(ms: number, fps: number): string {
  const totalF = Math.round(ms / (1000 / fps));
  const f = totalF % fps;
  const s = Math.floor(ms / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}:${String(f).padStart(2, "0")}`;
}

export default function Player({ scene }: { scene: Scene }) {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [fit, setFit] = useState(0.4);

  const stageRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const lastRef = useRef<number | undefined>(undefined);
  const frame = 1000 / scene.fps;

  // Fit the logical scene into the available preview area (vector → sharp).
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const pad = 48;
      const w = el.clientWidth - pad;
      const h = el.clientHeight - pad;
      if (w > 0 && h > 0) {
        setFit(Math.min(w / scene.width, h / scene.height));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [scene.width, scene.height]);

  // Playback loop (real-time preview).
  useEffect(() => {
    if (!playing) return;
    lastRef.current = undefined;
    const tick = (ts: number) => {
      if (lastRef.current != null) {
        const dt = ts - lastRef.current;
        setTime((prev) => {
          const n = prev + dt;
          if (n >= scene.duration) {
            setPlaying(false);
            return scene.duration;
          }
          return n;
        });
      }
      lastRef.current = ts;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, scene.duration]);

  const togglePlay = () => {
    if (!playing && time >= scene.duration) setTime(0);
    setPlaying((p) => !p);
  };
  const step = (dir: number) =>
    setTime((t) => Math.min(scene.duration, Math.max(0, t + dir * frame)));

  const btn: React.CSSProperties = {
    background: "var(--bg-1)",
    border: "1px solid var(--border)",
    color: "var(--fg)",
    borderRadius: 6,
    width: 34,
    height: 30,
    cursor: "pointer",
    fontSize: 13,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Preview stage */}
      <div
        ref={stageRef}
        style={{
          flex: 1,
          minHeight: 0,
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            transform: `scale(${fit})`,
            transformOrigin: "center center",
            boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
          }}
        >
          <SceneRenderer scene={scene} time={time} />
        </div>
      </div>

      {/* Transport bar */}
      <div
        style={{
          flexShrink: 0,
          borderTop: "1px solid var(--border)",
          background: "var(--bg)",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button style={btn} onClick={() => setTime(0)} title="Go to start">
          ⏮
        </button>
        <button style={btn} onClick={() => step(-1)} title="Prev frame">
          ◀
        </button>
        <button
          style={{ ...btn, width: 44, background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" }}
          onClick={togglePlay}
          title="Play / Pause (Space)"
        >
          {playing ? "❚❚" : "►"}
        </button>
        <button style={btn} onClick={() => step(1)} title="Next frame">
          ▶
        </button>

        <span
          style={{
            fontFamily: "monospace",
            fontSize: 13,
            color: "var(--fg)",
            minWidth: 168,
          }}
        >
          {fmtTime(time, scene.fps)} / {fmtTime(scene.duration, scene.fps)}
        </span>

        <input
          type="range"
          min={0}
          max={scene.duration}
          step={1}
          value={time}
          onChange={(e) => {
            setPlaying(false);
            setTime(Number(e.target.value));
          }}
          style={{ flex: 1, accentColor: "var(--accent)" }}
        />

        <span style={{ fontSize: 12, color: "var(--fg-2)", minWidth: 150, textAlign: "right" }}>
          {scene.width}×{scene.height} · {Math.round(fit * 100)}% · {scene.fps}fps
        </span>
      </div>
    </div>
  );
}
