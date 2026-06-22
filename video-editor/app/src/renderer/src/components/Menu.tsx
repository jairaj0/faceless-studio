import React, { useEffect } from "react";

export interface MenuItem {
  label?: string;
  shortcut?: string;
  onClick?: () => void;
  separator?: boolean;
  disabled?: boolean;
}

const itemStyle: React.CSSProperties = {
  display: "flex",
  width: "100%",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 24,
  padding: "7px 12px",
  background: "none",
  border: "none",
  color: "var(--fg)",
  fontSize: 12,
  cursor: "pointer",
  textAlign: "left",
  whiteSpace: "nowrap",
};

export function MenuList({
  items,
  onClose,
}: {
  items: MenuItem[];
  onClose?: () => void;
}) {
  return (
    <div
      style={{
        minWidth: 200,
        background: "var(--bg-2)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        padding: "4px 0",
      }}
    >
      {items.map((it, i) =>
        it.separator ? (
          <div key={i} style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
        ) : (
          <button
            key={i}
            disabled={it.disabled}
            onMouseDown={(e) => {
              e.preventDefault();
              if (it.disabled) return;
              it.onClick?.();
              onClose?.();
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            style={{ ...itemStyle, opacity: it.disabled ? 0.4 : 1 }}
          >
            <span>{it.label}</span>
            {it.shortcut && <span style={{ color: "var(--fg-3)" }}>{it.shortcut}</span>}
          </button>
        ),
      )}
    </div>
  );
}

export function ContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}) {
  useEffect(() => {
    const h = () => onClose();
    window.addEventListener("mousedown", h);
    window.addEventListener("blur", h);
    return () => {
      window.removeEventListener("mousedown", h);
      window.removeEventListener("blur", h);
    };
  }, [onClose]);

  return (
    <div
      style={{ position: "fixed", left: x, top: y, zIndex: 2000 }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <MenuList items={items} onClose={onClose} />
    </div>
  );
}
