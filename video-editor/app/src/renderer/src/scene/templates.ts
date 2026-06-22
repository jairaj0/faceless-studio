import type { Scene } from "./types";

export interface Template {
  id: string;
  name: string;
  description: string;
  previewTime: number; // ms — frame to show as thumbnail
  scene: Scene;
}

const fadeUp = (t0: number, fromY: number, toY: number) => ({
  y: [
    { t: t0, v: fromY, ease: "easeOutCubic" as const },
    { t: t0 + 700, v: toY },
  ],
  opacity: [
    { t: t0, v: 0, ease: "easeOut" as const },
    { t: t0 + 700, v: 1 },
  ],
});

export const TEMPLATES: Template[] = [
  {
    id: "blank",
    name: "Blank",
    description: "Empty 1080p canvas",
    previewTime: 0,
    scene: { width: 1920, height: 1080, fps: 30, duration: 5000, background: "#0b0f1a", layers: [] },
  },
  {
    id: "big-title",
    name: "Big Title",
    description: "Bold title + subtitle intro",
    previewTime: 1500,
    scene: {
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 5000,
      background: "#0b0f1a",
      layers: [
        {
          id: "t1",
          name: "Title",
          type: "text",
          text: "YOUR BIG\nIDEA HERE",
          fontSize: 160,
          fontWeight: 800,
          color: "#ffffff",
          letterSpacing: -4,
          lineHeight: 0.95,
          transform: { x: 160, ...fadeUp(0, 420, 360) },
        },
        {
          id: "t2",
          name: "Subtitle",
          type: "text",
          text: "a short supporting line goes here",
          fontSize: 48,
          fontWeight: 500,
          color: "#9fb0c9",
          transform: { x: 166, ...fadeUp(500, 640, 600) },
        },
        {
          id: "bar",
          name: "Accent Bar",
          type: "rect",
          width: 220,
          height: 10,
          fill: "#8b7bff",
          radius: 99,
          transform: {
            x: 166,
            y: 330,
            anchorX: 0,
            scaleX: [
              { t: 0, v: 0, ease: "easeOutCubic" },
              { t: 800, v: 1 },
            ],
          },
        },
      ],
    },
  },
  {
    id: "quote",
    name: "Quote",
    description: "Centered quote + author",
    previewTime: 1800,
    scene: {
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 5000,
      background: "#15121f",
      layers: [
        {
          id: "q",
          name: "Quote",
          type: "text",
          text: "“The best way to predict\nthe future is to create it.”",
          fontSize: 84,
          fontWeight: 700,
          color: "#f3eaff",
          lineHeight: 1.15,
          align: "center",
          width: 1400,
          transform: { x: 260, ...fadeUp(200, 460, 420) },
        },
        {
          id: "a",
          name: "Author",
          type: "text",
          text: "— Author Name",
          fontSize: 40,
          fontWeight: 500,
          color: "#a78bff",
          align: "center",
          width: 1400,
          transform: { x: 260, ...fadeUp(900, 760, 720) },
        },
      ],
    },
  },
  {
    id: "lower-third",
    name: "Lower Third",
    description: "Name + role badge",
    previewTime: 1500,
    scene: {
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 5000,
      background: "#0b0f1a",
      layers: [
        {
          id: "lt-bar",
          name: "Bar",
          type: "rect",
          width: 620,
          height: 130,
          fill: "#8b7bff",
          radius: 12,
          transform: {
            x: 140,
            y: 820,
            anchorX: 0,
            scaleX: [
              { t: 200, v: 0, ease: "easeOutCubic" },
              { t: 900, v: 1 },
            ],
          },
        },
        {
          id: "lt-name",
          name: "Name",
          type: "text",
          text: "Jane Doe",
          fontSize: 56,
          fontWeight: 800,
          color: "#ffffff",
          transform: { x: 170, ...fadeUp(600, 850, 832) },
        },
        {
          id: "lt-role",
          name: "Role",
          type: "text",
          text: "Founder & CEO",
          fontSize: 32,
          fontWeight: 500,
          color: "#e9e4ff",
          transform: { x: 172, ...fadeUp(800, 912, 900) },
        },
      ],
    },
  },
];
