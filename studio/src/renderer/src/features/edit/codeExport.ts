import type { Clip, Track } from "../../store/editor";
import { allClips } from "../../store/editor";
import { visibleClipsAt } from "./composite";
import { buildCodeSrcdoc, captureCodeFrame } from "./codeLayer";

// Manages offscreen iframes for rasterising code layers during export. One
// iframe per code clip, rendered at the export resolution and reused across
// frames; captureFrame() seeks it to a time and snapshots it to an image.
export class CodeExporter {
  private frames = new Map<string, HTMLIFrameElement>();
  private host: HTMLDivElement | null = null;
  private W = 0;
  private H = 0;

  /** Mount an offscreen iframe for every code clip and wait until each is ready. */
  async prepare(tracks: Track[], W: number, H: number): Promise<void> {
    this.W = W;
    this.H = H;
    const codeClips = allClips(tracks).filter((c) => c.type === "code" && c.code);
    if (!codeClips.length) return;

    const host = document.createElement("div");
    host.style.cssText = `position:fixed;left:-99999px;top:0;width:${W}px;height:${H}px;pointer-events:none;opacity:0;z-index:-1`;
    document.body.appendChild(host);
    this.host = host;

    await Promise.all(
      codeClips.map(
        (c) =>
          new Promise<void>((resolve) => {
            const f = document.createElement("iframe");
            f.setAttribute("sandbox", "allow-scripts allow-same-origin");
            f.style.cssText = `position:absolute;left:0;top:0;width:${W}px;height:${H}px;border:none;background:transparent`;
            f.srcdoc = buildCodeSrcdoc(c.code!);
            let settled = false;
            const done = (): void => {
              if (settled) return;
              settled = true;
              resolve();
            };
            const onMsg = (ev: MessageEvent): void => {
              const d = ev.data || {};
              if (d.__cl === 1 && d.type === "ready" && ev.source === f.contentWindow) {
                window.removeEventListener("message", onMsg);
                done();
              }
            };
            window.addEventListener("message", onMsg);
            setTimeout(done, 4000); // don't hang export if a layer never signals ready
            this.frames.set(c.id, f);
            host.appendChild(f);
          }),
      ),
    );
    // brief settle so vendored scripts (gsap/babel) have initialised
    await new Promise((r) => setTimeout(r, 400));
  }

  /** Capture every visible code clip at time `t` into a clipId→image map. */
  async captureFrame(tracks: Track[], t: number): Promise<Map<string, HTMLImageElement>> {
    const out = new Map<string, HTMLImageElement>();
    if (!this.frames.size) return out;
    const visible = visibleClipsAt(tracks, t).filter((c: Clip) => c.type === "code" && this.frames.has(c.id));
    await Promise.all(
      visible.map(async (c) => {
        const f = this.frames.get(c.id)!;
        const img = await captureCodeFrame(f, t - c.start, this.W, this.H);
        if (img) out.set(c.id, img);
      }),
    );
    return out;
  }

  dispose(): void {
    this.host?.remove();
    this.host = null;
    this.frames.clear();
  }
}
