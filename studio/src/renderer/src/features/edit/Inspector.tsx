import {
  useEditor,
  evalTransform,
  findClip,
  type FitMode,
  type TransformKey,
} from "../../store/editor";
import { EASING_OPTIONS, type EasingName } from "./animate";

const FITS: FitMode[] = ["contain", "cover", "fill"];
const FPS_OPTIONS = [24, 25, 30, 60];

const ROWS: { key: TransformKey; label: string; min: number; max: number; step: number; pct?: boolean; deg?: boolean }[] = [
  { key: "scale", label: "Scale", min: 0.1, max: 4, step: 0.01, pct: true },
  { key: "x", label: "Position X", min: -1, max: 1, step: 0.005, pct: true },
  { key: "y", label: "Position Y", min: -1, max: 1, step: 0.005, pct: true },
  { key: "rotation", label: "Rotation", min: -180, max: 180, step: 1, deg: true },
  { key: "opacity", label: "Opacity", min: 0, max: 1, step: 0.01, pct: true },
];

const PRESETS = [
  { id: "fadeIn", label: "Fade In" },
  { id: "fadeOut", label: "Fade Out" },
  { id: "slideLeft", label: "Slide ←" },
  { id: "slideRight", label: "Slide →" },
  { id: "slideUp", label: "Slide ↑" },
  { id: "slideDown", label: "Slide ↓" },
  { id: "pop", label: "Pop" },
  { id: "spin", label: "Spin" },
];

