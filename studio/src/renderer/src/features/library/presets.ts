// ReactBits-style component presets for the Library window. Each is a ready-made
// HTML or React/JSX animation that drops onto the timeline as a code layer
// (same runtime as hand-written code layers — sandboxed iframe, frame-accurate
// export). Authoring rules that keep them looking right at any resolution and
// exporting deterministically:
//   • size with viewport units (vh/vw) and % so they scale with the comp,
//   • animate with CSS @keyframes / gsap (both seek-accurate on export),
//     or define window.__seek(ms) for JS-driven values (e.g. counters),
//   • Text/UI presets keep a transparent background so they overlay footage;
//     Background presets fill the frame.
// React presets must default-export a component and avoid template literals
// (this file stores their source verbatim inside a template literal).

export type PresetCategory = "Text" | "Background" | "UI";

export interface ComponentPreset {
  id: string;
  label: string;
  category: PresetCategory;
  lang: "html" | "react";
  blurb: string;
  source: string;
  // Optional CSS injected into the layer's <head>. Curated/imported ReactBits
  // components reference an external stylesheet we can't load at runtime, so we
  // carry it here and feed it through CodeSpec.css.
  css?: string;
  // Optional attribution (e.g. a reactbits.dev source URL) shown on the card.
  credit?: { label: string; url: string };
  // Export-fidelity hint shown as a badge: "exact" (CSS/gsap — frame-accurate)
  // or "preview" (motion spring/rAF — previews live, export is approximate).
  fidelity?: "exact" | "preview";
}

