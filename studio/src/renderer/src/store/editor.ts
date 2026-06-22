import { create } from "zustand";
import type { MediaKind } from "../../../shared/media";
import { evalProp, type EasingName, type Keyframe, type Prop } from "../features/edit/animate";

// A piece of imported media. `src` is what the renderer uses (data URL for
// image/audio, blob URL for video); `path` is the on-disk file for ffmpeg.
export interface MediaItem {
  id: string;
  kind: MediaKind;
  name: string;
  path: string;
  src: string;
  isBlob?: boolean; // revoke src on removal
  duration?: number; // natural duration in ms (video/audio), filled async
}

export type NewMedia = Omit<MediaItem, "id">;

export type FitMode = "contain" | "cover" | "fill";

export type TransformKey = "x" | "y" | "scale" | "rotation" | "opacity";

export const TF_DEFAULT: Record<TransformKey, number> = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
  opacity: 1,
};

// Resolution-independent transform. Each field is a constant OR a list of
// keyframes (clip-local ms), so an animation survives reorder/resize/split.
export interface Transform {
  x?: Prop; // horizontal offset as a fraction of comp width (0 = centered)
  y?: Prop; // vertical offset as a fraction of comp height
  scale?: Prop; // 1 = base fit
  rotation?: Prop; // degrees
  opacity?: Prop; // 0..1
}

export type ClipType = "media" | "text" | "background" | "code";

// A text/caption layer's look. Sizes are fractions of comp height so text
// renders identically at any export resolution.
export interface TextSpec {
  content: string;
  fontSize: number; // fraction of comp height (0.1 = 10% of height)
  color: string;
  fontFamily: string;
  fontWeight: number; // 400 / 700
  align: "left" | "center" | "right";
  bg: string; // background box colour; "" = none
}

export const DEFAULT_TEXT: TextSpec = {
  content: "Text",
  fontSize: 0.1,
  color: "#ffffff",
  fontFamily: "Inter, system-ui, sans-serif",
  fontWeight: 700,
  align: "center",
  bg: "",
};

// An animated background layer, drawn procedurally on the canvas so it renders
// identically (and frame-accurately) at any export resolution. `preset` picks
// the generator; the three colours + speed parameterise it.
export interface BgSpec {
  preset: string; // id from BG_PRESETS
  colorA: string;
  colorB: string;
  colorC: string;
  speed: number; // animation-speed multiplier (1 = base)
}
export const DEFAULT_BG: BgSpec = {
  preset: "aurora",
  colorA: "#6d5efc",
  colorB: "#19c3a6",
  colorC: "#05060a",
  speed: 1,
};

// id + label + default colours + a CSS swatch for the gallery thumbnail.
export const BG_PRESETS: { id: string; label: string; colors: [string, string, string]; swatch: string }[] = [
  { id: "aurora", label: "Aurora", colors: ["#6d5efc", "#19c3a6", "#05060a"], swatch: "radial-gradient(circle at 30% 30%,#6d5efc,transparent 60%),radial-gradient(circle at 70% 70%,#19c3a6,transparent 60%),#05060a" },
  { id: "mesh", label: "Gradient Mesh", colors: ["#312e81", "#0f766e", "#831843"], swatch: "linear-gradient(120deg,#312e81,#0f766e,#831843)" },
  { id: "linear", label: "Linear", colors: ["#1e3a8a", "#9333ea", "#000000"], swatch: "linear-gradient(135deg,#1e3a8a,#9333ea)" },
  { id: "radial", label: "Spotlight", colors: ["#27408b", "#05060a", "#000000"], swatch: "radial-gradient(circle at 50% 40%,#27408b,#05060a 70%)" },
  { id: "beams", label: "Beams", colors: ["#fb7185", "#8b5cf6", "#0b1020"], swatch: "conic-gradient(from 0deg,#fb7185,#8b5cf6,#fb7185)" },
  { id: "grid", label: "Grid", colors: ["#0ea5e9", "#0b1020", "#000000"], swatch: "linear-gradient(#0b1020,#0b1020),repeating-linear-gradient(0deg,#0ea5e9 0 1px,transparent 1px 24px)" },
  { id: "dots", label: "Dots", colors: ["#22d3ee", "#0b1020", "#000000"], swatch: "radial-gradient(#22d3ee 1.5px,transparent 1.6px) 0 0/22px 22px,#0b1020" },
  { id: "particles", label: "Particles", colors: ["#93c5fd", "#0b1020", "#000000"], swatch: "radial-gradient(circle at 20% 30%,#93c5fd 1px,transparent 2px),radial-gradient(circle at 70% 60%,#93c5fd 1px,transparent 2px),#0b1020" },
  { id: "starfield", label: "Starfield", colors: ["#ffffff", "#05060a", "#000000"], swatch: "radial-gradient(1px 1px at 20% 30%,#fff,transparent),radial-gradient(1px 1px at 60% 70%,#fff,transparent),#05060a" },
  { id: "waves", label: "Waves", colors: ["#2563eb", "#7c3aed", "#070b18"], swatch: "linear-gradient(180deg,#070b18,#1e293b),repeating-linear-gradient(90deg,#2563eb22 0 20px,transparent 20px 40px)" },
];

