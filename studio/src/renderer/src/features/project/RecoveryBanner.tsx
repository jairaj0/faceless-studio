import { useEffect, useState } from "react";
import { useApp } from "../../store";
import { loadProjectFile } from "./projectActions";
import type { RecoverySnapshot } from "../../../../shared/project";

// On launch, if an autosave snapshot survived (app closed without saving), offer
// to restore it. Shown once, at the top of the workspace.
export function RecoveryBanner() {
  const [snap, setSnap] = useState<RecoverySnapshot | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    void window.api.recovery?.read().then((s) => {
      if (alive && s?.json) setSnap(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!snap) return null;

  const when = ((): string => {
    try {
      return new Date(snap.savedAt).toLocaleString();
    } catch {
      return "earlier";
    }
  })();

  const restore = async (): Promise<void> => {
    setBusy(true);
    try {
      const f = JSON.parse(snap.json);
      await loadProjectFile(f);
      useApp.getState().loadProject({ name: snap.name });
    } catch (e) {
      console.error("Failed to restore recovery snapshot:", e);
    } finally {
      void window.api.recovery?.clear();
      setSnap(null);
      setBusy(false);
    }
  };

  const discard = (): void => {
    void window.api.recovery?.clear();
    setSnap(null);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 14px",
        background: "var(--accent)",
        color: "#fff",
        fontSize: 12,
      }}
    >
      <span style={{ fontSize: 14 }}>↺</span>
      <span style={{ flex: 1 }}>
        Recovered <b>{snap.name}</b> from an unsaved session ({when}).
      </span>
      <button onClick={restore} disabled={busy} style={btn(true)}>
        {busy ? "Restoring…" : "Restore"}
      </button>
      <button onClick={discard} disabled={busy} style={btn(false)}>
        Discard
      </button>
    </div>
  );
}

const btn = (primary: boolean): React.CSSProperties => ({
  padding: "4px 12px",
  fontSize: 12,
  fontWeight: 600,
  color: primary ? "var(--accent)" : "#fff",
  background: primary ? "#fff" : "rgba(255,255,255,0.15)",
  border: primary ? "none" : "1px solid rgba(255,255,255,0.5)",
  borderRadius: 5,
  cursor: "pointer",
});

export default RecoveryBanner;
