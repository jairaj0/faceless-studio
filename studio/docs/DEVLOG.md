# Dev Log

Newest first. One entry per working session. Format: Done / Next / Blocked.

---

## 2026-06-22 — Library window: ReactBits-style component presets (Import & Preview)
**Done:**
- **New "Library" window** (Import & Preview) re-added — 3 views now: Edit ⌘1 / **Library ⌘2** / Export ⌘3
  (Export moved 2→3; `window.commands.ts`, MenuBar tabs, View menu all updated).
- **Component preset gallery** (`features/library/presets.ts`, 13 presets across Text / Background / UI):
  Gradient/Shiny/Blur-In/Wave/Glitch/Typewriter/Count-Up text, Aurora/Mesh/Particle/Grid backgrounds,
  Glow Button + Live Badge UI. Authored as HTML(+gsap/CSS) or React/JSX — resolution-independent (vh/vw),
  loop-friendly, and **frame-accurate on export** (CSS @keyframes / gsap / `window.__seek` for the counter).
- **`LibraryWindow.tsx`** — searchable, category-filtered grid; each card live-previews in the *same*
  sandboxed-iframe runtime as real code layers (reuses `buildCodeSrcdoc`), driven by one shared host clock
  (rAF → `seek`) so all cards animate in lockstep. "Add to timeline" → `addCodeClip({lang,source})` +
  jump to Edit. No dead buttons: gallery works before the tab was wired.
- Boot-tested (`npm run preview`): clean start, ffmpeg 6.0, no crash; `npm run build` green (66 modules).

**Next:** optional — user-pasteable custom component import; thumbnail poster for heavy presets; more presets.

---

## 2026-06-22 — App logo (keyframe-play mark)
**Done:**
- Upgraded `scripts/make-icon.mjs` (2× supersampled, squircle/superellipse, 3-stop gradient, A/B/C variants);
  shipped **variant B** (play triangle + keyframe-diamond track) as `build/icon.png`; rebuilt the unsigned .dmg
  with the new `icon.icns`.

---

## 2026-06-22 — M9: polish + real installers — COMPLETE (project shippable)
**Done:**
- **Branding**: dependency-free icon generator (`scripts/make-icon.mjs` → `build/icon.png`, raw RGBA→PNG via
  zlib: violet→teal rounded tile + play triangle); app/product name "Faceless Studio"; onboarding empty-state
  in the preview (quick actions: import media / +background / +text / +code) replacing the bare placeholder.
- **Menus** (no dead buttons — all features now exist): added **Insert** (Text T / Background B / Code L) and
  **View** (Edit ⌘1 / Export ⌘2) menus + `insert.commands.ts` registered in builtins.
- **Autosave + crash recovery**: `dirty` flag on the app store (set on real *document* edits only — tracks/
  comp/media/audio, ignoring playhead/selection churn via reference-identity diff; cleared on Save/Open/New).
  `useAutosave` debounces 1.5s → writes a snapshot to `userData/recovery.fstudio.json` (main: `recovery.ts`
  service + `recovery:write/read/clear` IPC + preload `window.api.recovery`). `RecoveryBanner` reads it on
  launch and offers Restore / Discard. Save/Open clear the snapshot so it only resurfaces after an unclean exit.
  Refactored `projectActions` → `buildProjectFile()` / `loadProjectFile()` reused by Save + autosave + Open.
- **Real installers**: electron-builder `build` config in package.json (appId, productName, mac dmg / win nsis /
  linux AppImage, icon, `asarUnpack` ffmpeg-static so the binary is executable in the bundle). Scripts
  `dist` / `dist:mac` / `dist:win` / `icon`. **Built a real `release/Faceless Studio-0.1.0-arm64.dmg`
  (116 MB, unsigned)**; verified ffmpeg lands in `app.asar.unpacked`.
- typecheck ✅ · build ✅ · `npm run preview` boots the packaged app cleanly (ffmpeg 6.0 detected) · dmg built ✅.
- **All milestones M0–M9 complete.** Faceless Studio is a self-contained, installable desktop animation→video
  editor: multi-track timeline, keyframe animation, text/colour/transitions, audio (waveform/volume/fades),
  procedural animated backgrounds, live code layers (HTML/React+gsap), native-ffmpeg export to 720p–8K, and
  project save/open + crash recovery.
