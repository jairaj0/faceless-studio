import { useState } from "react";
import { Type, Square, Circle, Shapes, Image as ImageIcon, Music, Code2, Sparkles, X } from "lucide-react";
import { PanelFrame } from "../PanelFrame";
import { ContextMenu } from "../Menu";
import { BackgroundsModal } from "../BackgroundsModal";
import { useEditor } from "../../store/editorStore";

const SAMPLE_SVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="46" fill="none" stroke="#8b7bff" stroke-width="4"/>
  <path d="M32 52 l12 14 l26 -34" fill="none" stroke="#19c3a6" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const SAMPLE_HTML = `<style>
  .bg { width:100%; height:100%; background:
    linear-gradient(120deg,#6d5efc,#19c3a6,#ff5d8f);
    background-size:300% 300%; animation:flow 8s ease infinite; }
  @keyframes flow { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
</style>
<div class="bg"></div>`;

const SAMPLE_REACT = `export default function Bg(){
  const dots = Array.from({length:40});
  return (
    <div style={{width:'100%',height:'100%',background:'#0b0f1a',position:'relative',overflow:'hidden'}}>
      {dots.map((_,i)=>(
        <div key={i} style={{
          position:'absolute', left:(i*53%100)+'%', top:(i*31%100)+'%',
          width:6, height:6, borderRadius:'50%', background:'#8b7bff',
          animation:'p 3s ease-in-out '+(i*0.1)+'s infinite alternate'
        }}/>
      ))}
      <style>{'@keyframes p{from{transform:translateY(0);opacity:.3}to{transform:translateY(-40px);opacity:1}}'}</style>
    </div>
  );
}`;

