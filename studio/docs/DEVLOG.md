# Dev Log

Newest first. One entry per working session. Format: Done / Next / Blocked.

---

## 2026-06-22 — Multi-track Stage 1 (Premiere-style N tracks)
**Done — rebuilt the document model from single-track → N free-positioned tracks** (after studying
OpenReel's `Track[]` model; kept studio's canvas-render engine untouched per constraint "engine nhi badalna"):
- **Model** (`store/editor.ts`): `tracks: Track[]`, each `Track { clips: Clip[]; hidden; locked; solo }`.
  Clips carry an absolute `start` (gaps allowed). Helpers `allClips`, `findClip`, `locate`. New actions:
  `addTrack`/`removeTrack`/`toggleTrack`, `placeClip(id, trackId, start)` (atomic move across + within
  tracks), `setClipStart`, plus split/duplicate/keyframes reworked over the track model. Undo snapshots
  now `{tracks, comp}`. v2 single-track saves migrate into one V1 track with recomputed absolute starts.
- **Compositing** (`composite.ts`): `visibleTracks` (solo overrides, hidden excluded), `visibleClipsAt`
  (bottom→top), `clipAt` (latest-starting wins, no "hold last clip"), `prepareFrame` seeks **all** visible
  videos. `drawFrame` paints bottom track → top.
- **Master-clock playback** (`PreviewMonitor.tsx`): playhead advances by real dt; every visible video is
  seeked/nudged (re-seek if drift > 0.3s) → supports **multiple simultaneous videos (PiP across tracks)**.
  Replaces the old "video drives the playhead" hack.
- **Timeline rewrite** (`Timeline.tsx`): N lanes (top track on top), sticky track headers with
  👁 hide / 🔒 lock / ◉ solo / ✕ remove + **+Track**, px-based zoom + horizontal scroll, clips positioned
  by absolute start, **horizontal drag = retime / vertical drag = move between tracks** (`placeClip`),
  both-edge trim, keyframe diamonds, razor/split, snapping, context menu, read-only audio lane, playhead
  spanning all lanes. EditWindow split-shortcut + Home/End added.
- Export (`ExportWindow.tsx`) + serialize updated for tracks. typecheck + build green; dev boots clean.

**Next:** Stage 2 — text / caption layers (new clip type `text`, render in composite, Inspector controls,
"Add Text" button). Then Stage 3 color/filters, Stage 4 transitions, Stage 5 audio waveform+volume+fades.

---

## 2026-06-22 — Day 1 (later 6): keyframes + pro timeline tools (ported from reference)
**Done — ported the *working* parts of `research/video-editor/app` into studio's clip model:**
- **Animation engine** (`features/edit/animate.ts`): `evalProp` + 6 easings (linear/easeIn/Out/InOut/
  OutCubic/OutBack). Pure function of time → preview and ffmpeg export animate identically.
- **Keyframe-able transforms**: each clip transform prop (scale/x/y/rotation/opacity) is now
  `number | Keyframe[]`. Keyframe times are **clip-local** (survive reorder/resize/split, unlike the
  reference's absolute-scene times). `composite.ts` evaluates props at clip-local time per frame.
- **Inspector** is now an Effect-Controls panel: ◇/◆ keyframe toggle per property (◆ = write keyframe
  at playhead), live value readout, **easing dropdown** for the selected keyframe, **motion presets**
  (Fade In/Out, Slide ←→↑↓, Pop, Spin) — all from the reference.
- **Timeline tools**: razor/split (✂ tool + S key + context menu, splits keyframes too), **snapping**
  (🧲, to playhead/clip bounds), **zoom** (−/Fit/+), **keyframe diamonds** on the clip row (drag to
  retime, click to select), right-click **context menu** (split/duplicate/delete) — plus existing
  reorder/trim/scrub.
- **Undo/redo** (clips+comp snapshots, 60 deep) — ⌘Z / ⇧⌘Z. Continuous gestures push history once at
  start; discrete actions auto-commit.
- **Edit shortcuts** added: S split-at-playhead, ⌘D duplicate, ⌘Z/⇧⌘Z undo/redo (+ existing
  space/arrows/delete).
- Export needs no change — it shares `drawFrame`, so keyframed motion renders straight into the MP4.
- Deliberately **left for M8** (text/shape/svg/**code** layers, the animated-background system) and the
  audio-volume/waveform work — only ported what actually worked.

**Next**
- M8: scene/code layers (animated web backgrounds) · audio volume+fades · export aspect/platform presets.

**Blocked**
- None.

---

## 2026-06-22 — Day 1 (later 5): editable MVP — engine + inspector + reorder + save/open
**Done**
- **Compositing engine** (`composite.ts`) now applies per-clip **fit mode** (contain/cover/fill) +
  **transform** — scale, position X/Y, rotation, opacity — all stored as fractions of the comp, so an
  edit looks identical in the preview and in the ffmpeg export at any resolution (720p–8K). Video clips
  gained a **trim start** (source in-point) honoured in both preview seek and export.
- **Inspector panel** (right of the monitor): Composition (background colour, frame rate) + the selected
  clip's properties (fit buttons, scale/X/Y/rotation/opacity sliders, reset-transform, duration, video
  trim, remove). Live two-way bound to the store.
- **Timeline**: clips are now **drag-to-reorder** (cross-midpoint swap) on top of select / scrub /
  drag-resize / remove; selected clip is highlighted.
- **Editing keyboard shortcuts** (Edit window): Space play/pause, ←/→ step a frame (⇧ = 10), Delete
  removes the selected clip.
- **Project save/open now round-trips the whole edit**: `serialize.ts` writes comp + clips + media
  (referenced by absolute **path**, not bytes) + audio into the .json; on open the files are re-read
  from disk and rebuilt as blob URLs. Old clips missing new fields are migrated with defaults.
- Milestones reached: **M2 (engine+monitor) ✅, M4 (inspector) ✅, M5 (project I/O) ✅**.

**Next**
- M8: animated backgrounds / code-layers (keyframed web content) · audio polish (mux video audio +
  Web Audio preview) · M9 autosave + packaging.

**Blocked**
- None. (Saved projects reference media by file path — moving/deleting a source file breaks reload; an
  "embed media" option is a later choice.)

---

## 2026-06-22 — Day 1 (later 4): drag & drop + video support (import → preview → export)
**Done**
- **Drag & drop** onto Media bin (images/video/audio) — dashed-highlight drop zone + result note; global drop guard
  so a stray drop can't navigate the window. Dropped files use blob URLs (same-origin → export canvas stays clean).
- **Video is now a first-class media type** end-to-end:
  - Import: `+ Video` button + File ▸ Import Video + drag&drop. Dialog video stays path-only → renderer streams it
    as a Blob via `media:bytes` (no giant base64). Natural duration probed → new clip defaults to full length.
  - Media bin shows video thumbs (first frame + ▶). Timeline shows video clips (🎞 label), same scrub/resize/remove.
  - Preview: video clips play natively (muted, playhead locked to video time); paused = frame-accurate seek.
  - Export: each frame seeks the active video then composites to canvas → ffmpeg. Mixed image+video timelines work.
- Media model refactor: `MediaItem.src` (data URL for image/audio, blob URL for video) + `path` for ffmpeg; blob URLs
  revoked on remove/reset/new-project. Audio still muxed; **video's own audio not muxed yet** (noted in Export UI).

**Next**
- Mux video-clip audio in export (ffmpeg adelay/amix) · clip reorder on timeline · then M2 scene engine.

**Blocked**
- None.

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
