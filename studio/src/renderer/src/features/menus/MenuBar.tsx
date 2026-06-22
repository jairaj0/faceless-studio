import { useEffect, useState } from "react";
import { MENU_CATALOG, type MenuDef } from "./menuCatalog";
import { getCommand, isEnabled, runCommand } from "../../commands";
import { useApp, type AppView } from "../../store";

const WINDOWS: { id: AppView; label: string; shortcut: string }[] = [
  { id: "edit", label: "Edit", shortcut: "⌘1" },
  { id: "import", label: "Import & Preview", shortcut: "⌘2" },
  { id: "export", label: "Export", shortcut: "⌘3" },
];

export function MenuBar() {
  const [open, setOpen] = useState<string | null>(null);
  const [hovered, setHovered] = useState<AppView | null>(null);
  const projectName = useApp((s) => s.projectName);
  const view = useApp((s) => s.view);
  const setView = useApp((s) => s.setView);

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
        height: 32,
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
        padding: "0 8px",
        flexShrink: 0,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* LEFT: logo + menus */}
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
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
      </div>

      {/* CENTER: window switcher */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "stretch",
          justifyContent: "center",
          height: "100%",
          gap: 2,
        }}
      >
        {WINDOWS.map((w) => {
          const active = w.id === view;
          return (
            <button
              key={w.id}
              onClick={() => setView(w.id)}
              onMouseEnter={() => setHovered(w.id)}
              onMouseLeave={() => setHovered((h) => (h === w.id ? null : h))}
              style={{
                position: "relative",
                padding: "0 14px",
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
                    left: 10,
                    right: 10,
                    bottom: 0,
                    height: 2,
                    background: "var(--accent)",
                    borderRadius: 2,
                  }}
                />
              )}
              {hovered === w.id && (
                <span
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "3px 8px",
                    background: "var(--bg-2)",
                    border: "1px solid var(--border)",
                    borderRadius: 5,
                    boxShadow: "0 6px 18px rgba(0,0,0,0.45)",
                    fontSize: 11,
                    fontWeight: 400,
                    color: "var(--fg-2)",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    zIndex: 600,
                  }}
                >
                  {w.label}
                  <kbd
                    style={{
                      padding: "1px 5px",
                      borderRadius: 3,
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                      color: "var(--fg-3)",
                      fontSize: 10,
                      fontFamily: "inherit",
                    }}
                  >
                    {w.shortcut}
                  </kbd>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* RIGHT: project name */}
      <span style={{ fontSize: 11, color: "var(--fg-3)" }}>{projectName}</span>
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
          background: open ? "var(--bg-2)" : "none",
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
                  if (enabled) e.currentTarget.style.background = "var(--bg-1)";
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
                {item.shortcut && <span style={{ color: "var(--fg-3)" }}>{item.shortcut}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MenuBar;
