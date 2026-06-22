import {
  useEditor,
  evalTransform,
  findClip,
  DEFAULT_FILTERS,
  FILTER_PRESETS,
  DEFAULT_TRANSITION,
  type FitMode,
  type FilterSpec,
  type TransformKey,
  type TransitionSpec,
  type TransitionType,
  type TransitionDir,
} from "../../store/editor";
import { EASING_OPTIONS, type EasingName } from "./animate";

const COLOR_ROWS: { key: keyof FilterSpec; label: string; min: number; max: number; step: number; mid: number }[] = [
  { key: "brightness", label: "Brightness", min: 0, max: 2, step: 0.01, mid: 1 },
  { key: "contrast", label: "Contrast", min: 0, max: 2, step: 0.01, mid: 1 },
  { key: "saturate", label: "Saturation", min: 0, max: 3, step: 0.01, mid: 1 },
  { key: "hue", label: "Hue", min: -180, max: 180, step: 1, mid: 0 },
  { key: "blur", label: "Blur", min: 0, max: 0.05, step: 0.001, mid: 0 },
];

const FITS: FitMode[] = ["contain", "cover", "fill"];
const FPS_OPTIONS = [24, 25, 30, 60];
const FONTS = [
  { label: "Sans", value: "Inter, system-ui, sans-serif" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Mono", value: "'SF Mono', Menlo, monospace" },
];
const ALIGNS: ("left" | "center" | "right")[] = ["left", "center", "right"];
const TRANS_TYPES: { id: TransitionType | "none"; label: string }[] = [
  { id: "none", label: "None" },
  { id: "fade", label: "Fade" },
  { id: "slide", label: "Slide" },
  { id: "wipe", label: "Wipe" },
];
const TRANS_DIRS: TransitionDir[] = ["left", "right", "up", "down"];
const DIR_ARROW: Record<TransitionDir, string> = { left: "⬅", right: "➡", up: "⬆", down: "⬇" };

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
  const audio = useEditor((s) => s.audio);
  const audioMix = useEditor((s) => s.audioMix);
  const setAudioMix = useEditor((s) => s.setAudioMix);
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
  const updateText = useEditor((s) => s.updateText);
  const updateFilters = useEditor((s) => s.updateFilters);
  const applyFilterPreset = useEditor((s) => s.applyFilterPreset);
  const setTransition = useEditor((s) => s.setTransition);
  const pushHistory = useEditor((s) => s.pushHistory);

  const clip = findClip(tracks, selectedId);
  const isText = clip?.type === "text";
  const m = clip && !isText ? media.find((x) => x.id === clip.mediaId) : null;
  const isVideo = m?.kind === "video";
  const txt = clip?.text;

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

      {audio && (
        <Section title={`Audio · ${audio.name}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "var(--fg-2)", flex: 1 }}>Volume</span>
              <span style={{ fontSize: 11, color: "var(--fg-3)" }}>{Math.round(audioMix.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1.5}
              step={0.01}
              value={audioMix.volume}
              onPointerDown={pushHistory}
              onChange={(e) => setAudioMix({ volume: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "var(--accent)" }}
            />
          </div>
          <Field label="Fade in (s)">
            <input
              type="number"
              min={0}
              step={0.1}
              value={(audioMix.fadeIn / 1000).toFixed(1)}
              onChange={(e) => setAudioMix({ fadeIn: Math.max(0, Number(e.target.value) * 1000) })}
              style={numStyle}
            />
          </Field>
          <Field label="Fade out (s)">
            <input
              type="number"
              min={0}
              step={0.1}
              value={(audioMix.fadeOut / 1000).toFixed(1)}
              onChange={(e) => setAudioMix({ fadeOut: Math.max(0, Number(e.target.value) * 1000) })}
              style={numStyle}
            />
          </Field>
        </Section>
      )}

      {!clip || (!m && !isText) ? (
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

          {isText && txt ? (
            <Section title="Text">
              <textarea
                value={txt.content}
                onChange={(e) => updateText(clip.id, { content: e.target.value })}
                rows={2}
                placeholder="Type caption…"
                style={{
                  width: "100%",
                  resize: "vertical",
                  fontSize: 12,
                  color: "var(--fg)",
                  background: "var(--bg-2)",
                  border: "1px solid var(--border)",
                  borderRadius: 5,
                  padding: "6px 8px",
                  fontFamily: "inherit",
                }}
              />
              <Field label="Font">
                <select
                  value={txt.fontFamily}
                  onChange={(e) => updateText(clip.id, { fontFamily: e.target.value })}
                  style={selectStyle}
                >
                  {FONTS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Size">
                <input
                  type="range"
                  min={0.02}
                  max={0.4}
                  step={0.005}
                  value={txt.fontSize}
                  onChange={(e) => updateText(clip.id, { fontSize: Number(e.target.value) })}
                  style={{ width: 110, accentColor: "var(--accent)" }}
                />
                <span style={{ fontSize: 11, color: "var(--fg-3)", width: 28, textAlign: "right" }}>
                  {Math.round(txt.fontSize * 100)}
                </span>
              </Field>
              <Field label="Weight">
                <div style={{ display: "flex", gap: 4 }}>
                  {[400, 700].map((w) => {
                    const on = txt.fontWeight === w;
                    return (
                      <button
                        key={w}
                        onClick={() => updateText(clip.id, { fontWeight: w })}
                        style={segBtn(on)}
                      >
                        {w === 400 ? "Regular" : "Bold"}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="Align">
                <div style={{ display: "flex", gap: 4 }}>
                  {ALIGNS.map((a) => (
                    <button key={a} onClick={() => updateText(clip.id, { align: a })} style={segBtn(txt.align === a)}>
                      {a === "left" ? "⬅" : a === "center" ? "⬌" : "➡"}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Colour">
                <input
                  type="color"
                  value={txt.color}
                  onChange={(e) => updateText(clip.id, { color: e.target.value })}
                  style={colorStyle}
                />
                <span style={{ fontSize: 11, color: "var(--fg-3)" }}>{txt.color}</span>
              </Field>
              <Field label="Box">
                <input
                  type="color"
                  value={txt.bg || "#000000"}
                  onChange={(e) => updateText(clip.id, { bg: e.target.value })}
                  style={colorStyle}
                />
                <button onClick={() => updateText(clip.id, { bg: "" })} style={{ ...miniBtnStyle, width: "auto", padding: "2px 8px" }}>
                  {txt.bg ? "Clear" : "None"}
                </button>
              </Field>
            </Section>
          ) : m ? (
            <Section title={`Clip · ${m.name}`}>
              <Field label="Fit">
                <div style={{ display: "flex", gap: 4 }}>
                  {FITS.map((f) => {
                    const on = clip.fit === f;
                    return (
                      <button key={f} onClick={() => updateClip(clip.id, { fit: f })} style={segBtn(on)}>
                        <span style={{ textTransform: "capitalize" }}>{f}</span>
                      </button>
                    );
                  })}
                </div>
              </Field>
            </Section>
          ) : null}

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

          {!isText && m && (
            <Section title="Colour / filters">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5 }}>
                {FILTER_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyFilterPreset(clip.id, p.id)}
                    style={{ ...miniBtnStyle, width: "auto", padding: "5px 2px", fontSize: 10 }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {COLOR_ROWS.map((r) => {
                const f = clip.filters ?? DEFAULT_FILTERS;
                const value = f[r.key];
                const shown =
                  r.key === "hue"
                    ? `${Math.round(value)}°`
                    : r.key === "blur"
                      ? `${Math.round(value * 1000)}`
                      : `${Math.round(value * 100)}%`;
                return (
                  <div key={r.key} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
                      onChange={(e) => updateFilters(clip.id, { [r.key]: Number(e.target.value) })}
                      onDoubleClick={() => updateFilters(clip.id, { [r.key]: r.mid })}
                      style={{ width: "100%", accentColor: "var(--accent)" }}
                    />
                  </div>
                );
              })}
              <button onClick={() => applyFilterPreset(clip.id, "none")} style={miniBtnStyle}>
                Reset colour
              </button>
            </Section>
          )}

          <Section title="Transitions">
            {(["in", "out"] as const).map((slot) => {
              const spec = slot === "in" ? clip.transIn : clip.transOut;
              const set = (next: TransitionSpec | null): void => setTransition(clip.id, slot, next);
              return (
                <div key={slot} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 11, color: "var(--fg-2)", fontWeight: 600 }}>{slot === "in" ? "In" : "Out"}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    {TRANS_TYPES.map((tt) => {
                      const on = (spec?.type ?? "none") === tt.id;
                      return (
                        <button
                          key={tt.id}
                          onClick={() =>
                            set(tt.id === "none" ? null : { ...DEFAULT_TRANSITION, ...spec, type: tt.id })
                          }
                          style={segBtn(on)}
                        >
                          {tt.label}
                        </button>
                      );
                    })}
                  </div>
                  {spec && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {spec.type !== "fade" && (
                        <div style={{ display: "flex", gap: 4 }}>
                          {TRANS_DIRS.map((d) => (
                            <button key={d} onClick={() => set({ ...spec, dir: d })} style={{ ...segBtn(spec.dir === d), flex: "none", width: 24 }}>
                              {DIR_ARROW[d]}
                            </button>
                          ))}
                        </div>
                      )}
                      <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--fg-2)" }}>Dur</span>
                      <input
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={(spec.duration / 1000).toFixed(1)}
                        onChange={(e) => set({ ...spec, duration: Math.max(100, Number(e.target.value) * 1000) })}
                        style={numStyle}
                      />
                    </div>
                  )}
                </div>
              );
            })}
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

const colorStyle: React.CSSProperties = {
  width: 36,
  height: 22,
  padding: 0,
  border: "1px solid var(--border)",
  borderRadius: 4,
  background: "none",
  cursor: "pointer",
};

const segBtn = (on: boolean): React.CSSProperties => ({
  flex: 1,
  padding: "4px 6px",
  fontSize: 10.5,
  color: on ? "#fff" : "var(--fg-2)",
  background: on ? "var(--accent)" : "var(--bg-2)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  cursor: "pointer",
});

export default Inspector;
