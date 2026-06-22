import { Trash2 } from "lucide-react";
import { PanelFrame } from "../PanelFrame";
import {
  useEditor,
  evalTransform,
  findLayer,
  type TransformKey,
} from "../../store/editorStore";
import type { EasingName, Layer } from "../../scene/types";

const TRANSFORM_ROWS: { key: TransformKey; label: string; step: number }[] = [
  { key: "x", label: "Position X", step: 1 },
  { key: "y", label: "Position Y", step: 1 },
  { key: "scale", label: "Scale", step: 0.05 },
  { key: "rotation", label: "Rotation", step: 1 },
  { key: "opacity", label: "Opacity", step: 0.05 },
];

const EASING_OPTIONS: EasingName[] = [
  "linear",
  "easeIn",
  "easeOut",
  "easeInOut",
  "easeOutCubic",
  "easeOutBack",
];

const PRESETS: { id: string; label: string; textOnly?: boolean }[] = [
  { id: "fadeIn", label: "Fade In" },
  { id: "fadeOut", label: "Fade Out" },
  { id: "slideLeft", label: "Slide ←" },
  { id: "slideRight", label: "Slide →" },
  { id: "slideUp", label: "Slide ↑" },
  { id: "pop", label: "Pop" },
  { id: "spin", label: "Spin" },
  { id: "typewriter", label: "Typewriter", textOnly: true },
];

const labelStyle: React.CSSProperties = {
  width: 88,
  fontSize: 11,
  color: "var(--fg-2)",
  flexShrink: 0,
};
const inputStyle: React.CSSProperties = {
  width: 80,
  background: "var(--bg-2)",
  color: "var(--fg)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  padding: "3px 6px",
  fontSize: 12,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderBottom: "1px solid var(--border)", padding: "10px 12px" }}>
      <div
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          color: "var(--fg-3)",
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{children}</div>
    </div>
  );
}

function TransformRow({ layer, k, label, step, time }: {
  layer: Layer;
  k: TransformKey;
  label: string;
  step: number;
  time: number;
}) {
  const pushHistory = useEditor((s) => s.pushHistory);
  const applyTransform = useEditor((s) => s.applyTransform);
  const toggleKeyframe = useEditor((s) => s.toggleKeyframe);

  const keyed = Array.isArray(layer.transform?.[k]);
  const value = evalTransform(layer, k, time);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        data-tip={keyed ? "Animated (click to remove keyframes)" : "Animate (add keyframe)"}
        onClick={() => toggleKeyframe(layer.id, k)}
        style={{
          width: 18,
          height: 18,
          flexShrink: 0,
          border: "none",
          background: "none",
          cursor: "pointer",
          color: keyed ? "var(--accent)" : "var(--fg-3)",
          fontSize: 12,
        }}
      >
        {keyed ? "◆" : "◇"}
      </button>
      <span style={labelStyle}>{label}</span>
      <input
        type="number"
        step={step}
        value={Number(value.toFixed(step < 1 ? 2 : 0))}
        onFocus={pushHistory}
        onChange={(e) => applyTransform(layer.id, k, Number(e.target.value))}
        style={inputStyle}
      />
      {keyed && (
        <span style={{ fontSize: 9, color: "var(--accent)" }}>● keyframe @ playhead</span>
      )}
    </div>
  );
}

function TypeFields({ layer, time }: { layer: Layer; time: number }) {
  const pushHistory = useEditor((s) => s.pushHistory);
  const setLayerField = useEditor((s) => s.setLayerField);
  void time;

  const text = (label: string, value: string, patch: (v: string) => Partial<Layer>) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={labelStyle}>{label}</span>
      <input
        value={value}
        onFocus={pushHistory}
        onChange={(e) => setLayerField(layer.id, patch(e.target.value))}
        style={{ ...inputStyle, width: 150 }}
      />
    </div>
  );
  const num = (label: string, value: number, patch: (v: number) => Partial<Layer>, step = 1) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={labelStyle}>{label}</span>
      <input
        type="number"
        step={step}
        value={value}
        onFocus={pushHistory}
        onChange={(e) => setLayerField(layer.id, patch(Number(e.target.value)))}
        style={inputStyle}
      />
    </div>
  );
  const color = (label: string, value: string, patch: (v: string) => Partial<Layer>) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={labelStyle}>{label}</span>
      <input
        type="color"
        value={value}
        onFocus={pushHistory}
        onChange={(e) => setLayerField(layer.id, patch(e.target.value))}
        style={{ width: 40, height: 26, background: "none", border: "1px solid var(--border)", borderRadius: 4 }}
      />
      <span style={{ fontSize: 11, color: "var(--fg-3)" }}>{value}</span>
    </div>
  );

  switch (layer.type) {
    case "text":
      return (
        <Section title="Text">
          <div style={{ display: "flex", gap: 8 }}>
            <span style={labelStyle}>Content</span>
            <textarea
              value={layer.text}
              onFocus={pushHistory}
              onChange={(e) => setLayerField(layer.id, { text: e.target.value })}
              style={{ ...inputStyle, width: 150, height: 50, resize: "vertical" }}
            />
          </div>
          {num("Font size", layer.fontSize, (v) => ({ fontSize: v }))}
          {num("Font weight", layer.fontWeight ?? 400, (v) => ({ fontWeight: v }), 100)}
          {color("Color", layer.color ?? "#ffffff", (v) => ({ color: v }))}
        </Section>
      );
    case "rect":
      return (
        <Section title="Rectangle">
          {num("Width", layer.width, (v) => ({ width: v }))}
          {num("Height", layer.height, (v) => ({ height: v }))}
          {num("Radius", layer.radius ?? 0, (v) => ({ radius: v }))}
          {color("Fill", layer.fill ?? "#888888", (v) => ({ fill: v }))}
        </Section>
      );
    case "ellipse":
      return (
        <Section title="Ellipse">
          {num("Width", layer.width, (v) => ({ width: v }))}
          {num("Height", layer.height, (v) => ({ height: v }))}
          {num("Blur", layer.blur ?? 0, (v) => ({ blur: v }))}
          {color("Fill", layer.fill ?? "#888888", (v) => ({ fill: v }))}
        </Section>
      );
    case "code":
      return (
        <Section title={`Code (${layer.lang})`}>
          <textarea
            value={layer.code}
            onFocus={pushHistory}
            onChange={(e) => setLayerField(layer.id, { code: e.target.value })}
            spellCheck={false}
            style={{
              ...inputStyle,
              width: "100%",
              height: 140,
              resize: "vertical",
              fontFamily: "monospace",
            }}
          />
          {num("Width", layer.width, (v) => ({ width: v }))}
          {num("Height", layer.height, (v) => ({ height: v }))}
        </Section>
      );
    default:
      return null;
  }
}

