# Faceless Studio (clean rebuild)

Desktop app to build resolution-independent web-animation videos and export them
at any resolution via native ffmpeg.

## Start here
- `docs/ARCHITECTURE.md` — how it's built + the rules
- `docs/CONVENTIONS.md` — where things go, Definition of Done
- `docs/ROADMAP.md` — milestones (M0…M9)
- `docs/STATUS.md` — current state (single source of truth)
- `docs/DEVLOG.md` — daily log (read the latest entry to know what's next)

## Run (after `npm install`)
- `npm run dev` — launch the app
- `npm run typecheck`
- `npm run build` / `npm run dist`

## Reference
`research/video-editor/app/` is the previous working build — we port proven modules from it (engine,
export, timeline, code-layers) into this clean structure, milestone by milestone.
