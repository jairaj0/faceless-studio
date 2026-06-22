import { useEffect, useState } from "react";
import { MENU_CATALOG, type MenuDef } from "./menuCatalog";
import { getCommand, isEnabled, runCommand } from "../../commands";
import { useApp, type AppView } from "../../store";

const WINDOWS: { id: AppView; label: string }[] = [
  { id: "edit", label: "Edit" },
  { id: "import", label: "Import & Preview" },
  { id: "export", label: "Export" },
];

export function MenuBar() {
  const [open, setOpen] = useState<string | null>(null);
  const projectName = useApp((s) => s.projectName);
  const view = useApp((s) => s.view);
  const setView = useApp((s) => s.setView);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const h = () => setOpen(null);
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: 30,
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
        padding: "0 8px",
        gap: 2,
        flexShrink: 0,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 4,
          background: "var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: 10,
          color: "#fff",
          marginRight: 8,
        }}
      >
        FS
      </div>
      {MENU_CATALOG.map((menu) => (
        <Menu
          key={menu.title}
          menu={menu}
          open={open === menu.title}
          onToggle={() => setOpen(open === menu.title ? null : menu.title)}
          onHover={() => open && setOpen(menu.title)}
          onClose={() => setOpen(null)}
        />
      ))}

      {/* divider */}
      <div style={{ width: 1, height: 16, background: "var(--border)", margin: "0 8px" }} />

      {/* window switcher — shows current window, click to switch */}
      {WINDOWS.map((w) => {
        const active = w.id === view;
        return (
          <button
            key={w.id}
            onClick={() => setView(w.id)}
            style={{
              position: "relative",
              padding: "0 10px",
              height: "100%",
              background: "none",
              border: "none",
              color: active ? "var(--fg)" : "var(--fg-3)",
              fontSize: 12,
              fontWeight: active ? 600 : 400,
              cursor: "pointer",
            }}
          >
            {w.label}
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

      <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--fg-3)" }}>
        {projectName}
      </span>
    </div>
  );
}

function Menu({
  menu,
  open,
  onToggle,
  onHover,
  onClose,
}: {
  menu: MenuDef;
  open: boolean;
  onToggle: () => void;
  onHover: () => void;
  onClose: () => void;
}) {
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={onToggle}
        onMouseEnter={onHover}
        style={{
          padding: "0 8px",
          height: 22,
          background: open ? "var(--hover, #2f2f2f)" : "none",
          border: "none",
          color: "var(--fg-2)",
          fontSize: 12,
          cursor: "pointer",
          borderRadius: 4,
        }}
      >
        {menu.title}
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            minWidth: 220,
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            padding: "4px 0",
            zIndex: 500,
          }}
        >
          {menu.items.map((item, i) => {
            if (item.separator)
              return <div key={i} style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />;
            const cmd = item.commandId ? getCommand(item.commandId) : undefined;
            const enabled = !!cmd && isEnabled(item.commandId!);
            return (
              <button
                key={i}
                disabled={!enabled}
                title={!cmd ? "Coming soon" : undefined}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (!enabled) return;
                  runCommand(item.commandId!);
                  onClose();
                }}
                onMouseEnter={(e) => {
                  if (enabled) e.currentTarget.style.background = "var(--hover, #2f2f2f)";
                }}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 24,
                  padding: "6px 12px",
                  background: "none",
                  border: "none",
                  color: enabled ? "var(--fg)" : "var(--fg-3)",
                  fontSize: 12,
                  cursor: enabled ? "pointer" : "default",
                  textAlign: "left",
                  whiteSpace: "nowrap",
                  opacity: enabled ? 1 : 0.5,
                }}
              >
                <span>{item.label}</span>
                {item.shortcut && (
                  <span style={{ color: "var(--fg-3)" }}>{item.shortcut}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MenuBar;
