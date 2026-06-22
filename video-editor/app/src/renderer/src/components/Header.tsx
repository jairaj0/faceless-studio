import { useEffect, useState } from "react";
import type { ExportProgress } from "../../../shared/export";
import { useEditor } from "../store/editorStore";
import { TemplatesModal } from "./TemplatesModal";
import { saveProject, openProject, newProject } from "../projectActions";
import { MenuList, type MenuItem } from "./Menu";

const MENUS = ["File", "Edit", "Clip", "Sequence", "Graphics", "View", "Window", "Help"];
const WORKSPACES = ["Assembly", "Editing", "Color", "Effects", "Audio"];
const EXPORT_OPTIONS = [
  { label: "1080p", scale: 1 },
  { label: "4K", scale: 2 },
  { label: "8K", scale: 4 },
];
const SIZES = [
  { label: "16:9 Landscape", w: 1920, h: 1080 },
  { label: "9:16 Reels/Shorts", w: 1080, h: 1920 },
  { label: "1:1 Square", w: 1080, h: 1080 },
  { label: "4:5 Portrait", w: 1080, h: 1350 },
];

export function Header() {
  const width = useEditor((s) => s.scene.width);
  const height = useEditor((s) => s.scene.height);
  const setSceneSize = useEditor((s) => s.setSceneSize);
  const currentPath = useEditor((s) => s.currentPath);

  const [workspace, setWorkspace] = useState("Editing");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [scale, setScale] = useState(2);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => window.api.onExportProgress(setProgress), []);

  const outW = width * scale;
  const outH = height * scale;

  const sharePreview = async () => {
    if (previewUrl) {
      await window.api.stopPreview();
      setPreviewUrl(null);
      return;
    }
    const scene = useEditor.getState().scene;
    const { url } = await window.api.startPreview(scene);
    setPreviewUrl(url);
  };

  const doExport = async () => {
    setExporting(true);
    setMessage("");
    setProgress(null);
    try {
      const scene = useEditor.getState().scene;
      const audioPath = scene.audio?.path;
      const renderScene = { ...scene, audio: undefined };
      const r = await window.api.exportScene({ scene: renderScene, scale, fps: scene.fps, audioPath });
      if (r.canceled) setMessage("Export cancelled");
      else if (r.ok) setMessage(`✓ Saved ${r.width}×${r.height}`);
      else setMessage(`✕ ${r.error ?? "Export failed"}`);
    } finally {
      setExporting(false);
      setProgress(null);
    }
  };

  const ed = () => useEditor.getState();
  const menuItems = (m: string): MenuItem[] => {
    if (m === "File")
      return [
        { label: "New", shortcut: "⌘N", onClick: newProject },
        { label: "Open…", shortcut: "⌘O", onClick: () => openProject() },
        { label: "Save", shortcut: "⌘S", onClick: () => saveProject() },
        { label: "Save As…", shortcut: "⇧⌘S", onClick: () => saveProject(true) },
      ];
    if (m === "Edit")
      return [
        { label: "Undo", shortcut: "⌘Z", onClick: () => ed().undo() },
        { label: "Redo", shortcut: "⇧⌘Z", onClick: () => ed().redo() },
        { separator: true },
        { label: "Copy", shortcut: "⌘C", onClick: () => ed().copySelected() },
        { label: "Paste", shortcut: "⌘V", onClick: () => ed().paste() },
        { label: "Duplicate", shortcut: "⌘D", onClick: () => ed().duplicateSelected() },
        { label: "Delete", shortcut: "⌫", onClick: () => ed().removeSelected() },
        { separator: true },
        { label: "Select All", shortcut: "⌘A", onClick: () => ed().selectAll() },
      ];
    return [];
  };

  return (
    <div style={{ flexShrink: 0 }}>
      {/* Menu row */}
      <div style={{ display: "flex", alignItems: "center", height: 30, background: "var(--bg)", borderBottom: "1px solid var(--border)", padding: "0 8px", gap: 2 }}>
        <div style={{ width: 20, height: 20, borderRadius: 4, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 10, color: "#fff", marginRight: 8 }}>
          FS
        </div>
        {MENUS.map((m) => {
          const hasMenu = m === "File" || m === "Edit";
          const open = openMenu === m;
          const btnStyle: React.CSSProperties = {
            padding: "0 8px",
            height: 22,
            background: open ? "var(--hover)" : "none",
            border: "none",
            color: "var(--fg-2)",
            fontSize: 12,
            cursor: "pointer",
            borderRadius: 4,
          };
          if (!hasMenu)
            return (
              <button key={m} style={btnStyle}>
                {m}
              </button>
            );
          return (
            <div key={m} style={{ position: "relative" }}>
              <button
                style={btnStyle}
                onClick={() => setOpenMenu(open ? null : m)}
                onBlur={() => setTimeout(() => setOpenMenu((c) => (c === m ? null : c)), 150)}
              >
                {m}
              </button>
              {open && (
                <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 500 }}>
                  <MenuList items={menuItems(m)} onClose={() => setOpenMenu(null)} />
                </div>
              )}
            </div>
          );
        })}
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--fg-3)" }}>
          {currentPath ? currentPath.split("/").pop() : "Untitled"} · {message}
        </span>
      </div>

      {/* Workspace tabs + controls */}
      <div style={{ display: "flex", alignItems: "center", height: 32, background: "var(--bg-1)", borderBottom: "1px solid var(--border)", padding: "0 8px", gap: 2 }}>
        <button
          onClick={() => setTemplatesOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", marginRight: 6, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 5, color: "var(--fg)", fontSize: 12, cursor: "pointer" }}
        >
          + Template
        </button>
        {WORKSPACES.map((w) => {
          const a = w === workspace;
          return (
            <button
              key={w}
              onClick={() => setWorkspace(w)}
              style={{ position: "relative", padding: "0 10px", height: "100%", background: "none", border: "none", color: a ? "var(--fg)" : "var(--fg-3)", fontSize: 12, cursor: "pointer" }}
            >
              {w}
              {a && <span style={{ position: "absolute", left: 6, right: 6, bottom: 0, height: 2, background: "var(--accent)", borderRadius: 2 }} />}
            </button>
          );
        })}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <select
            value={`${width}x${height}`}
            onChange={(e) => {
              const s = SIZES.find((o) => `${o.w}x${o.h}` === e.target.value);
              if (s) setSceneSize(s.w, s.h);
            }}
            title="Aspect ratio / canvas size"
            style={{ background: "var(--bg-2)", color: "var(--fg)", border: "1px solid var(--border)", borderRadius: 5, padding: "4px 6px", fontSize: 12 }}
          >
            {SIZES.map((o) => (
              <option key={o.label} value={`${o.w}x${o.h}`}>
                {o.label}
              </option>
            ))}
            {!SIZES.some((o) => o.w === width && o.h === height) && (
              <option value={`${width}x${height}`}>
                Custom {width}×{height}
              </option>
            )}
          </select>

          {previewUrl && (
            <button
              title="Click to copy"
              onClick={() => {
                navigator.clipboard.writeText(previewUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              style={{ fontSize: 11, fontFamily: "monospace", color: "var(--accent)", background: "var(--accent-soft)", padding: "3px 8px", borderRadius: 5, border: "1px solid var(--border)", cursor: "pointer" }}
            >
              {copied ? "✓ Copied!" : `📡 ${previewUrl}  ⧉`}
            </button>
          )}
          <button
            onClick={sharePreview}
            style={{ background: previewUrl ? "var(--accent)" : "var(--bg-2)", color: previewUrl ? "#fff" : "var(--fg)", border: "1px solid var(--border)", borderRadius: 5, padding: "5px 10px", fontSize: 12, cursor: "pointer" }}
          >
            {previewUrl ? "Stop Share" : "Share Preview"}
          </button>

          <select
            value={scale}
            disabled={exporting}
            onChange={(e) => setScale(Number(e.target.value))}
            style={{ background: "var(--bg-2)", color: "var(--fg)", border: "1px solid var(--border)", borderRadius: 5, padding: "4px 6px", fontSize: 12 }}
          >
            {EXPORT_OPTIONS.map((o) => (
              <option key={o.scale} value={o.scale}>
                {o.label} ({width * o.scale}×{height * o.scale})
              </option>
            ))}
          </select>
          <button
            onClick={doExport}
            disabled={exporting}
            style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: 5, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: exporting ? "default" : "pointer", opacity: exporting ? 0.7 : 1, minWidth: 140 }}
          >
            {exporting
              ? progress
                ? `${progress.phase === "encoding" ? "Encoding" : "Rendering"} ${Math.round(progress.pct)}%`
                : "Starting…"
              : `Export ${outW}×${outH}`}
          </button>
        </div>
      </div>

      {exporting && (
        <div style={{ height: 3, background: "var(--bg-2)" }}>
          <div style={{ height: "100%", width: `${progress?.pct ?? 0}%`, background: "var(--accent)", transition: "width 0.1s linear" }} />
        </div>
      )}

      {templatesOpen && <TemplatesModal onClose={() => setTemplatesOpen(false)} />}
    </div>
  );
}

export default Header;
