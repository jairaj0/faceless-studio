import React, { useState } from "react";

export interface PanelTab {
  id: string;
  label: string;
}

interface PanelFrameProps {
  tabs: PanelTab[];
  rightSlot?: React.ReactNode;
  contentStyle?: React.CSSProperties;
  children: React.ReactNode;
}

/** Premiere Pro-style panel chrome: dark header with tabbed labels + body. */
export function PanelFrame({
  tabs,
  rightSlot,
  contentStyle,
  children,
}: PanelFrameProps) {
  const [active, setActive] = useState(tabs[0]?.id);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        minWidth: 0,
        background: "var(--bg-1)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: 28,
          flexShrink: 0,
          background: "var(--bg)",
          borderBottom: "1px solid var(--border)",
          padding: "0 4px",
        }}
      >
        <div
          className="scrollbar-none"
          style={{ display: "flex", height: "100%", gap: 2, overflowX: "auto" }}
        >
          {tabs.map((t) => {
            const a = t.id === active;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                style={{
                  position: "relative",
                  height: "100%",
                  padding: "0 10px",
                  fontSize: 11,
                  fontWeight: 500,
                  background: "none",
                  border: "none",
                  color: a ? "var(--fg)" : "var(--fg-3)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {t.label}
                {a && (
                  <span
                    style={{
                      position: "absolute",
                      left: 6,
                      right: 6,
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
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 4,
            paddingRight: 2,
            color: "var(--fg-3)",
          }}
        >
          {rightSlot}
        </div>
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          overflow: "hidden",
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default PanelFrame;