export function EffectControls() {
  const scene = useEditor((s) => s.scene);
  const selectedId = useEditor((s) => s.selectedId);
  const selectedKeyframe = useEditor((s) => s.selectedKeyframe);
  const selectKeyframe = useEditor((s) => s.selectKeyframe);
  const setKeyframeEasing = useEditor((s) => s.setKeyframeEasing);
  const applyPreset = useEditor((s) => s.applyPreset);
  const time = useEditor((s) => s.time);
  const removeLayer = useEditor((s) => s.removeLayer);

  const layer = selectedId ? findLayer(scene.layers, selectedId) : null;
  const kfMode = !!(selectedKeyframe && layer && selectedKeyframe.layerId === layer.id);

  let curEase: EasingName = "easeOut";
  if (kfMode && layer) {
    const arr = layer.transform?.[selectedKeyframe!.key];
    if (Array.isArray(arr)) {
      const k = arr.find((x) => Math.abs(x.t - selectedKeyframe!.t) < 1);
      if (k?.ease) curEase = k.ease;
    }
  }

  return (
    <PanelFrame
      tabs={[
        { id: "fx", label: "Effect Controls" },
        { id: "source", label: "Source" },
      ]}
      contentStyle={{ overflowY: "auto" }}
    >
      {!layer ? (
        <div
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            color: "var(--fg-3)",
            fontSize: 12,
          }}
        >
          <div style={{ fontSize: 28, opacity: 0.4 }}>🎚️</div>
          <div>No layer selected</div>
          <div style={{ fontSize: 11 }}>Click a layer in the monitor or timeline</div>
        </div>
      ) : (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 12px",
              borderBottom: "1px solid var(--border)",
              background: "var(--bg-2)",
            }}
          >
            <strong style={{ fontSize: 12 }}>{layer.name}</strong>
            <span style={{ fontSize: 10, color: "var(--fg-3)", marginLeft: 8 }}>
              {layer.type}
            </span>
            <button
              data-tip="Delete layer (Del)"
              onClick={() => removeLayer(layer.id)}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                color: "var(--fg-3)",
                cursor: "pointer",
                display: "flex",
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Mode banner: keyframe-edit vs full (layer) edit */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              fontSize: 11,
              background: kfMode ? "var(--accent-soft)" : "var(--bg-1)",
              borderBottom: "1px solid var(--border)",
              color: kfMode ? "var(--fg)" : "var(--fg-3)",
            }}
          >
            {kfMode ? (
              <>
                <span style={{ color: "var(--accent)" }}>◆</span>
                <span>
                  {selectedKeyframe!.key} @ {(selectedKeyframe!.t / 1000).toFixed(2)}s
                </span>
                <select
                  value={curEase}
                  onChange={(e) =>
                    setKeyframeEasing(
                      layer.id,
                      selectedKeyframe!.key,
                      selectedKeyframe!.t,
                      e.target.value as EasingName,
                    )
                  }
                  style={{
                    marginLeft: "auto",
                    background: "var(--bg-2)",
                    color: "var(--fg)",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    fontSize: 10,
                    padding: "2px 4px",
                  }}
                >
                  {EASING_OPTIONS.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => selectKeyframe(null)}
                  style={{
                    background: "var(--bg-2)",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    color: "var(--fg-2)",
                    fontSize: 10,
                    padding: "2px 6px",
                    cursor: "pointer",
                  }}
                >
                  Full edit
                </button>
              </>
            ) : (
              <span>Full edit — changes apply at playhead</span>
            )}
          </div>

          <Section title="Transform">
            {TRANSFORM_ROWS.map((r) => (
              <TransformRow
                key={r.key}
                layer={layer}
                k={r.key}
                label={r.label}
                step={r.step}
                time={time}
              />
            ))}
          </Section>

          <Section title="Animate (presets @ playhead)">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {PRESETS.filter((p) => !p.textOnly || layer.type === "text").map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(layer.id, p.id)}
                  style={{
                    padding: "6px 8px",
                    background: "var(--bg-2)",
                    border: "1px solid var(--border)",
                    borderRadius: 5,
                    color: "var(--fg-2)",
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </Section>

          <TypeFields layer={layer} time={time} />
        </div>
      )}
    </PanelFrame>
  );
}

export default EffectControls;
