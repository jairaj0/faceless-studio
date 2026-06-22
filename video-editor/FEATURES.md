# Feature List & Gap Analysis — toward production-ready

> Studied **Premiere Pro** (editing), **After Effects** (motion graphics), **DaVinci Resolve**
> (color + node FX + page-based UX). Below: what a pro video editor has, our current status,
> and priority for making **Faceless Studio** user-friendly + production-ready.
>
> Legend: ✅ have · ⚠️ partial · ❌ missing

---

## 1. Project & Media Management
| Feature | Pro tool | Status |
|---|---|---|
| Import image / audio | all | ✅ |
| Import video clips | all | ❌ (animation-first; add later) |
| Media bin / project panel | Premiere | ⚠️ (list only) |
| **Project save / open (.json file)** | all | ❌ **critical** |
| **Autosave / recovery** | all | ❌ **critical** |
| Recent projects | all | ❌ |
| Asset organization (folders) | Premiere | ❌ |

## 2. Timeline Editing (Premiere Cut/Edit)
| Feature | Status |
|---|---|
| Move / trim / split / delete clips | ✅ |
| Multiple clips per track | ❌ (1 layer = 1 track row) |
| **Snapping** (to playhead/clips) | ❌ **high** |
| Timeline zoom / fit | ❌ **high** |
| Ripple / roll / slip / slide edits | ❌ |
| **Copy / paste / duplicate clips** | ❌ **high** |
| Multi-select on timeline | ❌ |
| Markers | ❌ |
| Track lock / mute / hide / solo | ❌ |

## 3. Animation / Motion Graphics (After Effects)
| Feature | Status |
|---|---|
| Keyframes on transform | ✅ |
| Per-keyframe easing | ✅ |
| Motion presets (fade/slide/pop/spin) | ✅ |
| Typewriter / text reveal | ✅ |
| **Code layers (ReactBits/HTML)** | ✅ (unique!) |
| Anchor point control + motion paths UI | ⚠️ (anchor in model, no UI) |
| Graph editor (bezier curves) | ❌ |
| Masking | ❌ |
| Blend modes | ❌ |
| Nested compositions | ⚠️ (groups only) |
| 3D layers / camera | ❌ |

## 4. Effects & Transitions
| Feature | Status |
|---|---|
| Transitions (dissolve/wipe/slide) | ❌ **high** |
| Filters (blur/glow/shadow/color) | ❌ **high** |
| Chroma key (green screen) | ❌ |
| Speed control (slow-mo/fast) | ❌ |
| Adjustment layers | ❌ |

## 5. Color (DaVinci strength)
| Feature | Status |
|---|---|
| Color correction (brightness/contrast/sat) | ❌ |
| Curves / color wheels | ❌ |
| LUTs | ❌ |
| Scopes | ❌ |
*(Lower priority for faceless/animation; do basic color later.)*

## 6. Audio (Fairlight)
| Feature | Status |
|---|---|
| Audio import + export mux | ✅ |
| Preview playback sync | ✅ |
| **Volume control + fades** | ❌ **high** |
| Real waveform | ⚠️ (decorative bar) |
| Multiple audio tracks | ❌ |
| Audio mixer / EQ | ❌ |

## 7. Text & Titles
| Feature | Status |
|---|---|
| Basic text + font size/weight/color | ✅ |
| **Stroke / shadow / gradient** | ⚠️ (partial in model, no UI) |
| Text alignment | ⚠️ |
| Font picker (system/Google fonts) | ❌ **high** |
| Text-on-path | ❌ |
| Subtitles / captions (+ auto) | ❌ |

## 8. Export / Delivery
| Feature | Status |
|---|---|
| MP4 H.264 at 1080p/4K/8K | ✅ |
| Audio in export | ✅ |
| **Platform presets** (YouTube/Insta/TikTok/Shorts) | ❌ **high** |
| Format/codec options (WebM, MOV, GIF) | ⚠️ (H.264 only) |
| Aspect-ratio presets (9:16, 1:1) | ❌ **high** |
| Render queue / batch | ❌ |
| Frame/image export | ❌ |

## 9. UX / Quality-of-Life (biggest "user-friendly" lever)
| Feature | Status |
|---|---|
| Premiere-style dockable panels | ✅ |
| Resizable panels | ✅ |
| Tools palette | ⚠️ (visual; only select/razor wired) |
| **Functional menus (File/Edit/...)** | ❌ **high** |
| Full keyboard shortcuts | ⚠️ (few) |
| Right-click context menus | ❌ **high** |
| Onboarding / empty-state guidance | ⚠️ |
| Workspaces (Edit/Color/Audio switch layouts) | ⚠️ (tabs visual) |
| Alignment guides / snapping on canvas | ❌ **high** |
| Zoom/pan canvas | ❌ |
| Undo/redo | ✅ |

## 10. Modern / AI (differentiators)
| Feature | Status |
|---|---|
| Shareable LAN preview | ✅ (unique!) |
| Auto-captions (speech→text) | ❌ |
| AI background/text generation | ❌ |
| Templates gallery | ✅ |

---

## 🎯 Prioritized roadmap (production-ready first)

### Tier 1 — Must-have (block production use)
1. **Project save / open (.json) + autosave** — abhi kaam kho jaata hai!
2. **Copy / paste / duplicate** layers + multi-select
3. **Canvas snapping + alignment guides** (center, edges)
4. **Timeline snapping + zoom/fit**
5. **Export presets** (YouTube 16:9, Shorts/Reels 9:16, Square 1:1) + aspect-ratio
6. **Functional File/Edit menus + right-click context menus**

### Tier 2 — Pro polish
7. **Transitions** (cross-dissolve, slide, wipe) between clips
8. **Filters** (blur, glow, drop-shadow, basic color) per layer
9. **Rich text UI** (stroke, shadow, gradient, font picker)
10. **Audio**: volume + fade in/out, real waveform
11. **Masking + blend modes**

### Tier 3 — Advanced
12. Graph editor (bezier easing curves)
13. Color grading panel (curves/wheels)
14. Auto-captions, speed control, chroma key
15. Multiple clips per track / multiple audio tracks

---

## Our unique edges (keep leaning in)
- **Code layers** (ReactBits/any web component) — no other editor has this
- **Resolution-independent → 8K from low-end** (web-animation engine)
- **Shareable LAN preview** (render-from-data)
- Faceless-content templates
