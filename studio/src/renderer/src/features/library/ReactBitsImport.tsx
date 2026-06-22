import { useMemo, useState } from "react";
import { buildCodeSrcdoc } from "../edit/codeLayer";

// Pull every fenced ```lang … ``` block out of a markdown string.
function fencedBlocks(md: string): { lang: string; body: string }[] {
  const re = /```([a-zA-Z0-9]*)\r?\n([\s\S]*?)```/g;
  const out: { lang: string; body: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) out.push({ lang: m[1].toLowerCase(), body: m[2].replace(/\s+$/, "") });
  return out;
}

// ReactBits' "copy prompt" is a markdown blob (props table, deps, then fenced
// source + CSS). If the pasted text looks like that, split it into the component
// source (the code block that default-exports) and the CSS block. Returns null
// when there are no fences — i.e. the user pasted raw source, leave it as-is.
function parseCopyPrompt(md: string): { source: string; css: string } | null {
  const blocks = fencedBlocks(md);
  if (blocks.length === 0) return null;
  const CODE = ["tsx", "jsx", "ts", "js", "javascript", "typescript", ""];
  const code = blocks.filter((b) => CODE.includes(b.lang) || b.body.includes("export default"));
  const src = code.find((b) => b.body.includes("export default")) ?? code[0];
  if (!src) return null;
  const cssBlock = blocks.find((b) => b.lang === "css" || b.lang === "scss");
  return { source: src.body, css: cssBlock?.body ?? "" };
}

// "Import from ReactBits" — paste any ReactBits (or hand-written) component's
// source straight from reactbits.dev and drop it on the timeline as a code layer.
// The same sandboxed-iframe runtime that powers the gallery previews it here, so
// what renders is what exports. JS or TSX both work (Babel strips the types);
// `motion/react`, gsap, `@gsap/react` and `ogl` resolve to the vendored libs, and
// the component's own `import "./X.css"` is ignored — paste that CSS into the CSS
// box (or paste the whole "copy prompt" and it auto-splits source + CSS).
//
// WebGL via `ogl` is supported and exports frame-accurately (the iframe
// virtualises requestAnimationFrame so the host can seek the render loop).
// three.js / @react-three/fiber / matter-js are still unsupported.
export function ReactBitsImport({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (spec: { lang: "react"; source: string; css?: string }) => void;
}) {
  const [source, setSource] = useState("");
  const [css, setCss] = useState("");
  const [note, setNote] = useState("");

  // On paste into the source box: if it's a ReactBits copy-prompt, auto-split the
  // fenced source/CSS into the two boxes instead of dumping the whole markdown.
  function onSourcePaste(e: React.ClipboardEvent<HTMLTextAreaElement>): void {
    const text = e.clipboardData.getData("text");
    const parsed = parseCopyPrompt(text);
    if (parsed) {
      e.preventDefault();
      setSource(parsed.source);
      if (parsed.css) setCss(parsed.css);
      setNote(parsed.css ? "Split copy-prompt into source + CSS." : "Extracted source from copy-prompt.");
    }
  }

  // Only build a preview srcdoc once there's source — avoids a blank-error frame.
  const srcDoc = useMemo(
    () => (source.trim() ? buildCodeSrcdoc({ lang: "react", source, css: css.trim() || undefined }) : ""),
    [source, css],
  );

  const ready = source.trim().length > 0;

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute", inset: 0, zIndex: 30, background: "rgba(2,4,10,.62)",
        backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(1040px,96%)", height: "min(680px,92%)", display: "flex", flexDirection: "column",
          background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 14,
          boxShadow: "0 24px 80px rgba(0,0,0,.55)", overflow: "hidden",
        }}
      >
        {/* header */}
        <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <strong style={{ fontSize: 14 }}>Import from ReactBits</strong>
          <span style={{ fontSize: 11.5, color: "var(--fg-3)" }}>
            Paste a component’s source or its “copy prompt”. Supports motion, gsap, CSS & WebGL (ogl).
          </span>
          {note && <span style={{ fontSize: 11, color: "#34d399" }}>{note}</span>}
          <button onClick={onClose} style={iconBtn}>✕</button>
        </div>

        {/* body: editors | preview */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", borderRight: "1px solid var(--border)", minHeight: 0 }}>
            <Label>Component source <span style={{ color: "var(--fg-3)", fontWeight: 400 }}>· default-export a component, or paste a copy-prompt</span></Label>
            <textarea
              value={source}
              onChange={(e) => setSource(e.target.value)}
              onPaste={onSourcePaste}
              spellCheck={false}
              placeholder={'Paste a ReactBits "copy prompt" here (auto-splits),\nor a component that default-exports:\n\nexport default function App() {\n  return <GradientText>Hello</GradientText>;\n}'}
              style={{ ...editor, flex: 2 }}
            />
            <Label>CSS <span style={{ color: "var(--fg-3)", fontWeight: 400 }}>· paste the component’s .css (its import is ignored)</span></Label>
            <textarea
              value={css}
              onChange={(e) => setCss(e.target.value)}
              spellCheck={false}
              placeholder={".my-class { animation: spin 2s linear infinite; }"}
              style={{ ...editor, flex: 1 }}
            />
          </div>

          {/* preview */}
          <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
            <Label>Live preview</Label>
            <div style={{ flex: 1, margin: "0 12px 12px", borderRadius: 10, background: "#0a0d16", border: "1px solid var(--border)", overflow: "hidden", position: "relative" }}>
              {ready ? (
                <iframe
                  key={srcDoc.length}
                  title="reactbits-import-preview"
                  srcDoc={srcDoc}
                  sandbox="allow-scripts allow-same-origin"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", background: "transparent" }}
                />
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--fg-3)", fontSize: 12.5, padding: 20, textAlign: "center" }}>
                  Paste a component on the left to preview it here.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* footer */}
        <div style={{ padding: "11px 16px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={ghostBtn}>Cancel</button>
          <button
            disabled={!ready}
            onClick={() => onAdd({ lang: "react", source, css: css.trim() || undefined })}
            style={{ ...primaryBtn, opacity: ready ? 1 : 0.45, cursor: ready ? "pointer" : "not-allowed" }}
          >
            + Add to timeline
          </button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: "10px 12px 6px", fontSize: 11.5, fontWeight: 600, color: "var(--fg-2)" }}>{children}</div>;
}

const editor: React.CSSProperties = {
  margin: "0 12px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-1)",
  color: "var(--fg)", fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace", fontSize: 12, lineHeight: 1.5,
  padding: 10, resize: "none", outline: "none",
};
const iconBtn: React.CSSProperties = {
  marginLeft: "auto", width: 26, height: 26, borderRadius: 7, border: "1px solid var(--border)",
  background: "var(--bg-1)", color: "var(--fg-2)", cursor: "pointer", fontSize: 12,
};
const ghostBtn: React.CSSProperties = {
  padding: "7px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-1)",
  color: "var(--fg-2)", cursor: "pointer", fontSize: 13,
};
const primaryBtn: React.CSSProperties = {
  padding: "7px 16px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff",
  fontSize: 13, fontWeight: 600,
};

export default ReactBitsImport;
