// Bundles the OGL WebGL library into a single browser IIFE global (`window.ogl`)
// so ReactBits' WebGL components (Strands, backgrounds, etc.) can `import … from
// "ogl"` inside the code-layer iframe, which has no module loader.
// Run after `npm i -D ogl`:  node scripts/vendor-ogl.mjs
import { build } from "esbuild";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src/renderer/public/vendor/ogl.js");

await build({
  stdin: { contents: `export * from "ogl";`, resolveDir: ROOT, loader: "js" },
  bundle: true,
  format: "iife",
  globalName: "ogl",
  outfile: OUT,
  minify: true,
  legalComments: "none",
  target: ["es2019"],
});

console.log("Wrote", OUT);
