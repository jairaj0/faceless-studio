import { registerFileCommands } from "./file.commands";
import { registerWindowCommands } from "./window.commands";
import { registerMediaCommands } from "./media.commands";
import { registerInsertCommands } from "./insert.commands";

/**
 * Registers all commands available so far. Each milestone adds its own
 * register*Commands() here; the matching menu items light up automatically.
 *  - File:   New / Open / Save / Save As   (working)
 *  - Insert: Text / Background / Code layers   (working)
 *  - Window: Edit / Export views   (working)
 */
export function registerBuiltins(): void {
  registerFileCommands();
  registerWindowCommands();
  registerMediaCommands();
  registerInsertCommands();
}
