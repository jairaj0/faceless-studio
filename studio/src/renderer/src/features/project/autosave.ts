import { useEffect } from "react";
import { useApp } from "../../store";
import { useEditor } from "../../store/editor";
import { buildProjectFile } from "./projectActions";

// Debounced crash-recovery autosave. Only *document* edits (tracks / comp /
// media / audio mix) count — playhead, selection and playback are ignored so
// merely scrubbing after a Save doesn't resurrect a recovery snapshot. A
// snapshot is written to userData while the project is dirty; an explicit
// Save/Open/New clears `dirty` (and the file), so on the next launch a leftover
// snapshot reliably means the app exited with unsaved changes → offer restore.
const DEBOUNCE_MS = 1500;

// Reference-identity signature of the parts that make up the saved document.
function docSig(): unknown[] {
  const e = useEditor.getState();
  return [e.tracks, e.comp, e.media, e.audio, e.audioMix];
}

function hasContent(): boolean {
  const e = useEditor.getState();
  return e.tracks.some((t) => t.clips.length > 0) || e.media.length > 0 || !!e.audio;
}

export function useAutosave(): void {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let prev = docSig();
    const schedule = (): void => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (!useApp.getState().dirty || !hasContent()) return;
        const json = JSON.stringify(buildProjectFile());
        void window.api.recovery?.write(json, useApp.getState().projectName);
      }, DEBOUNCE_MS);
    };
    const unsub = useEditor.subscribe(() => {
      const cur = docSig();
      const changed = cur.some((v, i) => v !== prev[i]);
      prev = cur;
      if (!changed) return; // ignore playhead/selection/playback churn
      useApp.getState().markDirty();
      schedule();
    });
    return () => {
      if (timer) clearTimeout(timer);
      unsub();
    };
  }, []);
}
