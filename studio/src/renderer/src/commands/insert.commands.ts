import { registerCommands } from "./registry";
import { useEditor } from "../store/editor";

// Insert layers onto the timeline. Each maps to a store action that drops a clip
// at the playhead — the same code paths as the timeline toolbar buttons.
export function registerInsertCommands(): void {
  registerCommands([
    {
      id: "insert.text",
      label: "Text Layer",
      group: "Insert",
      shortcut: "T",
      run: () => useEditor.getState().addTextClip(),
    },
    {
      id: "insert.background",
      label: "Background",
      group: "Insert",
      shortcut: "B",
      run: () => useEditor.getState().addBackgroundClip(),
    },
    {
      id: "insert.code",
      label: "Code Layer",
      group: "Insert",
      shortcut: "L",
      run: () => useEditor.getState().addCodeClip(),
    },
  ]);
}
