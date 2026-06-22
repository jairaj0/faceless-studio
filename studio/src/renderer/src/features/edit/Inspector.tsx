import { useEditor, DEFAULT_TRANSFORM, type FitMode } from "../../store/editor";

const FITS: FitMode[] = ["contain", "cover", "fill"];
const FPS_OPTIONS = [24, 25, 30, 60];

export function Inspector() {
  const clips = useEditor((s) => s.clips);
  const media = useEditor((s) => s.media);
  const comp = useEditor((s) => s.comp);
  const selectedId = useEditor((s) => s.selectedClipId);
  const updateComp = useEditor((s) => s.updateComp);
  const updateClip = useEditor((s) => s.updateClip);
  const updateTransform = useEditor((s) => s.updateTransform);
  const setClipDuration = useEditor((s) => s.setClipDuration);
  const removeClip = useEditor((s) => s.removeClip);

  const clip = clips.find((c) => c.id === selectedId) ?? null;
  const m = clip ? media.find((x) => x.id === clip.mediaId) : null;
  const isVideo = m?.kind === "video";

  return (
    <div
      style={{
        width: 244,
        flexShrink: 0,
        borderLeft: "1px solid var(--border)",
        background: "var(--bg-1)",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      {/* Composition */}
      <Section title="Composition">
        <Field label="Background">
          <input
            type="color"
            value={comp.bg}
            onChange={(e) => updateComp({ bg: e.target.value })}
            style={{
              width: 36,
              height: 22,
              padding: 0,
              border: "1px solid var(--border)",
              borderRadius: 4,
              background: "none",
              cursor: "pointer",
            }}
          />
          <span style={{ fontSize: 11, color: "var(--fg-3)" }}>{comp.bg}</span>
        </Field>
        <Field label="Frame rate">
          <select
            value={comp.fps}
            onChange={(e) => updateComp({ fps: Number(e.target.value) })}
            style={selectStyle}
          >
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

      {/* Selected clip */}
      {!clip || !m ? (
        <div style={{ padding: 16, fontSize: 11, color: "var(--fg-3)" }}>
          Select a clip on the timeline to edit it.
        </div>
      ) : (
        <Section title={`Clip · ${m.name}`}>
          {/* Fit */}
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
                      padding: "4px 0",
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

          <Slider
            label="Scale"
            value={clip.transform.scale}
            min={0.1}
            max={4}
            step={0.01}
            fmt={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => updateTransform(clip.id, { scale: v })}
          />
          <Slider
            label="Position X"
            value={clip.transform.x}
            min={-1}
            max={1}
            step={0.005}
            fmt={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => updateTransform(clip.id, { x: v })}
          />
          <Slider
            label="Position Y"
            value={clip.transform.y}
            min={-1}
            max={1}
            step={0.005}
            fmt={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => updateTransform(clip.id, { y: v })}
          />
          <Slider
            label="Rotation"
            value={clip.transform.rotation}
            min={-180}
            max={180}
            step={1}
            fmt={(v) => `${Math.round(v)}°`}
            onChange={(v) => updateTransform(clip.id, { rotation: v })}
          />
          <Slider
            label="Opacity"
            value={clip.transform.opacity}
            min={0}
            max={1}
            step={0.01}
            fmt={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => updateTransform(clip.id, { opacity: v })}
          />

          <button
            onClick={() => updateClip(clip.id, { transform: { ...DEFAULT_TRANSFORM } })}
            style={miniBtnStyle}
          >
            Reset transform
          </button>

          {/* Timing */}
          <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />
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
                  updateClip(clip.id, {
                    trimStart: Math.max(0, Math.round(Number(e.target.value) * 1000)),
                  })
                }
                style={numStyle}
              />
            </Field>
          )}

          <button
            onClick={() => removeClip(clip.id)}
            style={{ ...miniBtnStyle, color: "#e06c75", marginTop: 8 }}
          >
            Remove clip
          </button>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: 12, borderBottom: "1px solid var(--border)" }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: "var(--fg-3)",
          marginBottom: 10,
        }}
      >
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

function Slider({
  label,
  value,
  min,
  max,
  step,
  fmt,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  fmt: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: "var(--fg-2)" }}>{label}</span>
        <span style={{ fontSize: 11, color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>
          {fmt(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "var(--accent)" }}
      />
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
  padding: "6px 0",
  fontSize: 11,
  color: "var(--fg-2)",
  background: "var(--bg-2)",
  border: "1px solid var(--border)",
  borderRadius: 5,
  cursor: "pointer",
};

export default Inspector;
