import { useRef, useState } from "react";
import { useEditor, allClips, type Clip, type Track, type TransformKey } from "../../store/editor";
import { fmtTime } from "./PreviewMonitor";

const HEADER_W = 116;
const RULER_H = 22;
const TRACK_H = 58;
const AUDIO_H = 34;
const BASE_PXMS = 0.06; // px per ms at zoom 1
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

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(v, hi));

export function Timeline() {
  const media = useEditor((s) => s.media);
  const tracks = useEditor((s) => s.tracks);
  const audio = useEditor((s) => s.audio);
  const playhead = useEditor((s) => s.playhead);
  const selectedClipId = useEditor((s) => s.selectedClipId);
  const selectedKeyframe = useEditor((s) => s.selectedKeyframe);
  const total = useEditor((s) => s.duration());
  const setPlayhead = useEditor((s) => s.setPlayhead);
  const pausePlay = useEditor((s) => s.pause);
  const selectClip = useEditor((s) => s.selectClip);
  const selectKeyframe = useEditor((s) => s.selectKeyframe);
  const removeClip = useEditor((s) => s.removeClip);
  const duplicateClip = useEditor((s) => s.duplicateClip);
  const splitClip = useEditor((s) => s.splitClip);
  const setClipDuration = useEditor((s) => s.setClipDuration);
  const placeClip = useEditor((s) => s.placeClip);
  const updateClip = useEditor((s) => s.updateClip);
  const setKeyframeTime = useEditor((s) => s.setKeyframeTime);
  const sortKeyframes = useEditor((s) => s.sortKeyframes);
  const pushHistory = useEditor((s) => s.pushHistory);
  const addTrack = useEditor((s) => s.addTrack);
  const removeTrack = useEditor((s) => s.removeTrack);
  const toggleTrack = useEditor((s) => s.toggleTrack);
  const addTextClip = useEditor((s) => s.addTextClip);

  const scrollRef = useRef<HTMLDivElement>(null);
  const laneRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [tool, setTool] = useState<"select" | "razor">("select");
  const [zoom, setZoom] = useState(1);
  const [snap, setSnap] = useState(true);
  const [ctx, setCtx] = useState<{ x: number; y: number; clipId: string } | null>(null);

  const pxMs = BASE_PXMS * zoom;
  const contentW = Math.max(900, (total + 4000) * pxMs);

  // Absolute ms at a given screen X (accounts for the sticky header + scroll).
  const timeAt = (clientX: number): number => {
    const el = scrollRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return Math.max(0, (clientX - r.left - HEADER_W + el.scrollLeft) / pxMs);
  };

  // Which track lane (id) is under a screen Y, or null.
  const trackAt = (clientY: number): string | null => {
    for (const [id, el] of Object.entries(laneRefs.current)) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (clientY >= r.top && clientY <= r.bottom) return id;
    }
    return null;
  };

  const snapTime = (t: number, usePlayhead = true): number => {
    if (!snap) return t;
    const th = 8 / pxMs; // ~8px worth of ms
    const targets = [0, total];
    if (usePlayhead) targets.push(playhead);
    for (const c of allClips(tracks)) targets.push(c.start, c.start + c.duration);
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
    if (e.button !== 0) return;
    pausePlay();
    setPlayhead(snapTime(timeAt(e.clientX), false));
    const move = (ev: MouseEvent): void => setPlayhead(snapTime(timeAt(ev.clientX), false));
    const up = (): void => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  // Drag a clip: horizontal = retime, vertical = move to another track.
  const onClipDown = (e: React.MouseEvent, c: Clip, track: Track): void => {
    e.stopPropagation();
    setCtx(null);
    if (track.locked) return;
    if (tool === "razor") {
      selectClip(c.id);
      splitClip(c.id, timeAt(e.clientX));
      return;
    }
    selectClip(c.id);
    const grabMs = timeAt(e.clientX) - c.start;
    const startX = e.clientX;
    let dragging = false;
    const move = (ev: MouseEvent): void => {
      if (!dragging && Math.abs(ev.clientX - startX) < 5) return;
      if (!dragging) pushHistory();
      dragging = true;
      const start = snapTime(timeAt(ev.clientX) - grabMs);
      const destId = trackAt(ev.clientY) ?? track.id;
      const dest = useEditor.getState().tracks.find((t) => t.id === destId);
      placeClip(c.id, dest && !dest.locked ? destId : track.id, start);
    };
    const up = (): void => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  // Resize a clip edge. "end" changes duration; "start" trims the in-point.
  const startResize = (e: React.MouseEvent, c: Clip, edge: "start" | "end"): void => {
    e.stopPropagation();
    const m = media.find((x) => x.id === c.mediaId);
    const isVideo = m?.kind === "video";
    pushHistory();
    const move = (ev: MouseEvent): void => {
      const at = snapTime(timeAt(ev.clientX));
      if (edge === "end") {
        setClipDuration(c.id, at - c.start);
      } else {
        const newStart = clamp(at, 0, c.start + c.duration - 200);
        const delta = newStart - c.start;
        updateClip(c.id, {
          start: newStart,
          duration: c.duration - delta,
          trimStart: isVideo ? Math.max(0, c.trimStart + delta) : c.trimStart,
        });
      }
    };
    const up = (): void => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const startKfDrag = (e: React.MouseEvent, c: Clip, kf: KfRef): void => {
    e.stopPropagation();
    pausePlay();
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

  // Top track composites on top → show it as the top row.
  const rows = [...tracks].reverse();
  const clipCount = allClips(tracks).length;

  return (
    <div
      style={{
        height: 248,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderTop: "1px solid var(--border)",
        background: "var(--bg-1)",
      }}
    >
      {/* Toolbar */}
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
        <Sep />
        <ToolBtn on={snap} onClick={() => setSnap((s) => !s)} title="Snapping">
          🧲
        </ToolBtn>
        <ToolBtn on={false} onClick={() => setZoom((z) => Math.max(0.25, z / 1.5))} title="Zoom out">
          −
        </ToolBtn>
        <ToolBtn on={false} onClick={() => setZoom(1)} title="Reset zoom">
          1×
        </ToolBtn>
        <ToolBtn on={false} onClick={() => setZoom((z) => Math.min(20, z * 1.5))} title="Zoom in">
          +
        </ToolBtn>
        <Sep />
        <ToolBtn on={false} onClick={() => addTextClip()} title="Add a text / caption layer (T)">
          + Text
        </ToolBtn>
        <ToolBtn on={false} onClick={addTrack} title="Add a track">
          + Track
        </ToolBtn>
        <span style={{ marginLeft: "auto", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>
          {tracks.length} track{tracks.length === 1 ? "" : "s"} · {clipCount} clip{clipCount === 1 ? "" : "s"} ·{" "}
          {fmtTime(total)}
        </span>
      </div>

      {/* Scroll area: ruler + track lanes (sticky headers) */}
      <div ref={scrollRef} style={{ flex: 1, overflow: "auto" }}>
        <div style={{ position: "relative", width: HEADER_W + contentW }}>
          {/* Ruler */}
          <div style={{ display: "flex", height: RULER_H, position: "sticky", top: 0, zIndex: 5 }}>
            <div
              style={{
                width: HEADER_W,
                flexShrink: 0,
                position: "sticky",
                left: 0,
                zIndex: 6,
                background: "var(--bg)",
                borderRight: "1px solid var(--border)",
                borderBottom: "1px solid var(--border)",
              }}
            />
            <div
              onMouseDown={startScrub}
              style={{
                position: "relative",
                width: contentW,
                background: "var(--bg)",
                borderBottom: "1px solid var(--border)",
                cursor: "ew-resize",
              }}
            >
              {ticks(pxMs, contentW).map((tk) => (
                <div
                  key={tk}
                  style={{
                    position: "absolute",
                    left: tk * pxMs,
                    top: 0,
                    bottom: 0,
                    borderLeft: "1px solid var(--border)",
                    fontSize: 9,
                    color: "var(--fg-3)",
                    paddingLeft: 3,
                    paddingTop: 4,
                    pointerEvents: "none",
                  }}
                >
                  {(tk / 1000).toFixed(tk % 1000 === 0 ? 0 : 1)}s
                </div>
              ))}
            </div>
          </div>

          {/* Track rows (top track first) */}
          {rows.map((track) => (
            <div key={track.id} style={{ display: "flex", height: TRACK_H, borderBottom: "1px solid var(--border)" }}>
              {/* Sticky header */}
              <div
                style={{
                  width: HEADER_W,
                  flexShrink: 0,
                  position: "sticky",
                  left: 0,
                  zIndex: 4,
                  background: "var(--bg-2)",
                  borderRight: "1px solid var(--border)",
                  padding: "4px 6px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span
                    style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {track.name}
                  </span>
                  <MiniToggle on={track.solo} onClick={() => toggleTrack(track.id, "solo")} title="Solo">
                    ◉
                  </MiniToggle>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <MiniToggle on={track.hidden} onClick={() => toggleTrack(track.id, "hidden")} title="Hide / show">
                    {track.hidden ? "🚫" : "👁"}
                  </MiniToggle>
                  <MiniToggle on={track.locked} onClick={() => toggleTrack(track.id, "locked")} title="Lock">
                    🔒
                  </MiniToggle>
                  <span style={{ flex: 1 }} />
                  {tracks.length > 1 && (
                    <MiniToggle on={false} onClick={() => removeTrack(track.id)} title="Delete track">
                      ✕
                    </MiniToggle>
                  )}
                </div>
              </div>

              {/* Lane */}
              <div
                ref={(el) => {
                  laneRefs.current[track.id] = el;
                }}
                onMouseDown={startScrub}
                style={{
                  position: "relative",
                  width: contentW,
                  background: track.hidden
                    ? "repeating-linear-gradient(45deg,var(--bg),var(--bg) 6px,var(--bg-1) 6px,var(--bg-1) 12px)"
                    : "var(--bg)",
                  opacity: track.locked ? 0.6 : 1,
                }}
              >
                {track.clips.map((c) => {
                  const isText = c.type === "text";
                  const m = media.find((x) => x.id === c.mediaId);
                  const active = c.id === selectedClipId;
                  const clipBg = isText
                    ? "linear-gradient(180deg,#5a4a8f,#3d3168)"
                    : m?.kind === "image"
                      ? `center/cover url(${m.src})`
                      : "var(--bg-2)";
                  return (
                    <div key={c.id}>
                      <div
                        onMouseDown={(e) => onClipDown(e, c, track)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          selectClip(c.id);
                          setCtx({ x: e.clientX, y: e.clientY, clipId: c.id });
                        }}
                        style={{
                          position: "absolute",
                          left: c.start * pxMs,
                          top: 4,
                          width: Math.max(8, c.duration * pxMs),
                          height: TRACK_H - 8,
                          borderRadius: 5,
                          overflow: "hidden",
                          background: clipBg,
                          border: `2px solid ${active ? "var(--accent)" : "var(--border)"}`,
                          cursor: track.locked ? "default" : tool === "razor" ? "crosshair" : "grab",
                          boxShadow: active
                            ? "inset 0 0 0 200px rgba(0,0,0,0.18)"
                            : "inset 0 0 0 200px rgba(0,0,0,0.34)",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: 0,
                            padding: "1px 5px",
                            fontSize: 9.5,
                            color: "#fff",
                            background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {isText ? `T ${c.text?.content ?? ""}` : `${m?.kind === "video" ? "🎞 " : ""}${m?.name ?? "missing"}`}
                        </div>
                        {!track.locked && (
                          <>
                            <div
                              onMouseDown={(e) => startResize(e, c, "start")}
                              title="Trim start"
                              style={{ position: "absolute", top: 0, left: 0, width: 7, height: "100%", cursor: "ew-resize" }}
                            />
                            <div
                              onMouseDown={(e) => startResize(e, c, "end")}
                              title="Trim end / duration"
                              style={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                width: 7,
                                height: "100%",
                                cursor: "ew-resize",
                                background: active ? "var(--accent)" : "transparent",
                                opacity: 0.6,
                              }}
                            />
                          </>
                        )}
                      </div>

                      {/* Keyframe diamonds */}
                      {!track.locked &&
                        clipKeyframes(c).map((kf, i) => {
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
                                left: (c.start + kf.t) * pxMs - 5,
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
            </div>
          ))}

          {/* Audio lane (read-only for now — editable in a later stage) */}
          <div style={{ display: "flex", height: AUDIO_H, borderBottom: "1px solid var(--border)" }}>
            <div
              style={{
                width: HEADER_W,
                flexShrink: 0,
                position: "sticky",
                left: 0,
                zIndex: 4,
                background: "var(--bg-2)",
                borderRight: "1px solid var(--border)",
                padding: "0 6px",
                display: "flex",
                alignItems: "center",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--fg-3)",
              }}
            >
              🎵 Audio
            </div>
            <div style={{ position: "relative", width: contentW, background: "var(--bg)" }}>
              {audio && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 4,
                    height: AUDIO_H - 10,
                    width: (audio.duration ?? total) * pxMs || contentW,
                    borderRadius: 4,
                    background: "linear-gradient(180deg,#2a6f5a,#1d4f40)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 6px",
                    fontSize: 10,
                    color: "#cfe",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                  }}
                >
                  {audio.name}
                </div>
              )}
            </div>
          </div>

          {/* Playhead across all lanes */}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: HEADER_W + playhead * pxMs,
              width: 1,
              background: "var(--accent)",
              pointerEvents: "none",
              zIndex: 7,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: -4,
                width: 9,
                height: 9,
                background: "var(--accent)",
                clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              }}
            />
          </div>
        </div>
      </div>

      {ctx && (
        <>
          <div
            onClick={() => setCtx(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setCtx(null);
            }}
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
          />
          <div
            style={{
              position: "fixed",
              left: ctx.x,
              top: ctx.y,
              zIndex: 41,
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: 4,
              minWidth: 160,
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            }}
          >
            <CtxItem
              label="Split at playhead"
              hint="S"
              onClick={() => {
                splitClip(ctx.clipId, playhead);
                setCtx(null);
              }}
            />
            <CtxItem
              label="Duplicate"
              hint="⌘D"
              onClick={() => {
                duplicateClip(ctx.clipId);
                setCtx(null);
              }}
            />
            <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
            <CtxItem
              label="Delete"
              hint="⌫"
              danger
              onClick={() => {
                removeClip(ctx.clipId);
                setCtx(null);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

// Evenly spaced "nice" tick times across the visible content.
function ticks(pxMs: number, contentW: number): number[] {
  const spanMs = contentW / pxMs;
  const raw = spanMs / 10; // aim for ~10 labels
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 5, 10].map((n) => n * pow).find((n) => n >= raw) ?? pow * 10;
  const out: number[] = [];
  for (let t = 0; t <= spanMs; t += step) out.push(Math.round(t));
  return out;
}

function Sep() {
  return <span style={{ width: 1, height: 14, background: "var(--border)", margin: "0 2px" }} />;
}

function ToolBtn({
  on,
  onClick,
  title,
  children,
}: {
  on: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
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

function MiniToggle({
  on,
  onClick,
  title,
  children,
}: {
  on: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 18,
        height: 16,
        fontSize: 9.5,
        lineHeight: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: on ? "var(--accent)" : "transparent",
        color: on ? "#fff" : "var(--fg-3)",
        border: "1px solid var(--border)",
        borderRadius: 3,
        cursor: "pointer",
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}

function CtxItem({
  label,
  hint,
  danger,
  onClick,
}: {
  label: string;
  hint?: string;
  danger?: boolean;
  onClick: () => void;
}) {
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