export function ProjectPanel() {
  const scene = useEditor((s) => s.scene);
  const selectedIds = useEditor((s) => s.selectedIds);
  const select = useEditor((s) => s.select);
  const toggleSelect = useEditor((s) => s.toggleSelect);
  const addLayer = useEditor((s) => s.addLayer);
  const addSvgLayer = useEditor((s) => s.addSvgLayer);
  const addImageLayer = useEditor((s) => s.addImageLayer);
  const addCodeLayer = useEditor((s) => s.addCodeLayer);
  const setAudio = useEditor((s) => s.setAudio);
  const duplicateSelected = useEditor((s) => s.duplicateSelected);
  const copySelected = useEditor((s) => s.copySelected);
  const removeSelected = useEditor((s) => s.removeSelected);

  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null);
  const [bgOpen, setBgOpen] = useState(false);
  const [svgOpen, setSvgOpen] = useState(false);
  const [svgText, setSvgText] = useState(SAMPLE_SVG);
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeLang, setCodeLang] = useState<"html" | "react">("react");
  const [codeText, setCodeText] = useState(SAMPLE_REACT);

  const importImage = async () => {
    const r = await window.api.importImage();
    if (!r) return;
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, 800 / img.naturalWidth);
      addImageLayer(
        r.dataUrl,
        Math.round(img.naturalWidth * s),
        Math.round(img.naturalHeight * s),
        r.name,
      );
    };
    img.src = r.dataUrl;
  };

  const importAudio = async () => {
    const r = await window.api.importAudio();
    if (r) setAudio({ name: r.name, path: r.path, dataUrl: r.dataUrl, volume: 1 });
  };

  const addBtn: React.CSSProperties = {
    width: "calc(33.33% - 4px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    padding: "8px 0",
    background: "var(--bg-2)",
    border: "1px solid var(--border)",
    borderRadius: 5,
    color: "var(--fg-2)",
    cursor: "pointer",
    fontSize: 10,
  };

  return (
    <PanelFrame tabs={[{ id: "project", label: "Project" }, { id: "media", label: "Media" }]}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: 8, borderBottom: "1px solid var(--border)" }}>
          <button style={addBtn} onClick={() => addLayer("text")}>
            <Type size={16} /> Text
          </button>
          <button style={addBtn} onClick={() => addLayer("rect")}>
            <Square size={16} /> Rect
          </button>
          <button style={addBtn} onClick={() => addLayer("ellipse")}>
            <Circle size={16} /> Ellipse
          </button>
          <button style={addBtn} onClick={() => setSvgOpen(true)}>
            <Shapes size={16} /> SVG
          </button>
          <button style={addBtn} onClick={importImage}>
            <ImageIcon size={16} /> Image
          </button>
          <button style={addBtn} onClick={importAudio}>
            <Music size={16} /> Audio
          </button>
          <button style={addBtn} onClick={() => setCodeOpen(true)}>
            <Code2 size={16} /> Code
          </button>
          <button style={addBtn} onClick={() => setBgOpen(true)}>
            <Sparkles size={16} /> BG
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {scene.audio && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                fontSize: 12,
                color: "var(--fg-2)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <Music size={13} style={{ color: "var(--c-audio)" }} />
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {scene.audio.name}
              </span>
              <button
                onClick={() => setAudio(undefined)}
                style={{ background: "none", border: "none", color: "var(--fg-3)", cursor: "pointer", display: "flex" }}
              >
                <X size={13} />
              </button>
            </div>
          )}
          {scene.layers.map((l) => (
            <div
              key={l.id}
              onClick={(e) => (e.shiftKey ? toggleSelect(l.id) : select(l.id))}
              onContextMenu={(e) => {
                e.preventDefault();
                if (!selectedIds.includes(l.id)) select(l.id);
                setCtx({ x: e.clientX, y: e.clientY });
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                fontSize: 12,
                cursor: "pointer",
                color: selectedIds.includes(l.id) ? "var(--fg)" : "var(--fg-2)",
                background: selectedIds.includes(l.id) ? "var(--selected)" : "transparent",
              }}
            >
              <span style={{ fontSize: 10, color: "var(--fg-3)", width: 48 }}>{l.type}</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {l.name}
              </span>
            </div>
          ))}
          {scene.layers.length === 0 && !scene.audio && (
            <div style={{ padding: 20, textAlign: "center", color: "var(--fg-3)", fontSize: 11 }}>
              Blank project — add a layer above to begin
            </div>
          )}
        </div>

        {svgOpen && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              flexDirection: "column",
              padding: 12,
              gap: 8,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600 }}>Paste SVG markup</div>
            <textarea
              value={svgText}
              onChange={(e) => setSvgText(e.target.value)}
              style={{
                flex: 1,
                background: "var(--bg-2)",
                color: "var(--fg)",
                border: "1px solid var(--border)",
                borderRadius: 5,
                padding: 8,
                fontSize: 11,
                fontFamily: "monospace",
                resize: "none",
              }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setSvgOpen(false)}
                style={{ padding: "6px 12px", background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 5, color: "var(--fg-2)", cursor: "pointer", fontSize: 12 }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (svgText.trim()) addSvgLayer(svgText.trim());
                  setSvgOpen(false);
                }}
                style={{ padding: "6px 12px", background: "var(--accent)", border: "none", borderRadius: 5, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
              >
                Add SVG
              </button>
            </div>
          </div>
        )}

        {codeOpen && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              display: "flex",
              flexDirection: "column",
              padding: 12,
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Add Code Layer</span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                {(["react", "html"] as const).map((lng) => (
                  <button
                    key={lng}
                    onClick={() => {
                      setCodeLang(lng);
                      setCodeText(lng === "react" ? SAMPLE_REACT : SAMPLE_HTML);
                    }}
                    style={{
                      padding: "4px 10px",
                      fontSize: 11,
                      borderRadius: 5,
                      border: "1px solid var(--border)",
                      cursor: "pointer",
                      background: codeLang === lng ? "var(--accent)" : "var(--bg-2)",
                      color: codeLang === lng ? "#fff" : "var(--fg-2)",
                    }}
                  >
                    {lng === "react" ? "React/JSX" : "HTML/CSS/JS"}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={codeText}
              onChange={(e) => setCodeText(e.target.value)}
              spellCheck={false}
              placeholder={
                codeLang === "react"
                  ? "Paste a ReactBits component (export default function ...)"
                  : "Paste HTML + <style> + <script>"
              }
              style={{
                flex: 1,
                background: "var(--bg-2)",
                color: "var(--fg)",
                border: "1px solid var(--border)",
                borderRadius: 5,
                padding: 8,
                fontSize: 11,
                fontFamily: "monospace",
                resize: "none",
              }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setCodeOpen(false)}
                style={{ padding: "6px 12px", background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 5, color: "var(--fg-2)", cursor: "pointer", fontSize: 12 }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (codeText.trim()) addCodeLayer(codeLang, codeText);
                  setCodeOpen(false);
                }}
                style={{ padding: "6px 12px", background: "var(--accent)", border: "none", borderRadius: 5, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
              >
                Add Code
              </button>
            </div>
          </div>
        )}

        {bgOpen && <BackgroundsModal onClose={() => setBgOpen(false)} />}

        {ctx && (
          <ContextMenu
            x={ctx.x}
            y={ctx.y}
            onClose={() => setCtx(null)}
            items={[
              { label: "Duplicate", shortcut: "⌘D", onClick: duplicateSelected },
              { label: "Copy", shortcut: "⌘C", onClick: copySelected },
              { separator: true },
              { label: "Delete", shortcut: "⌫", onClick: removeSelected },
            ]}
          />
        )}
      </div>
    </PanelFrame>
  );
}

export default ProjectPanel;
