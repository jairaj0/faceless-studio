# features/

One folder per UI area. Each feature owns its components + hooks and wires its
actions through the **command registry** (`../commands`), not inline onClicks.

Planned (built milestone by milestone):
- `menus/`     — top menu bar, builds menus from commands
- `monitor/`   — program monitor + transport
- `timeline/`  — tracks, clips, keyframes, playhead
- `inspector/` — effect controls / properties
- `project/`   — project/media panel
- `export/`    — export dialog
- `backgrounds/` — backgrounds gallery

Rule: a feature imports from `engine/`, `store/`, `commands/`, `shared/` —
never from another feature's internals.
