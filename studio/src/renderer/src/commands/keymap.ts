import { useEffect } from "react";
import { allCommands, runCommand } from "./registry";

/** Normalize a keyboard event to a binding string like "shift+mod+s". */
export function eventToBinding(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.metaKey || e.ctrlKey) parts.push("mod");
  if (e.shiftKey) parts.push("shift");
  if (e.altKey) parts.push("alt");
  const k = e.key.toLowerCase();
  parts.push(k === " " ? "space" : k);
  return parts.join("+");
}

function isTypingTarget(el: EventTarget | null): boolean {
  const t = el as HTMLElement | null;
  return (
    !!t &&
    (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)
  );
}

/** Global keymap: matches keydown to a command's keybinding and runs it. */
export function useGlobalKeymap(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const binding = eventToBinding(e);
      const cmd = allCommands().find((c) => c.keybinding === binding);
      if (!cmd) return;
      // Allow ⌘-shortcuts even while typing (Save/Undo); block plain keys in inputs.
      const hasMod = e.metaKey || e.ctrlKey;
      if (!hasMod && isTypingTarget(e.target)) return;
      if (cmd.enabled && !cmd.enabled()) return;
      e.preventDefault();
      runCommand(cmd.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
