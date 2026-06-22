import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useEditor } from "../../store/editor";
import { useApp } from "../../store";
import { buildCodeSrcdoc } from "../edit/codeLayer";
import { COMPONENT_PRESETS, PRESET_CATEGORIES, type ComponentPreset, type PresetCategory } from "./presets";
import { REACTBITS_PRESETS } from "./reactbitsPresets";
import { ReactBitsImport } from "./ReactBitsImport";

const LOOP_MS = 6000; // preview clock period — all cards loop together

// Curated ReactBits components lead the gallery, then the built-in presets.
const ALL_PRESETS: ComponentPreset[] = [...REACTBITS_PRESETS, ...COMPONENT_PRESETS];

// The Import & Preview window: a gallery of ReactBits-style component presets.
// Each card runs a live, looping preview in the same sandboxed-iframe runtime
// used for real code layers, so what you see is what exports. "Add to timeline"
// drops the preset as a code-layer clip and jumps to the Edit window.
export function LibraryWindow() {
  const addCodeClip = useEditor((s) => s.addCodeClip);
  const setView = useApp((s) => s.setView);

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<PresetCategory | "All">("All");
  const [importing, setImporting] = useState(false);

  const frames = useRef(new Map<string, HTMLIFrameElement>());

  const presets = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_PRESETS.filter((p) => {
      if (cat !== "All" && p.category !== cat) return false;
      if (!q) return true;
      return (p.label + " " + p.blurb + " " + p.category).toLowerCase().includes(q);
    });
  }, [query, cat]);

  // Single host clock drives every visible preview iframe via seek, so CSS,
  // gsap and __seek-based presets all animate (and stay in lockstep).
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (): void => {
      const t = (performance.now() - start) % LOOP_MS;
      for (const f of frames.current.values()) {
        f.contentWindow?.postMessage({ __cl: 1, type: "seek", t }, "*");
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  function add(p: ComponentPreset): void {
    addCodeClip({ lang: p.lang, source: p.source, css: p.css });
    setView("edit");
  }

  function addImported(spec: { lang: "react"; source: string; css?: string }): void {
    addCodeClip(spec);
    setImporting(false);
    setView("edit");
  }

  return (
    <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", background: "var(--bg)", color: "var(--fg)", overflow: "hidden" }}>
      {/* header */}
      <div style={{ padding: "14px 18px 10px", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Import &amp; Preview</h2>
          <span style={{ color: "var(--fg-3)", fontSize: 12 }}>
            {presets.length} component{presets.length === 1 ? "" : "s"} · click to drop on the timeline as an editable code layer
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search components…"
            spellCheck={false}
            style={{
              flex: "0 0 220px", padding: "6px 10px", borderRadius: 7, border: "1px solid var(--border)",
              background: "var(--bg-1)", color: "var(--fg)", fontSize: 13, outline: "none",
            }}
          />
          <div style={{ display: "flex", gap: 6 }}>
            {(["All", ...PRESET_CATEGORIES] as const).map((c) => (
              <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>
            ))}
          </div>
          <button
            onClick={() => setImporting(true)}
            style={{
              marginLeft: "auto", padding: "6px 13px", borderRadius: 8, cursor: "pointer", fontSize: 12.5, fontWeight: 600,
              border: "1px solid var(--accent)", background: "color-mix(in srgb, var(--accent) 20%, transparent)", color: "var(--fg)",
            }}
          >
            ↧ Import from ReactBits
          </button>
        </div>
      </div>

      {/* grid */}
      <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
          {presets.map((p) => (
            <PresetCard
              key={p.id}
              preset={p}
              onAdd={() => add(p)}
              register={(el) => {
                if (el) frames.current.set(p.id, el);
                else frames.current.delete(p.id);
              }}
            />
          ))}
        </div>
        {presets.length === 0 && (
          <p style={{ color: "var(--fg-3)", fontSize: 13, textAlign: "center", marginTop: 40 }}>
            No components match “{query}”.
          </p>
        )}
      </div>

      {importing && <ReactBitsImport onClose={() => setImporting(false)} onAdd={addImported} />}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 12px", borderRadius: 999, fontSize: 12, cursor: "pointer",
        border: "1px solid " + (active ? "var(--accent)" : "var(--border)"),
        background: active ? "color-mix(in srgb, var(--accent) 22%, transparent)" : "var(--bg-1)",
        color: active ? "var(--fg)" : "var(--fg-2)",
      }}
    >
      {children}
    </button>
  );
}

function PresetCard({
  preset,
  onAdd,
  register,
}: {
  preset: ComponentPreset;
  onAdd: () => void;
  register: (el: HTMLIFrameElement | null) => void;
}) {
  const [hover, setHover] = useState(false);
  const srcDoc = useMemo(
    () => buildCodeSrcdoc({ lang: preset.lang, source: preset.source, css: preset.css }),
    [preset.lang, preset.source, preset.css],
  );
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderRadius: 11, overflow: "hidden", background: "var(--bg-1)",
        border: "1px solid " + (hover ? "var(--accent)" : "var(--border)"),
        transition: "border-color .12s", display: "flex", flexDirection: "column",
      }}
    >
      {/* preview */}
      <div style={{ position: "relative", aspectRatio: "16 / 9", background: "#0a0d16", overflow: "hidden" }}>
        <iframe
          ref={register}
          title={preset.label}
          srcDoc={srcDoc}
          sandbox="allow-scripts allow-same-origin"
          scrolling="no"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", background: "transparent", pointerEvents: "none" }}
        />
        <span style={{
          position: "absolute", top: 8, right: 8, fontSize: 10, fontWeight: 700, letterSpacing: ".04em",
          padding: "2px 7px", borderRadius: 5, textTransform: "uppercase",
          background: "rgba(0,0,0,.5)", color: preset.lang === "react" ? "#61dafb" : "#f59e0b",
          backdropFilter: "blur(3px)",
        }}>{preset.lang === "react" ? "React" : "HTML"}</span>
        {hover && (
          <button
            onClick={onAdd}
            style={{
              position: "absolute", inset: 0, margin: "auto", width: 150, height: 38,
              border: "none", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: 600,
              color: "#fff", background: "var(--accent)", boxShadow: "0 4px 18px rgba(0,0,0,.4)",
            }}
          >
            + Add to timeline
          </button>
        )}
      </div>
      {/* meta */}
      <div style={{ padding: "9px 11px 11px", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <strong style={{ fontSize: 13 }}>{preset.label}</strong>
          <span style={{ fontSize: 10, color: "var(--fg-3)" }}>{preset.category}</span>
        </div>
        <span style={{ fontSize: 11.5, color: "var(--fg-2)", lineHeight: 1.35 }}>{preset.blurb}</span>
        {(preset.credit || preset.fidelity) && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 2 }}>
            {preset.fidelity && (
              <span
                title={preset.fidelity === "exact" ? "Seeks frame-accurately on export" : "Previews live; export is approximate (motion spring/rAF)"}
                style={{
                  fontSize: 9.5, fontWeight: 700, letterSpacing: ".03em", textTransform: "uppercase",
                  padding: "1.5px 6px", borderRadius: 5,
                  color: preset.fidelity === "exact" ? "#34d399" : "#fbbf24",
                  background: preset.fidelity === "exact" ? "rgba(52,211,153,.13)" : "rgba(251,191,36,.13)",
                }}
              >
                {preset.fidelity === "exact" ? "Frame-accurate" : "Preview"}
              </span>
            )}
            {preset.credit && (
              <span style={{ fontSize: 10, color: "var(--fg-3)" }}>via {preset.credit.label}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LibraryWindow;
