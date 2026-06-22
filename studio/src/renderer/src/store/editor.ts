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

// One clip on the single visual track. Times are in milliseconds.
export interface Clip {
  id: string;
  mediaId: string;
  start: number;
  duration: number;
}

export interface Composition {
  width: number;
  height: number;
  fps: number;
  bg: string;
}

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
  selectClip: (id: string | null) => void;
  setClipDuration: (id: string, ms: number) => void;
  setAudio: (item: NewMedia | null) => void;
  setPlayhead: (ms: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
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
      const clip: Clip = { id: uid(), mediaId, start: 0, duration };
      return { clips: relayout([...s.clips, clip]), selectedClipId: clip.id };
    }),

  removeClip: (id) =>
    set((s) => ({
      clips: relayout(s.clips.filter((c) => c.id !== id)),
      selectedClipId: s.selectedClipId === id ? null : s.selectedClipId,
    })),

  selectClip: (id) => set({ selectedClipId: id }),

  setClipDuration: (id, ms) =>
    set((s) => ({
      clips: relayout(
        s.clips.map((c) =>
          c.id === id ? { ...c, duration: Math.max(MIN_CLIP_MS, Math.round(ms)) } : c,
        ),
      ),
    })),

  setAudio: (item) =>
    set((s) => {
      revoke(s.audio);
      return { audio: item ? { ...item, id: uid() } : null };
    }),

  setPlayhead: (ms) => set({ playhead: Math.max(0, Math.min(ms, get().duration())) }),

  play: () => {
    if (get().duration() === 0) return;
    if (get().playhead >= get().duration()) set({ playhead: 0 });
    set({ playing: true });
  },
  pause: () => set({ playing: false }),
  togglePlay: () => (get().playing ? get().pause() : get().play()),

  reset: () =>
    set((s) => {
      s.media.forEach(revoke);
      revoke(s.audio);
      return { media: [], clips: [], audio: null, playhead: 0, playing: false, selectedClipId: null };
    }),

  duration: () => get().clips.reduce((sum, c) => sum + c.duration, 0),
}));
