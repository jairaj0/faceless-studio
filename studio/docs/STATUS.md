# Status — single source of truth

Updated: 2026-06-22 · Legend: ✅ done · 🔨 in progress · ❌ not started

## Current milestone: **Editable MVP done (engine+monitor+inspector+timeline+save) → M8 (animated backgrounds) next**

The first end-to-end vertical slice works: **import images → arrange on timeline → preview → export MP4 (native ffmpeg)** at 720p/1080p/4K/8K, optional audio muxed in.

| Area | State | Notes |
|---|---|---|
| Folder structure | ✅ | clean feature-based layout |
| docs (ROADMAP/STATUS/DEVLOG/ARCHITECTURE/CONVENTIONS/WORKSPACE) | ✅ | |
| Command registry | ✅ | `commands/` — registry + keymap |
| Electron + Vite + React shell (boots) | ✅ | `npm run dev` works |
| **M1 — Menu bar** | ✅ | command-driven; items light up per milestone |
| M2 — Engine + Monitor | ✅ | compositing + **keyframe animation engine** (evalProp + 6 easings, res-independent) + Monitor (play/scrub/step) · scene/code layers → M8 |
| M3 — Timeline | ✅ | clips: scrub, trim, reorder, **razor/split, snapping, zoom, keyframe diamonds, context menu**, playhead |
| M4 — Inspector | ✅ | comp (bg/fps) + clip transform with **keyframes (◆) + easing + motion presets** + fit, duration, video trim |
| M5 — Project I/O | ✅ | save/open .json serializes full editor (comp+media-by-path+clips+audio); media re-read on open · autosave → M9 |
| M6 — Export (native ffmpeg) | ✅ | canvas frames → ffmpeg H.264 mp4, 720p–8K + audio mux |
| M7 — Media + Audio | 🔨 | image/**video**/audio import (buttons + drag&drop) ✅ · video plays in preview + renders in export ✅ · video's own audio + Web Audio preview = later |
| M8 — Backgrounds + Code layers | ❌ | port |
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
· Delete/Backspace remove selected clip. Timeline tools: ⬚ select · ✂ razor · 🧲 snap · −/Fit/+ zoom.

## Right now
Imported media is fully **editable + saveable + exportable**: drag-reorder/resize clips on the
timeline, tune each clip in the Inspector (fit, scale, position, rotation, opacity, duration, video
trim), set comp bg/fps; every transform is resolution-independent so it renders identically in the
ffmpeg export at 720p–8K. Projects save/open with the whole timeline (media referenced by file path).
Next: **M8 — animated backgrounds / code-layers** (keyframed web content, not just stills), then
audio polish (mux video's own audio, Web Audio preview) + M9 packaging/autosave.
