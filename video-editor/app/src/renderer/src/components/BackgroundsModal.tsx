import { X } from "lucide-react";
import { BACKGROUNDS } from "../scene/backgrounds";
import { useEditor } from "../store/editorStore";

export function BackgroundsModal({ onClose }: { onClose: () => void }) {
  const addCodeLayer = useEditor((s) => s.addCodeLayer);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "14px 20px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg)",
        }}
      >
        <strong style={{ fontSize: 15 }}>Animated Backgrounds</strong>
        <span style={{ fontSize: 12, color: "var(--fg-3)", marginLeft: 10 }}>
          ReactBits-style · click to add as a background layer
        </span>
        <button
          onClick={onClose}
          style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--fg-2)", cursor: "pointer", display: "flex" }}
        >
          <X size={18} />
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 20,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 16,
          alignContent: "start",
        }}
      >
        {BACKGROUNDS.map((b) => (
          <button
            key={b.id}
            onClick={() => {
              addCodeLayer("react", b.code);
              onClose();
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: 0,
              background: "var(--bg-1)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              overflow: "hidden",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div style={{ width: "100%", height: 110, background: b.swatch as string }} />
            <div style={{ padding: "0 12px 12px", fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>
              {b.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default BackgroundsModal;
