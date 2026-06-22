import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { EditorShell } from "./components/EditorShell";
import { useEditor } from "./store/editorStore";
import { saveProject, openProject, newProject } from "./projectActions";
import type { Scene } from "./scene/types";

export default function App() {
  const [recover, setRecover] = useState<Scene | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing =
        el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable;
      const s = useEditor.getState();
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveProject(e.shiftKey);
        return;
      }
      if (mod && e.key.toLowerCase() === "o") {
        e.preventDefault();
        openProject();
        return;
      }
      if (mod && e.key.toLowerCase() === "n") {
        e.preventDefault();
        newProject();
        return;
      }
      if (typing) return;

      if (mod && e.key.toLowerCase() === "c") {
        e.preventDefault();
        s.copySelected();
      } else if (mod && e.key.toLowerCase() === "v") {
        e.preventDefault();
        s.paste();
      } else if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        s.duplicateSelected();
      } else if (mod && e.key.toLowerCase() === "a") {
        e.preventDefault();
        s.selectAll();
      } else if (e.code === "Space") {
        e.preventDefault();
        if (!s.playing && s.time >= s.scene.duration) s.setTime(0);
        s.setPlaying(!s.playing);
      } else if ((e.key === "Delete" || e.key === "Backspace") && s.selectedIds.length) {
        e.preventDefault();
        s.removeSelected();
      } else if (e.key.toLowerCase() === "s" && s.selectedId) {
        e.preventDefault();
        s.splitLayer(s.selectedId, s.time);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Autosave every 15s (skip empty projects so we never clobber recovery)
  useEffect(() => {
    const id = setInterval(() => {
      const s = useEditor.getState().scene;
      if (s.layers.length === 0 && !s.audio) return;
      window.api.autosaveProject(JSON.stringify(s));
    }, 15000);
    return () => clearInterval(id);
  }, []);

  // On startup, offer to recover last autosaved work
  useEffect(() => {
    (async () => {
      const json = await window.api.loadAutosave();
      if (!json) return;
      try {
        const scene = JSON.parse(json) as Scene;
        if (scene.layers && scene.layers.length > 0) setRecover(scene);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {recover && (
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 14px",
            background: "var(--accent-soft)",
            borderBottom: "1px solid var(--border)",
            fontSize: 12,
          }}
        >
          <span>⏱ Unsaved work from your last session was found.</span>
          <button
            onClick={() => {
              useEditor.getState().loadScene(recover);
              setRecover(null);
            }}
            style={{ marginLeft: "auto", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 5, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
          >
            Recover
          </button>
          <button
            onClick={() => {
              window.api.clearAutosave();
              setRecover(null);
            }}
            style={{ background: "var(--bg-2)", color: "var(--fg-2)", border: "1px solid var(--border)", borderRadius: 5, padding: "5px 12px", cursor: "pointer", fontSize: 12 }}
          >
            Discard
          </button>
        </div>
      )}
      <Header />
      <div style={{ flex: 1, minHeight: 0 }}>
        <EditorShell />
      </div>
    </div>
  );
}
