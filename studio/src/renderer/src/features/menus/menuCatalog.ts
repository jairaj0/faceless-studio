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
      { commandId: "file.save", label: "Save", shortcut: "⌘S" },
      { commandId: "file.saveAs", label: "Save As…", shortcut: "⇧⌘S" },
    ],
  },
  {
    title: "Window",
    items: [
      { commandId: "window.edit", label: "Edit", shortcut: "⌘1" },
      { commandId: "window.import", label: "Import & Preview", shortcut: "⌘2" },
      { commandId: "window.export", label: "Export", shortcut: "⌘3" },
    ],
  },
];
