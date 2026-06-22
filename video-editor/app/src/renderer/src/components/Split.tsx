import React, { useRef, useState } from "react";

interface SplitProps {
  direction: "horizontal" | "vertical";
  initial: number; // first pane size, %
  min?: number;
  max?: number;
  first: React.ReactNode;
  second: React.ReactNode;
}

/** Minimal resizable two-pane split with a draggable divider. */
export function Split({
  direction,
  initial,
  min = 12,
  max = 88,
  first,
  second,
}: SplitProps) {
  const [pct, setPct] = useState(initial);
  const ref = useRef<HTMLDivElement>(null);
  const isH = direction === "horizontal";

  const onDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const move = (ev: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = isH
        ? ((ev.clientX - r.left) / r.width) * 100
        : ((ev.clientY - r.top) / r.height) * 100;
      setPct(Math.min(max, Math.max(min, p)));
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = isH ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const firstStyle: React.CSSProperties = isH
    ? { width: `${pct}%` }
    : { height: `${pct}%` };
  const handleStyle: React.CSSProperties = isH
    ? { width: 5, cursor: "col-resize" }
    : { height: 5, cursor: "row-resize" };

  return (
    <div
      ref={ref}
      style={{
        display: "flex",
        flexDirection: isH ? "row" : "column",
        height: "100%",
        width: "100%",
        minHeight: 0,
        minWidth: 0,
      }}
    >
      <div style={{ ...firstStyle, flexShrink: 0, minHeight: 0, minWidth: 0, overflow: "hidden" }}>
        {first}
      </div>
      <div
        className={isH ? "rh-col" : "rh-row"}
        style={{ ...handleStyle, flexShrink: 0 }}
        onMouseDown={onDown}
      />
      <div style={{ flex: 1, minHeight: 0, minWidth: 0, overflow: "hidden" }}>
        {second}
      </div>
    </div>
  );
}

export default Split;