export function Inspector() {
  const tracks = useEditor((s) => s.tracks);
  const media = useEditor((s) => s.media);
  const comp = useEditor((s) => s.comp);
  const playhead = useEditor((s) => s.playhead);
  const selectedId = useEditor((s) => s.selectedClipId);
  const selectedKeyframe = useEditor((s) => s.selectedKeyframe);
  const updateComp = useEditor((s) => s.updateComp);
  const updateClip = useEditor((s) => s.updateClip);
  const setClipDuration = useEditor((s) => s.setClipDuration);
  const removeClip = useEditor((s) => s.removeClip);
  const applyTransform = useEditor((s) => s.applyTransform);
  const toggleKeyframe = useEditor((s) => s.toggleKeyframe);
  const applyPreset = useEditor((s) => s.applyPreset);
  const resetTransform = useEditor((s) => s.resetTransform);
  const setKeyframeEasing = useEditor((s) => s.setKeyframeEasing);
  const selectKeyframe = useEditor((s) => s.selectKeyframe);
  const pushHistory = useEditor((s) => s.pushHistory);

  const clip = findClip(tracks, selectedId);
  const m = clip ? media.find((x) => x.id === clip.mediaId) : null;
  const isVideo = m?.kind === "video";

  const kfMode = !!(selectedKeyframe && clip && selectedKeyframe.clipId === clip.id);
  let curEase: EasingName = "easeOut";
  if (kfMode && clip) {
    const arr = clip.transform[selectedKeyframe!.key];
    if (Array.isArray(arr)) {
      const k = arr.find((x) => Math.abs(x.t - selectedKeyframe!.t) < 1);
      if (k?.ease) curEase = k.ease;
    }
  }

  return (
    <div
      style={{
        width: 252,
        flexShrink: 0,
        borderLeft: "1px solid var(--border)",
        background: "var(--bg-1)",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      <Section title="Composition">
        <Field label="Background">
          <input
            type="color"
            value={comp.bg}
            onChange={(e) => updateComp({ bg: e.target.value })}
            style={{ width: 36, height: 22, padding: 0, border: "1px solid var(--border)", borderRadius: 4, background: "none", cursor: "pointer" }}
          />
          <span style={{ fontSize: 11, color: "var(--fg-3)" }}>{comp.bg}</span>
        </Field>
        <Field label="Frame rate">
          <select value={comp.fps} onChange={(e) => updateComp({ fps: Number(e.target.value) })} style={selectStyle}>
            {FPS_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f} fps
              </option>
            ))}
          </select>
        </Field>
        <Field label="Canvas">
          <span style={{ fontSize: 11, color: "var(--fg-3)" }}>
            {comp.width}×{comp.height}
          </span>
        </Field>
      </Section>

      {!clip || !m ? (
        <div style={{ padding: 16, fontSize: 11, color: "var(--fg-3)" }}>
          Select a clip on the timeline to edit it.
        </div>
      ) : (
        <>
          {/* Mode banner: keyframe-edit vs full edit */}
          {kfMode && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                fontSize: 11,
                background: "var(--accent)",
                color: "#fff",
              }}
            >
              <span>◆</span>
              <span>
                {selectedKeyframe!.key} @ {(selectedKeyframe!.t / 1000).toFixed(2)}s
              </span>
              <select
                value={curEase}
                onChange={(e) =>
                  setKeyframeEasing(clip.id, selectedKeyframe!.key, selectedKeyframe!.t, e.target.value as EasingName)
                }
                style={{ ...selectStyle, marginLeft: "auto", color: "#000" }}
              >
                {EASING_OPTIONS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
              <button onClick={() => selectKeyframe(null)} style={{ ...miniBtnStyle, width: "auto", padding: "2px 6px" }}>
                ✕
              </button>
            </div>
          )}

          <Section title={`Clip · ${m.name}`}>
            <Field label="Fit">
              <div style={{ display: "flex", gap: 4 }}>
                {FITS.map((f) => {
                  const on = clip.fit === f;
                  return (
                    <button
                      key={f}
                      onClick={() => updateClip(clip.id, { fit: f })}
                      style={{
                        flex: 1,
                        padding: "4px 6px",
                        fontSize: 10.5,
                        textTransform: "capitalize",
                        color: on ? "#fff" : "var(--fg-2)",
                        background: on ? "var(--accent)" : "var(--bg-2)",
                        border: "1px solid var(--border)",
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            </Field>
          </Section>

          <Section title="Transform (◆ = keyframe at playhead)">
            {ROWS.map((r) => {
              const animated = Array.isArray(clip.transform[r.key]);
              const value = evalTransform(clip, r.key, playhead);
              const shown = r.pct ? `${Math.round(value * 100)}%` : r.deg ? `${Math.round(value)}°` : value.toFixed(2);
              return (
                <div key={r.key} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                      title={animated ? "Animated — click to bake to a constant" : "Add keyframe (animate)"}
                      onClick={() => toggleKeyframe(clip.id, r.key)}
                      style={{ width: 16, border: "none", background: "none", cursor: "pointer", color: animated ? "var(--accent)" : "var(--fg-3)", fontSize: 12 }}
                    >
                      {animated ? "◆" : "◇"}
                    </button>
                    <span style={{ fontSize: 11, color: "var(--fg-2)", flex: 1 }}>{r.label}</span>
                    <span style={{ fontSize: 11, color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>{shown}</span>
                  </div>
                  <input
                    type="range"
                    min={r.min}
                    max={r.max}
                    step={r.step}
                    value={value}
                    onPointerDown={pushHistory}
                    onChange={(e) => applyTransform(clip.id, r.key, Number(e.target.value))}
                    style={{ width: "100%", accentColor: "var(--accent)" }}
                  />
                </div>
              );
            })}
            <button onClick={() => resetTransform(clip.id)} style={miniBtnStyle}>
              Reset transform
            </button>
          </Section>

          <Section title="Animate (presets @ playhead)">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {PRESETS.map((p) => (
                <button key={p.id} onClick={() => applyPreset(clip.id, p.id)} style={{ ...miniBtnStyle, width: "auto" }}>
                  {p.label}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Timing">
            <Field label="Duration (s)">
              <input
                type="number"
                min={0.2}
                step={0.1}
                value={(clip.duration / 1000).toFixed(1)}
                onChange={(e) => setClipDuration(clip.id, Number(e.target.value) * 1000)}
                style={numStyle}
              />
            </Field>
            {isVideo && (
              <Field label="Trim start (s)">
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={(clip.trimStart / 1000).toFixed(1)}
                  onChange={(e) =>
                    updateClip(clip.id, { trimStart: Math.max(0, Math.round(Number(e.target.value) * 1000)) })
                  }
                  style={numStyle}
                />
              </Field>
            )}
            <button onClick={() => removeClip(clip.id)} style={{ ...miniBtnStyle, color: "#e06c75" }}>
              Remove clip
            </button>
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: 12, borderBottom: "1px solid var(--border)" }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--fg-3)", marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <span style={{ fontSize: 11, color: "var(--fg-2)" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>{children}</div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--fg)",
  background: "var(--bg-2)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  padding: "2px 4px",
};

const numStyle: React.CSSProperties = {
  width: 64,
  fontSize: 11,
  color: "var(--fg)",
  background: "var(--bg-2)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  padding: "3px 6px",
};

const miniBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  fontSize: 11,
  color: "var(--fg-2)",
  background: "var(--bg-2)",
  border: "1px solid var(--border)",
  borderRadius: 5,
  cursor: "pointer",
};

export default Inspector;
