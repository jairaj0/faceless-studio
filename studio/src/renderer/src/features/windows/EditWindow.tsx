import { WindowPlaceholder } from "./WindowPlaceholder";

export function EditWindow() {
  return (
    <WindowPlaceholder
      icon="✂️"
      title="Edit"
      lines={[
        "The editing workspace — monitor, timeline, inspector, tools.",
        "Built next: M2 (engine + monitor) → M3 (timeline) → M4 (inspector).",
      ]}
    />
  );
}

export default EditWindow;
