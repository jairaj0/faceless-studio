import { useRef, useState } from "react";
import { useEditor, type Clip, type TransformKey } from "../../store/editor";
import { fmtTime } from "./PreviewMonitor";

const RULER = 22;
const TRACK_H = 64;
const MARKS = 8;
const KEYS: TransformKey[] = ["x", "y", "scale", "rotation", "opacity"];

interface KfRef {
  key: TransformKey;
  index: number;
  t: number; // clip-local ms
}

function clipKeyframes(clip: Clip): KfRef[] {
  const out: KfRef[] = [];
  for (const key of KEYS) {
    const v = clip.transform[key];
    if (Array.isArray(v)) v.forEach((kf, index) => out.push({ key, index, t: kf.t }));
  }
  return out;
}

export function Timeline() {
  const media = useEditor((s) => s.media);
  const clips = useEditor((s) => s.clips);
  const playhead = useEditor((s) => s.playhead);
  const selectedClipId = useEditor((s) => s.selectedClipId);
  const selectedKeyframe = useEditor((s) => s.selectedKeyframe);
  const total = useEditor((s) => s.duration());
  const setPlayhead = useEditor((s) => s.setPlayhead);
  const setPlaying = useEditor((s) => s.pause);
  const selectClip = useEditor((s) => s.selectClip);
  const selectKeyframe = useEditor((s) => s.selectKeyframe);
  const removeClip = useEditor((s) => s.removeClip);
  const duplicateClip = useEditor((s) => s.duplicateClip);
  const splitClip = useEditor((s) => s.splitClip);
  const setClipDuration = useEditor((s) => s.setClipDuration);
  const moveClip = useEditor((s) => s.moveClip);
  const setKeyframeTime = useEditor((s) => s.setKeyframeTime);
  const sortKeyframes = useEditor((s) => s.sortKeyframes);
  const pushHistory = useEditor((s) => s.pushHistory);

  const laneRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<"select" | "razor">("select");
  const [zoom, setZoom] = useState(1);
  const [snap, setSnap] = useState(true);
  const [ctx, setCtx] = useState<{ x: number; y: number; clipId: string } | null>(null);

  const dur = Math.max(1, total);

  const timeAt = (clientX: number): number => {
    const el = laneRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return clamp(((clientX - r.left) / r.width) * dur, 0, dur);
  };

  const snapTime = (t: number, usePlayhead = true): number => {
    if (!snap) return t;
    const w = laneRef.current?.getBoundingClientRect().width ?? 1;
    const th = (8 / w) * dur; // ~8px threshold
    const targets = [0, total];
    if (usePlayhead) targets.push(playhead);
    for (const c of clips) targets.push(c.start, c.start + c.duration);
    let best = t;
    let bestD = th;
    for (const tt of targets) {
      const d = Math.abs(tt - t);
      if (d < bestD) {
        bestD = d;
        best = tt;
      }
    }
    return best;
  };

  const startScrub = (e: React.MouseEvent): void => {
    setPlaying();
    setPlayhead(snapTime(timeAt(e.clientX), false));
    const move = (ev: MouseEvent): void => setPlayhead(snapTime(timeAt(ev.clientX), false));
    const up = (): void => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  // Mouse-down on a clip body: razor splits, else select + (drag = reorder).
  const onClipDown = (e: React.MouseEvent, c: Clip): void => {
    e.stopPropagation();
    setCtx(null);
    if (tool === "razor") {
      selectClip(c.id);
      splitClip(c.id, timeAt(e.clientX));
      return;
    }
    selectClip(c.id);
    const startX = e.clientX;
    let dragging = false;
    const move = (ev: MouseEvent): void => {
      if (!dragging && Math.abs(ev.clientX - startX) < 5) return;
      if (!dragging) pushHistory();
      dragging = true;
      const ms = timeAt(ev.clientX);
      const cur = useEditor.getState().clips;
      let idx = 0;
      for (const o of cur) if (o.id !== c.id && ms > o.start + o.duration / 2) idx++;
      if (idx !== cur.findIndex((x) => x.id === c.id)) moveClip(c.id, idx);
    };
    const up = (): void => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      if (!dragging) setPlayhead(c.start);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const startResize = (e: React.MouseEvent, c: Clip): void => {
    e.stopPropagation();
    pushHistory();
    const startX = e.clientX;
    const startMs = c.duration;
    const w = laneRef.current?.getBoundingClientRect().width ?? 1;
    const move = (ev: MouseEvent): void =>
      setClipDuration(c.id, startMs + ((ev.clientX - startX) / w) * dur);
    const up = (): void => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const startKfDrag = (e: React.MouseEvent, c: Clip, kf: KfRef): void => {
    e.stopPropagation();
    setPlaying();
    selectClip(c.id);
    selectKeyframe({ clipId: c.id, key: kf.key, t: kf.t });
    pushHistory();
    let moved = false;
    const move = (ev: MouseEvent): void => {
      moved = true;
      const local = clamp(snapTime(timeAt(ev.clientX)) - c.start, 0, c.duration);
      setKeyframeTime(c.id, kf.key, kf.index, local);
      setPlayhead(c.start + local);
      selectKeyframe({ clipId: c.id, key: kf.key, t: local });
    };
    const up = (): void => {
      if (moved) sortKeyframes(c.id, kf.key);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const pct = (ms: number): string => `${(ms / dur) * 100}%`;

  return (
    <div
      style={{
        height: 220,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderTop: "1px solid var(--border)",
        background: "var(--bg-1)",
      }}
    >
      {/* Header / toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          height: 28,
          padding: "0 10px",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: "var(--fg-3)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        Timeline
        <ToolBtn on={tool === "select"} onClick={() => setTool("select")} title="Select / move (V)">
          ⬚
        </ToolBtn>
        <ToolBtn on={tool === "razor"} onClick={() => setTool("razor")} title="Razor — click a clip to split (C)">
          ✂
        </ToolBtn>
        <span style={{ width: 1, height: 14, background: "var(--border)", margin: "0 2px" }} />
        <ToolBtn on={snap} onClick={() => setSnap((s) => !s)} title="Snapping">
          🧲
        </ToolBtn>
        <ToolBtn on={false} onClick={() => setZoom((z) => Math.max(1, z / 1.5))} title="Zoom out">
          −
        </ToolBtn>
        <ToolBtn on={false} onClick={() => setZoom(1)} title="Fit">
          Fit
        </ToolBtn>
        <ToolBtn on={false} onClick={() => setZoom((z) => Math.min(20, z * 1.5))} title="Zoom in">
          +
        </ToolBtn>
        <span style={{ marginLeft: "auto", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>
          {clips.length} clip{clips.length === 1 ? "" : "s"} · {fmtTime(total)}
        </span>
      </div>

      <div style={{ flex: 1, overflowX: "auto", overflowY: "hidden" }}>
        <div ref={laneRef} style={{ position: "relative", width: `${zoom * 100}%`, minWidth: "100%", height: "100%" }}>
          {/* Ruler / scrub strip */}
          <div
            onMouseDown={startScrub}
            style={{ height: RULER, position: "relative", borderBottom: "1px solid var(--border)", background: "var(--bg)", cursor: "ew-resize" }}
          >
            {Array.from({ length: MARKS + 1 }).map((_, i) => (
              <div
                key={i}
                style={{ position: "absolute", left: `${(i / MARKS) * 100}%`, top: 0, bottom: 0, borderLeft: "1px solid var(--border)", fontSize: 9, color: "var(--fg-3)", paddingLeft: 3, paddingTop: 5, pointerEvents: "none" }}
              >
                {((i / MARKS) * (total / 1000)).toFixed(1)}s
              </div>
            ))}
          </div>

          {/* Track */}
          <div
            onMouseDown={(e) => e.button === 0 && startScrub(e)}
            style={{ position: "relative", height: TRACK_H, marginTop: 10 }}
          >
            {clips.length === 0 && (
              <p style={{ padding: "20px 12px", fontSize: 11, color: "var(--fg-3)" }}>
                Double-click media in the Media panel to add it. Drag to reorder · ✂ to split · ◆ keyframes appear here.
              </p>
            )}
            {clips.map((c) => {
              const m = media.find((x) => x.id === c.mediaId);
              const active = c.id === selectedClipId;
              const kfs = clipKeyframes(c);
              return (
                <div key={c.id}>
                  <div
                    onMouseDown={(e) => onClipDown(e, c)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      selectClip(c.id);
                      setCtx({ x: e.clientX, y: e.clientY, clipId: c.id });
                    }}
                    style={{
                      position: "absolute",
                      left: pct(c.start),
                      width: pct(c.duration),
                      height: TRACK_H,
                      borderRadius: 6,
                      overflow: "hidden",
                      background: m?.kind === "image" ? `center/cover url(${m.src})` : "var(--bg-2)",
                      border: `2px solid ${active ? "var(--accent)" : "var(--border)"}`,
                      cursor: tool === "razor" ? "crosshair" : "grab",
                      boxShadow: active ? "inset 0 0 0 100px rgba(0,0,0,0.2)" : "inset 0 0 0 100px rgba(0,0,0,0.35)",
                    }}
                  >
                    <div
                      style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "2px 6px", fontSize: 10, color: "#fff", background: "linear-gradient(transparent, rgba(0,0,0,0.7))", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      {m?.kind === "video" ? "🎞 " : ""}
                      {m?.name ?? "missing"} · {fmtTime(c.duration)}
                    </div>
                    <div onMouseDown={(e) => startResize(e, c)} title="Drag to change duration" style={{ position: "absolute", top: 0, right: 0, width: 8, height: "100%", cursor: "ew-resize", background: active ? "var(--accent)" : "transparent", opacity: 0.6 }} />
                  </div>

                  {/* Keyframe diamonds (on top, not clipped by the clip block) */}
                  {kfs.map((kf, i) => {
                    const isSel =
                      selectedKeyframe &&
                      selectedKeyframe.clipId === c.id &&
                      selectedKeyframe.key === kf.key &&
                      Math.abs(selectedKeyframe.t - kf.t) < 1;
                    return (
                      <div
                        key={i}
                        title={`${kf.key} @ ${(kf.t / 1000).toFixed(2)}s — drag to retime`}
                        onMouseDown={(e) => startKfDrag(e, c, kf)}
                        style={{
                          position: "absolute",
                          top: TRACK_H / 2 - 5,
                          left: `calc(${pct(c.start + kf.t)} - 5px)`,
                          width: 10,
                          height: 10,
                          background: isSel ? "var(--accent)" : "#fff",
                          transform: "rotate(45deg)",
                          border: "1px solid rgba(0,0,0,0.6)",
                          cursor: "ew-resize",
                          zIndex: 2,
                        }}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Playhead */}
          <div style={{ position: "absolute", top: 0, bottom: 0, left: pct(playhead), width: 1, background: "var(--accent)", pointerEvents: "none", zIndex: 3 }}>
            <div style={{ position: "absolute", top: 0, left: -4, width: 9, height: 9, background: "var(--accent)", clipPath: "polygon(0 0, 100% 0, 50% 100%)" }} />
          </div>
        </div>
      </div>

      {ctx && (
        <>
          <div onClick={() => setCtx(null)} onContextMenu={(e) => { e.preventDefault(); setCtx(null); }} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div style={{ position: "fixed", left: ctx.x, top: ctx.y, zIndex: 41, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 6, padding: 4, minWidth: 160, boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
            <CtxItem label="Split at playhead" hint="S" onClick={() => { splitClip(ctx.clipId, playhead); setCtx(null); }} />
            <CtxItem label="Duplicate" hint="⌘D" onClick={() => { duplicateClip(ctx.clipId); setCtx(null); }} />
            <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
            <CtxItem label="Delete" hint="⌫" danger onClick={() => { removeClip(ctx.clipId); setCtx(null); }} />
          </div>
        </>
      )}
    </div>
  );
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(v, hi));
}

function ToolBtn({ on, onClick, title, children }: { on: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        background: on ? "var(--accent)" : "var(--bg-2)",
        color: on ? "#fff" : "var(--fg-2)",
        border: "1px solid var(--border)",
        borderRadius: 4,
        fontSize: 11,
        lineHeight: 1,
        padding: "3px 7px",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function CtxItem({ label, hint, danger, onClick }: { label: string; hint?: string; danger?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        width: "100%",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "6px 10px",
        background: "none",
        border: "none",
        borderRadius: 4,
        color: danger ? "#e06c75" : "var(--fg)",
        fontSize: 12,
        cursor: "pointer",
        textAlign: "left",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-1)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
    >
      <span>{label}</span>
      {hint && <span style={{ fontSize: 10, color: "var(--fg-3)" }}>{hint}</span>}
    </button>
  );
}

export default Timeline;
