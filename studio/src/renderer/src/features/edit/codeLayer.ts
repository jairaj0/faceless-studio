import type { CodeSpec } from "../../store/editor";

// Absolute URL prefix to the served /vendor bundles. A srcdoc iframe's base is
// about:srcdoc, so relative paths won't resolve — we inject an absolute one.
// With sandbox="allow-scripts allow-same-origin" the iframe shares our origin,
// so these same-origin scripts load in both dev (http) and prod (file://).
export function vendorBase(): string {
  return new URL("vendor/", window.location.href).href;
}

const BASE_STYLE =
  "html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:transparent}#root{width:100%;height:100%}";

// A clock-control + capture harness injected into every code layer. It lets the
// host drive the layer's animation deterministically (export) or play it live
// (preview), and rasterise the current frame to a PNG via modern-screenshot
// (captures DOM/CSS/canvas — so CSS, gsap and canvas animations all export).
function harness(): string {
  return `
<script src="${vendorBase()}modern-screenshot.js"></script>
<script>
(function(){
  function seek(ms){
    try {
      (document.getAnimations ? document.getAnimations() : []).forEach(function(a){
        try { a.pause(); a.currentTime = ms; } catch(e){}
      });
    } catch(e){}
    if (window.gsap && window.gsap.globalTimeline) {
      try { window.gsap.globalTimeline.pause(); window.gsap.globalTimeline.time(ms/1000); } catch(e){}
    }
    if (typeof window.__seek === "function") { try { window.__seek(ms); } catch(e){} }
  }
  function play(){
    try {
      (document.getAnimations ? document.getAnimations() : []).forEach(function(a){ try { a.play(); } catch(e){} });
    } catch(e){}
    if (window.gsap && window.gsap.globalTimeline) { try { window.gsap.globalTimeline.resume(); } catch(e){} }
  }
  window.addEventListener("message", function(ev){
    var d = ev.data || {};
    if (d.__cl !== 1) return;
    if (d.type === "seek") { seek(d.t); }
    else if (d.type === "play") { play(); }
    else if (d.type === "capture") {
      seek(d.t);
      var go = function(){
        var ms = window.modernScreenshot;
        var opts = { width: d.w, height: d.h, backgroundColor: null, style: { margin: "0" } };
        ms.domToPng(document.body, opts).then(function(png){
          parent.postMessage({ __cl: 1, type: "captured", id: d.id, png: png }, "*");
        }).catch(function(err){
          parent.postMessage({ __cl: 1, type: "captured", id: d.id, png: null, error: String(err) }, "*");
        });
      };
      // two frames so the seeked state has painted before we snapshot
      requestAnimationFrame(function(){ requestAnimationFrame(go); });
    }
  });
  parent.postMessage({ __cl: 1, type: "ready" }, "*");
})();
</script>`;
}

// Optional per-layer CSS, injected into <head>. Pasted ReactBits components
// reference an external stylesheet we can't load; the importer captures it here.
function cssTag(spec: CodeSpec): string {
  return spec.css ? `<style>${spec.css}</style>` : "";
}

// The require() shim available to React code layers. Resolves the libraries the
// iframe vendors as browser globals so real ReactBits components (which use ES
// imports → Babel rewrites them to require()) run unchanged:
//   • react / react-dom            → window.React / window.ReactDOM
//   • gsap, gsap/*, gsap/all       → window.gsap (+ SplitText/ScrollTrigger)
//   • @gsap/react (useGSAP)        → a minimal hook over gsap.context
//   • motion, motion/react,        → window.MotionReact (bundled framer-motion)
//     framer-motion
//   • *.css / *.scss imports       → ignored (styling comes via cssTag)
// Anything else throws a clear, listing error so the layer shows what's missing.
const REQUIRE_SHIM = `
function require(name){
  if (name === "react") return React;
  if (name === "react/jsx-runtime" || name === "react/jsx-dev-runtime"){
    function jsx(type, props, key){
      if (key !== undefined){ props = Object.assign({ key: key }, props); }
      return React.createElement(type, props);
    }
    return { Fragment: React.Fragment, jsx: jsx, jsxs: jsx, jsxDEV: jsx };
  }
  if (name === "react-dom" || name === "react-dom/client") return ReactDOM;
  if (/\\.(css|scss|sass|less)$/.test(name)) return {};
  if (name === "gsap" || name.indexOf("gsap") === 0){
    return { __esModule: true, default: window.gsap, gsap: window.gsap,
      SplitText: window.SplitText, ScrollTrigger: window.ScrollTrigger };
  }
  if (name === "@gsap/react"){
    function useGSAP(cb, deps){
      var ref = React.useRef(null);
      React.useLayoutEffect(function(){
        var ctx = window.gsap.context(function(){ if (cb) cb({}, ctx); }, ref.current || undefined);
        return function(){ ctx.revert(); };
      }, deps || []);
      return { context: undefined, contextSafe: undefined, scope: ref };
    }
    return { __esModule: true, useGSAP: useGSAP, default: useGSAP };
  }
  if (name === "motion" || name === "motion/react" || name === "framer-motion" || name === "motion/react-client"){
    if (!window.MotionReact) throw new Error("motion (framer-motion) failed to load");
    return window.MotionReact;
  }
  throw new Error("Module not available in code layer: '" + name +
    "'. Available: react, react-dom, gsap, @gsap/react, motion/react. (CSS imports are ignored — paste CSS into the importer.)");
}`;

