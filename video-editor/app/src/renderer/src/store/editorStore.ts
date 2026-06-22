import { create } from "zustand";
import type { EasingName, Keyframe, Layer, Scene, SceneAudio } from "../scene/types";
import { evalProp } from "../scene/animate";
import { emptyScene } from "../scene/emptyScene";

export type TransformKey =
  | "x"
  | "y"
  | "scale"
  | "scaleX"
  | "scaleY"
  | "rotation"
  | "opacity";

export const TF_DEFAULT: Record<TransformKey, number> = {
  x: 0,
  y: 0,
  scale: 1,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  opacity: 1,
};

let idCounter = 0;
const newId = (p: string) => `${p}-${Date.now().toString(36)}-${idCounter++}`;

function findLayer(layers: Layer[], id: string): Layer | null {
  for (const l of layers) {
    if (l.id === id) return l;
    if (l.type === "group") {
      const f = findLayer(l.children, id);
      if (f) return f;
    }
  }
  return null;
}

/** Offset a layer's x/y by d (for paste/duplicate). Handles static + keyframed. */
function offsetXY(l: Layer, d: number): void {
  l.transform = l.transform ?? {};
  for (const k of ["x", "y"] as const) {
    const v = l.transform[k];
    if (typeof v === "number") l.transform[k] = v + d;
    else if (Array.isArray(v)) v.forEach((kf) => (kf.v += d));
    else l.transform[k] = d;
  }
}

interface EditorState {
  scene: Scene;
  selectedId: string | null;
  time: number;
  playing: boolean;
  past: Scene[];
  future: Scene[];

  selectedKeyframe: { layerId: string; key: TransformKey; t: number } | null;
  selectedIds: string[];
  clipboard: Layer[];
  currentPath: string | null;

  setCurrentPath: (path: string | null) => void;
  loadScene: (scene: Scene) => void;
  setSceneSize: (w: number, h: number) => void;
  setTime: (t: number) => void;
  setPlaying: (p: boolean) => void;
  select: (id: string | null) => void;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  copySelected: () => void;
  paste: () => void;
  duplicateSelected: () => void;
  removeSelected: () => void;
  selectKeyframe: (
    sel: { layerId: string; key: TransformKey; t: number } | null,
  ) => void;
  setKeyframeTime: (
    layerId: string,
    key: TransformKey,
    index: number,
    t: number,
  ) => void;
  sortKeyframes: (layerId: string, key: TransformKey) => void;

  /** clip editing */
  splitLayer: (id: string, t: number) => void;
  moveLayerTime: (id: string, deltaMs: number) => void;
  setLayerBound: (id: string, which: "start" | "end", valueMs: number) => void;

  pushHistory: () => void;
  /** live mutation (no history) — caller pushHistory() at gesture start */
  applyTransform: (id: string, key: TransformKey, value: number) => void;
  setLayerField: (id: string, patch: Partial<Layer>) => void;

  /** history-committing actions */
  toggleKeyframe: (id: string, key: TransformKey) => void;
  setKeyframeEasing: (
    layerId: string,
    key: TransformKey,
    t: number,
    ease: EasingName,
  ) => void;
  applyPreset: (layerId: string, presetId: string) => void;
  addLayer: (type: "text" | "rect" | "ellipse") => void;
  addSvgLayer: (svg: string) => void;
  addCodeLayer: (lang: "html" | "react", code: string) => void;
  addImageLayer: (src: string, width: number, height: number, name: string) => void;
  setAudio: (audio: SceneAudio | undefined) => void;
  removeLayer: (id: string) => void;

  undo: () => void;
  redo: () => void;
}

