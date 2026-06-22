import { WindowPlaceholder } from "./WindowPlaceholder";

export function ImportPreviewWindow() {
  return (
    <WindowPlaceholder
      icon="🖼️"
      title="Import & Preview"
      lines={[
        "Bring in media (images, audio, SVG, fonts) and preview the scene.",
        "Built later: M7 (media + audio) + a clean preview surface.",
      ]}
    />
  );
}

export default ImportPreviewWindow;