- **Next (optional, post-1.0):** code-signing/notarization for distribution; mux a video clip's own audio;
  multi-window; richer code-layer templates.

---

## 2026-06-22 — M8: animated backgrounds + code layers — COMPLETE
**Done — engine extended (user lifted the "don't change engine" rule: best result wins):**
- **Two new clip types** `background` and `code` (`ClipType` widened; clips carry optional `bg`/`code` specs).
- **Backgrounds** (`backgrounds.ts`): `drawBackground(ctx, comp, clip, localT)` — 10 presets (aurora, mesh,
  linear, radial, beams, grid, dots, particles, starfield, waves) as **pure procedural canvas functions of
  clip-local time** (deterministic `rnd(seed)`, no RAF) → preview and ffmpeg export are byte-identical. Each
  preset has 3 editable colours + a speed multiplier. `addBackgroundClip(presetId?)` drops on the **bottom**
  track at the playhead. Inspector "Background" section = preset grid + 3 colour pickers + speed slider
  (`updateBg`, live). Gallery modal + `+ BG` toolbar button + `B` shortcut.
- **Code layers** (`codeLayer.ts` / `CodeOverlay.tsx` / `codeExport.ts`): author **HTML/CSS/JS or React/JSX**
  with **gsap** available, run inside a **sandboxed iframe** (`allow-scripts allow-same-origin`) loading
  vendored react/react-dom/babel/gsap. Live in the preview as an overlay aligned to the canvas's object-fit
  content rect (clock seeks while paused, plays while playing). **Frame-accurate export**: an offscreen
  iframe per code clip at render resolution, seeked via `document.getAnimations()` currentTime + gsap
  `globalTimeline.time()`, rasterised with **modern-screenshot** `domToPng` → `<img>` → composited into the
  export canvas in z-order (`codeImages` map threaded through `drawFrame`/`drawClip`). `addCodeClip()` drops
  on the **top** track. Inspector "Code" section = lang toggle + source textarea. `</>` toolbar button + `L`
  shortcut.
- **Persistence**: bg/code clips are self-contained — migration `keep` predicate updated so they survive
  save/open even though they have no `mediaId`.
- **Vendored** (served from `renderer/public/vendor/`, copied into build `out/renderer/vendor/`):
  react, react-dom, babel, gsap, modern-screenshot.
- typecheck ✅ · build ✅ (vendor present in out).
- **Next:** M9 — polish (context menus, onboarding, branding, autosave) + real electron-builder .dmg/.exe.
- **Known limit:** code layers driven by `requestAnimationFrame`/`performance.now()` won't be perfectly
  frame-seekable (only CSS animations + gsap timelines are); WebGL needs `preserveDrawingBuffer`.

---

## 2026-06-22 — Multi-track Stage 5 (audio waveform + volume + fades) — plan COMPLETE
**Done — final OpenReel feature; engine untouched:**
- **Model**: `AudioMix { volume, fadeIn, fadeOut }` (fades in ms) + `audioMix` state, `setAudioMix` (live;
  Inspector volume slider pushes history on pointer-down), `setAudioDuration` (patches the singleton audio
  track once its natural length is probed on import).
- **Preview** (`audioPreview.ts`): lazy `AudioContext`; per-src cached `MediaElementSource → GainNode →
  destination`. `fadeGain` computes the gain envelope (volume, fade-in/out, guarded for unknown duration);
  `syncAudio` resumes the ctx, sets gain, re-seeks on >0.3s drift, plays/pauses; `stopAudio` halts all.
  Wired into PreviewMonitor's master-clock loop (+ stop on pause/end/unmount).
- **Waveform**: `getPeaks(src, buckets)` decodes once (cached) → normalized peaks; `AudioWaveform` canvas
  draws them in the timeline audio lane, sized to the bar (redraws on zoom), with fade-in/out wedges +
  "🎵 name · NN%" overlay.
