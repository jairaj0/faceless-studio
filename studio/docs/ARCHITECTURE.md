# Architecture

Faceless Studio — a desktop (Electron) app to build resolution-independent
web-animation videos and export them at any resolution via native ffmpeg.

## Three layers

```
FRONTEND (renderer, React, Chromium)   ← all UI + the scene engine
        │  window.api  (secure bridge)
BRIDGE  (preload, contextBridge)
        │  IPC
BACKEND (main, Node.js)                 ← ffmpeg, files, preview server
```

## Folder map

```
studio/
├─ docs/                  # the project's brain (read daily)
├─ src/
│  ├─ main/               # BACKEND (Electron main, Node.js)
│  │  ├─ index.ts         # app entry + window
│  │  ├─ ipc/             # IPC handlers by domain (export, project, media, preview)
│  │  └─ services/        # ffmpeg, fileSystem, previewServer
│  ├─ preload/
│  │  └─ index.ts         # the bridge (window.api)
│  ├─ renderer/           # FRONTEND (React, Chromium)
│  │  ├─ index.html
│  │  └─ src/
│  │     ├─ main.tsx      # renderer entry
│  │     ├─ app/          # shell, providers, global keymap
│  │     ├─ features/     # ONE folder per UI area (timeline, monitor, inspector, menus, ...)
│  │     ├─ engine/       # PURE scene logic (no UI/store) — types, animate, SceneRenderer, codeLayer
│  │     ├─ store/        # Zustand, sliced by domain (scene, selection, playback, clipboard)
│  │     ├─ commands/     # command registry — single source of all actions
│  │     └─ shared/       # ui primitives, utils, constants
│  └─ shared/             # types shared between main + renderer
└─ (config: package.json, electron.vite.config.ts, tsconfig.json)
```
(Layout follows electron-vite conventions: `src/main`, `src/preload`, `src/renderer`.)

## Core rules (why this scales)

1. **Feature-based.** Each UI area lives in `src/features/<area>/` with its own
   components + hooks. Never dump everything into one `components/` folder.

2. **Engine is pure.** `src/engine/` has zero imports from `store/`, `features/`,
   or React app code. It only knows about a `Scene` and a `time`. This makes it
   reusable for BOTH the live preview and the offline export renderer, and testable.

3. **Store sliced by domain.** No single giant store. `scene.slice`, `selection.slice`,
   `playback.slice`, `clipboard.slice` — composed in `store/index.ts`.

4. **🔑 Command Registry (most important).** Every user action — menu item, keyboard
   shortcut, toolbar button, context-menu item — is defined ONCE as a command:
   `{ id, label, shortcut?, enabled?, run }`. Menus, the keymap, and context menus
   all READ from this registry. This is why "make all menu buttons work, then move on"
   becomes systematic: build the command once, it appears everywhere automatically.

5. **IPC per-domain.** Backend handlers are grouped files: `ipc/export.ts`,
   `ipc/project.ts`, `ipc/media.ts`, `ipc/preview.ts`. Preload exposes a typed `window.api`.

## Data flow (example: Export)

1. User triggers command `export.render` (from menu / shortcut / button).
2. Command calls `window.api.export.render(scene, opts)`.
3. Preload → IPC → `electron/ipc/export.ts` → `services/ffmpeg.ts`.
4. Backend renders frames + ffmpeg → MP4, streams progress back.

## Migration note

The previous working build lives in `research/video-editor/app/` (reference). We port proven modules
(engine, export pipeline, code-layer) INTO this clean structure feature-by-feature —
we do not rewrite the hard parts from scratch.