// Build the full srcdoc for a code layer. HTML layers get the raw markup; React
// layers are transpiled in-iframe via Babel against the require() shim above.
export function buildCodeSrcdoc(spec: CodeSpec): string {
  const base = vendorBase();
  if (spec.lang === "html") {
    return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_STYLE}</style>${cssTag(spec)}
<script src="${base}gsap.min.js"></script>
<script src="${base}SplitText.min.js"></script>
<script>try{window.gsap&&window.SplitText&&window.gsap.registerPlugin(window.SplitText)}catch(e){}</script></head>
<body>${spec.source}${harness()}</body></html>`;
  }

  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_STYLE}</style>${cssTag(spec)}
<script src="${base}react.production.min.js"></script>
<script src="${base}react-dom.production.min.js"></script>
<script src="${base}gsap.min.js"></script>
<script src="${base}SplitText.min.js"></script>
<script src="${base}motion-react.js"></script>
<script src="${base}babel.min.js"></script>
<script>try{window.gsap&&window.SplitText&&window.gsap.registerPlugin(window.SplitText)}catch(e){}</script>
</head><body><div id="root"></div>
<script>
(function(){
  var userCode = ${JSON.stringify(spec.source)};
  try {
    var out = Babel.transform(userCode, {
      // typescript preset lets ReactBits' TSX (or the site's JS) paste run as-is;
      // env -> CommonJS so the require() shim resolves imports. react runtime
      // "classic" emits React.createElement (React is in scope) rather than the
      // automatic runtime's jsx-runtime import. filename ".tsx" makes the
      // typescript preset parse JSX; preset-react then transforms it.
      // (isTSX/allExtensions options were removed in current Babel.)
      presets: [
        ["env", { modules: "commonjs" }],
        ["react", { runtime: "classic" }],
        ["typescript", { onlyRemoveTypeImports: true }],
      ],
      filename: "component.tsx",
    }).code;
    var module = { exports: {} };
    var exports = module.exports;
    ${REQUIRE_SHIM}
    var fn = new Function("React","ReactDOM","require","exports","module",
      out + "\\nreturn (module.exports && (module.exports.default || module.exports));");
    var Comp = fn(React, ReactDOM, require, exports, module);
    if (Comp && Comp.default) Comp = Comp.default;
    if (typeof Comp !== "function") throw new Error("No default-exported component found");
    ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(Comp));
  } catch (e) {
    document.body.innerHTML =
      '<pre style="color:#ff8080;font:12px/1.4 monospace;padding:10px;white-space:pre-wrap">' +
      String((e && e.stack) || e) + '</pre>';
  }
})();
</script>
${harness()}
</body></html>`;
}

// Rasterise one code clip to an image at W×H and time `localT` (ms), using an
// offscreen iframe. Reused across frames; the same harness drives seek+capture.
// Returns null if capture fails (export then just skips the layer that frame).
export function captureCodeFrame(
  iframe: HTMLIFrameElement,
  localT: number,
  W: number,
  H: number,
  timeoutMs = 8000,
): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const win = iframe.contentWindow;
    if (!win) return resolve(null);
    const id = Math.random().toString(36).slice(2);
    let done = false;
    const finish = (img: HTMLImageElement | null): void => {
      if (done) return;
      done = true;
      window.removeEventListener("message", onMsg);
      resolve(img);
    };
    const onMsg = (ev: MessageEvent): void => {
      const d = ev.data || {};
      if (d.__cl !== 1 || d.type !== "captured" || d.id !== id) return;
      if (!d.png) return finish(null);
      const img = new Image();
      img.onload = () => finish(img);
      img.onerror = () => finish(null);
      img.src = d.png;
    };
    window.addEventListener("message", onMsg);
    setTimeout(() => finish(null), timeoutMs);
    win.postMessage({ __cl: 1, type: "capture", t: localT, w: W, h: H, id }, "*");
  });
}
