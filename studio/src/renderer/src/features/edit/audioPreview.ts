import type { AudioMix } from "../../store/editor";

// Web Audio preview for the single audio track: an <audio> element routed
// through a GainNode so we can apply volume + fades live, plus a waveform-peaks
// decoder for the timeline. Mirrors what the ffmpeg export will mux.

let actx: AudioContext | null = null;
function ctx(): AudioContext {
  if (!actx) actx = new AudioContext();
  return actx;
}

interface Node {
  el: HTMLAudioElement;
  gain: GainNode;
}
const nodes = new Map<string, Node>();

function getNode(src: string): Node {
  let n = nodes.get(src);
  if (!n) {
    const el = new Audio(src);
    el.preload = "auto";
    const c = ctx();
    const source = c.createMediaElementSource(el);
    const gain = c.createGain();
    source.connect(gain).connect(c.destination);
    n = { el, gain };
    nodes.set(src, n);
  }
  return n;
}

/** Linear gain at a timeline position, given volume + fade in/out. */
export function fadeGain(mix: AudioMix, playheadMs: number, durMs: number): number {
  let g = mix.volume;
  if (mix.fadeIn > 0 && playheadMs < mix.fadeIn) g *= playheadMs / mix.fadeIn;
  if (mix.fadeOut > 0 && durMs > 0 && playheadMs > durMs - mix.fadeOut) {
    g *= Math.max(0, (durMs - playheadMs) / mix.fadeOut);
  }
  return Math.max(0, g);
}

/** Keep the audio element synced to the playhead, with the mix applied. */
export function syncAudio(
  src: string | null,
  mix: AudioMix,
  durMs: number,
  playheadMs: number,
  playing: boolean,
): void {
  if (!src) return stopAudio();
  const n = getNode(src);
  if (actx && actx.state === "suspended") void actx.resume();
  n.gain.gain.value = fadeGain(mix, playheadMs, durMs);
  const target = playheadMs / 1000;
  if (playing) {
    if (Math.abs(n.el.currentTime - target) > 0.3) n.el.currentTime = target;
    if (n.el.paused) void n.el.play();
  } else if (!n.el.paused) {
    n.el.pause();
  }
}

/** Pause every audio element (e.g. on stop / unmount). */
export function stopAudio(): void {
  nodes.forEach((n) => {
    if (!n.el.paused) n.el.pause();
  });
}

// ---- waveform peaks --------------------------------------------------------

const peakCache = new Map<string, number[]>();

/** Normalised 0..1 peak amplitudes (one per bucket), cached by src. */
export async function getPeaks(src: string, buckets = 1000): Promise<number[]> {
  const cached = peakCache.get(src);
  if (cached) return cached;
  const res = await fetch(src);
  const buf = await res.arrayBuffer();
  const audioBuf = await ctx().decodeAudioData(buf);
  const data = audioBuf.getChannelData(0);
  const block = Math.floor(data.length / buckets) || 1;
  const peaks: number[] = [];
  let peak = 0;
  for (let i = 0; i < buckets; i++) {
    let max = 0;
    const start = i * block;
    for (let j = 0; j < block; j++) {
      const v = Math.abs(data[start + j] || 0);
      if (v > max) max = v;
    }
    peaks.push(max);
    if (max > peak) peak = max;
  }
  const norm = peak > 0 ? peaks.map((p) => p / peak) : peaks;
  peakCache.set(src, norm);
  return norm;
}
