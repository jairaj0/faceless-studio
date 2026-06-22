# Status — single source of truth

Updated: 2026-06-22 · Legend: ✅ done · 🔨 in progress · ❌ not started

## Current milestone: **MVP loop done → M2 (scene engine) next**

The first end-to-end vertical slice works: **import images → arrange on timeline → preview → export MP4 (native ffmpeg)** at 720p/1080p/4K/8K, optional audio muxed in.

| Area | State | Notes |
|---|---|---|
| Folder structure | ✅ | clean feature-based layout |
| docs (ROADMAP/STATUS/DEVLOG/ARCHITECTURE/CONVENTIONS/WORKSPACE) | ✅ | |
| Command registry | ✅ | `commands/` — registry + keymap |
| Electron + Vite + React shell (boots) | ✅ | `npm run dev` works |
| **M1 — Menu bar** | ✅ | command-driven; items light up per milestone |
| M2 — Engine + Monitor | 🔨 | Preview Monitor (canvas + play/scrub) ✅ · scene/animate engine port ❌ |
| M3 — Timeline | ✅ | basic: image clips, scrub, drag-resize duration, playhead (reorder = later) |
| M4 — Inspector | ❌ | port |
| M5 — Project I/O | 🔨 | save/open .json works · timeline not serialized into doc yet |
| M6 — Export (native ffmpeg) | ✅ | canvas frames → ffmpeg H.264 mp4, 720p–8K + audio mux |
| M7 — Media + Audio | 🔨 | image+audio import ✅ · audio is export-only (Web Audio preview = later) |
| M8 — Backgrounds + Code layers | ❌ | port |
| M9 — Polish + Package | ❌ | |

## Menu policy (IMPORTANT)
Only menus/items that actually WORK are shown. Build feature → then add its menu item.
Currently the menu bar has **File** only (New/Open/Import Image/Import Audio/Save/Save As).

## Commands implemented so far
✅ File: `file.new`, `file.open`, `file.save`, `file.saveAs` (project saved as .json)
✅ Media: `media.importImage` (⌘I), `media.importAudio`
✅ Window: `window.edit` (⌘1), `window.export` (⌘2)

## Windows (2 views)
- **Edit** (⌘1) — Media bin (import) + Preview monitor + Timeline
- **Export** (⌘2) — reads the Edit timeline → native-ffmpeg render (720p/1080p/4K/8K + audio)

## Reference
`research/video-editor/app/` = previous working build. Port proven modules from there.

## Right now
End-to-end MVP loop is live (import → timeline → preview → export). Export uses the
canvas-frame → ffmpeg path (robust to mixed image sizes).
Next: **M2 — port the scene engine** (types/animate/SceneRenderer/codeLayer) so layers can be
animated web content, not just image stills; then Inspector (M4) + project-doc serialization (M5).
