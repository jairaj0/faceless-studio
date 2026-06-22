import type { Clip, Composition, MediaItem } from "../../store/editor";

// Decoded-image cache keyed by data URL. Both preview and export draw through
// here so what you see is exactly what gets rendered.
const cache = new Map<string, HTMLImageElement>();

export function getImage(src: string): HTMLImageElement {
  let img = cache.get(src);
  if (!img) {
    img = new Image();
    img.src = src;
    cache.set(src, img);
  }
  return img;
}

/** Load every image used by the clips and resolve once all are decoded. */
export async function preloadClips(clips: Clip[], media: MediaItem[]): Promise<void> {
  const srcs = new Set<string>();
  for (const c of clips) {
    const m = media.find((x) => x.id === c.mediaId);
    if (m) srcs.add(m.dataUrl);
  }
  await Promise.all(
    [...srcs].map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = getImage(src);
          if (img.complete && img.naturalWidth) return resolve();
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }),
    ),
  );
}

export function clipAt(clips: Clip[], t: number): Clip | null {
  for (const c of clips) {
    if (t >= c.start && t < c.start + c.duration) return c;
  }
  // At/after the end, hold the last clip so the final frame isn't blank.
  return clips.length ? clips[clips.length - 1] : null;
}

/** Draw the composition at time `t` (ms) into ctx, sized to comp.width×height. */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  comp: Composition,
  media: MediaItem[],
  clips: Clip[],
  t: number,
): void {
  const { width: W, height: H } = comp;
  ctx.fillStyle = comp.bg;
  ctx.fillRect(0, 0, W, H);

  const clip = clipAt(clips, t);
  if (!clip) return;
  const m = media.find((x) => x.id === clip.mediaId);
  if (!m) return;
  const img = getImage(m.dataUrl);
  if (!img.complete || !img.naturalWidth) return;

  // Contain fit, centred (letterbox).
  const scale = Math.min(W / img.naturalWidth, H / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
}