export const useEditor = create<EditorState>((set, get) => {
  const live = (fn: (scene: Scene) => void) =>
    set((s) => {
      const next = structuredClone(s.scene);
      fn(next);
      return { scene: next };
    });

  const commit = (fn: (scene: Scene) => void) =>
    set((s) => {
      const next = structuredClone(s.scene);
      fn(next);
      return {
        scene: next,
        past: [...s.past, s.scene].slice(-60),
        future: [],
      };
    });

  return {
    scene: structuredClone(emptyScene),
    selectedId: null,
    selectedKeyframe: null,
    selectedIds: [],
    clipboard: [],
    currentPath: null,
    time: 0,
    playing: false,
    past: [],
    future: [],

    setCurrentPath: (path) => set({ currentPath: path }),
    loadScene: (scene) =>
      set({
        scene: structuredClone(scene),
        selectedId: null,
        selectedIds: [],
        selectedKeyframe: null,
        time: 0,
        playing: false,
        past: [],
        future: [],
      }),
    setSceneSize: (w, h) =>
      commit((scene) => {
        scene.width = w;
        scene.height = h;
      }),
    setTime: (t) => set({ time: Math.max(0, t) }),
    setPlaying: (p) => set({ playing: p }),
    select: (id) =>
      set({ selectedId: id, selectedIds: id ? [id] : [], selectedKeyframe: null }),
    toggleSelect: (id) =>
      set((s) => {
        const has = s.selectedIds.includes(id);
        const ids = has ? s.selectedIds.filter((x) => x !== id) : [...s.selectedIds, id];
        return { selectedIds: ids, selectedId: ids[ids.length - 1] ?? null, selectedKeyframe: null };
      }),
    selectAll: () =>
      set((s) => {
        const ids = s.scene.layers.map((l) => l.id);
        return { selectedIds: ids, selectedId: ids[ids.length - 1] ?? null };
      }),
    copySelected: () =>
      set((s) => {
        const layers = s.selectedIds
          .map((id) => findLayer(s.scene.layers, id))
          .filter(Boolean) as Layer[];
        return { clipboard: structuredClone(layers) };
      }),
    paste: () => {
      const cb = get().clipboard;
      if (!cb.length) return;
      const newIds: string[] = [];
      commit((scene) => {
        for (const l of cb) {
          const c = structuredClone(l);
          c.id = newId(c.type);
          offsetXY(c, 40);
          scene.layers.push(c);
          newIds.push(c.id);
        }
      });
      set({ selectedIds: newIds, selectedId: newIds[newIds.length - 1] ?? null });
    },
    duplicateSelected: () => {
      const s = get();
      const layers = s.selectedIds
        .map((id) => findLayer(s.scene.layers, id))
        .filter(Boolean) as Layer[];
      if (!layers.length) return;
      const newIds: string[] = [];
      commit((scene) => {
        for (const l of layers) {
          const c = structuredClone(l);
          c.id = newId(c.type);
          c.name = `${l.name} copy`;
          offsetXY(c, 40);
          scene.layers.push(c);
          newIds.push(c.id);
        }
      });
      set({ selectedIds: newIds, selectedId: newIds[newIds.length - 1] ?? null });
    },
    removeSelected: () => {
      const ids = get().selectedIds;
      if (!ids.length) return;
      commit((scene) => {
        scene.layers = scene.layers.filter((l) => !ids.includes(l.id));
      });
      set({ selectedId: null, selectedIds: [] });
    },
    selectKeyframe: (sel) => set({ selectedKeyframe: sel }),

    setKeyframeTime: (layerId, key, index, t) =>
      live((scene) => {
        const l = findLayer(scene.layers, layerId);
        const arr = l?.transform?.[key];
        if (Array.isArray(arr) && arr[index]) arr[index].t = Math.max(0, t);
      }),

    sortKeyframes: (layerId, key) =>
      live((scene) => {
        const l = findLayer(scene.layers, layerId);
        const arr = l?.transform?.[key];
        if (Array.isArray(arr)) arr.sort((a, b) => a.t - b.t);
      }),

    splitLayer: (id, t) =>
      commit((scene) => {
        const idx = scene.layers.findIndex((l) => l.id === id);
        if (idx < 0) return;
        const l = scene.layers[idx];
        const start = l.start ?? 0;
        const end = l.end ?? scene.duration;
        if (t <= start + 10 || t >= end - 10) return;
        const clone = structuredClone(l);
        clone.id = newId(l.type);
        clone.name = `${l.name} (2)`;
        clone.start = t;
        l.end = t;
        scene.layers.splice(idx + 1, 0, clone);
      }),

    moveLayerTime: (id, delta) =>
      live((scene) => {
        const l = findLayer(scene.layers, id);
        if (!l) return;
        const dur = scene.duration;
        l.start = Math.max(0, (l.start ?? 0) + delta);
        l.end = Math.min(dur, (l.end ?? dur) + delta);
        if (l.transform) {
          for (const v of Object.values(l.transform)) {
            if (Array.isArray(v)) for (const kf of v) kf.t = Math.max(0, kf.t + delta);
          }
        }
        if (l.type === "text" && Array.isArray(l.reveal)) {
          for (const kf of l.reveal) kf.t = Math.max(0, kf.t + delta);
        }
      }),

    setLayerBound: (id, which, value) =>
      live((scene) => {
        const l = findLayer(scene.layers, id);
        if (!l) return;
        const dur = scene.duration;
        const start = l.start ?? 0;
        const end = l.end ?? dur;
        if (which === "start") l.start = Math.max(0, Math.min(value, end - 50));
        else l.end = Math.min(dur, Math.max(value, start + 50));
      }),

    pushHistory: () =>
      set((s) => ({ past: [...s.past, s.scene].slice(-60), future: [] })),

    applyTransform: (id, key, value) =>
      live((scene) => {
        const l = findLayer(scene.layers, id);
        if (!l) return;
        l.transform = l.transform ?? {};
        const cur = l.transform[key];
        if (Array.isArray(cur)) {
          const t = get().time;
          const kf = cur.find((k) => Math.abs(k.t - t) < 1);
          if (kf) kf.v = value;
          else {
            cur.push({ t, v: value, ease: "easeOut" });
            cur.sort((a, b) => a.t - b.t);
          }
        } else {
          l.transform[key] = value;
        }
      }),

    setLayerField: (id, patch) =>
      live((scene) => {
        const l = findLayer(scene.layers, id);
        if (l) Object.assign(l, patch);
      }),

    toggleKeyframe: (id, key) =>
      commit((scene) => {
        const l = findLayer(scene.layers, id);
        if (!l) return;
        l.transform = l.transform ?? {};
        const cur = l.transform[key];
        const t = get().time;
        if (Array.isArray(cur)) {
          l.transform[key] = evalProp(cur, t, TF_DEFAULT[key]);
        } else {
          const v = typeof cur === "number" ? cur : TF_DEFAULT[key];
          l.transform[key] = [{ t, v, ease: "easeOut" }];
        }
      }),

    setKeyframeEasing: (layerId, key, t, ease) =>
      commit((scene) => {
        const l = findLayer(scene.layers, layerId);
        const arr = l?.transform?.[key];
        if (Array.isArray(arr)) {
          const kf = arr.find((k) => Math.abs(k.t - t) < 1);
          if (kf) kf.ease = ease;
        }
      }),

    applyPreset: (layerId, presetId) =>
      commit((scene) => {
        const l = findLayer(scene.layers, layerId);
        if (!l) return;
        l.transform = l.transform ?? {};
        const tf = l.transform;
        const t0 = get().time;
        const D = 800;
        const baseX = evalProp(tf.x, t0, 0);
        const baseY = evalProp(tf.y, t0, 0);
        const kf = (a: number, b: number, ease: EasingName = "easeOut"): Keyframe[] => [
          { t: t0, v: a, ease },
          { t: t0 + D, v: b },
        ];
        switch (presetId) {
          case "fadeIn":
            tf.opacity = kf(0, 1);
            break;
          case "fadeOut":
            tf.opacity = kf(1, 0);
            break;
          case "slideLeft":
            tf.x = kf(baseX - 250, baseX, "easeOutCubic");
            tf.opacity = kf(0, 1);
            break;
          case "slideRight":
            tf.x = kf(baseX + 250, baseX, "easeOutCubic");
            tf.opacity = kf(0, 1);
            break;
          case "slideUp":
            tf.y = kf(baseY + 150, baseY, "easeOutCubic");
            tf.opacity = kf(0, 1);
            break;
          case "pop":
            tf.scale = kf(0.2, 1, "easeOutBack");
            tf.opacity = kf(0, 1);
            break;
          case "spin":
            tf.rotation = [
              { t: t0, v: 0, ease: "linear" },
              { t: t0 + 1200, v: 360 },
            ];
            break;
          case "typewriter":
            if (l.type === "text") {
              const len = Math.max(1, l.text.length);
              l.reveal = [
                { t: t0, v: 0, ease: "linear" },
                { t: t0 + len * 45, v: 1 },
              ];
            }
            break;
        }
      }),

    addLayer: (type) => {
      const id = newId(type);
      commit((scene) => {
        const cx = scene.width / 2;
        const cy = scene.height / 2;
        let layer: Layer;
        if (type === "text") {
          layer = {
            id,
            name: "Text",
            type: "text",
            text: "New text",
            fontSize: 96,
            fontWeight: 700,
            color: "#ffffff",
            transform: { x: cx - 200, y: cy - 50 },
          };
        } else if (type === "rect") {
          layer = {
            id,
            name: "Rectangle",
            type: "rect",
            width: 400,
            height: 240,
            fill: "#8b7bff",
            radius: 16,
            transform: { x: cx - 200, y: cy - 120 },
          };
        } else {
          layer = {
            id,
            name: "Ellipse",
            type: "ellipse",
            width: 300,
            height: 300,
            fill: "#19c3a6",
            transform: { x: cx - 150, y: cy - 150 },
          };
        }
        scene.layers.push(layer);
      });
      set({ selectedId: id });
    },

    addSvgLayer: (svg) => {
      const id = newId("svg");
      commit((scene) => {
        scene.layers.push({
          id,
          name: "SVG",
          type: "svg",
          svg,
          width: 300,
          height: 300,
          transform: { x: scene.width / 2 - 150, y: scene.height / 2 - 150 },
        });
      });
      set({ selectedId: id });
    },

    addCodeLayer: (lang, code) => {
      const id = newId("code");
      commit((scene) => {
        scene.layers.unshift({
          id,
          name: lang === "react" ? "React Component" : "HTML Code",
          type: "code",
          lang,
          code,
          width: scene.width,
          height: scene.height,
          transform: { x: 0, y: 0 },
        });
      });
      set({ selectedId: id });
    },

    addImageLayer: (src, width, height, name) => {
      const id = newId("img");
      commit((scene) => {
        scene.layers.push({
          id,
          name,
          type: "image",
          src,
          width,
          height,
          transform: {
            x: scene.width / 2 - width / 2,
            y: scene.height / 2 - height / 2,
          },
        });
      });
      set({ selectedId: id });
    },

    setAudio: (audio) =>
      commit((scene) => {
        scene.audio = audio;
      }),

    removeLayer: (id) =>
      commit((scene) => {
        scene.layers = scene.layers.filter((l) => l.id !== id);
      }),

    undo: () =>
      set((s) => {
        if (!s.past.length) return s;
        const prev = s.past[s.past.length - 1];
        return {
          scene: prev,
          past: s.past.slice(0, -1),
          future: [s.scene, ...s.future].slice(0, 60),
        };
      }),

    redo: () =>
      set((s) => {
        if (!s.future.length) return s;
        const next = s.future[0];
        return {
          scene: next,
          past: [...s.past, s.scene].slice(-60),
          future: s.future.slice(1),
        };
      }),
  };
});

/** helper: current evaluated value of a transform prop at the playhead */
export function evalTransform(layer: Layer, key: TransformKey, time: number): number {
  return evalProp(layer.transform?.[key], time, TF_DEFAULT[key]);
}

export { findLayer };
