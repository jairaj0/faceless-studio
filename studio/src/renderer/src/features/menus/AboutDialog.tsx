import { useEffect, useState } from "react";

export function AboutDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener("fs:about", show);
    return () => window.removeEventListener("fs:about", show);
  }, []);

  if (!open) return null;
  return (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 360,
          background: "var(--bg-1)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: 24,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            color: "#fff",
            fontSize: 18,
          }}
        >
          FS
        </div>
        <strong style={{ fontSize: 16 }}>Faceless Studio</strong>
        <span style={{ fontSize: 12, color: "var(--fg-2)" }}>
          Web-animation video editor · v0.1.0
        </span>
        <span style={{ fontSize: 11, color: "var(--fg-3)" }}>
          Clean rebuild · M1 — menu bar (command registry)
        </span>
        <button
          onClick={() => setOpen(false)}
          style={{
            marginTop: 8,
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "6px 16px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default AboutDialog;
