import { X } from "lucide-react";
import { TEMPLATES } from "../scene/templates";
import { SceneRenderer } from "../scene/SceneRenderer";
import { useEditor } from "../store/editorStore";

const CARD_W = 260;
const SCALE = CARD_W / 1920;

export function TemplatesModal({ onClose }: { onClose: () => void }) {
  const loadScene = useEditor((s) => s.loadScene);

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
        <strong style={{ fontSize: 15 }}>New from Template</strong>
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
          gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_W}px, 1fr))`,
          gap: 16,
          alignContent: "start",
        }}
      >
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              loadScene(t.scene);
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
            <div
              style={{
                width: "100%",
                height: CARD_W * (1080 / 1920),
                overflow: "hidden",
                position: "relative",
                background: "#000",
              }}
            >
              <div style={{ transform: `scale(${SCALE})`, transformOrigin: "top left" }}>
                <SceneRenderer scene={t.scene} time={t.previewTime} />
              </div>
            </div>
            <div style={{ padding: "0 12px 12px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>{t.name}</div>
              <div style={{ fontSize: 11, color: "var(--fg-3)" }}>{t.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default TemplatesModal;
