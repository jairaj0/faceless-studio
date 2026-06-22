// The menu bar structure. Keep ONLY menus whose items actually work.
// Add more menus (Edit, Clip, Sequence, …) milestone by milestone, once their
// features + commands exist — never show a dead button.

export interface MenuItemDef {
  commandId?: string;
  label?: string;
  shortcut?: string; // display only
  separator?: boolean;
}

export interface MenuDef {
  title: string;
  items: MenuItemDef[];
}

export const MENU_CATALOG: MenuDef[] = [
  {
    title: "File",
    items: [
      { commandId: "file.new", label: "New Project", shortcut: "⌘N" },
      { commandId: "file.open", label: "Open…", shortcut: "⌘O" },
      { separator: true },
      { commandId: "media.importImage", label: "Import Image…", shortcut: "⌘I" },
      { commandId: "media.importVideo", label: "Import Video…" },
      { commandId: "media.importAudio", label: "Import Audio…" },
      { separator: true },
      { commandId: "file.save", label: "Save", shortcut: "⌘S" },
      { commandId: "file.saveAs", label: "Save As…", shortcut: "⇧⌘S" },
    ],
  },
  {
    title: "Insert",
    items: [
      { commandId: "insert.text", label: "Text Layer", shortcut: "T" },
      { commandId: "insert.background", label: "Background", shortcut: "B" },
      { commandId: "insert.code", label: "Code Layer", shortcut: "L" },
    ],
  },
  {
    title: "View",
    items: [
      { commandId: "window.edit", label: "Edit", shortcut: "⌘1" },
      { commandId: "window.export", label: "Export", shortcut: "⌘2" },
    ],
  },
];
