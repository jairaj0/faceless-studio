// Builds the iframe srcdoc for a Code Layer.
// - "html": raw HTML/CSS/JS snippet rendered directly.
// - "react": React/JSX (ReactBits style) transpiled in-iframe via Babel,
//   with React + ReactDOM provided. Self-contained components work; imports
//   other than react/react-dom are reported as errors (more libs later).
import reactUmd from "../vendor/react.production.min.js?raw";
import reactDomUmd from "../vendor/react-dom.production.min.js?raw";
import babelStandalone from "../vendor/babel.min.js?raw";
import gsapUmd from "../vendor/gsap.min.js?raw";

const BASE_STYLE = `html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:transparent}#root{width:100%;height:100%}`;

export function buildCodeSrcdoc(lang: "html" | "react", code: string): string {
  if (lang === "html") {
    return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_STYLE}</style></head><body>${code}</body></html>`;
  }

  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_STYLE}</style>
<script>${reactUmd}</script>
<script>${reactDomUmd}</script>
<script>${gsapUmd}</script>
<script>${babelStandalone}</script>
</head><body><div id="root"></div>
<script>
(function(){
  var userCode = ${JSON.stringify(code)};
  try {
    var out = Babel.transform(userCode, {
      presets: [["env", { modules: "commonjs" }], "react"],
      filename: "component.jsx",
    }).code;
    var module = { exports: {} };
    var exports = module.exports;
    function require(name){
      if (name === "react") return React;
      if (name === "react-dom" || name === "react-dom/client") return ReactDOM;
      if (name === "gsap" || name.indexOf("gsap/") === 0) {
        if (window.gsap) window.gsap.gsap = window.gsap;
        return window.gsap;
      }
      throw new Error("Module not available in code layer: " + name);
    }
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
</body></html>`;
}
