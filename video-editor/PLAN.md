# Master Plan — Faceless Web-Animation Video Studio (fresh build)

> **PIVOT (final):** OpenReel fork DROP. Fresh, lightweight build jaisa POC tha.
> See `GOALS.md` (north star) and `poc-render/` (proven pipeline).

---

## Product in one line
Ek **pure-UI desktop app** (no code) jisme user faceless animation banata hai. App ka
"document" ek **resolution-independent web animation** hai (DOM/SVG/CSS). Editing locally
**ultra-fast** (lightweight web render). Export ke time wahi scene **frame-by-frame** kisi
bhi resolution (1080p/4K/**8K**) pe ffmpeg se video ban jaata hai. **Quality limit tooti.**

Think: **"Remotion ki power, par pure UI, no code"** + Premiere Pro jaisa interface.

---

## Why it works (POC-proven)
`poc-render/` ne prove kar diya: ek hi webpage → 1080p / 4K / **7680×4320 (8K)** sharp video,
ffmpeg se, ek normal machine pe. Animation = recipe (vector), footage nahi → no proxy needed,
resolution-independent. Editing 720p viewport pe = instant. Export offline = weak PC bhi 8K
de dega (bas wait).

---

## Architecture

```
        ┌──────────────── SCENE (document = JSON) ─────────────────┐
        │  comps → layers (text / shape / image / svg / group)     │
        │  transform + keyframes + easing + timeline               │
        └──────────────────────────┬───────────────────────────────┘
                                   │  ONE renderer, 3 consumers
        ┌───────────────┬──────────┴───────────┬──────────────────┐
        ▼               ▼                       ▼                  
  EDITOR PREVIEW   EXPORT (offline)        SHAREABLE PREVIEW
  (viewport res,   (hidden window @4K/8K,  (send JSON+assets,
   live, instant)   seek+capture→ffmpeg)    viewer browser renders)
```

- **Scene model:** JSON document. Layers keyframe-able. Resolution-independent.
- **Renderer:** React → DOM/SVG/CSS; **GSAP** drives animation; deterministic `seek(t)`.
  Same renderer for editor preview, export, and shareable preview.
- **Editor:** Premiere Pro-style UI; pure-UI editing (no code shown to user).
- **Export:** Electron hidden BrowserWindow renders scene at target res, frame-by-frame
  seek + capture → **native ffmpeg** → MP4. (POC pipeline, in-app.)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Shell | **Electron** + electron-vite + electron-builder |
| UI | React + TypeScript (strict) + Vite |
| Panels | **Dockview** (Premiere-style dockable) |
| UI kit | Tailwind + Radix UI + lucide-react |
| Animation engine | **GSAP** (deterministic `seek`, timeline, motion paths) |
| Scene render | **DOM + SVG + CSS** (resolution-independent); Canvas/Pixi later for heavy FX |
| Drag/handles | dnd-kit + interact.js (or custom) |
| State / Undo | Zustand + immer + action/command pattern |
| Storage | Project files (.json) on disk + autosave (Electron fs) |
| Export | Electron hidden window capture + **native ffmpeg** (ffmpeg-static). WebCodecs = speed option |
| Text/fonts | opentype.js + bundled web fonts |
| Quality | TS strict + Biome + Vitest + Playwright |

> Reference only (not used): `_eval-openreel/` — padhne ke liye, code copy ke liye.
> Carryover from paused work: Premiere theme tokens + PanelFrame/ToolsPalette concepts (port karenge).

---

## Phase-Wise Roadmap (each independently testable)

### Phase 0 — Foundation 🏗️
Electron + Vite + React + TS skeleton; native ffmpeg wired (spawn from main); IPC bridge.
**✅ Test:** App khulti hai (Mac); button → backend `ffmpeg -version`.

### Phase 1 — Scene Model + Renderer + Player 🎞️ (the heart)
Scene JSON schema (comp, layers, transform, keyframes, easing). React renderer → DOM/SVG/CSS.
GSAP-driven deterministic `seek(t)`. Standalone Player (play/scrub).
**✅ Test:** Hardcoded scene play + scrub hota hai, resolution-independent.

### Phase 2 — Export Engine 🎬 (in-app POC)
Hidden BrowserWindow renders scene @ target res; frame-by-frame seek+capture → native ffmpeg.
Presets 1080p/4K/8K, fps, codec; progress + cancel.
**✅ Test:** App se ek scene → 4K MP4 export.

### Phase 3 — Premiere-Style Editor Shell 🪟
Dark Premiere theme, Dockview panels (Program=Player, Project, Effect Controls, Timeline),
tools palette, workspace tabs, Premiere keyboard shortcuts. Program monitor = live Player.
**✅ Test:** Editor khule, panels dock/resize, preview chale.

### Phase 4 — Editing Tools (pure UI, no code) ✏️
Canvas handles (move/scale/rotate), layers panel, properties panel, timeline tracks + keyframes
(stopwatch), drag/trim, playhead, undo/redo.
**✅ Test:** Bina code, GUI se choti animation → scrub → export.

### Phase 5 — Animation Power ✨
Rich text + animated text presets, SVG import + path animation, shape tools, motion presets,
easing editor.
**✅ Test:** Animated title + SVG morph UI se.

### Phase 6 — Media + Audio 📁
Import image/SVG/font/audio; media bin; drag to scene/timeline; audio track + waveform; audio
muxed in export.
**✅ Test:** Assets import → place → export with audio.

### Phase 7 — Faceless Templates 🧩
Template gallery (listicle, quote, explainer, news, captions); fully editable/custom.
**✅ Test:** Template pick → customize → export.

### Phase 8 — Shareable Preview URL 🔗
Local server serves scene JSON+assets; viewer page renders via same renderer; LAN URL.
**✅ Test:** Dusre device (same wifi) ke browser me preview/scrub.

### Phase 9 — Performance + Branding + Package 🚀
OffscreenCanvas/worker + faster capture (WebCodecs option), low-end smoothness, autosave;
own name/logo/theme; electron-builder .dmg/.exe; ffmpeg hwaccel.
**✅ Test:** Low-end pe smooth; installer clean machine pe chale.

---

## Risks / Notes
1. **Frame capture speed** — Electron `capturePage` per-frame ok; optimize with WebCodecs/raw pipe later.
2. **Raster assets** in a faceless scene (4K image/b-roll) = heavy part; optimize per-asset.
3. **`await raf()` before capture** — POC gotcha; ensures no blank/duplicate frames.
4. Editor preview at viewport res keeps low-end smooth; export offline keeps 8K feasible.
