# Status — single source of truth

Updated: 2026-06-22 · Legend: ✅ done · 🔨 in progress · ❌ not started

## Current milestone: **M2 — Engine + Monitor**

| Area | State | Notes |
|---|---|---|
| Folder structure | ✅ | clean feature-based layout |
| docs (ROADMAP/STATUS/DEVLOG/ARCHITECTURE/CONVENTIONS/WORKSPACE) | ✅ | |
| Command registry | ✅ | `commands/` — registry + keymap |
| Electron + Vite + React shell (boots) | ✅ | `npm run dev` works |
| **M1 — Menu bar** | ✅ | full menu catalog, command-driven; items light up per milestone |
| M2 — Engine + Monitor | ❌ | port from research/video-editor/app |
| M3 — Timeline | ❌ | port |
| M4 — Inspector | ❌ | port |
| M5 — Project I/O | ❌ | port + Workspace folders (WORKSPACE.md) |
| M6 — Export (native ffmpeg) | ❌ | port |
| M7 — Media + Audio (Web Audio) | ❌ | audio = Web Audio upgrade |
| M8 — Backgrounds + Code layers | ❌ | port |
| M9 — Polish + Package | ❌ | |

## Menu policy (IMPORTANT)
Only menus/items that actually WORK are shown. Build feature → then add its menu item.
Currently the menu bar has **File** + **Window** only. Edit/Clip/Sequence/Markers/Graphics/
View/Help return as their features land.

## Commands implemented so far
✅ File: `file.new`, `file.open`, `file.save`, `file.saveAs` (working — project saved as .json)
✅ Window: `window.edit`, `window.import`, `window.export` (switch the 3 windows; ⌘1/⌘2/⌘3)

## Windows (3 main views — placeholders, upgrade later)
- **Edit** — editing workspace (fills in M2–M4)
- **Import & Preview** — media + preview (M7)
- **Export** — render settings (M6)

## Reference
`research/video-editor/app/` = previous working build. Port proven modules from there.

## Right now
Menu trimmed to File+Window (both working). 3-window shell live. File I/O works (save/open .json).
Next: **M2 — port the pure engine** into `engine/`, add scene+playback store, and build the
**Edit window's** monitor (render + play/scrub) — then later timeline (M3) + inspector (M4).
