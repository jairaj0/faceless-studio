import { useRef, useState } from "react";
import type { Layer } from "../../scene/types";
import { PanelFrame } from "../PanelFrame";
import { ToolsPalette } from "../ToolsPalette";
import { ContextMenu } from "../Menu";
import { useEditor, type TransformKey } from "../../store/editorStore";

function layerColor(type: Layer["type"]): string {
  switch (type) {
    case "text":
      return "var(--c-text)";
    case "image":
    case "svg":
      return "var(--c-video)";
    default:
      return "var(--c-shape)";
  }
}

interface KfRef {
  key: TransformKey;
  index: number;
  t: number;
}

function layerKeyframes(layer: Layer): KfRef[] {
  const tf = layer.transform;
  if (!tf) return [];
  const out: KfRef[] = [];
  for (const [key, val] of Object.entries(tf)) {
    if (Array.isArray(val)) {
      val.forEach((kf, index) => out.push({ key: key as TransformKey, index, t: kf.t }));
    }
  }
  return out;
}

const RULER = 24;
const ROW = 34;
const HEAD = 150;
const MARKS = 8;

export function TimelinePanel({
  activeTool,
  onTool,
}: {
  activeTool: string;
  onTool: (id: string) => void;
}) {
  const scene = useEditor((s) => s.scene);
  const time = useEditor((s) => s.time);
  const selectedId = useEditor((s) => s.selectedId);
  const selectedKeyframe = useEditor((s) => s.selectedKeyframe);
  const select = useEditor((s) => s.select);
  const selectKeyframe = useEditor((s) => s.selectKeyframe);
  const setTime = useEditor((s) => s.setTime);
  const setPlaying = useEditor((s) => s.setPlaying);
  const pushHistory = useEditor((s) => s.pushHistory);
  const setKeyframeTime = useEditor((s) => s.setKeyframeTime);
  const sortKeyframes = useEditor((s) => s.sortKeyframes);
  const splitLayer = useEditor((s) => s.splitLayer);
  const moveLayerTime = useEditor((s) => s.moveLayerTime);
  const setLayerBound = useEditor((s) => s.setLayerBound);
  const duplicateSelected = useEditor((s) => s.duplicateSelected);
  const copySelected = useEditor((s) => s.copySelected);
  const removeSelected = useEditor((s) => s.removeSelected);

  const dur = scene.duration;
  const laneRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [snap, setSnap] = useState(true);
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null);

  const snapTime = (t: number, excludeId?: string, usePlayhead = true): number => {
    if (!snap) return t;
    const w = laneRef.current?.getBoundingClientRect().width ?? 1;
    const thMs = (10 / w) * dur;
    const targets = [0, dur];
    if (usePlayhead) targets.push(time);
    for (const l of scene.layers) {
      if (l.id === excludeId) continue;
      targets.push(l.start ?? 0, l.end ?? dur);
    }
    let best = t;
    let bestD = thMs;
    for (const tt of targets) {
      const d = Math.abs(tt - t);
      if (d < bestD) {
        bestD = d;
        best = tt;
      }
    }
    return best;
  };

  const onClipDown = (e: React.MouseEvent, layerId: string) => {
    e.stopPropagation();
    select(layerId);
    if (activeTool === "razor") {
      splitLayer(layerId, timeAt(e.clientX));
      return;
    }
    const layer = scene.layers.find((l) => l.id === layerId);
    const baseStart = layer?.start ?? 0;
    const startX = e.clientX;
    const w = laneRef.current?.getBoundingClientRect().width ?? 1;
    let last = 0;
    let moved = false;
    const move = (ev: MouseEvent) => {
      if (!moved) {
        pushHistory();
        moved = true;
      }
      const raw = ((ev.clientX - startX) / w) * dur;
      const snappedStart = snapTime(baseStart + raw, layerId);
      const delta = snappedStart - baseStart;
      moveLayerTime(layerId, delta - last);
      last = delta;
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const onTrimDown = (
    e: React.MouseEvent,
    layerId: string,
    which: "start" | "end",
  ) => {
    e.stopPropagation();
    select(layerId);
    let moved = false;
    const move = (ev: MouseEvent) => {
      if (!moved) {
        pushHistory();
        moved = true;
      }
      setLayerBound(layerId, which, snapTime(timeAt(ev.clientX), layerId));
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const timeAt = (clientX: number) => {
    const el = laneRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return Math.min(dur, Math.max(0, ((clientX - r.left) / r.width) * dur));
  };

  // Smooth playhead scrub (drag), like the preview slider.
  const startScrub = (e: React.MouseEvent) => {
    setPlaying(false);
    setTime(snapTime(timeAt(e.clientX), undefined, false));
    const move = (ev: MouseEvent) =>
      setTime(snapTime(timeAt(ev.clientX), undefined, false));
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  // Drag a keyframe diamond to retime it.
  const startKfDrag = (
    e: React.MouseEvent,
    layerId: string,
    kf: KfRef,
  ) => {
    e.stopPropagation();
    setPlaying(false);
    select(layerId);
    selectKeyframe({ layerId, key: kf.key, t: kf.t });
    setTime(kf.t);
    pushHistory();
    let moved = false;
    const move = (ev: MouseEvent) => {
      moved = true;
      const nt = snapTime(timeAt(ev.clientX), undefined, false);
      setKeyframeTime(layerId, kf.key, kf.index, nt);
      setTime(nt);
      selectKeyframe({ layerId, key: kf.key, t: nt });
    };
    const up = () => {
      if (moved) sortKeyframes(layerId, kf.key);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const playheadPct = (time / dur) * 100;

  return (
    <PanelFrame
      tabs={[{ id: "tl", label: "Timeline: Main" }]}
      rightSlot={
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            data-tip="Snap"
            onClick={() => setSnap((s) => !s)}
            style={{ background: snap ? "var(--accent)" : "var(--bg-2)", color: snap ? "#fff" : "var(--fg-2)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 11, padding: "2px 6px", cursor: "pointer" }}
          >
            🧲
          </button>
          <button data-tip="Zoom out" onClick={() => setZoom((z) => Math.max(1, z / 1.5))} style={{ background: "var(--bg-2)", color: "var(--fg-2)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 11, padding: "2px 7px", cursor: "pointer" }}>−</button>
          <button data-tip="Fit" onClick={() => setZoom(1)} style={{ background: "var(--bg-2)", color: "var(--fg-2)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 10, padding: "2px 6px", cursor: "pointer" }}>Fit</button>
          <button data-tip="Zoom in" onClick={() => setZoom((z) => Math.min(20, z * 1.5))} style={{ background: "var(--bg-2)", color: "var(--fg-2)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 11, padding: "2px 7px", cursor: "pointer" }}>+</button>
        </div>
      }
    >
      <div style={{ display: "flex", height: "100%", minHeight: 0 }}>
        <ToolsPalette active={activeTool} onSelect={onTool} />

        <div style={{ flex: 1, minWidth: 0, display: "flex", background: "var(--stage)" }}>
          {/* Left: track headers */}
          <div style={{ width: HEAD, flexShrink: 0, background: "var(--bg-1)", borderRight: "1px solid var(--border)" }}>
            <div style={{ height: RULER, borderBottom: "1px solid var(--border)" }} />
            {scene.layers.map((l) => (
              <div
                key={l.id}
                onClick={() => select(l.id)}
                style={{
                  height: ROW,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 10px",
                  fontSize: 11,
                  color: l.id === selectedId ? "var(--fg)" : "var(--fg-2)",
                  background: l.id === selectedId ? "var(--selected)" : "transparent",
                  borderBottom: "1px solid var(--border)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {l.name}
              </div>
            ))}
            {scene.audio && (
              <div
                style={{
                  height: ROW,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "0 10px",
                  fontSize: 11,
                  color: "var(--fg-2)",
                  borderBottom: "1px solid var(--border)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                🔊 {scene.audio.name}
              </div>
            )}
          </div>

          {/* Right: lanes + playhead (zoomable, horizontally scrollable) */}
          <div style={{ flex: 1, overflowX: "auto", overflowY: "hidden" }}>
          <div ref={laneRef} style={{ position: "relative", width: `${zoom * 100}%`, minWidth: "100%" }}>
            {/* ruler — drag to scrub */}
            <div
              onMouseDown={startScrub}
              style={{
                height: RULER,
                position: "relative",
                borderBottom: "1px solid var(--border)",
                background: "var(--bg-1)",
                cursor: "ew-resize",
              }}
            >
              {Array.from({ length: MARKS + 1 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${(i / MARKS) * 100}%`,
                    top: 0,
                    bottom: 0,
                    borderLeft: "1px solid var(--border)",
                    fontSize: 9,
                    color: "var(--fg-3)",
                    paddingLeft: 3,
                    paddingTop: 6,
                    pointerEvents: "none",
                  }}
                >
                  {((i / MARKS) * (dur / 1000)).toFixed(1)}s
                </div>
              ))}
            </div>

            {/* lanes */}
            {scene.layers.map((l) => {
              const start = l.start ?? 0;
              const end = l.end ?? dur;
              const kfs = layerKeyframes(l);
              const sel = l.id === selectedId;
              return (
                <div
                  key={l.id}
                  onClick={() => select(l.id)}
                  style={{ height: ROW, position: "relative", borderBottom: "1px solid var(--border)" }}
                >
                  <div
                    onMouseDown={(e) => onClipDown(e, l.id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      select(l.id);
                      setCtx({ x: e.clientX, y: e.clientY });
                    }}
                    style={{
                      position: "absolute",
                      top: 5,
                      bottom: 5,
                      left: `${(start / dur) * 100}%`,
                      width: `${((end - start) / dur) * 100}%`,
                      background: layerColor(l.type),
                      borderRadius: 4,
                      opacity: sel ? 1 : 0.8,
                      outline: sel ? "1px solid #fff" : "none",
                      cursor: activeTool === "razor" ? "crosshair" : "grab",
                    }}
                  >
                    <div
                      onMouseDown={(e) => onTrimDown(e, l.id, "start")}
                      style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 7, cursor: "ew-resize" }}
                    />
                    <div
                      onMouseDown={(e) => onTrimDown(e, l.id, "end")}
                      style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 7, cursor: "ew-resize" }}
                    />
                  </div>
                  {kfs.map((kf, i) => {
                    const isSel =
                      selectedKeyframe &&
                      selectedKeyframe.layerId === l.id &&
                      selectedKeyframe.key === kf.key &&
                      Math.abs(selectedKeyframe.t - kf.t) < 1;
                    return (
                      <div
                        key={i}
                        data-tip={`${kf.key} @ ${(kf.t / 1000).toFixed(2)}s — drag to retime`}
                        onMouseDown={(e) => startKfDrag(e, l.id, kf)}
                        style={{
                          position: "absolute",
                          top: ROW / 2 - 6,
                          left: `calc(${(kf.t / dur) * 100}% - 6px)`,
                          width: 12,
                          height: 12,
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

            {/* audio lane */}
            {scene.audio && (
              <div style={{ height: ROW, position: "relative", borderBottom: "1px solid var(--border)" }}>
                <div
                  style={{
                    position: "absolute",
                    top: 5,
                    bottom: 5,
                    left: 0,
                    right: 0,
                    background: "var(--c-audio)",
                    opacity: 0.85,
                    borderRadius: 4,
                    backgroundImage:
                      "repeating-linear-gradient(90deg, rgba(0,0,0,0.28) 0 1px, transparent 1px 4px)",
                  }}
                />
              </div>
            )}

            {/* playhead */}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${playheadPct}%`,
                width: 2,
                background: "var(--accent)",
                pointerEvents: "none",
                zIndex: 3,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: -5,
                  width: 12,
                  height: 8,
                  background: "var(--accent)",
                  clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                }}
              />
            </div>
          </div>
          </div>
        </div>
      </div>

      {ctx && (
        <ContextMenu
          x={ctx.x}
          y={ctx.y}
          onClose={() => setCtx(null)}
          items={[
            { label: "Split at playhead", shortcut: "S", onClick: () => selectedId && splitLayer(selectedId, time) },
            { label: "Duplicate", shortcut: "⌘D", onClick: duplicateSelected },
            { label: "Copy", shortcut: "⌘C", onClick: copySelected },
            { separator: true },
            { label: "Delete", shortcut: "⌫", onClick: removeSelected },
          ]}
        />
      )}
    </PanelFrame>
  );
}

export default TimelinePanel;
