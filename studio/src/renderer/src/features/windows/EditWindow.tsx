import { useEffect } from "react";
import { MediaBin } from "../edit/MediaBin";
import { PreviewMonitor } from "../edit/PreviewMonitor";
import { Inspector } from "../edit/Inspector";
import { Timeline } from "../edit/Timeline";
import { useEditor, allClips, findClip } from "../../store/editor";

// The editing workspace: media bin + preview + inspector on top, timeline below.
export function EditWindow() {
  // Editing keyboard shortcuts, scoped to this window.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      const st = useEditor.getState();
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.code === "KeyZ") {
        e.preventDefault();
        e.shiftKey ? st.redo() : st.undo();
      } else if (mod && e.code === "KeyD" && st.selectedClipId) {
        e.preventDefault();
        st.duplicateClip(st.selectedClipId);
      } else if (e.code === "Space") {
        e.preventDefault();
        st.togglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        st.stepFrame(e.shiftKey ? -10 : -1);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        st.stepFrame(e.shiftKey ? 10 : 1);
      } else if (e.code === "KeyS" && !mod) {
        // Split the clip under the playhead — prefer the selected one.
        const spans = (x: { start: number; duration: number }): boolean =>
          st.playhead > x.start && st.playhead < x.start + x.duration;
        const sel = findClip(st.tracks, st.selectedClipId);
        const c = sel && spans(sel) ? sel : allClips(st.tracks).find(spans);
        if (c) {
          e.preventDefault();
          st.splitClip(c.id, st.playhead);
        }
      } else if (e.code === "KeyT" && !mod) {
        e.preventDefault();
        st.addTextClip();
      } else if (e.code === "KeyB" && !mod) {
        e.preventDefault();
        st.addBackgroundClip();
      } else if (e.code === "KeyL" && !mod) {
        e.preventDefault();
        st.addCodeClip();
      } else if (e.code === "Home") {
        e.preventDefault();
        st.setPlayhead(0);
      } else if (e.code === "End") {
        e.preventDefault();
        st.setPlayhead(st.duration());
      } else if ((e.code === "Delete" || e.code === "Backspace") && st.selectedClipId) {
        e.preventDefault();
        st.removeClip(st.selectedClipId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        <MediaBin />
        <PreviewMonitor />
        <Inspector />
      </div>
      <Timeline />
    </div>
  );
}

export default EditWindow;
