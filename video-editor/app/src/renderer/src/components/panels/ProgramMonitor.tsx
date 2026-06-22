import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SceneRenderer } from "../../scene/SceneRenderer";
import { PanelFrame } from "../PanelFrame";
import { useEditor, evalTransform, findLayer } from "../../store/editorStore";

function fmt(ms: number, fps: number): string {
  const totalF = Math.round(ms / (1000 / fps));
  const f = totalF % fps;
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
}

function EditorCanvas() {
  const scene = useEditor((s) => s.scene);
  const time = useEditor((s) => s.time);
  const selectedId = useEditor((s) => s.selectedId);
  const select = useEditor((s) => s.select);
  const toggleSelect = useEditor((s) => s.toggleSelect);
  const pushHistory = useEditor((s) => s.pushHistory);
  const applyTransform = useEditor((s) => s.applyTransform);

  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(0.35);
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [guides, setGuides] = useState<{ v: number | null; h: number | null }>({ v: null, h: null });

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const recompute = () => {
      const w = el.clientWidth - 48;
      const h = el.clientHeight - 48;
      if (w > 0 && h > 0) setFit(Math.min(w / scene.width, h / scene.height));
    };
    recompute(); // instant on aspect/size change
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [scene.width, scene.height]);

  // Recompute selection outline (in scene coordinates) from the rendered DOM.
  useLayoutEffect(() => {
    if (!selectedId || !sceneRef.current) {
      setBox(null);
      return;
    }
    const root = sceneRef.current;
    const el = root.querySelector(`[data-layer-id="${selectedId}"]`) as HTMLElement | null;
    if (!el) {
      setBox(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const rr = root.getBoundingClientRect();
    setBox({
      x: (r.left - rr.left) / fit,
      y: (r.top - rr.top) / fit,
      w: r.width / fit,
      h: r.height / fit,
    });
  }, [selectedId, time, fit, scene]);

  const onMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const el = target.closest("[data-layer-id]") as HTMLElement | null;
    const id = el?.getAttribute("data-layer-id") ?? null;
    if (e.shiftKey && id) toggleSelect(id);
    else select(id);
    if (!id || !el) return;

    const layer = findLayer(scene.layers, id);
    if (!layer) return;
    // layer size in scene coords (for snapping)
    const r = el.getBoundingClientRect();
    const bw = r.width / fit;
    const bh = r.height / fit;
    const baseX = evalTransform(layer, "x", time);
    const baseY = evalTransform(layer, "y", time);
    const startX = e.clientX;
    const startY = e.clientY;
    const TH = 14; // snap threshold (scene px)
    let moved = false;

    const move = (ev: MouseEvent) => {
      if (!moved) {
        pushHistory();
        moved = true;
      }
      let nx = baseX + (ev.clientX - startX) / fit;
      let ny = baseY + (ev.clientY - startY) / fit;
      let gv: number | null = null;
      let gh: number | null = null;

      const cx = nx + bw / 2;
      if (Math.abs(cx - scene.width / 2) < TH) { nx = scene.width / 2 - bw / 2; gv = scene.width / 2; }
      else if (Math.abs(nx) < TH) { nx = 0; gv = 0; }
      else if (Math.abs(nx + bw - scene.width) < TH) { nx = scene.width - bw; gv = scene.width; }

      const cy = ny + bh / 2;
      if (Math.abs(cy - scene.height / 2) < TH) { ny = scene.height / 2 - bh / 2; gh = scene.height / 2; }
      else if (Math.abs(ny) < TH) { ny = 0; gh = 0; }
      else if (Math.abs(ny + bh - scene.height) < TH) { ny = scene.height - bh; gh = scene.height; }

      applyTransform(id, "x", Math.round(nx));
      applyTransform(id, "y", Math.round(ny));
      setGuides({ v: gv, h: gh });
    };
    const up = () => {
      setGuides({ v: null, h: null });
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  return (
    <div
      ref={stageRef}
      style={{
        height: "100%",
        background: "var(--stage)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div style={{ transform: `scale(${fit})`, transformOrigin: "center center" }}>
        <div
          ref={sceneRef}
          onMouseDown={onMouseDown}
          style={{ position: "relative", width: scene.width, height: scene.height }}
        >
          <SceneRenderer scene={scene} time={time} />
          {box && (
            <div
              style={{
                position: "absolute",
                left: box.x,
                top: box.y,
                width: box.w,
                height: box.h,
                border: `${2 / fit}px solid var(--accent)`,
                boxShadow: `0 0 0 ${1 / fit}px rgba(0,0,0,0.4)`,
                pointerEvents: "none",
                cursor: "move",
              }}
            />
          )}
          {guides.v != null && (
            <div style={{ position: "absolute", left: guides.v, top: 0, bottom: 0, width: 1 / fit, background: "#ff4df0", pointerEvents: "none" }} />
          )}
          {guides.h != null && (
            <div style={{ position: "absolute", top: guides.h, left: 0, right: 0, height: 1 / fit, background: "#ff4df0", pointerEvents: "none" }} />
          )}
        </div>
      </div>
    </div>
  );
}

function Transport() {
  const time = useEditor((s) => s.time);
  const playing = useEditor((s) => s.playing);
  const setTime = useEditor((s) => s.setTime);
  const setPlaying = useEditor((s) => s.setPlaying);
  const duration = useEditor((s) => s.scene.duration);
  const fps = useEditor((s) => s.scene.fps);
  const frame = 1000 / fps;
  const lastRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!playing) return;
    lastRef.current = undefined;
    let raf = 0;
    const tick = (ts: number) => {
      if (lastRef.current != null) {
        const dt = ts - lastRef.current;
        const cur = useEditor.getState().time;
        const n = cur + dt;
        if (n >= duration) {
          setTime(duration);
          setPlaying(false);
          return;
        }
        setTime(n);
      }
      lastRef.current = ts;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, duration, setTime, setPlaying]);

  const btn: React.CSSProperties = {
    background: "var(--bg-2)",
    border: "1px solid var(--border)",
    color: "var(--fg)",
    borderRadius: 5,
    width: 32,
    height: 28,
    cursor: "pointer",
  };

  return (
    <div
      style={{
        flexShrink: 0,
        borderTop: "1px solid var(--border)",
        background: "var(--bg)",
        padding: "8px 12px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <button style={btn} onClick={() => setTime(0)}>⏮</button>
      <button style={btn} onClick={() => setTime(Math.max(0, time - frame))}>◀</button>
      <button
        style={{ ...btn, width: 42, background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" }}
        onClick={() => {
          if (!playing && time >= duration) setTime(0);
          setPlaying(!playing);
        }}
      >
        {playing ? "❚❚" : "►"}
      </button>
      <button style={btn} onClick={() => setTime(Math.min(duration, time + frame))}>▶</button>
      <span style={{ fontFamily: "monospace", fontSize: 12, minWidth: 150 }}>
        {fmt(time, fps)} / {fmt(duration, fps)}
      </span>
      <input
        type="range"
        min={0}
        max={duration}
        step={1}
        value={time}
        onChange={(e) => {
          setPlaying(false);
          setTime(Number(e.target.value));
        }}
        style={{ flex: 1, accentColor: "var(--accent)" }}
      />
    </div>
  );
}

/** Hidden <audio> kept in sync with the playhead for preview. */
function AudioSync() {
  const audioUrl = useEditor((s) => s.scene.audio?.dataUrl);
  const volume = useEditor((s) => s.scene.audio?.volume ?? 1);
  const playing = useEditor((s) => s.playing);
  const time = useEditor((s) => s.time);
  const ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    if (playing) a.play().catch(() => {});
    else a.pause();
  }, [playing, audioUrl]);

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    const target = time / 1000;
    if (Math.abs(a.currentTime - target) > 0.25) a.currentTime = target;
  }, [time]);

  useEffect(() => {
    if (ref.current) ref.current.volume = volume;
  }, [volume]);

  if (!audioUrl) return null;
  return <audio ref={ref} src={audioUrl} />;
}

export function ProgramMonitor() {
  return (
    <PanelFrame tabs={[{ id: "program", label: "Program: Main" }]}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ flex: 1, minHeight: 0 }}>
          <EditorCanvas />
        </div>
        <Transport />
        <AudioSync />
      </div>
    </PanelFrame>
  );
}

export default ProgramMonitor;
