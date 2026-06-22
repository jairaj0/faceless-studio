# Roadmap (milestones)

Depth-first: finish one area to "Done" before the next. Each milestone = one area.

## M0 — Scaffold ✅ (in progress)
Folder structure, docs, command registry skeleton, runnable Electron+React shell.

## M1 — Menu bar (command registry proof)
Every top menu fully working via commands: File, Edit, Clip, Sequence, Markers,
Graphics, View, Window, Help. Items not yet backed by a feature are visibly disabled.
**Done when:** every menu opens, every enabled item runs a real command, shortcuts match.

## M2 — Engine + Monitor
Port the pure scene engine (types, animate, SceneRenderer, codeLayer). Program monitor
renders + plays a scene. Transport (play/scrub/frame-step) via commands.

## M3 — Timeline
Tracks, clips (move/trim/split), keyframes (drag + easing), playhead, snapping, zoom.

## M4 — Inspector
Per-layer properties + transform keyframes + animate presets.

## M5 — Project I/O
New/Open/Save/Save As (.json) + autosave + recovery (wired to File menu commands).

## M6 — Export
Native ffmpeg render @ 1080p/4K/8K, aspect presets, progress.

## M7 — Media + Audio
Image import; audio import + Web Audio (waveform, volume, fades) + export mux.

## M8 — Backgrounds / Code layers
Code layer (HTML + React + gsap), backgrounds gallery.

## M9 — Polish + Package
Context menus everywhere, onboarding, branding, electron-builder (.dmg/.exe).

> Reference implementation of all of the above already exists in `research/video-editor/app/` — we port,
> not rewrite.
