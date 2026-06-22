import { registerCommands } from "./registry";
import { importImages, importAudio, importVideos } from "../features/edit/importActions";

export function registerMediaCommands(): void {
  registerCommands([
    {
      id: "media.importImage",
      label: "Import Image…",
      group: "File",
      shortcut: "⌘I",
      keybinding: "mod+i",
      run: () => void importImages(),
    },
    {
      id: "media.importVideo",
      label: "Import Video…",
      group: "File",
      run: () => void importVideos(),
    },
    {
      id: "media.importAudio",
      label: "Import Audio…",
      group: "File",
      run: () => void importAudio(),
    },
  ]);
}
