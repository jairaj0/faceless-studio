import { useEffect, useMemo, useRef, useState } from "react";
import { useEditor, evalTransform, type Clip } from "../../store/editor";
import { visibleClipsAt } from "./composite";
import { buildCodeSrcdoc } from "./codeLayer";

// The drawn-image rect of a `object-fit: contain` canvas inside its box.
interface Rect { left: number; top: number; width: number; height: number }

// Live preview for code layers: sandboxed iframes positioned over the preview
// canvas in the exact same coordinate space, transformed per clip, shown only
// during each clip's span. Animations run live while playing, and are seeked to
// the scrubbed time while paused — matching the rasterised export.
export function CodeOverlay({ canvas }: { canvas: HTMLCanvasElement | null }) {
  const tracks = useEditor((s) => s.tracks);
  const comp = useEditor((s) => s.comp);
  const playhead = useEditor((s) => s.playhead);
  const playing = useEditor((s) => s.playing);
  const [rect, setRect] = useState<Rect | null>(null);
  const frames = useRef(new Map<string, HTMLIFrameElement>());

  // The code clips live at the current playhead, with resolved transform.
  const clips = visibleClipsAt(tracks, playhead).filter((c) => c.type === "code" && c.code);

  // Track the canvas' on-screen content rect (accounts for object-fit: contain).
  useEffect(() => {
    if (!canvas) return;
    const measure = (): void => {
      const r = canvas.getBoundingClientRect();
      const parent = canvas.parentElement?.getBoundingClientRect();
      if (!parent || !r.width || !r.height) return;
      const scale = Math.min(r.width / comp.width, r.height / comp.height);
      const cw = comp.width * scale;
      const ch = comp.height * scale;
      setRect({
        left: r.left - parent.left + (r.width - cw) / 2,
        top: r.top - parent.top + (r.height - ch) / 2,
        width: cw,
        height: ch,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(canvas);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [canvas, comp.width, comp.height]);

  // Drive each iframe's clock: live while playing, seeked while paused.
  useEffect(() => {
    for (const c of clips) {
      const f = frames.current.get(c.id);
      const win = f?.contentWindow;
      if (!win) continue;
      if (playing) win.postMessage({ __cl: 1, type: "play" }, "*");
      else win.postMessage({ __cl: 1, type: "seek", t: Math.max(0, playhead - c.start) }, "*");
    }
  }, [playhead, playing, clips.map((c) => c.id).join(",")]);

  if (!rect) return null;
  return (
    <div style={{ position: "absolute", left: rect.left, top: rect.top, width: rect.width, height: rect.height, pointerEvents: "none", overflow: "hidden" }}>
      {clips.map((c) => (
        <CodeFrame
          key={c.id}
          clip={c}
          comp={comp}
          playhead={playhead}
          register={(el) => {
            if (el) frames.current.set(c.id, el);
            else frames.current.delete(c.id);
          }}
        />
      ))}
    </div>
  );
}

function CodeFrame({
  clip,
  comp,
  playhead,
  register,
}: {
  clip: Clip;
  comp: { width: number; height: number };
  playhead: number;
  register: (el: HTMLIFrameElement | null) => void;
}) {
  const srcDoc = useMemo(() => buildCodeSrcdoc(clip.code!), [clip.code?.lang, clip.code?.source]);
  const x = evalTransform(clip, "x", playhead);
  const y = evalTransform(clip, "y", playhead);
  const scale = evalTransform(clip, "scale", playhead);
  const rotation = evalTransform(clip, "rotation", playhead);
  const opacity = evalTransform(clip, "opacity", playhead);
  void comp;
  return (
    <iframe
      ref={register}
      title="code-layer"
      srcDoc={srcDoc}
      sandbox="allow-scripts allow-same-origin"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        border: "none",
        background: "transparent",
        opacity,
        transform: `translate(${x * 100}%, ${y * 100}%) rotate(${rotation}deg) scale(${scale})`,
        transformOrigin: "center",
        pointerEvents: "none",
      }}
    />
  );
}

export default CodeOverlay;
