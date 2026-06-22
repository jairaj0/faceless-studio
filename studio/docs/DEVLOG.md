# Dev Log

Newest first. One entry per working session. Format: Done / Next / Blocked.

---

## 2026-06-22 — Day 1 (later 3): MVP loop — import → timeline → preview → export
**Done**
- **Edit window** is now a real workspace: Media Bin + Preview Monitor + Timeline.
  - Media Bin: Import Image (multi) / Import Audio → list with thumbs; double-click/＋ adds to timeline.
  - Preview Monitor: canvas composite at comp size, play/pause + playhead time, redraws on decode.
  - Timeline: gapless image clips, click-to-scrub, drag right edge to resize duration, per-clip remove, playhead.
- **Export window** wired to the same store: resolution presets 720p/1080p/4K/8K, renders each frame on a
  canvas → ships PNG to main → **native ffmpeg** (libx264, crf18) → mp4, optional audio muxed (`-shortest`).
  Progress bar (capture % then encode %), reveals file in Finder on done.
- Backend: `ipc/media.ts` (dialog import), `ipc/export.ts` + `services/exportSession.ts` (begin/frame/encode/cancel),
  `services/ffmpeg.ts`. ffmpeg detected at boot (`ffmpeg 6.0`).
- Windows trimmed 3→2 (Edit ⌘1 / Export ⌘2) — Import&Preview folded into Edit. File menu gained Import Image/Audio.
- Covers: **M3 (timeline, basic) ✅, M6 (export) ✅**; partial **M2 (monitor), M7 (media+audio import)**.

**Next**
- M2: port the scene engine (animated web layers, not just stills) + Inspector (M4) + serialize timeline into the project doc (M5).

**Blocked**
- None. (Note: leave only one `npm run dev` running — stale instances hog ports 5173/5174.)

---

## 2026-06-22 — Day 1 (later 2): menu trimmed + Windows + File working
**Done**
- Policy: only working buttons shown. Menu bar trimmed to **File + Window** (rest return per milestone).
- **Window** = 3 switchable windows: Edit / Import & Preview / Export (placeholders) + tab strip + ⌘1/⌘2/⌘3.
- **File** working+testable: New / Open / Save / Save As → project saved as .json (IPC + fileSystem service +
  project store). Project name shows in menu bar.
- Removed dead items (About/reload menu, all stub menus).

**Next**
- M2: port pure engine + build the Edit window's monitor (render + play/scrub).

**Blocked**
- None.

---

## 2026-06-22 — Day 1 (later): M0 + M1 done
**Done**
- M0: structure + docs + command registry + Electron shell — `npm install` ✅, app boots (`npm run dev`).
- M1: Menu bar live — full menu catalog (File…Help), command-driven, items auto-disable until their milestone.
- Working commands: help.about, help.shortcuts, window.reload.
- Workspace/content structure designed → `docs/WORKSPACE.md`.

**Next**
- M2: port pure engine (types/animate/SceneRenderer/codeLayer) → `engine/`; add scene+playback store slices;
  build Program Monitor (render + play/scrub); register playback commands (transport menu items light up).

**Blocked**
- None.

**Notes**
- electron binary needed manual extract (npm blocks postinstall) — ditto-extract from cache + write path.txt.

---

## 2026-06-22 — Day 1: clean rebuild kickoff
**Done**
- Decided: rebuild systematically (structure + docs first, code feature-by-feature).
- Created clean folder structure under `studio/`.
- Wrote docs: ARCHITECTURE, CONVENTIONS, ROADMAP, STATUS, DEVLOG.
- (next in this session) command registry skeleton + runnable Electron+React shell.

**Next**
- Finish M0: command registry + boot shell + `npm install`.
- Start M1: Menu bar — wire File/Edit fully via commands, rest disabled honestly.

**Blocked**
- None.

**Notes**
- Previous working app is at `research/video-editor/app/` — port engine/export/timeline from there, don't rewrite.
