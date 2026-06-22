# Workspace & Content Structure (on-disk data)

How user content is organized on disk: **projects, presets, media, exports**.
This is the DATA layout (separate from source-code architecture in ARCHITECTURE.md).

There are two roots:
1. **Workspace** — user-visible, configurable folder (default `~/Documents/Faceless Studio/`).
   Everything the user owns: projects, their media, their presets, exports.
2. **App data** — hidden (`<userData>/FacelessStudio/`): shipped presets, cache, autosave, settings.

---

## 1. Workspace (user-visible)

```
~/Documents/Faceless Studio/
├─ Projects/                       # saved projects (one folder each, self-contained)
│  └─ my-reel/
│     ├─ project.fstudio.json      # the scene document
│     ├─ assets/                   # media used by THIS project (copied in → portable)
│     │  ├─ images/  audio/  svg/  fonts/  video/
│     └─ thumbnail.png
│
├─ Templates/                      # full premade projects (user-saved)
│  └─ listicle/  quote/  …  (same shape as a Project)
│
├─ Media Library/                  # global reusable assets (not tied to one project)
│  ├─ images/
│  ├─ video/
│  ├─ audio/
│  │  ├─ music/  sfx/  voiceover/
│  ├─ svg/
│  └─ fonts/
│
├─ Presets/                        # reusable building blocks (see §3 for format)
│  ├─ text-animations/             # typewriter, fade-in-words, glitch… (code/data)
│  ├─ backgrounds/                 # ReactBits / HTML / gsap code-based animations
│  ├─ transitions/                 # dissolve, wipe, slide…
│  ├─ effects/                     # blur, glow, shadow, color filters
│  ├─ motion/                      # transform presets: pop, slide, spin (keyframes)
│  ├─ graphics/                    # lower-thirds, badges, callouts, shapes (SVG)
│  ├─ titles/                      # styled title templates
│  ├─ color/                       # LUTs / color grades
│  └─ audio/                       # jingles, stings, sound presets
│
└─ Exports/                        # rendered output videos
   └─ my-reel_4K_2026-06-22.mp4
```

**Rules**
- A **Project** is a folder, fully self-contained (scene json + its assets copied in) → easy to
  move/share/back-up.
- **Media Library** = reusable raw assets across projects.
- **Presets** = reusable *behaviors/looks* (animations, transitions, graphics), not raw media.
- Workspace path is configurable in Settings; default Documents.

---

## 2. App data (hidden — `<userData>/FacelessStudio/`)

```
<userData>/FacelessStudio/
├─ presets-builtin/      # shipped presets (read-only) — same categories as Presets/
├─ templates-builtin/    # shipped templates
├─ cache/                # render temp frames, generated thumbnails
├─ autosave/             # crash recovery snapshots
└─ settings.json         # workspace path, preferences, recent projects
```

The app merges **builtin + user** presets in each gallery (builtin marked read-only).

---

## 3. Preset format (every preset is self-describing)

Each preset = a **folder** with a `preset.json` + its payload + a thumbnail.

```
Presets/backgrounds/aurora/
├─ preset.json
├─ code.jsx            # payload (for code-based: backgrounds / text-animations)
└─ thumbnail.png
```

`preset.json`:
```json
{
  "id": "aurora",
  "name": "Aurora",
  "type": "background",        // background | text-animation | transition | effect | motion | graphic | title | color | audio
  "category": "ambient",
  "tags": ["gradient", "ambient"],
  "lang": "react",            // react | html  (code-based only)
  "payload": "code.jsx",      // file ref; OR inline "data" for keyframe presets
  "duration": 5000,            // optional default ms
  "author": "builtin"
}
```

Payload by type:
| Type | Payload |
|---|---|
| background, text-animation | `code.jsx` / `code.html` (React/HTML, may use gsap) |
| motion, transition | inline `data` (keyframes) in preset.json |
| graphic, title | `graphic.svg` (+ editable text fields) |
| effect | inline `data` (filter params/shader) |
| color | `lut.cube` or grade params |
| audio | `audio.mp3` + preset.json |

Each category has an optional `index.json` (list of preset ids) for fast loading;
otherwise the app scans the folder.

---

## How code maps to this (later milestones)
- **M5** Project I/O → reads/writes `Projects/<name>/project.fstudio.json` (+ copies assets).
- A **Library service** (`src/main/services/library.ts`) → lists/saves presets & media, merges builtin+user.
- Galleries (backgrounds, templates, text-anim) read from `presets-builtin/` + `Presets/`.
- "Save as preset" → writes a folder into the right `Presets/<category>/`.