- **Inspector** Audio section: volume slider + fade-in/out (seconds) → `setAudioMix`.
- **Export** matches preview: `exportSession.encode` appends `-af volume=…,afade=t=in…,afade=t=out…`
  (fade-out start = videoDur − fadeOut); `ExportEncodeRequest` gains `audioVolume/audioFadeIn/audioFadeOut`,
  passed from ExportWindow.
- **Persistence**: `audioMix` saved/restored in `serialize.ts` (+ audio duration already in `strip`).
- typecheck ✅ · build ✅. **All 5 stages (multi-track + transitions + text + colour + audio) shipped.**

**Next:** M8 (backgrounds / code layers), M9 (autosave + packaging); optionally mux video clips' own audio.

---

## 2026-06-22 — Multi-track Stage 4 (transitions)
**Done — per-clip in/out transitions, engine untouched:**
- Chose **per-clip in/out transitions** over overlap-based cross-fades (the engine renders one clip per
  track via `clipAt`, so a true same-track overlap dissolve would need an engine change — out of scope).
  A transition plays inside the clip's own span: `transIn` fades/slides/wipes it on at the head, `transOut`
  off at the tail. Adjacent same-track clips with out+in ≈ a cross dissolve through the background.
- **Model**: `TransitionSpec { type: fade|slide|wipe; dir; duration }`, `Clip.transIn?/transOut?`,
  action `setTransition(id, slot, spec|null)`.
- **Render** (`composite.ts` `transEnv`): pure fn → `{alpha, dx, dy, wipe-rect}` at clip-local time;
  applied in both `drawSource` and `drawText` (alpha mult, screen-space translate for slide, `ctx.clip`
  rect for wipe). Same path → preview == export.
- **Inspector**: Transitions section (In / Out × type buttons + direction arrows + duration) for any clip.
- **Timeline**: accent corner wedges mark clips that have an in/out transition. typecheck + build green.

**Next:** Stage 5 — audio waveform + per-clip volume + fades (the last of the 4 OpenReel features).

---

## 2026-06-22 — Multi-track Stage 3 (colour / filters)
**Done — per-clip colour grade:**
- **Model**: `Clip.filters?: FilterSpec` (brightness/contrast/saturate multipliers, hue°, blur as a
  fraction of comp height → res-independent). `DEFAULT_FILTERS` + `FILTER_PRESETS` (None/Vivid/B&W/Noir/
  Warm/Cool/Vintage/Dream). Actions `updateFilters` (live; sliders push history on pointer-down) +
  `applyFilterPreset` (pushes).
- **Render** (`composite.ts`): `filterString()` builds a CSS filter, set on `ctx.filter` inside the
  saved transform in `drawSource` → grade rides along with the existing transform; preview == export.
- **Inspector**: Colour section (preset grid + brightness/contrast/saturation/hue/blur sliders, double-
  click a slider to reset, Reset Colour button), media clips only. typecheck + build green.

**Next:** Stage 4 — transitions (cross-fade / wipe / slide between adjacent clips), then Stage 5 audio
waveform + volume + fades.

---

## 2026-06-22 — Multi-track Stage 2 (text / caption layers)
**Done — clips can now be text, not just media:**
- **Model**: `ClipType = "media" | "text"`, `Clip.text?: TextSpec` (content, fontSize as fraction of
  comp height, color, fontFamily, fontWeight, align, bg box). Actions `addTextClip(trackId?)` (drops at
  playhead on the top track) + `updateText(id, partial)`. Save migration keeps text clips (they have no
  mediaId, so the media-id filter now also keeps `type === "text"`).
- **Render** (`composite.ts` `drawText`): canvas-drawn, resolution-independent — multi-line, left/center/
  right align, optional background box, with the clip's full keyframed transform (so text fades/slides/
  scales/rotates exactly like media). Same draw path → preview == export.
- **Inspector**: Text section (content textarea, font family, size, weight, align, colour, box) shown for
  text clips; Fit shown for media clips. Transform + motion presets + timing apply to both.
- **Timeline**: text clips render with a purple gradient + "T …content" label; **+Text** toolbar button
  and **T** shortcut. typecheck + build green; HMR clean.

**Next:** Stage 3 — color / filters (per-clip brightness/contrast/saturation/blur + presets), then Stage 4
transitions, Stage 5 audio waveform+volume+fades.

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
