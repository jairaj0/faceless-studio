# Status — single source of truth

Updated: 2026-06-22 · Legend: ✅ done · 🔨 in progress · ❌ not started

## Current milestone: **🎉 ALL MILESTONES DONE (M0–M9) — shippable .dmg built**

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
| M9 — Polish + Package | ✅ | **Branding** (app icon, "Faceless Studio" name, onboarding empty-state w/ quick actions) · **Insert + View menus** (Text/Background/Code · Edit/Export) · **autosave + crash recovery** (debounced dirty-tracked snapshot in userData → restore banner on next launch) · **real installers via electron-builder** (`npm run dist:mac/:win`, ffmpeg unpacked from asar) — produced `release/Faceless Studio-0.1.0-arm64.dmg` |

## Menu policy (IMPORTANT)
Only menus/items that actually WORK are shown. Build feature → then add its menu item.
Menu bar: **File** (New/Open/Import Image·Video·Audio/Save/Save As) · **Insert** (Text/Background/Code) · **View** (Edit/Export).

## Commands implemented so far
✅ File: `file.new`, `file.open`, `file.save`, `file.saveAs` (project saved as .json)
✅ Media: `media.importImage` (⌘I), `media.importVideo`, `media.importAudio` (+ drag & drop onto Media bin)
✅ Insert: `insert.text` (T), `insert.background` (B), `insert.code` (L)
✅ Window: `window.edit` (⌘1), `window.export` (⌘2)

## Packaging
`npm run dist:mac` → `release/Faceless Studio-<ver>-arm64.dmg` · `npm run dist:win` → NSIS .exe · `npm run icon` regenerates `build/icon.png`.
electron-builder config lives in `package.json` › `build`; ffmpeg-static is `asarUnpack`ed so the bundled binary stays executable. Builds are unsigned (set `CSC_IDENTITY_AUTO_DISCOVERY=false` or add signing creds for distribution).

## Windows (3 views)
- **Edit** (⌘1) — Media bin (import) + Preview monitor + Timeline
- **Library** (⌘2) — Import & Preview: gallery of component presets (HTML/React+gsap) + **direct ReactBits integration**. Each card live-previews in the same sandboxed-iframe runtime as real code layers (what you see = what exports); "Add to timeline" drops it as an editable code-layer clip and jumps to Edit. Search + Text/Background/UI filters. Built-in presets in `features/library/presets.ts`; curated real ReactBits components (BlurText/GlitchText/RotatingText, MIT, with attribution + Frame-accurate/Preview fidelity badge) in `features/library/reactbitsPresets.ts` (source vendored verbatim as `?raw` under `reactbits/`). **"Import from ReactBits"** button (`ReactBitsImport.tsx`) — paste any component's JS/TSX (+ optional CSS), live-preview, add as a code layer. The code-layer runtime now resolves ES imports for `react`, `react-dom`, `gsap`/`@gsap/react`, **`motion/react` (framer-motion, vendored via esbuild → `motion-react.js`)** and ignores CSS imports; Babel runs `env`+`react`(classic runtime)+`typescript` so TSX pastes run as-is. WebGL/three.js components are excluded (can't seek/rasterise deterministically) → motion components carry a "Preview" fidelity badge (preview live, export approximate); CSS/gsap stay frame-accurate.
- **Export** (⌘3) — reads the Edit timeline → native-ffmpeg render (720p/1080p/4K/8K + audio)

## Reference
`research/video-editor/app/` = previous working build. Port proven modules from there.

## Editing shortcuts (Edit window)
Space play/pause · ←/→ step 1 frame (⇧ = 10) · S split at playhead · ⌘D duplicate · ⌘Z / ⇧⌘Z undo/redo
· Home/End jump to start/end · Delete/Backspace remove selected clip.
· T add text layer · B add background · L add code layer.
Timeline tools: ⬚ select · ✂ razor · 🧲 snap · −/1×/+ zoom · +Text · +BG · </> code · +Track. Drag a clip up/down to move it between tracks.

## Right now
**Feature-complete and installable.** Compose on a multi-track timeline (media, text, animated
backgrounds, live HTML/React+gsap code layers), keyframe any transform, colour-grade, add transitions,
mix audio (waveform/volume/fades); every layer is resolution-independent and renders identically via the
native-ffmpeg export at 720p–8K. Projects save/open (media by path) and autosave for crash recovery.
Build a real installer with `npm run dist:mac` (or `:win`). All milestones M0–M9 are done.
Post-1.0 ideas: code-signing/notarization, mux a video clip's own audio, multi-window.