// A code layer (HTML or React/JSX, with gsap available). Rendered live in the
// preview via a sandboxed iframe, and rasterised frame-accurately on export.
export interface CodeSpec {
  lang: "html" | "react";
  source: string;
  // Optional CSS injected into the layer's <head> — used by pasted ReactBits
  // components whose `import "./X.css"` is ignored at runtime.
  css?: string;
}
export const DEFAULT_CODE: CodeSpec = {
  lang: "html",
  source: `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;
  font:700 12vh/1.1 system-ui;color:#fff;
  background:linear-gradient(135deg,#0ea5e9,#9333ea)">
  <span style="animation:pulse 1.6s ease-in-out infinite">Hello</span>
</div>
<style>@keyframes pulse{0%,100%{opacity:.4;transform:scale(.96)}50%{opacity:1;transform:scale(1.04)}}</style>`,
};

// Per-clip colour grade. brightness/contrast/saturate are multipliers (1 =
// normal), hue is degrees, blur is a fraction of comp height (res-independent).
export interface FilterSpec {
  brightness: number;
  contrast: number;
  saturate: number;
  blur: number;
  hue: number;
}

export const DEFAULT_FILTERS: FilterSpec = { brightness: 1, contrast: 1, saturate: 1, blur: 0, hue: 0 };

export const FILTER_PRESETS: { id: string; label: string; f: FilterSpec }[] = [
  { id: "none", label: "None", f: DEFAULT_FILTERS },
  { id: "vivid", label: "Vivid", f: { brightness: 1.05, contrast: 1.15, saturate: 1.5, blur: 0, hue: 0 } },
  { id: "bw", label: "B&W", f: { brightness: 1, contrast: 1.1, saturate: 0, blur: 0, hue: 0 } },
  { id: "noir", label: "Noir", f: { brightness: 0.95, contrast: 1.4, saturate: 0, blur: 0, hue: 0 } },
  { id: "warm", label: "Warm", f: { brightness: 1.05, contrast: 1, saturate: 1.2, blur: 0, hue: -12 } },
  { id: "cool", label: "Cool", f: { brightness: 1, contrast: 1.05, saturate: 1.1, blur: 0, hue: 16 } },
  { id: "vintage", label: "Vintage", f: { brightness: 1.1, contrast: 0.85, saturate: 0.7, blur: 0, hue: -15 } },
  { id: "dream", label: "Dream", f: { brightness: 1.1, contrast: 0.95, saturate: 1.2, blur: 0.004, hue: 0 } },
];

// An in/out transition played within the clip's own span (engine-preserving:
// no overlap rendering needed). fade = alpha; slide = move on/off; wipe = reveal.
export type TransitionType = "fade" | "slide" | "wipe";
export type TransitionDir = "left" | "right" | "up" | "down";
export interface TransitionSpec {
  type: TransitionType;
  dir: TransitionDir;
  duration: number; // ms
}
export const DEFAULT_TRANSITION: TransitionSpec = { type: "fade", dir: "left", duration: 500 };

// Mix applied to the (single) audio track: gain + fade in/out (ms).
export interface AudioMix {
  volume: number; // 0..1.5
  fadeIn: number; // ms
  fadeOut: number; // ms
}
export const DEFAULT_MIX: AudioMix = { volume: 1, fadeIn: 0, fadeOut: 0 };

