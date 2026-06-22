import type { Clip, Composition, MediaItem, Track } from "../../store/editor";
import { allClips, TF_DEFAULT } from "../../store/editor";
import { evalProp } from "./animate";

// Decoded media cached by src URL. Both preview and export draw through here so
// what you see is what gets rendered.
const imgCache = new Map<string, HTMLImageElement>();
const vidCache = new Map<string, HTMLVideoElement>();

export function getImage(src: string): HTMLImageElement {
  let img = imgCache.get(src);
  if (!img) {
    img = new Image();
    img.src = src;
    imgCache.set(src, img);
  }
  return img;
}

export function getVideo(src: string): HTMLVideoElement {
  let v = vidCache.get(src);
  if (!v) {
    v = document.createElement("video");
    v.src = src;
    v.muted = true; // preview is silent for now
    v.preload = "auto";
    v.playsInline = true;
    vidCache.set(src, v);
  }
  return v;
}

/** Pause every cached video except the ones whose src is in `keep`. */
export function pauseVideos(keep?: Set<string>): void {
  vidCache.forEach((v, src) => {
    if (!(keep && keep.has(src)) && !v.paused) v.pause();
  });
}

export function releaseVideo(src: string): void {
  const v = vidCache.get(src);
  if (v) {
    v.pause();
    v.removeAttribute("src");
    v.load();
    vidCache.delete(src);
  }
}

/** Read a video's natural duration (ms). Resolves 0 if it can't load. */
export function probeDuration(src: string): Promise<number> {
  return new Promise((resolve) => {
    const v = getVideo(src);
    if (v.readyState >= 1 && v.duration) return resolve(v.duration * 1000);
    const on = (): void => {
      v.removeEventListener("loadedmetadata", on);
      resolve((v.duration || 0) * 1000);
    };
    v.addEventListener("loadedmetadata", on);
  });
}

function ready(v: HTMLVideoElement): Promise<void> {
  return new Promise((resolve) => {
    if (v.readyState >= 2) return resolve();
    const on = (): void => {
      v.removeEventListener("loadeddata", on);
      resolve();
    };
    v.addEventListener("loadeddata", on);
  });
}

function seek(v: HTMLVideoElement, sec: number): Promise<void> {
  return new Promise((resolve) => {
    if (Math.abs(v.currentTime - sec) < 0.001) return resolve();
    const on = (): void => {
      v.removeEventListener("seeked", on);
      resolve();
    };
    v.addEventListener("seeked", on);
    v.currentTime = sec;
  });
}

/** The clip a single track shows at time `t` (latest-starting match wins). */
export function clipAt(clips: Clip[], t: number): Clip | null {
  let best: Clip | null = null;
  for (const c of clips) {
    if (t >= c.start && t <= c.start + c.duration && (!best || c.start > best.start)) best = c;
  }
  return best;
}

/** Which tracks are visible at all (solo overrides; hidden never shows). */
export function visibleTracks(tracks: Track[]): Track[] {
  const soloed = tracks.some((t) => t.solo);
  return tracks.filter((t) => !t.hidden && (!soloed || t.solo));
}

/** The clips to composite at time `t`, bottom track first → top track last. */
export function visibleClipsAt(tracks: Track[], t: number): Clip[] {
  const out: Clip[] = [];
  for (const tr of visibleTracks(tracks)) {
    const c = clipAt(tr.clips, t);
    if (c) out.push(c);
  }
  return out;
}

/** Local time within a clip's source media, in seconds, clamped to its length. */
export function localTime(clip: Clip, m: MediaItem, t: number): number {
  const sec = (clip.trimStart + (t - clip.start)) / 1000;
  const max = m.duration ? m.duration / 1000 - 0.05 : sec;
  return Math.max(0, Math.min(sec, max));
}

/** Preload every image/video used by the tracks so the first draw isn't blank. */
export async function preloadClips(tracks: Track[], media: MediaItem[]): Promise<void> {
  const items = new Map<string, MediaItem>();
  for (const c of allClips(tracks)) {
    const m = media.find((x) => x.id === c.mediaId);
    if (m) items.set(m.src, m);
  }
  await Promise.all(
    [...items.values()].map((m) =>
      m.kind === "video"
        ? ready(getVideo(m.src))
        : new Promise<void>((resolve) => {
            const img = getImage(m.src);
            if (img.complete && img.naturalWidth) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }),
    ),
  );
}

/** Export: seek every visible video clip to its correct frame before drawing. */
export async function prepareFrame(media: MediaItem[], tracks: Track[], t: number): Promise<void> {
  await Promise.all(
    visibleClipsAt(tracks, t).map(async (clip) => {
      const m = media.find((x) => x.id === clip.mediaId);
      if (!m || m.kind !== "video") return;
      const v = getVideo(m.src);
      await ready(v);
      await seek(v, localTime(clip, m, t));
    }),
  );
}

// Draw a source with the clip's fit mode + a resolved transform. Positions/scale
// are fractions of the comp, so the result is identical at any export resolution.
function drawSource(
  ctx: CanvasRenderingContext2D,
  comp: Composition,
  src: CanvasImageSource,
  sw: number,
  sh: number,
  clip: Clip,
  localT: number,
): void {
  if (!sw || !sh) return;
  const { width: W, height: H } = comp;
  let dw: number;
  let dh: number;
  if (clip.fit === "fill") {
    dw = W;
    dh = H;
  } else {
    const base = clip.fit === "cover" ? Math.max(W / sw, H / sh) : Math.min(W / sw, H / sh);
    dw = sw * base;
    dh = sh * base;
  }
  // Evaluate (possibly keyframed) transform props at the clip-local time.
  const tf = clip.transform;
  const x = evalProp(tf.x, localT, TF_DEFAULT.x);
  const y = evalProp(tf.y, localT, TF_DEFAULT.y);
  const scale = evalProp(tf.scale, localT, TF_DEFAULT.scale);
  const rotation = evalProp(tf.rotation, localT, TF_DEFAULT.rotation);
  const opacity = evalProp(tf.opacity, localT, TF_DEFAULT.opacity);

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
  ctx.translate(W / 2 + x * W, H / 2 + y * H);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.drawImage(src, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}

/** Draw one clip (resolving its source) at the given absolute time. */
function drawClip(
  ctx: CanvasRenderingContext2D,
  comp: Composition,
  media: MediaItem[],
  clip: Clip,
  t: number,
): void {
  const m = media.find((x) => x.id === clip.mediaId);
  if (!m) return;
  const localT = t - clip.start;
  if (m.kind === "video") {
    const v = getVideo(m.src);
    if (v.readyState >= 2) drawSource(ctx, comp, v, v.videoWidth, v.videoHeight, clip, localT);
  } else {
    const img = getImage(m.src);
    if (img.complete && img.naturalWidth)
      drawSource(ctx, comp, img, img.naturalWidth, img.naturalHeight, clip, localT);
  }
}

/** Draw the composition at time `t` (ms) into ctx, sized to comp.width×height. */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  comp: Composition,
  media: MediaItem[],
  tracks: Track[],
  t: number,
): void {
  const { width: W, height: H } = comp;
  ctx.fillStyle = comp.bg;
  ctx.fillRect(0, 0, W, H);
  for (const clip of visibleClipsAt(tracks, t)) drawClip(ctx, comp, media, clip, t);
}
