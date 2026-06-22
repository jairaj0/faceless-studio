import React from "react";
import type { CodeLayer, Layer, Scene, Transform } from "./types";
import { evalProp } from "./animate";
import { buildCodeSrcdoc } from "./codeLayer";

/** Renders a Code Layer in a sandboxed iframe (srcdoc memoized by code). */
const CodeLayerView: React.FC<{ layer: CodeLayer; style: React.CSSProperties }> = ({
  layer,
  style,
}) => {
  const srcDoc = React.useMemo(
    () => buildCodeSrcdoc(layer.lang, layer.code),
    [layer.lang, layer.code],
  );
  return (
    <div data-layer-id={layer.id} style={style}>
      <iframe
        title={layer.name}
        srcDoc={srcDoc}
        sandbox="allow-scripts"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          background: "transparent",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

/** Build the CSS for a layer's transform + opacity at time `t`. */
function transformStyle(tf: Transform | undefined, t: number): React.CSSProperties {
  if (!tf) return { position: "absolute", left: 0, top: 0 };
  const x = evalProp(tf.x, t, 0);
  const y = evalProp(tf.y, t, 0);
  const scale = evalProp(tf.scale, t, 1);
  const sx = evalProp(tf.scaleX, t, 1) * scale;
  const sy = evalProp(tf.scaleY, t, 1) * scale;
  const rot = evalProp(tf.rotation, t, 0);
  const op = evalProp(tf.opacity, t, 1);
  return {
    position: "absolute",
    left: x,
    top: y,
    opacity: op,
    transform: `rotate(${rot}deg) scale(${sx}, ${sy})`,
    transformOrigin: `${(tf.anchorX ?? 0) * 100}% ${(tf.anchorY ?? 0) * 100}%`,
    willChange: "transform, opacity",
  };
}

const LayerView: React.FC<{ layer: Layer; time: number; duration: number }> = ({
  layer,
  time,
  duration,
}) => {
  const start = layer.start ?? 0;
  const end = layer.end ?? duration;
  if (time < start || time > end) return null;

  const base = transformStyle(layer.transform, time);

  switch (layer.type) {
    case "text": {
      const shown =
        layer.reveal !== undefined
          ? layer.text.slice(
              0,
              Math.ceil(evalProp(layer.reveal, time, 1) * layer.text.length),
            )
          : layer.text;
      return (
        <div
          data-layer-id={layer.id}
          style={{
            ...base,
            fontSize: layer.fontSize,
            fontWeight: layer.fontWeight ?? 400,
            color: layer.color ?? "#fff",
            fontFamily:
              layer.fontFamily ??
              '-apple-system, "Helvetica Neue", Arial, sans-serif',
            letterSpacing: layer.letterSpacing,
            lineHeight: layer.lineHeight ?? 1,
            width: layer.width,
            textAlign: layer.align ?? "left",
            whiteSpace: layer.width ? "pre-wrap" : "pre",
          }}
        >
          {shown}
        </div>
      );
    }

    case "rect":
      return (
        <div
          data-layer-id={layer.id}
          style={{
            ...base,
            width: layer.width,
            height: layer.height,
            background: layer.fill ?? "#888",
            borderRadius: layer.radius ?? 0,
          }}
        />
      );

    case "ellipse":
      return (
        <div
          data-layer-id={layer.id}
          style={{
            ...base,
            width: layer.width,
            height: layer.height,
            background: layer.fill ?? "#888",
            borderRadius: "50%",
            filter: layer.blur ? `blur(${layer.blur}px)` : undefined,
          }}
        />
      );

    case "image":
      return (
        <img
          data-layer-id={layer.id}
          src={layer.src}
          style={{
            ...base,
            width: layer.width,
            height: layer.height,
            objectFit: layer.fit ?? "cover",
            borderRadius: layer.radius ?? 0,
          }}
        />
      );

    case "svg":
      return (
        <div
          data-layer-id={layer.id}
          style={{ ...base, width: layer.width, height: layer.height }}
          dangerouslySetInnerHTML={{ __html: layer.svg }}
        />
      );

    case "code":
      return (
        <CodeLayerView
          layer={layer}
          style={{ ...base, width: layer.width, height: layer.height }}
        />
      );

    case "group":
      return (
        <div data-layer-id={layer.id} style={base}>
          {layer.children.map((child) => (
            <LayerView
              key={child.id}
              layer={child}
              time={time}
              duration={duration}
            />
          ))}
        </div>
      );

    default:
      return null;
  }
};

/**
 * Renders a Scene at a given `time` (ms) to DOM/SVG/CSS at its logical size.
 * Resolution-independence comes from scaling THIS element (vector content
 * stays sharp). Same renderer is used for editor preview AND export.
 */
export const SceneRenderer: React.FC<{ scene: Scene; time: number }> = ({
  scene,
  time,
}) => (
  <div
    style={{
      position: "relative",
      width: scene.width,
      height: scene.height,
      background: scene.background ?? "#000",
      overflow: "hidden",
    }}
  >
    {scene.layers.map((layer) => (
      <LayerView
        key={layer.id}
        layer={layer}
        time={time}
        duration={scene.duration}
      />
    ))}
  </div>
);

export default SceneRenderer;
