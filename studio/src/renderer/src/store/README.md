# store/ — Zustand, sliced by domain

Compose slices in `index.ts`. Keep slices small and focused.

Planned slices:
- `scene.slice.ts` — the document (scene) + mutations + undo/redo
- `selection.slice.ts` — selectedIds, selectedKeyframe
- `playback.slice.ts` — time, playing
- `clipboard.slice.ts` — copy/paste buffer
