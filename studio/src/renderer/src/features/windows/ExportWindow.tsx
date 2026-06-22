import { WindowPlaceholder } from "./WindowPlaceholder";

export function ExportWindow() {
  return (
    <WindowPlaceholder
      icon="🎬"
      title="Export"
      lines={[
        "Render the project to video — resolution, aspect, format, progress.",
        "Built later: M6 (native ffmpeg export 1080p/4K/8K).",
      ]}
    />
  );
}

export default ExportWindow;
