// Bundles framer-motion's React API (`motion/react`) into a single browser
// IIFE global (`window.MotionReact`) so it can run inside the code-layer iframe,
// which has no module loader. React / React-DOM / the JSX runtime are left as
// externals mapped to the globals the iframe already vendors (window.React etc).
// Run after `npm i -D motion`:  node scripts/vendor-motion.mjs
import { build } from "esbuild";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src/renderer/public/vendor/motion-react.js");

// Externals → browser globals. The JSX runtime is synthesised from React so
// motion's compiled `jsx(...)` calls work without bundling a second React.
const GLOBALS = {
  react: "window.React",
  "react-dom": "window.ReactDOM",
  "react-dom/client": "window.ReactDOM",
  "react/jsx-runtime":
    "(function(R){function j(t,p,k){if(k!==undefined){p=Object.assign({key:k},p)}return R.createElement(t,p)}return {Fragment:R.Fragment,jsx:j,jsxs:j}})(window.React)",
};

const mapGlobals = {
  name: "map-globals",
  setup(b) {
    const esc = (s) => s.replace(/[/\\^$*+?.()|[\]{}-]/g, "\\$&");
    const filter = new RegExp("^(" + Object.keys(GLOBALS).map(esc).join("|") + ")$");
    b.onResolve({ filter }, (a) => ({ path: a.path, namespace: "global-ext" }));
    b.onLoad({ filter: /.*/, namespace: "global-ext" }, (a) => ({
      contents: `module.exports = ${GLOBALS[a.path]};`,
      loader: "js",
    }));
  },
};

await build({
  stdin: { contents: `export * from "motion/react";`, resolveDir: ROOT, loader: "js" },
  bundle: true,
  format: "iife",
  globalName: "MotionReact",
  outfile: OUT,
  minify: true,
  legalComments: "none",
  target: ["es2019"],
  define: { "process.env.NODE_ENV": '"production"' },
  plugins: [mapGlobals],
});

console.log("Wrote", OUT);
