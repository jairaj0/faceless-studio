import { useApp, type AppView } from "../../store";
import { EditWindow } from "./EditWindow";
import { ImportPreviewWindow } from "./ImportPreviewWindow";
import { ExportWindow } from "./ExportWindow";

const TABS: { id: AppView; label: string }[] = [
  { id: "edit", label: "Edit" },
  { id: "import", label: "Import & Preview" },
  { id: "export", label: "Export" },
];

export function WindowHost() {
  const view = useApp((s) => s.view);
  const setView = useApp((s) => s.setView);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Window tabs (also switchable via Window menu / ⌘1-3) */}
      <div
        style={{
          display: "flex",
          height: 34,
          background: "var(--bg-1)",
          borderBottom: "1px solid var(--border)",
          padding: "0 8px",
          gap: 2,
          flexShrink: 0,
        }}
      >
        {TABS.map((t) => {
          const active = t.id === view;
          return (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              style={{
                position: "relative",
                padding: "0 14px",
                height: "100%",
                background: "none",
                border: "none",
                color: active ? "var(--fg)" : "var(--fg-3)",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {t.label}
              {active && (
                <span
                  style={{
                    position: "absolute",
                    left: 8,
                    right: 8,
                    bottom: 0,
                    height: 2,
                    background: "var(--accent)",
                    borderRadius: 2,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        {view === "edit" ? (
          <EditWindow />
        ) : view === "import" ? (
          <ImportPreviewWindow />
        ) : (
          <ExportWindow />
        )}
      </div>
    </div>
  );
}

export default WindowHost;
