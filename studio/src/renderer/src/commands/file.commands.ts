import { registerCommands } from "./registry";
import { newProject, saveProject, openProject } from "../features/project/projectActions";

export function registerFileCommands(): void {
  registerCommands([
    { id: "file.new", label: "New Project", group: "File", shortcut: "⌘N", keybinding: "mod+n", run: () => newProject() },
    { id: "file.open", label: "Open…", group: "File", shortcut: "⌘O", keybinding: "mod+o", run: () => openProject() },
    { id: "file.save", label: "Save", group: "File", shortcut: "⌘S", keybinding: "mod+s", run: () => saveProject() },
    { id: "file.saveAs", label: "Save As…", group: "File", shortcut: "⇧⌘S", keybinding: "shift+mod+s", run: () => saveProject(true) },
  ]);
}