// One clip living inside a track. Times are in milliseconds. Clips are
// free-positioned on the timeline now (explicit `start`, gaps allowed). A clip
// is either backed by `media` (mediaId) or is a `text` layer (text spec).
export interface Clip {
  id: string;
  type: ClipType;
  mediaId: string; // "" for text clips
  start: number; // absolute timeline ms
  duration: number;
  trimStart: number; // ms into the source media where playback begins (video)
  fit: FitMode;
  transform: Transform;
  text?: TextSpec; // present when type === "text"
  bg?: BgSpec; // present when type === "background"
  code?: CodeSpec; // present when type === "code"
  filters?: FilterSpec; // colour grade (media clips)
  transIn?: TransitionSpec; // entrance transition
  transOut?: TransitionSpec; // exit transition
}

// A horizontal lane. Tracks composite bottom (index 0) → top (last).
export interface Track {
  id: string;
  name: string;
  kind: "video"; // visual track; audio stays a singleton until Stage 5
  clips: Clip[];
  hidden: boolean;
  locked: boolean;
  solo: boolean;
}

export interface Composition {
  width: number;
  height: number;
  fps: number;
  bg: string;
}

export const DEFAULT_TRANSFORM: Transform = { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 };
const DEFAULT_CLIP_MS = 3000;
const MIN_CLIP_MS = 200;
const PRESET_MS = 800; // motion-preset animation length

export interface KeyframeRef {
  clipId: string;
  key: TransformKey;
  t: number; // clip-local ms
}

const uid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(v, hi));

function revoke(m: { src: string; isBlob?: boolean } | null): void {
  if (m?.isBlob && m.src.startsWith("blob:")) URL.revokeObjectURL(m.src);
}

const newTrack = (name: string): Track => ({
  id: uid(),
  name,
  kind: "video",
  clips: [],
  hidden: false,
  locked: false,
  solo: false,
});

// Every clip across all tracks, flattened.
export function allClips(tracks: Track[]): Clip[] {
  return tracks.flatMap((t) => t.clips);
}

// Locate a clip and its position by id.
function locate(tracks: Track[], id: string): { ti: number; ci: number } | null {
  for (let ti = 0; ti < tracks.length; ti++) {
    const ci = tracks[ti].clips.findIndex((c) => c.id === id);
    if (ci >= 0) return { ti, ci };
  }
  return null;
}

export function findClip(tracks: Track[], id: string | null): Clip | null {
  if (!id) return null;
  for (const t of tracks) {
    const c = t.clips.find((x) => x.id === id);
    if (c) return c;
  }
  return null;
}

// End of the last clip in a track (where a freshly appended clip should start).
const trackEnd = (t: Track): number =>
  t.clips.reduce((max, c) => Math.max(max, c.start + c.duration), 0);

interface Snapshot {
  tracks: Track[];
  comp: Composition;
}

interface EditorState {
  media: MediaItem[];
  tracks: Track[];
  audio: MediaItem | null;
  audioMix: AudioMix;
  comp: Composition;
  playhead: number;
  playing: boolean;
  selectedClipId: string | null;
  selectedKeyframe: KeyframeRef | null;
  past: Snapshot[];
  future: Snapshot[];

  addMedia: (items: NewMedia[]) => MediaItem[];
  setMediaDuration: (id: string, ms: number) => void;
  removeMedia: (id: string) => void;

  // tracks
  addTrack: () => void;
  removeTrack: (id: string) => void;
  toggleTrack: (id: string, flag: "hidden" | "locked" | "solo") => void;

  // clips
  addClip: (mediaId: string, trackId?: string) => void;
  addTextClip: (trackId?: string) => void;
  addBackgroundClip: (presetId?: string, trackId?: string) => void;
  addCodeClip: (spec?: Partial<CodeSpec>, trackId?: string) => void;
  updateText: (id: string, partial: Partial<TextSpec>) => void;
  updateBg: (id: string, partial: Partial<BgSpec>) => void;
  updateCode: (id: string, partial: Partial<CodeSpec>) => void;
  updateFilters: (id: string, partial: Partial<FilterSpec>) => void;
  applyFilterPreset: (id: string, presetId: string) => void;
  setTransition: (id: string, slot: "in" | "out", spec: TransitionSpec | null) => void;
  removeClip: (id: string) => void;
  duplicateClip: (id: string) => void;
  splitClip: (id: string, atMs: number) => void;
  placeClip: (id: string, trackId: string, start: number) => void;
  selectClip: (id: string | null) => void;
  setClipDuration: (id: string, ms: number) => void;
  setClipStart: (id: string, ms: number) => void;
  updateClip: (id: string, partial: Partial<Clip>) => void;

