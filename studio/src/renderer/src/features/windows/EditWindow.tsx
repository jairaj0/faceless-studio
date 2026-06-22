import { MediaBin } from "../edit/MediaBin";
import { PreviewMonitor } from "../edit/PreviewMonitor";
import { Timeline } from "../edit/Timeline";

// The editing workspace: media bin + preview on top, timeline below.
export function EditWindow() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        <MediaBin />
        <PreviewMonitor />
      </div>
      <Timeline />
    </div>
  );
}

export default EditWindow;
