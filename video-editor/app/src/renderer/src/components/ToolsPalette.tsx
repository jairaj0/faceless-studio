import {
  MousePointer2,
  ArrowLeftRight,
  Scissors,
  Move,
  PenTool,
  Hand,
  ZoomIn,
  Type,
  type LucideIcon,
} from "lucide-react";

interface Tool {
  id: string;
  label: string;
  key: string;
  Icon: LucideIcon;
}

export const TOOLS: Tool[] = [
  { id: "select", label: "Selection Tool", key: "V", Icon: MousePointer2 },
  { id: "ripple", label: "Ripple Edit Tool", key: "B", Icon: ArrowLeftRight },
  { id: "razor", label: "Razor Tool", key: "C", Icon: Scissors },
  { id: "slip", label: "Slip Tool", key: "Y", Icon: Move },
  { id: "pen", label: "Pen Tool", key: "P", Icon: PenTool },
  { id: "hand", label: "Hand Tool", key: "H", Icon: Hand },
  { id: "zoom", label: "Zoom Tool", key: "Z", Icon: ZoomIn },
  { id: "type", label: "Type Tool", key: "T", Icon: Type },
];

export function ToolsPalette({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        padding: "6px 4px",
        width: 36,
        flexShrink: 0,
        background: "var(--bg-1)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {TOOLS.map((t) => {
        const a = t.id === active;
        return (
          <button
            key={t.id}
            data-tip={`${t.label} (${t.key})`}
            onClick={() => onSelect(t.id)}
            style={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 5,
              border: "none",
              cursor: "pointer",
              background: a ? "var(--accent)" : "transparent",
              color: a ? "#fff" : "var(--fg-2)",
            }}
          >
            <t.Icon size={15} />
          </button>
        );
      })}
    </div>
  );
}

export default ToolsPalette;
