import { registerCommands } from "./registry";
import { useApp } from "../store";

export function registerWindowCommands(): void {
  registerCommands([
    { id: "window.edit", label: "Edit", group: "Window", shortcut: "⌘1", keybinding: "mod+1", run: () => useApp.getState().setView("edit") },
    { id: "window.export", label: "Export", group: "Window", shortcut: "⌘2", keybinding: "mod+2", run: () => useApp.getState().setView("export") },
  ]);
}
