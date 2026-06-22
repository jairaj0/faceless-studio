import { useEffect } from "react";
import { MediaBin } from "../edit/MediaBin";
import { PreviewMonitor } from "../edit/PreviewMonitor";
import { Inspector } from "../edit/Inspector";
import { Timeline } from "../edit/Timeline";
import { useEditor } from "../../store/editor";

// The editing workspace: media bin + preview + inspector on top, timeline below.
export function EditWindow() {
  // Editing keyboard shortcuts, scoped to this window.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      const st = useEditor.getState();
      if (e.code === "Space") {
        e.preventDefault();
        st.togglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        st.stepFrame(e.shiftKey ? -10 : -1);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        st.stepFrame(e.shiftKey ? 10 : 1);
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
