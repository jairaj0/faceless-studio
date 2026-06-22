# engine/ — PURE scene logic

No imports from `store/`, `features/`, or app code. Knows only `Scene` + `time`.
Reused by BOTH the live preview and the offline export renderer. Unit-testable.

To port from `research/video-editor/app` (M2):
- `types.ts` — Scene / Layer model
- `animate.ts` — keyframe eval + easings
- `SceneRenderer.tsx` — Scene + time → DOM/SVG/CSS
- `codeLayer.ts` — code-layer iframe (React/HTML + gsap)
