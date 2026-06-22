import type { Command } from "./types";

const registry = new Map<string, Command>();

export function registerCommand(cmd: Command): void {
  if (registry.has(cmd.id)) console.warn(`[commands] duplicate id: ${cmd.id}`);
  registry.set(cmd.id, cmd);
}

export function registerCommands(cmds: Command[]): void {
  cmds.forEach(registerCommand);
}

export function getCommand(id: string): Command | undefined {
  return registry.get(id);
}

export function isEnabled(id: string): boolean {
  const c = registry.get(id);
  return !!c && (!c.enabled || c.enabled());
}

/** Run a command by id (no-op if missing or disabled). */
export function runCommand(id: string): void {
  const c = registry.get(id);
  if (!c) {
    console.warn(`[commands] unknown command: ${id}`);
    return;
  }
  if (c.enabled && !c.enabled()) return;
  void c.run();
}

export function allCommands(): Command[] {
  return [...registry.values()];
}

/** Commands in a given menu group (for building menus). */
export function commandsInGroup(group: string): Command[] {
  return allCommands().filter((c) => c.group === group);
}
