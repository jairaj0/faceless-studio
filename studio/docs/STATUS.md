# Status — single source of truth

Updated: 2026-06-22 · Legend: ✅ done · 🔨 in progress · ❌ not started

## Current milestone: **M8 done — animated backgrounds + code layers ✅** (Stages 1–6)

The first end-to-end vertical slice works: **import images/video → arrange on N timeline tracks → preview → export MP4 (native ffmpeg)** at 720p/1080p/4K/8K, optional audio muxed in.

### Multi-track upgrade (5-stage plan, from OpenReel feature study)
Premiere-style N tracks: each track has free-positioned clips (gaps allowed); higher track composites on top; per-track hide 👁 / lock 🔒 / solo ◉ / remove. Playback uses a **master clock** (playhead drives time; every visible video is seeked/nudged to stay in sync → multiple simultaneous videos / PiP).
- **Stage 1 — multi-track core** ✅ tracks model, compositing bottom→top, vertical+horizontal clip drag, add/remove track, per-track controls, master-clock playback, v2→v3 save migration.
- **Stage 2 — Text / caption layers** ✅ `text` clip type, canvas-rendered (res-independent fontSize, multi-line, align, colour, box), Inspector text controls (content/font/size/weight/align/colour/box), +Text button + `T` key, keyframe-animatable like any clip.
- **Stage 3 — Colour / filters** ✅ per-clip `filters` (brightness/contrast/saturation/hue/blur, blur res-independent) applied via canvas `ctx.filter`; 8 presets (Vivid/B&W/Noir/Warm/Cool/Vintage/Dream); Inspector Colour section (preset grid + sliders, double-click to reset a slider). Preview == export.
- **Stage 4 — Transitions** ✅ per-clip in/out transitions (fade / slide / wipe + direction + duration) rendered within the clip's own span (no engine change — `transEnv` modulates alpha / offset / reveal-rect in `composite`); works on media + text; Inspector Transitions section; corner wedges on timeline clips.
- **Stage 5 — Audio waveform + volume + fades** ✅ Web Audio preview (AudioContext → gain, fade envelope, drift-corrected sync in PreviewMonitor); decoded **waveform peaks drawn in the timeline audio lane** (+ fade-in/out wedges, volume %); Inspector Audio section (volume slider + fade-in/out seconds); audio duration probed on import; **export applies `volume=` + `afade=` via ffmpeg `-af`** so render matches preview; `audioMix` persisted in project save.

| Area | State | Notes |
|---|---|---|
| Folder structure | ✅ | clean feature-based layout |
| docs (ROADMAP/STATUS/DEVLOG/ARCHITECTURE/CONVENTIONS/WORKSPACE) | ✅ | |
| Command registry | ✅ | `commands/` — registry + keymap |
| Electron + Vite + React shell (boots) | ✅ | `npm run dev` works |
| **M1 — Menu bar** | ✅ | command-driven; items light up per milestone |
| M2 — Engine + Monitor | ✅ | compositing + **keyframe animation engine** (evalProp + 6 easings, res-independent) + Monitor (play/scrub/step) · scene/code layers → M8 |
| M3 — Timeline | ✅ | **N tracks** (lanes): scrub, trim both edges, **vertical drag between tracks**, **razor/split, snapping, zoom, keyframe diamonds, context menu**, per-track 👁🔒◉/remove, +Track, playhead spanning lanes |
| M4 — Inspector | ✅ | comp (bg/fps) + clip transform with **keyframes (◆) + easing + motion presets** + fit, duration, video trim |
| M5 — Project I/O | ✅ | save/open .json serializes full editor (comp+media-by-path+clips+audio); media re-read on open · autosave → M9 |
| M6 — Export (native ffmpeg) | ✅ | canvas frames → ffmpeg H.264 mp4, 720p–8K + audio mux |
| M7 — Media + Audio | ✅ | image/**video**/audio import (buttons + drag&drop) ✅ · video plays in preview + renders in export ✅ · **Web Audio preview + waveform + volume + fades** ✅ · video's own audio mux = later |
| M8 — Backgrounds + Code layers | ✅ | **10 procedural animated backgrounds** (pure canvas fns of clip-local time → frame-accurate, preview==export) + gallery modal + Inspector (preset grid, 3 colours, speed) · **Code layers (HTML/CSS/JS or React/JSX + gsap)** in a sandboxed iframe, live in preview overlay, exported frame-accurately via modern-screenshot rasterisation at render resolution; vendored react/react-dom/babel/gsap/modern-screenshot |
| M9 — Polish + Package | ❌ | |

## Menu policy (IMPORTANT)
Only menus/items that actually WORK are shown. Build feature → then add its menu item.
Currently the menu bar has **File** only (New/Open/Import Image/Import Audio/Save/Save As).

## Commands implemented so far
✅ File: `file.new`, `file.open`, `file.save`, `file.saveAs` (project saved as .json)
✅ Media: `media.importImage` (⌘I), `media.importVideo`, `media.importAudio` (+ drag & drop onto Media bin)
✅ Window: `window.edit` (⌘1), `window.export` (⌘2)

## Windows (2 views)
- **Edit** (⌘1) — Media bin (import) + Preview monitor + Timeline
- **Export** (⌘2) — reads the Edit timeline → native-ffmpeg render (720p/1080p/4K/8K + audio)

## Reference
`research/video-editor/app/` = previous working build. Port proven modules from there.

## Editing shortcuts (Edit window)
Space play/pause · ←/→ step 1 frame (⇧ = 10) · S split at playhead · ⌘D duplicate · ⌘Z / ⇧⌘Z undo/redo
· Home/End jump to start/end · Delete/Backspace remove selected clip.
· T add text layer · B add background · L add code layer.
Timeline tools: ⬚ select · ✂ razor · 🧲 snap · −/1×/+ zoom · +Text · +BG · </> code · +Track. Drag a clip up/down to move it between tracks.

## Right now
Imported media is fully **editable + saveable + exportable**: drag-reorder/resize clips on the
timeline, tune each clip in the Inspector (fit, scale, position, rotation, opacity, duration, video
trim), set comp bg/fps; every transform is resolution-independent so it renders identically in the
ffmpeg export at 720p–8K. Projects save/open with the whole timeline (media referenced by file path).
Next: **M8 — animated backgrounds / code-layers** (keyframed web content, not just stills), then
audio polish (mux video's own audio, Web Audio preview) + M9 packaging/autosave.
