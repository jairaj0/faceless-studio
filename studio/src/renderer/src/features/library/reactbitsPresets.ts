// Curated, real ReactBits components seeded into the Library as presets.
//
// Their source is vendored verbatim from github.com/DavidHDev/react-bits
// (MIT-licensed) as `?raw` text so backticks/${} survive untouched, then wrapped
// at build time: we strip the component's own `export default <Name>;` and append
// a centred default-export that renders it with sensible demo props. The runtime
// (codeLayer's require() shim) resolves `motion/react`, gsap and ignored CSS
// imports, so these run exactly like a pasted ReactBits component.
//
// Fidelity follows the export model: CSS-driven components seek frame-accurately
// ("exact"); motion spring / rAF components preview live but export approximately
// ("preview"). WebGL/three.js components are intentionally not curated.
import blurTextRaw from "./reactbits/BlurText.txt?raw";
import glitchTextRaw from "./reactbits/GlitchText.txt?raw";
import glitchTextCss from "./reactbits/GlitchText.css.txt?raw";
import rotatingTextRaw from "./reactbits/RotatingText.txt?raw";
import rotatingTextCss from "./reactbits/RotatingText.css.txt?raw";
import type { ComponentPreset } from "./presets";

const RB_URL = "https://reactbits.dev/text-animations";

// Strip the component's own default export, then append a centred wrapper whose
// default export is what the code layer mounts. `render` is JSX (Babel handles it
// in-iframe) referencing the now-in-scope component by name.
function wrap(raw: string, name: string, render: string): string {
  const stripped = raw.replace(new RegExp(`export\\s+default\\s+${name}\\s*;?`), "");
  return `${stripped}
export default function __RBPreset() {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "system-ui,-apple-system,Segoe UI,sans-serif", fontWeight: 800, fontSize: "clamp(26px,7vw,72px)", textAlign: "center", padding: "5%", boxSizing: "border-box" }}>
      ${render}
    </div>
  );
}`;
}

export const REACTBITS_PRESETS: ComponentPreset[] = [
  {
    id: "rb-blur-text",
    label: "Blur Text",
    category: "Text",
    lang: "react",
    blurb: "Words blur-fade in on mount. Real ReactBits component, powered by Framer Motion.",
    credit: { label: "ReactBits", url: `${RB_URL}/blur-text` },
    fidelity: "preview",
    source: wrap(blurTextRaw, "BlurText", `<BlurText text="Animate anything" animateBy="words" delay={150} />`),
  },
  {
    id: "rb-glitch-text",
    label: "Glitch Text",
    category: "Text",
    lang: "react",
    blurb: "Classic RGB-split glitch, pure CSS — seeks frame-accurately on export.",
    credit: { label: "ReactBits", url: `${RB_URL}/glitch-text` },
    fidelity: "exact",
    css: glitchTextCss,
    source: wrap(glitchTextRaw, "GlitchText", `<GlitchText>REACTBITS</GlitchText>`),
  },
  {
    id: "rb-rotating-text",
    label: "Rotating Text",
    category: "Text",
    lang: "react",
    blurb: "Cycles through words with spring transitions (Framer Motion + AnimatePresence).",
    credit: { label: "ReactBits", url: `${RB_URL}/rotating-text` },
    fidelity: "preview",
    css: rotatingTextCss,
    source: wrap(
      rotatingTextRaw,
      "RotatingText",
      `<span>Make it&nbsp;<RotatingText texts={["creative","animated","exportable"]} rotationInterval={1600} mainClassName="rb-rot" /></span>`,
    ),
  },
];
