import { registerFileCommands } from "./file.commands";
import { registerWindowCommands } from "./window.commands";

/**
 * Registers all commands available so far. Each milestone adds its own
 * register*Commands() here; the matching menu items light up automatically.
 *  - File:   New / Open / Save / Save As   (working)
 *  - Window: Edit / Import & Preview / Export views   (working)
 */
export function registerBuiltins(): void {
  registerFileCommands();
  registerWindowCommands();
}
