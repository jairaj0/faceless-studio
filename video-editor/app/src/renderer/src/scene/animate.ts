import type { EasingName, Prop } from "./types";

// Deterministic easing functions (pure, reproducible at any fps).
export const EASINGS: Record<EasingName, (t: number) => number> = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => 1 - (1 - t) * (1 - t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
  easeOutBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

/**
 * Evaluate a property at time `t` (ms). Constant → returned as-is.
 * Keyframes → interpolated with per-segment easing. Pure function of t.
 */
export function evalProp(
  prop: Prop | undefined,
  t: number,
  fallback: number,
): number {
  if (prop === undefined) return fallback;
  if (typeof prop === "number") return prop;

  const kfs = prop;
  if (kfs.length === 0) return fallback;
  if (t <= kfs[0].t) return kfs[0].v;
  const last = kfs[kfs.length - 1];
  if (t >= last.t) return last.v;

  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i];
    const b = kfs[i + 1];
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t || 1;
      const lt = (t - a.t) / span;
      const eased = EASINGS[a.ease ?? "easeOut"](lt);
      return a.v + (b.v - a.v) * eased;
    }
  }
  return last.v;
}
