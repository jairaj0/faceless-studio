import type { Scene } from "./types";

// A faceless demo scene — pure vector/text/SVG, resolution-independent.
// Mirrors the proven POC look, expressed in the scene model with keyframes.
export const sampleScene: Scene = {
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 4000,
  background: "#0b0f1a",
  layers: [
    // ── decorative blurred blobs (slow drift) ──
    {
      id: "blob1",
      name: "Blob Violet",
      type: "ellipse",
      width: 700,
      height: 700,
      fill: "#6d5efc",
      blur: 90,
      transform: {
        opacity: 0.55,
        x: [
          { t: 0, v: 1100, ease: "easeInOut" },
          { t: 4000, v: 1180 },
        ],
        y: [
          { t: 0, v: -120, ease: "easeInOut" },
          { t: 4000, v: -40 },
        ],
      },
    },
    {
      id: "blob2",
      name: "Blob Teal",
      type: "ellipse",
      width: 620,
      height: 620,
      fill: "#19c3a6",
      blur: 90,
      transform: {
        opacity: 0.5,
        x: [
          { t: 0, v: -120, ease: "easeInOut" },
          { t: 4000, v: -40 },
        ],
        y: 560,
      },
    },
    {
      id: "blob3",
      name: "Blob Pink",
      type: "ellipse",
      width: 520,
      height: 520,
      fill: "#ff5d8f",
      blur: 90,
      transform: { opacity: 0.45, x: 1300, y: 620 },
    },

    // ── title ──
    {
      id: "title",
      name: "Title",
      type: "text",
      text: "Quality has\nno limit.",
      fontSize: 150,
      fontWeight: 800,
      color: "#ffffff",
      letterSpacing: -4,
      lineHeight: 0.95,
      transform: {
        x: 140,
        y: [
          { t: 0, v: 440, ease: "easeOutCubic" },
          { t: 1200, v: 380 },
        ],
        opacity: [
          { t: 0, v: 0, ease: "easeOutCubic" },
          { t: 1200, v: 1 },
        ],
      },
    },

    // ── subtitle ──
    {
      id: "subtitle",
      name: "Subtitle",
      type: "text",
      text: "720p PC · rendered at 8K · zero pixelation",
      fontSize: 46,
      fontWeight: 500,
      color: "#9fb0c9",
      transform: {
        x: 146,
        y: [
          { t: 500, v: 640, ease: "easeOutCubic" },
          { t: 1700, v: 600 },
        ],
        opacity: [
          { t: 500, v: 0, ease: "easeOutCubic" },
          { t: 1700, v: 1 },
        ],
      },
    },

    // ── lower third (group: dot + label) ──
    {
      id: "lower",
      name: "Lower Third",
      type: "group",
      transform: {
        x: [
          { t: 1200, v: 106, ease: "easeOutCubic" },
          { t: 2200, v: 146 },
        ],
        opacity: [
          { t: 1200, v: 0, ease: "easeOutCubic" },
          { t: 2200, v: 1 },
        ],
      },
      children: [
        {
          id: "lower-dot",
          name: "Dot",
          type: "ellipse",
          width: 26,
          height: 26,
          fill: "#19c3a6",
          transform: { x: 0, y: 854 },
        },
        {
          id: "lower-text",
          name: "Label",
          type: "text",
          text: "Faceless Studio — web animation → video",
          fontSize: 34,
          fontWeight: 600,
          color: "#e6edf7",
          transform: { x: 48, y: 846 },
        },
      ],
    },

    // ── SVG badge (vector — proves sharpness) ──
    {
      id: "badge",
      name: "Badge",
      type: "svg",
      width: 180,
      height: 180,
      svg: `<svg width="180" height="180" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="none" stroke="#8b7bff" stroke-width="3"/>
        <path d="M35 52 l10 12 l22 -28" fill="none" stroke="#19c3a6" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      transform: {
        x: 1590,
        y: 150,
        anchorX: 0.5,
        anchorY: 0.5,
        scale: [
          { t: 1600, v: 0.4, ease: "easeOutBack" },
          { t: 2200, v: 1 },
        ],
        rotation: [
          { t: 1600, v: -30, ease: "easeOutBack" },
          { t: 2200, v: 0 },
        ],
        opacity: [
          { t: 1600, v: 0, ease: "easeOut" },
          { t: 2000, v: 1 },
        ],
      },
    },

    // ── progress bar (grows left→right) ──
    {
      id: "bar",
      name: "Progress",
      type: "rect",
      width: 1628,
      height: 6,
      fill: "#8b7bff",
      radius: 99,
      transform: {
        x: 146,
        y: 1000,
        anchorX: 0,
        anchorY: 0.5,
        scaleX: [
          { t: 0, v: 0, ease: "linear" },
          { t: 4000, v: 1 },
        ],
      },
    },
  ],
};
