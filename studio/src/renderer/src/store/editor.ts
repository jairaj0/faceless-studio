import { create } from "zustand";
import type { MediaKind } from "../../../shared/media";

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

// Resolution-independent transform: positions/scale are relative to the comp,
// so the same edit looks identical at 1080p or 8K.
export interface Transform {
  x: number; // horizontal offset as a fraction of comp width (0 = centered)
  y: number; // vertical offset as a fraction of comp height
  scale: number; // 1 = base fit
  rotation: number; // degrees
  opacity: number; // 0..1
}

// One clip on the single visual track. Times are in milliseconds.
export interface Clip {
  id: string;
  mediaId: string;
  start: number;
  duration: number;
  trimStart: number; // ms into the source media where playback begins (video)
  fit: FitMode;
  transform: Transform;
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

const uid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

function revoke(m: { src: string; isBlob?: boolean } | null): void {
  if (m?.isBlob && m.src.startsWith("blob:")) URL.revokeObjectURL(m.src);
}

interface EditorState {
  media: MediaItem[];
  clips: Clip[];
  audio: MediaItem | null;
  comp: Composition;
  playhead: number;
  playing: boolean;
  selectedClipId: string | null;

  addMedia: (items: NewMedia[]) => MediaItem[];
  setMediaDuration: (id: string, ms: number) => void;
  removeMedia: (id: string) => void;
  addClip: (mediaId: string) => void;
  removeClip: (id: string) => void;
  moveClip: (id: string, toIndex: number) => void;
  selectClip: (id: string | null) => void;
  setClipDuration: (id: string, ms: number) => void;
  updateClip: (id: string, partial: Partial<Clip>) => void;
  updateTransform: (id: string, partial: Partial<Transform>) => void;
  setAudio: (item: NewMedia | null) => void;
  updateComp: (partial: Partial<Composition>) => void;
  setPlayhead: (ms: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  stepFrame: (dir: number) => void;
  replaceAll: (s: Partial<EditorState>) => void;
  reset: () => void;
  duration: () => number;
}

// Append clips back-to-back so the track stays gapless.
function relayout(clips: Clip[]): Clip[] {
  let t = 0;
  return clips.map((c) => {
    const next = { ...c, start: t };
    t += c.duration;
    return next;
  });
}

export const useEditor = create<EditorState>((set, get) => ({
  media: [],
  clips: [],
  audio: null,
  comp: { width: 1920, height: 1080, fps: 30, bg: "#000000" },
  playhead: 0,
  playing: false,
  selectedClipId: null,

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
        media: s.media.filter((m) => m.id !== id),
        clips: relayout(s.clips.filter((c) => c.mediaId !== id)),
      };
    }),

  addClip: (mediaId) =>
    set((s) => {
      const m = s.media.find((x) => x.id === mediaId);
      const duration = m?.kind === "video" && m.duration ? m.duration : DEFAULT_CLIP_MS;
      const clip: Clip = {
        id: uid(),
        mediaId,
        start: 0,
        duration,
        trimStart: 0,
        fit: "contain",
        transform: { ...DEFAULT_TRANSFORM },
      };
      return { clips: relayout([...s.clips, clip]), selectedClipId: clip.id };
    }),

  removeClip: (id) =>
    set((s) => ({
      clips: relayout(s.clips.filter((c) => c.id !== id)),
      selectedClipId: s.selectedClipId === id ? null : s.selectedClipId,
    })),

  moveClip: (id, toIndex) =>
    set((s) => {
      const arr = [...s.clips];
      const from = arr.findIndex((c) => c.id === id);
      if (from < 0) return {};
      const [it] = arr.splice(from, 1);
      arr.splice(Math.max(0, Math.min(toIndex, arr.length)), 0, it);
      return { clips: relayout(arr) };
    }),

  selectClip: (id) => set({ selectedClipId: id }),

  setClipDuration: (id, ms) =>
    set((s) => ({
      clips: relayout(
        s.clips.map((c) =>
          c.id === id ? { ...c, duration: Math.max(MIN_CLIP_MS, Math.round(ms)) } : c,
        ),
      ),
    })),

  updateClip: (id, partial) =>
    set((s) => {
      const clips = s.clips.map((c) => (c.id === id ? { ...c, ...partial } : c));
      return { clips: "duration" in partial ? relayout(clips) : clips };
    }),

  updateTransform: (id, partial) =>
    set((s) => ({
      clips: s.clips.map((c) =>
        c.id === id ? { ...c, transform: { ...c.transform, ...partial } } : c,
      ),
    })),

  setAudio: (item) =>
    set((s) => {
      revoke(s.audio);
      return { audio: item ? { ...item, id: uid() } : null };
    }),

  updateComp: (partial) => set((s) => ({ comp: { ...s.comp, ...partial } })),

  setPlayhead: (ms) => set({ playhead: Math.max(0, Math.min(ms, get().duration())) }),

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

  replaceAll: (next) => set(next as Partial<EditorState>),

  reset: () =>
    set((s) => {
      s.media.forEach(revoke);
      revoke(s.audio);
      return { media: [], clips: [], audio: null, playhead: 0, playing: false, selectedClipId: null };
    }),

  duration: () => get().clips.reduce((sum, c) => sum + c.duration, 0),
}));
