// ─────────────────────────────────────────────────────────────────────────
// Scene model — the "document" of the app.
// A scene is a resolution-independent web animation: layers (text/shape/
// image/svg/group) with keyframed properties. Rendered to DOM/SVG/CSS at any
// resolution, driven deterministically by a time `t` (ms).
// ─────────────────────────────────────────────────────────────────────────

export type EasingName =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "easeOutCubic"
  | "easeOutBack";

/** A single keyframe: value `v` at time `t` (ms), with easing toward the next. */
export interface Keyframe {
  t: number;
  v: number;
  ease?: EasingName;
}

/** A property is either a constant number, or an animated list of keyframes. */
export type Prop = number | Keyframe[];

/** Layer transform — every field can be a constant or keyframed. */
export interface Transform {
  x?: Prop; // px in logical scene coordinates (top-left of layer box)
  y?: Prop;
  scale?: Prop; // uniform, 1 = 100%
  scaleX?: Prop;
  scaleY?: Prop;
  rotation?: Prop; // degrees
  opacity?: Prop; // 0..1
  anchorX?: number; // 0..1, transform-origin (static)
  anchorY?: number;
}

export interface BaseLayer {
  id: string;
  name: string;
  transform?: Transform;
  start?: number; // ms — layer in-point (default 0)
  end?: number; // ms — layer out-point (default scene duration)
}

export interface TextLayer extends BaseLayer {
  type: "text";
  text: string;
  fontSize: number;
  fontWeight?: number;
  color?: string;
  fontFamily?: string;
  letterSpacing?: number;
  lineHeight?: number;
  width?: number; // optional wrap width
  align?: "left" | "center" | "right";
  /** 0..1 typewriter reveal — fraction of characters shown (animatable). */
  reveal?: Prop;
}

export interface RectLayer extends BaseLayer {
  type: "rect";
  width: number;
  height: number;
  fill?: string;
  radius?: number;
}

export interface EllipseLayer extends BaseLayer {
  type: "ellipse";
  width: number;
  height: number;
  fill?: string;
  blur?: number; // px
}

export interface ImageLayer extends BaseLayer {
  type: "image";
  src: string;
  width: number;
  height: number;
  fit?: "cover" | "contain";
  radius?: number;
}

export interface SvgLayer extends BaseLayer {
  type: "svg";
  svg: string; // raw inline SVG markup (vector — stays sharp at any res)
  width: number;
  height: number;
}

export interface GroupLayer extends BaseLayer {
  type: "group";
  children: Layer[];
}

export interface CodeLayer extends BaseLayer {
  type: "code";
  lang: "html" | "react";
  code: string;
  width: number;
  height: number;
}

export type Layer =
  | TextLayer
  | RectLayer
  | EllipseLayer
  | ImageLayer
  | SvgLayer
  | GroupLayer
  | CodeLayer;

export interface SceneAudio {
  name: string;
  path: string; // original file path (used by ffmpeg on export)
  dataUrl: string; // for in-app preview playback
  volume?: number; // 0..1
}

export interface Scene {
  width: number; // logical px (e.g. 1920)
  height: number; // logical px (e.g. 1080)
  fps: number;
  duration: number; // ms
  background?: string;
  layers: Layer[];
  audio?: SceneAudio;
}
