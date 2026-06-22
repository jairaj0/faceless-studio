import { app } from "electron";
import { writeFile, readFile, unlink } from "fs/promises";
import { join } from "path";
import type { RecoverySnapshot } from "../../shared/project";

// Crash-recovery snapshot. Autosaved to userData on a debounce while editing,
// cleared on an explicit Save/Open/New, and offered back on the next launch if
// the app exited without saving.
function recoveryPath(): string {
  return join(app.getPath("userData"), "recovery.fstudio.json");
}

export async function writeRecovery(json: string, name: string): Promise<boolean> {
  try {
    const wrapped = JSON.stringify({ savedAt: Date.now(), name, json });
    await writeFile(recoveryPath(), wrapped, "utf-8");
    return true;
  } catch {
    return false;
  }
}

export async function readRecovery(): Promise<RecoverySnapshot | null> {
  try {
    const raw = await readFile(recoveryPath(), "utf-8");
    const d = JSON.parse(raw);
    if (!d?.json) return null;
    return { savedAt: d.savedAt ?? 0, name: d.name ?? "Untitled", json: d.json };
  } catch {
    return null; // no snapshot
  }
}

export async function clearRecovery(): Promise<boolean> {
  try {
    await unlink(recoveryPath());
  } catch {
    /* nothing to clear */
  }
  return true;
}
