# Conventions (the rules we follow)

## Where does a new thing go?

| You are adding… | Put it in… |
|---|---|
| A new UI area (panel/dialog) | `src/features/<area>/` |
| Scene/animation logic (no UI) | `src/engine/` |
| Shared state | `src/store/<domain>.slice.ts` |
| A user action (menu/shortcut/button) | `src/commands/` (a command) |
| Reusable button/input/icon | `src/shared/ui/` |
| Native/file/ffmpeg work | `electron/services/` + an `electron/ipc/<domain>.ts` handler |
| A type used by main AND renderer | `shared/` |

## Naming
- Components: `PascalCase.tsx` (e.g. `Timeline.tsx`)
- Hooks: `useXxx.ts`
- Store slices: `xxx.slice.ts`
- Commands: id is `domain.action` (e.g. `edit.copy`, `file.save`, `clip.split`)
- One file = one main responsibility.

## Command rule (enforce!)
Never wire an action directly into a button's onClick with inline logic.
Instead: define a command in `src/commands/`, then reference it. Menus, keymap,
context menus, and buttons all dispatch commands by id. This keeps every action
working consistently in every place.

## Definition of Done (a feature is "done" only when)
- ✅ It works
- ⌨️ Has a keyboard shortcut (if applicable) via the keymap → command
- 📋 Appears in the relevant menu (via command)
- 🖱️ In context menu where it makes sense (via command)
- 🚫 Anything not yet implemented is **visibly disabled** or labelled "soon" — never a dead button
- 📝 STATUS.md + DEVLOG.md updated

## Daily ritual
1. Morning: read `STATUS.md` (where we are) + last `DEVLOG.md` entry (what's next).
2. Work on exactly one area to "Done".
3. Evening: update `STATUS.md` states, add a `DEVLOG.md` entry (Done / Next / Blocked).

## TypeScript
- `strict: true`. No `any` unless unavoidable (comment why).
- Type the `window.api` surface in one place (`shared/`).
