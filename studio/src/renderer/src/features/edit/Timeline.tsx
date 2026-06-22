import { useRef } from "react";
import { useEditor } from "../../store/editor";
import { fmtTime } from "./PreviewMonitor";

const PX_PER_MS = 0.06; // 60px per second
const TRACK_H = 64;

export function Timeline() {
  const media = useEditor((s) => s.media);
  const clips = useEditor((s) => s.clips);
  const playhead = useEditor((s) => s.playhead);
  const selectedClipId = useEditor((s) => s.selectedClipId);
  const duration = useEditor((s) => s.duration());
  const setPlayhead = useEditor((s) => s.setPlayhead);
  const selectClip = useEditor((s) => s.selectClip);
  const removeClip = useEditor((s) => s.removeClip);
  const setClipDuration = useEditor((s) => s.setClipDuration);

  const laneRef = useRef<HTMLDivElement>(null);

  const scrubTo = (clientX: number): void => {
    const el = laneRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left + el.scrollLeft;
    setPlayhead(x / PX_PER_MS);
  };

  const startResize = (e: React.PointerEvent, id: string, startMs: number): void => {
    e.stopPropagation();
    const startX = e.clientX;
    const move = (ev: PointerEvent): void =>
      setClipDuration(id, startMs + (ev.clientX - startX) / PX_PER_MS);
    const up = (): void => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const contentW = Math.max(800, duration * PX_PER_MS + 200);

  return (
    <div
      style={{
        height: 200,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderTop: "1px solid var(--border)",
        background: "var(--bg-1)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: 26,
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
        <span style={{ marginLeft: "auto", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>
          {clips.length} clip{clips.length === 1 ? "" : "s"} · {fmtTime(duration)}
        </span>
      </div>

      <div ref={laneRef} style={{ flex: 1, overflowX: "auto", overflowY: "hidden", position: "relative" }}>
        <div style={{ position: "relative", width: contentW, height: "100%" }}>
          {/* Ruler / scrub strip */}
          <div
            onPointerDown={(e) => scrubTo(e.clientX)}
            style={{
              height: 22,
              borderBottom: "1px solid var(--border)",
              background: "var(--bg)",
              cursor: "text",
            }}
          />

          {/* Track */}
          <div
            onPointerDown={(e) => scrubTo(e.clientX)}
            style={{ position: "relative", height: TRACK_H, marginTop: 10 }}
          >
            {clips.length === 0 && (
              <p style={{ padding: "20px 12px", fontSize: 11, color: "var(--fg-3)" }}>
                Double-click an image in the Media panel to add it here.
              </p>
            )}
            {clips.map((c) => {
              const m = media.find((x) => x.id === c.mediaId);
              const active = c.id === selectedClipId;
              return (
                <div
                  key={c.id}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    selectClip(c.id);
                    setPlayhead(c.start);
                  }}
                  style={{
                    position: "absolute",
                    left: c.start * PX_PER_MS,
                    width: Math.max(8, c.duration * PX_PER_MS),
                    height: TRACK_H,
                    borderRadius: 6,
                    overflow: "hidden",
                    background:
                      m?.kind === "image" ? `center/cover url(${m.src})` : "var(--bg-2)",
                    border: `2px solid ${active ? "var(--accent)" : "var(--border)"}`,
                    cursor: "pointer",
                    boxShadow: "inset 0 0 0 100px rgba(0,0,0,0.35)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      padding: "2px 6px",
                      fontSize: 10,
                      color: "#fff",
                      background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {m?.kind === "video" ? "🎞 " : ""}
                    {m?.name ?? "missing"} · {fmtTime(c.duration)}
                  </div>
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => removeClip(c.id)}
                    title="Remove clip"
                    style={{
                      position: "absolute",
                      top: 2,
                      right: 2,
                      width: 16,
                      height: 16,
                      fontSize: 11,
                      lineHeight: 1,
                      color: "#fff",
                      background: "rgba(0,0,0,0.5)",
                      border: "none",
                      borderRadius: 3,
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                  {/* Resize handle */}
                  <div
                    onPointerDown={(e) => startResize(e, c.id, c.duration)}
                    title="Drag to change duration"
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: 8,
                      height: "100%",
                      cursor: "ew-resize",
                      background: active ? "var(--accent)" : "transparent",
                      opacity: 0.6,
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Playhead */}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: playhead * PX_PER_MS,
              width: 1,
              background: "var(--accent)",
              pointerEvents: "none",
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
    </div>
  );
}

export default Timeline;
