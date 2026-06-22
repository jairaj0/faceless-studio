// Headless render page — loaded in a hidden window by the export engine.
// Exposes window.__loadScene(scene) and window.__seek(t); the main process
// drives these per-frame, then captures the viewport via CDP.
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { SceneRenderer } from "./scene/SceneRenderer";
import type { Scene } from "./scene/types";

let sceneSetter: (s: Scene) => void = () => {};
let timeSetter: (t: number) => void = () => {};

// Resolve after the browser has painted (two rAFs) — avoids capturing a stale frame.
const afterPaint = () =>
  new Promise<boolean>((res) =>
    requestAnimationFrame(() => requestAnimationFrame(() => res(true))),
  );

function RenderRoot() {
  const [scene, setScene] = useState<Scene | null>(null);
  const [time, setTime] = useState(0);

  useEffect(() => {
    sceneSetter = setScene;
    timeSetter = setTime;
    (window as unknown as { __ready: boolean }).__ready = true;
  }, []);

  if (!scene) return null;
  return (
    <div style={{ position: "absolute", top: 0, left: 0 }}>
      <SceneRenderer scene={scene} time={time} />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<RenderRoot />);

// Wait for all <img> (data-URL images) to finish loading before capture,
// otherwise the first frames capture blank/half-loaded media.
async function waitForImages(): Promise<void> {
  const imgs = Array.from(document.images);
  await Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((res) => {
            img.onload = () => res();
            img.onerror = () => res();
          }),
    ),
  );
}

// Code-layer iframes (sandboxed) run React/Babel after load — wait for the
// load event plus a settle delay so their first paint exists before capture.
async function waitForIframes(): Promise<void> {
  const frames = Array.from(document.querySelectorAll("iframe"));
  if (!frames.length) return;
  await Promise.all(
    frames.map(
      (f) =>
        new Promise<void>((res) => {
          let done = false;
          const finish = () => {
            if (!done) {
              done = true;
              res();
            }
          };
          f.addEventListener("load", finish, { once: true });
          setTimeout(finish, 2000);
        }),
    ),
  );
  await new Promise((r) => setTimeout(r, 600));
}

// Globals invoked by the main process via executeJavaScript.
Object.assign(window, {
  __loadScene: async (s: Scene) => {
    sceneSetter(s);
    await afterPaint();
    await waitForImages();
    await waitForIframes();
    if (document.fonts?.ready) await document.fonts.ready;
    await afterPaint();
    return true;
  },
  __seek: async (t: number) => {
    timeSetter(t);
    return afterPaint();
  },
});