export const COMPONENT_PRESETS: ComponentPreset[] = [
  // ---- Text ---------------------------------------------------------------
  {
    id: "gradient-text",
    label: "Gradient Text",
    category: "Text",
    lang: "html",
    blurb: "Looping gradient sweep clipped to the text.",
    source: `<div style="width:100%;height:100%;display:grid;place-items:center;font:800 17vh/1 system-ui,sans-serif">
  <span style="background:linear-gradient(90deg,#f0abfc,#818cf8,#22d3ee,#f0abfc);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:gt 4s linear infinite">Gradient</span>
</div>
<style>@keyframes gt{to{background-position:300% 0}}</style>`,
  },
  {
    id: "typewriter",
    label: "Typewriter",
    category: "Text",
    lang: "html",
    blurb: "Monospace type-on with a blinking caret.",
    source: `<div style="width:100%;height:100%;display:grid;place-items:center">
  <div style="font:700 13vh/1 ui-monospace,monospace;color:#e2e8f0;white-space:nowrap;overflow:hidden;border-right:.1em solid #38bdf8;width:9ch;animation:tw 4s steps(9) infinite,cw .7s step-end infinite">Faceless</div>
</div>
<style>@keyframes tw{0%{width:0}45%{width:9ch}65%{width:9ch}100%{width:0}}@keyframes cw{50%{border-color:transparent}}</style>`,
  },
  {
    id: "shiny-text",
    label: "Shiny Text",
    category: "Text",
    lang: "html",
    blurb: "Metallic sheen sweeping across the letters.",
    source: `<div style="width:100%;height:100%;display:grid;place-items:center;font:800 17vh/1 system-ui,sans-serif">
  <span style="background:linear-gradient(110deg,#64748b 42%,#ffffff 50%,#64748b 58%);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:sh 3s linear infinite">Shiny</span>
</div>
<style>@keyframes sh{to{background-position:-220% 0}}</style>`,
  },
  {
    id: "blur-in",
    label: "Blur In",
    category: "Text",
    lang: "html",
    blurb: "Text resolves from a soft blur with letter-spacing.",
    source: `<div style="width:100%;height:100%;display:grid;place-items:center;font:800 17vh/1 system-ui,sans-serif;color:#fff">
  <span style="animation:bi 3.6s ease-in-out infinite">Focus</span>
</div>
<style>@keyframes bi{0%{filter:blur(26px);opacity:0;letter-spacing:.45em}45%{filter:blur(0);opacity:1;letter-spacing:.02em}72%{filter:blur(0);opacity:1;letter-spacing:.02em}100%{filter:blur(26px);opacity:0;letter-spacing:.45em}}</style>`,
  },
  {
    id: "wave-text",
    label: "Wave Letters",
    category: "Text",
    lang: "react",
    blurb: "Per-letter bob with a staggered delay (React).",
    source: `export default function Wave() {
  const letters = "WAVE".split("");
  return (
    <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", font: "900 20vh/1 system-ui, sans-serif", color: "#fff" }}>
      <div style={{ display: "flex" }}>
        {letters.map((ch, i) => (
          <span key={i} style={{ display: "inline-block", animation: "bob 1.4s ease-in-out " + (i * 0.12) + "s infinite" }}>{ch}</span>
        ))}
      </div>
      <style>{"@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-22%)}}"}</style>
    </div>
  );
}`,
  },
  {
    id: "glitch-text",
    label: "Glitch Text",
    category: "Text",
    lang: "html",
    blurb: "RGB-split cyberpunk glitch.",
    source: `<div style="width:100%;height:100%;display:grid;place-items:center;font:900 16vh/1 system-ui,sans-serif">
  <div style="position:relative;color:#fff">GLITCH
    <span style="position:absolute;inset:0;color:#ff00ea;mix-blend-mode:screen;animation:g1 2s steps(2) infinite">GLITCH</span>
    <span style="position:absolute;inset:0;color:#00fff0;mix-blend-mode:screen;animation:g2 2s steps(2) infinite">GLITCH</span>
  </div>
</div>
<style>@keyframes g1{0%,100%{transform:translate(0,0)}20%{transform:translate(-3%,2%)}40%{transform:translate(2%,-2%)}}@keyframes g2{0%,100%{transform:translate(0,0)}30%{transform:translate(3%,-2%)}60%{transform:translate(-2%,2%)}}</style>`,
  },
  {
    id: "count-up",
    label: "Count Up",
    category: "Text",
    lang: "html",
    blurb: "Number tweens to a target — frame-accurate via __seek.",
    source: `<div style="width:100%;height:100%;display:grid;place-items:center">
  <div id="n" style="font:800 22vh/1 system-ui,sans-serif;color:#34d399">0</div>
</div>
<script>
  var el = document.getElementById("n");
  var TARGET = 2026, DUR = 2400;
  // Driven by the host clock (export seeks each frame) so it never desyncs.
  window.__seek = function (ms) {
    var p = Math.min(1, Math.max(0, ms) / DUR);
    p = 1 - Math.pow(1 - p, 3); // easeOutCubic
    el.textContent = Math.round(TARGET * p).toLocaleString();
  };
  window.__seek(0);
</script>`,
  },
  // ---- Background ---------------------------------------------------------
  {
    id: "aurora",
    label: "Aurora",
    category: "Background",
    lang: "html",
    blurb: "Soft drifting blobs of light.",
    source: `<div style="width:100%;height:100%;position:relative;overflow:hidden;background:#070b16">
  <div style="position:absolute;width:60%;height:60%;left:-5%;top:-10%;background:radial-gradient(circle,#7c3aed,transparent 60%);filter:blur(8vh);animation:au1 7s ease-in-out infinite"></div>
  <div style="position:absolute;width:55%;height:55%;right:-5%;top:8%;background:radial-gradient(circle,#06b6d4,transparent 60%);filter:blur(8vh);animation:au2 8s ease-in-out infinite"></div>
  <div style="position:absolute;width:55%;height:55%;left:18%;bottom:-12%;background:radial-gradient(circle,#ec4899,transparent 60%);filter:blur(8vh);animation:au3 9s ease-in-out infinite"></div>
</div>
<style>@keyframes au1{0%,100%{transform:translate(0,0)}50%{transform:translate(28%,22%)}}@keyframes au2{0%,100%{transform:translate(0,0)}50%{transform:translate(-24%,24%)}}@keyframes au3{0%,100%{transform:translate(0,0)}50%{transform:translate(16%,-28%)}}</style>`,
  },
  {
    id: "mesh-gradient",
    label: "Mesh Gradient",
    category: "Background",
    lang: "html",
    blurb: "Slowly rotating conic colour mesh.",
    source: `<div style="width:100%;height:100%;overflow:hidden">
  <div style="width:100%;height:100%;background:conic-gradient(from 0deg,#f43f5e,#f59e0b,#10b981,#3b82f6,#a855f7,#f43f5e);animation:mg 9s linear infinite"></div>
</div>
<style>@keyframes mg{from{transform:rotate(0deg) scale(1.9)}to{transform:rotate(360deg) scale(1.9)}}</style>`,
  },
  {
    id: "particles",
    label: "Particle Rise",
    category: "Background",
    lang: "react",
    blurb: "Drifting particles over a deep gradient (React).",
    source: `export default function Particles() {
  const dots = Array.from({ length: 36 });
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "radial-gradient(circle at 50% 30%,#0f172a,#020617)" }}>
      {dots.map((_, i) => (
        <span key={i} style={{ position: "absolute", left: ((i * 137.5) % 100) + "%", bottom: "-5%", width: "0.9vh", height: "0.9vh", borderRadius: "50%", background: "#7dd3fc", opacity: 0.7, animation: "rise " + (4 + (i % 5)) + "s linear " + (-(i % 7)) + "s infinite" }} />
      ))}
      <style>{"@keyframes rise{to{transform:translateY(-110vh);opacity:0}}"}</style>
    </div>
  );
}`,
  },
  {
    id: "grid-pulse",
    label: "Grid Pulse",
    category: "Background",
    lang: "html",
    blurb: "Breathing technical grid.",
    source: `<div style="width:100%;height:100%;background-color:#060a14;background-image:linear-gradient(#1e293b 1px,transparent 1px),linear-gradient(90deg,#1e293b 1px,transparent 1px);background-size:8% 8%;animation:gp 3s ease-in-out infinite"></div>
<style>@keyframes gp{0%,100%{opacity:.45;background-size:8% 8%}50%{opacity:1;background-size:8.4% 8.4%}}</style>`,
  },
  // ---- UI -----------------------------------------------------------------
  {
    id: "glow-button",
    label: "Glow Button",
    category: "UI",
    lang: "html",
    blurb: "Call-to-action with a pulsing glow ring.",
    source: `<div style="width:100%;height:100%;display:grid;place-items:center">
  <button style="font:700 6vh/1 system-ui,sans-serif;color:#fff;padding:.65em 1.5em;border:none;border-radius:999px;background:linear-gradient(90deg,#6366f1,#8b5cf6);animation:gb 2s ease-in-out infinite">Get Started</button>
</div>
<style>@keyframes gb{0%,100%{box-shadow:0 0 0 0 rgba(139,92,246,.6)}50%{box-shadow:0 0 4vh 1.2vh rgba(139,92,246,0)}}</style>`,
  },
  {
    id: "live-badge",
    label: "Live Badge",
    category: "UI",
    lang: "html",
    blurb: "Pill badge with a pulsing status dot.",
    source: `<div style="width:100%;height:100%;display:grid;place-items:center">
  <div style="display:flex;align-items:center;gap:.5em;font:800 7vh/1 system-ui,sans-serif;color:#fff;background:#111827;padding:.45em .85em;border-radius:999px;border:1px solid rgba(239,68,68,.35)">
    <span style="width:.55em;height:.55em;border-radius:50%;background:#ef4444;animation:lb 1.2s ease-in-out infinite"></span>LIVE
  </div>
</div>
<style>@keyframes lb{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(239,68,68,.55)}50%{opacity:.6;box-shadow:0 0 0 .5em rgba(239,68,68,0)}}</style>`,
  },
];

export const PRESET_CATEGORIES: PresetCategory[] = ["Text", "Background", "UI"];
