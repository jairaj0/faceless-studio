# Dev Log

Newest first. One entry per working session. Format: Done / Next / Blocked.

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
