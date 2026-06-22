/**
 * A Command is the single definition of a user action. Menus, the keymap, the
 * toolbar, and context menus all reference commands by id — define once, use
 * everywhere. This is the backbone of the app's actions.
 */
export interface Command {
  /** Unique id, "domain.action" e.g. "file.save", "edit.copy", "clip.split" */
  id: string;
  /** Human label shown in menus */
  label: string;
  /** Menu group, e.g. "File", "Edit" */
  group?: string;
  /** Display shortcut, e.g. "⌘S" */
  shortcut?: string;
  /** Matcher binding, e.g. "mod+s", "shift+mod+s", "space" (mod = ⌘/Ctrl) */
  keybinding?: string;
  /** Optional gate — command is disabled when this returns false */
  enabled?: () => boolean;
  /** What the command does */
  run: () => void | Promise<void>;
}