  // transform + keyframes
  applyTransform: (id: string, key: TransformKey, value: number) => void;
  toggleKeyframe: (id: string, key: TransformKey) => void;
  selectKeyframe: (sel: KeyframeRef | null) => void;
  setKeyframeTime: (id: string, key: TransformKey, index: number, t: number) => void;
  sortKeyframes: (id: string, key: TransformKey) => void;
  setKeyframeEasing: (id: string, key: TransformKey, t: number, ease: EasingName) => void;
  applyPreset: (id: string, presetId: string) => void;
  resetTransform: (id: string) => void;

  setAudio: (item: NewMedia | null) => void;
  setAudioDuration: (ms: number) => void;
  setAudioMix: (partial: Partial<AudioMix>) => void;
  updateComp: (partial: Partial<Composition>) => void;
  setPlayhead: (ms: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  stepFrame: (dir: number) => void;

  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  replaceAll: (s: Partial<EditorState>) => void;
  reset: () => void;
  duration: () => number;
}

export const useEditor = create<EditorState>((set, get) => {
  // Snapshot the editable surface (tracks + comp) for undo/redo.
  const snap = (s: EditorState): Snapshot => ({
    tracks: structuredClone(s.tracks),
    comp: { ...s.comp },
  });
  const push = (s: EditorState): Pick<EditorState, "past" | "future"> => ({
    past: [...s.past, snap(s)].slice(-60),
    future: [],
  });

  // Clip-local playhead time, clamped to the clip's span.
  const localNow = (c: Clip): number => clamp(get().playhead - c.start, 0, c.duration);

  // Replace the clip with `id` (wherever it lives) via `fn`.
  const mapClip = (id: string, fn: (c: Clip) => Clip): Track[] =>
    get().tracks.map((t) => ({ ...t, clips: t.clips.map((c) => (c.id === id ? fn(c) : c)) }));

  return {
    media: [],
    tracks: [newTrack("V1")],
    audio: null,
    audioMix: { ...DEFAULT_MIX },
    comp: { width: 1920, height: 1080, fps: 30, bg: "#000000" },
    playhead: 0,
    playing: false,
    selectedClipId: null,
    selectedKeyframe: null,
    past: [],
    future: [],

    addMedia: (items) => {
      const added = items.map((m) => ({ ...m, id: uid() }));
      set((s) => ({ media: [...s.media, ...added] }));
      return added;
    },

    setMediaDuration: (id, ms) =>
      set((s) => ({ media: s.media.map((m) => (m.id === id ? { ...m, duration: ms } : m)) })),

    removeMedia: (id) =>
      set((s) => {
        revoke(s.media.find((m) => m.id === id) ?? null);
        return {
          ...push(s),
          media: s.media.filter((m) => m.id !== id),
          tracks: s.tracks.map((t) => ({ ...t, clips: t.clips.filter((c) => c.mediaId !== id) })),
        };
      }),

    // ---- tracks --------------------------------------------------------------

    addTrack: () =>
      set((s) => ({ ...push(s), tracks: [...s.tracks, newTrack(`V${s.tracks.length + 1}`)] })),

    removeTrack: (id) =>
      set((s) => {
        if (s.tracks.length <= 1) return {}; // keep at least one
        const gone = s.tracks.find((t) => t.id === id);
        const selGone = gone?.clips.some((c) => c.id === s.selectedClipId);
        return {
          ...push(s),
          tracks: s.tracks.filter((t) => t.id !== id),
          selectedClipId: selGone ? null : s.selectedClipId,
          selectedKeyframe: selGone ? null : s.selectedKeyframe,
        };
      }),

    toggleTrack: (id, flag) =>
      set((s) => ({
        tracks: s.tracks.map((t) => (t.id === id ? { ...t, [flag]: !t[flag] } : t)),
      })),

    // ---- clips ---------------------------------------------------------------

    addClip: (mediaId, trackId) =>
      set((s) => {
        const m = s.media.find((x) => x.id === mediaId);
        const duration = m?.kind === "video" && m.duration ? m.duration : DEFAULT_CLIP_MS;
        const tIdx = trackId ? s.tracks.findIndex((t) => t.id === trackId) : 0;
        const ti = tIdx >= 0 ? tIdx : 0;
        const clip: Clip = {
          id: uid(),
          type: "media",
          mediaId,
          start: trackEnd(s.tracks[ti]),
          duration,
          trimStart: 0,
          fit: "contain",
          transform: { ...DEFAULT_TRANSFORM },
        };
        const tracks = s.tracks.map((t, i) =>
          i === ti ? { ...t, clips: [...t.clips, clip] } : t,
        );
        return { ...push(s), tracks, selectedClipId: clip.id };
      }),

    // A text layer drops in at the playhead on the target track (default top
    // track, so captions sit above footage).
    addTextClip: (trackId) =>
      set((s) => {
        const tIdx = trackId
          ? s.tracks.findIndex((t) => t.id === trackId)
          : s.tracks.length - 1;
        const ti = tIdx >= 0 ? tIdx : 0;
        const clip: Clip = {
          id: uid(),
          type: "text",
          mediaId: "",
          start: Math.max(0, Math.round(s.playhead)),
          duration: DEFAULT_CLIP_MS,
          trimStart: 0,
          fit: "contain",
          transform: { ...DEFAULT_TRANSFORM },
          text: { ...DEFAULT_TEXT },
        };
        const tracks = s.tracks.map((t, i) =>
          i === ti ? { ...t, clips: [...t.clips, clip].sort((a, b) => a.start - b.start) } : t,
        );
        return { ...push(s), tracks, selectedClipId: clip.id };
      }),

    // A background drops at the playhead on the BOTTOM track (index 0) so it
    // sits behind footage.
    addBackgroundClip: (presetId, trackId) =>
      set((s) => {
        const preset = BG_PRESETS.find((p) => p.id === presetId) ?? BG_PRESETS[0];
        const tIdx = trackId ? s.tracks.findIndex((t) => t.id === trackId) : 0;
        const ti = tIdx >= 0 ? tIdx : 0;
        const clip: Clip = {
          id: uid(),
          type: "background",
          mediaId: "",
          start: Math.max(0, Math.round(s.playhead)),
          duration: DEFAULT_CLIP_MS,
          trimStart: 0,
          fit: "fill",
          transform: { ...DEFAULT_TRANSFORM },
          bg: { ...DEFAULT_BG, preset: preset.id, colorA: preset.colors[0], colorB: preset.colors[1], colorC: preset.colors[2] },
        };
        const tracks = s.tracks.map((t, i) =>
          i === ti ? { ...t, clips: [...t.clips, clip].sort((a, b) => a.start - b.start) } : t,
        );
        return { ...push(s), tracks, selectedClipId: clip.id };
      }),

    // A code layer drops at the playhead on the TOP track (above footage).
    addCodeClip: (spec, trackId) =>
      set((s) => {
        const tIdx = trackId ? s.tracks.findIndex((t) => t.id === trackId) : s.tracks.length - 1;
        const ti = tIdx >= 0 ? tIdx : 0;
        const clip: Clip = {
          id: uid(),
          type: "code",
          mediaId: "",
          start: Math.max(0, Math.round(s.playhead)),
          duration: DEFAULT_CLIP_MS,
          trimStart: 0,
          fit: "fill",
          transform: { ...DEFAULT_TRANSFORM },
          code: { ...DEFAULT_CODE, ...spec },
        };
        const tracks = s.tracks.map((t, i) =>
          i === ti ? { ...t, clips: [...t.clips, clip].sort((a, b) => a.start - b.start) } : t,
        );
        return { ...push(s), tracks, selectedClipId: clip.id };
      }),

    updateText: (id, partial) =>
      set((s) => ({
        ...push(s),
        tracks: mapClip(id, (c) => ({ ...c, text: { ...DEFAULT_TEXT, ...c.text, ...partial } })),
      })),

    // Live (colour pickers/sliders push history on pointer-down).
    updateBg: (id, partial) =>
      set(() => ({
        tracks: mapClip(id, (c) => ({ ...c, bg: { ...DEFAULT_BG, ...c.bg, ...partial } })),
      })),

    updateCode: (id, partial) =>
      set((s) => ({
        ...push(s),
        tracks: mapClip(id, (c) => ({ ...c, code: { ...DEFAULT_CODE, ...c.code, ...partial } })),
      })),

    // Live (sliders push history on pointer-down); presets below push themselves.
    updateFilters: (id, partial) =>
      set(() => ({
        tracks: mapClip(id, (c) => ({ ...c, filters: { ...DEFAULT_FILTERS, ...c.filters, ...partial } })),
      })),

    applyFilterPreset: (id, presetId) =>
      set((s) => {
        const preset = FILTER_PRESETS.find((p) => p.id === presetId);
        if (!preset) return {};
        return { ...push(s), tracks: mapClip(id, (c) => ({ ...c, filters: { ...preset.f } })) };
      }),

    setTransition: (id, slot, spec) =>
      set((s) => ({
        ...push(s),
        tracks: mapClip(id, (c) => ({
          ...c,
          [slot === "in" ? "transIn" : "transOut"]: spec ?? undefined,
        })),
      })),

    removeClip: (id) =>
      set((s) => ({
        ...push(s),
        tracks: s.tracks.map((t) => ({ ...t, clips: t.clips.filter((c) => c.id !== id) })),
        selectedClipId: s.selectedClipId === id ? null : s.selectedClipId,
        selectedKeyframe: null,
      })),

    duplicateClip: (id) =>
      set((s) => {
        const at = locate(s.tracks, id);
        if (!at) return {};
        const orig = s.tracks[at.ti].clips[at.ci];
        const copy: Clip = {
          ...structuredClone(orig),
          id: uid(),
          start: orig.start + orig.duration,
        };
        const tracks = s.tracks.map((t, i) =>
          i === at.ti
            ? { ...t, clips: [...t.clips.slice(0, at.ci + 1), copy, ...t.clips.slice(at.ci + 1)] }
            : t,
        );
        return { ...push(s), tracks, selectedClipId: copy.id };
      }),

    splitClip: (id, atMs) =>
      set((s) => {
        const at = locate(s.tracks, id);
        if (!at) return {};
        const c = s.tracks[at.ti].clips[at.ci];
        const local = atMs - c.start;
        if (local <= MIN_CLIP_MS || local >= c.duration - MIN_CLIP_MS) return {};
        const isVideo = s.media.find((m) => m.id === c.mediaId)?.kind === "video";

        // First half keeps keyframes up to the split; second half gets the rest,
        // shifted to its own local zero.
        const splitProp = (p: Prop | undefined, side: "a" | "b"): Prop | undefined => {
          if (!Array.isArray(p)) return p;
          return side === "a"
            ? p.filter((k) => k.t <= local).map((k) => ({ ...k }))
            : p.filter((k) => k.t > local).map((k) => ({ ...k, t: k.t - local }));
        };
        const splitTransform = (tf: Transform, side: "a" | "b"): Transform => ({
          x: splitProp(tf.x, side),
          y: splitProp(tf.y, side),
          scale: splitProp(tf.scale, side),
          rotation: splitProp(tf.rotation, side),
          opacity: splitProp(tf.opacity, side),
        });

        const first: Clip = { ...c, duration: local, transform: splitTransform(c.transform, "a") };
        const second: Clip = {
          ...structuredClone(c),
          id: uid(),
          start: c.start + local,
          duration: c.duration - local,
          trimStart: c.trimStart + (isVideo ? local : 0),
          transform: splitTransform(c.transform, "b"),
        };
        const tracks = s.tracks.map((t, i) =>
          i === at.ti
            ? { ...t, clips: [...t.clips.slice(0, at.ci), first, second, ...t.clips.slice(at.ci + 1)] }
            : t,
        );
        return { ...push(s), tracks, selectedClipId: second.id, selectedKeyframe: null };
      }),

    // Move a clip to a track + start (drag on the timeline). Live; UI pushes history.
    placeClip: (id, trackId, start) =>
      set((s) => {
        const at = locate(s.tracks, id);
        if (!at) return {};
        const clip = { ...s.tracks[at.ti].clips[at.ci], start: Math.max(0, Math.round(start)) };
        const destIdx = s.tracks.findIndex((t) => t.id === trackId);
        if (destIdx < 0) return {};
        const tracks = s.tracks.map((t, i) => {
          let clips = i === at.ti ? t.clips.filter((c) => c.id !== id) : t.clips;
          if (i === destIdx) clips = [...clips.filter((c) => c.id !== id), clip].sort((a, b) => a.start - b.start);
          return clips === t.clips ? t : { ...t, clips };
        });
        return { tracks };
      }),

    selectClip: (id) => set({ selectedClipId: id, selectedKeyframe: null }),

    setClipDuration: (id, ms) =>
      set({ tracks: mapClip(id, (c) => ({ ...c, duration: Math.max(MIN_CLIP_MS, Math.round(ms)) })) }),

    setClipStart: (id, ms) =>
      set({ tracks: mapClip(id, (c) => ({ ...c, start: Math.max(0, Math.round(ms)) })) }),

    updateClip: (id, partial) =>
      set((s) => ({ ...push(s), tracks: mapClip(id, (c) => ({ ...c, ...partial })) })),

    // ---- transform + keyframes (live; UI calls pushHistory at gesture start) --

    applyTransform: (id, key, value) =>
      set(() => ({
        tracks: mapClip(id, (c) => {
          const cur = c.transform[key];
          if (Array.isArray(cur)) {
            const t = localNow(c);
            const arr = cur.map((k) => ({ ...k }));
            const kf = arr.find((k) => Math.abs(k.t - t) < 1);
            if (kf) kf.v = value;
            else arr.push({ t, v: value, ease: "easeOut" });
            arr.sort((a, b) => a.t - b.t);
            return { ...c, transform: { ...c.transform, [key]: arr } };
          }
          return { ...c, transform: { ...c.transform, [key]: value } };
        }),
      })),

    toggleKeyframe: (id, key) =>
      set((s) => ({
        ...push(s),
        tracks: mapClip(id, (c) => {
          const cur = c.transform[key];
          const t = localNow(c);
          if (Array.isArray(cur)) {
            return { ...c, transform: { ...c.transform, [key]: evalProp(cur, t, TF_DEFAULT[key]) } };
          }
          const v = typeof cur === "number" ? cur : TF_DEFAULT[key];
          return { ...c, transform: { ...c.transform, [key]: [{ t, v, ease: "easeOut" }] } };
        }),
      })),

    selectKeyframe: (sel) => set({ selectedKeyframe: sel }),

    setKeyframeTime: (id, key, index, t) =>
      set(() => ({
        tracks: mapClip(id, (c) => {
          const cur = c.transform[key];
          if (!Array.isArray(cur) || !cur[index]) return c;
          const arr = cur.map((k) => ({ ...k }));
          arr[index] = { ...arr[index], t: clamp(t, 0, c.duration) };
          return { ...c, transform: { ...c.transform, [key]: arr } };
        }),
      })),

    sortKeyframes: (id, key) =>
      set(() => ({
        tracks: mapClip(id, (c) => {
          const cur = c.transform[key];
          if (!Array.isArray(cur)) return c;
          return { ...c, transform: { ...c.transform, [key]: [...cur].sort((a, b) => a.t - b.t) } };
        }),
      })),

    setKeyframeEasing: (id, key, t, ease) =>
      set((s) => ({
        ...push(s),
        tracks: mapClip(id, (c) => {
          const cur = c.transform[key];
          if (!Array.isArray(cur)) return c;
          const arr = cur.map((k) => (Math.abs(k.t - t) < 1 ? { ...k, ease } : k));
          return { ...c, transform: { ...c.transform, [key]: arr } };
        }),
      })),

    applyPreset: (id, presetId) =>
      set((s) => ({
        ...push(s),
        tracks: mapClip(id, (c) => {
          const t0 = localNow(c);
          const tf = { ...c.transform };
          const baseX = evalProp(tf.x, t0, 0);
          const baseY = evalProp(tf.y, t0, 0);
          const kf = (a: number, b: number, ease: EasingName = "easeOut"): Keyframe[] => [
            { t: t0, v: a, ease },
            { t: t0 + PRESET_MS, v: b },
          ];
          switch (presetId) {
            case "fadeIn":
              tf.opacity = kf(0, 1);
              break;
            case "fadeOut":
              tf.opacity = kf(1, 0);
              break;
            case "slideLeft":
              tf.x = kf(baseX - 0.15, baseX, "easeOutCubic");
              tf.opacity = kf(0, 1);
              break;
            case "slideRight":
              tf.x = kf(baseX + 0.15, baseX, "easeOutCubic");
              tf.opacity = kf(0, 1);
              break;
            case "slideUp":
              tf.y = kf(baseY + 0.15, baseY, "easeOutCubic");
              tf.opacity = kf(0, 1);
              break;
            case "slideDown":
              tf.y = kf(baseY - 0.15, baseY, "easeOutCubic");
              tf.opacity = kf(0, 1);
              break;
            case "pop":
              tf.scale = kf(0.2, 1, "easeOutBack");
              tf.opacity = kf(0, 1);
              break;
            case "spin":
              tf.rotation = [
                { t: t0, v: 0, ease: "linear" },
                { t: t0 + 1200, v: 360 },
              ];
              break;
          }
          return { ...c, transform: tf };
        }),
      })),

    resetTransform: (id) =>
      set((s) => ({
        ...push(s),
        tracks: mapClip(id, (c) => ({ ...c, transform: { ...DEFAULT_TRANSFORM } })),
        selectedKeyframe: null,
      })),

    setAudio: (item) =>
      set((s) => {
        revoke(s.audio);
        return { audio: item ? { ...item, id: uid() } : null, audioMix: { ...DEFAULT_MIX } };
      }),

    setAudioDuration: (ms) =>
      set((s) => ({ audio: s.audio ? { ...s.audio, duration: ms } : null })),

    // Live; the volume slider pushes history on pointer-down.
    setAudioMix: (partial) => set((s) => ({ audioMix: { ...s.audioMix, ...partial } })),

    updateComp: (partial) => set((s) => ({ ...push(s), comp: { ...s.comp, ...partial } })),

    setPlayhead: (ms) => set({ playhead: clamp(ms, 0, get().duration()) }),

    play: () => {
      if (get().duration() === 0) return;
      if (get().playhead >= get().duration()) set({ playhead: 0 });
      set({ playing: true });
    },
    pause: () => set({ playing: false }),
    togglePlay: () => (get().playing ? get().pause() : get().play()),

    stepFrame: (dir) => {
      const { comp, playhead } = get();
      get().pause();
      get().setPlayhead(playhead + (dir * 1000) / comp.fps);
    },

    pushHistory: () => set((s) => push(s)),

    undo: () =>
      set((s) => {
        const prev = s.past[s.past.length - 1];
        if (!prev) return {};
        return {
          tracks: prev.tracks,
          comp: prev.comp,
          past: s.past.slice(0, -1),
          future: [snap(s), ...s.future].slice(0, 60),
          selectedKeyframe: null,
        };
      }),

    redo: () =>
      set((s) => {
        const next = s.future[0];
        if (!next) return {};
        return {
          tracks: next.tracks,
          comp: next.comp,
          past: [...s.past, snap(s)].slice(-60),
          future: s.future.slice(1),
          selectedKeyframe: null,
        };
      }),

    replaceAll: (next) => set(next as Partial<EditorState>),

    reset: () =>
      set((s) => {
        s.media.forEach(revoke);
        revoke(s.audio);
        return {
          media: [],
          tracks: [newTrack("V1")],
          audio: null,
          audioMix: { ...DEFAULT_MIX },
          playhead: 0,
          playing: false,
          selectedClipId: null,
          selectedKeyframe: null,
          past: [],
          future: [],
        };
      }),

    duration: () =>
      allClips(get().tracks).reduce((max, c) => Math.max(max, c.start + c.duration), 0),
  };
});

/** Current evaluated value of a clip transform prop at the playhead. */
export function evalTransform(clip: Clip, key: TransformKey, playhead: number): number {
  return evalProp(clip.transform[key], clamp(playhead - clip.start, 0, clip.duration), TF_DEFAULT[key]);
}
