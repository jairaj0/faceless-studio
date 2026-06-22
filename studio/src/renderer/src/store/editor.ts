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

export type ClipType = "media";

// One clip living inside a track. Times are in milliseconds. Clips are
// free-positioned on the timeline now (explicit `start`, gaps allowed).
export interface Clip {
  id: string;
  type: ClipType;
  mediaId: string;
  start: number; // absolute timeline ms
  duration: number;
  trimStart: number; // ms into the source media where playback begins (video)
  fit: FitMode;
  transform: Transform;
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
        return { audio: item ? { ...item, id: uid() } : null };
      }),

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
