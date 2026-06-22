# Tools, Libraries & References — Curated (gathered from web + GitHub)

> Sab research-backed. Har item ke saath **kyun** + link. UI/UX aur coding-quality dono cover.

---

## 0. Reference Projects (inse seekhna / inko padhna)

| Project | Stack | Kya seekhna | Link |
|---|---|---|---|
| **OpenReel Video** ⭐ | React+TS, Zustand, **WebCodecs+WebGPU**, Web Audio, IndexedDB, action-based undo | Humara EXACT stack. 4K editing, multi-track, color grading. Code padhna must. | github.com/Augani/openreel-video |
| **designcombo/react-video-editor** | React + Remotion | CapCut/Canva clone UI, timeline UX | github.com/designcombo/react-video-editor |
| **Twick** | React SDK, canvas timeline, MP4 export | Timeline + drag-drop + serverless export patterns | github.com/ncounterspecialist/twick |
| **Remotion** | React → video (programmatic) | Deterministic frame rendering ka concept | remotion.dev |
| **ScreenArc** | React+TS, FFmpeg, **Electron** | Electron + ffmpeg desktop packaging | (github) |
| **xzdarcy/react-timeline-editor** | React component | Lightweight timeline animation editor base | github.com/xzdarcy/react-timeline-editor |
| **Mp4Maker** | mp4-muxer + WebCodecs | Frame-by-frame MP4 encode reference code | github.com/tlecoz/Mp4Maker |

**Key validation:** OpenReel exactly humare jaisa stack use karta hai aur 4K @ 60fps deta hai → humara plan sahi hai. ✅

---

## 1. App Shell & Build

| Tool | Kaam | Kyun |
|---|---|---|
| **electron-vite** | Electron + Vite build tooling | Fast HMR, `src/main` `src/preload` `src/renderer` clean structure |
| **electron-builder** | Packaging (.dmg/.exe) | Mac + Windows installers |
| **ffmpeg-static** | Bundled ffmpeg binary | Native encode/mux. Build me **`external`** mark karna (asar issue) |
| `child_process.spawn` | ffmpeg run | `spawn` (not exec) → streaming progress milti hai |

**IPC pattern:** preload me `contextBridge` se safe `window.api` expose karo (renderer → main).

---

## 2. UI / UX (Premiere Pro look + accessibility)

| Tool | Kaam | Kyun |
|---|---|---|
| **Dockview** ⭐ | Dockable/draggable/resizable panels | Zero-dep, 98k weekly downloads, IDE-jaisa. Premiere panels ke liye best. Floating + popout windows bhi. |
| **Tailwind CSS** | Styling | Fast, consistent dark pro theme |
| **Radix UI** | Accessible primitives (menu, slider, dialog, dropdown) | Keyboard-nav + a11y built-in → UX perfection |
| **lucide-react** | Icons | Clean, consistent icon set (tools, buttons) |
| **dnd-kit** | Drag-drop (clips, media bin, layers) | Modern, accessible, performant |
| **interact.js** | Resize/trim handles on timeline clips | Drag edges to trim, snapping |
| **react-resizable-panels** | Splitter panes (agar Dockview se light chahiye) | Alternative for simple splits |

**Docking comparison (research):** Dockview > flexlayout-react > rc-dock (downloads + features). **Dockview lock.**

---

## 3. Animation & Rendering Engine

| Tool | Kaam | Kyun |
|---|---|---|
| **GSAP** ⭐ | Master timeline, tweens, `seek()` | Deterministic seek → offline render ke liye perfect |
| **Pixi.js v8** ⭐ | WebGL/WebGPU 2D renderer | GPU 4K, sprites/graphics/text. 2D motion graphics ke liye Three se behtar |
| **Three.js** | 3D transforms (optional, later) | Agar 3D layer/camera chahiye (OpenReel bhi use karta) |
| **opentype.js** | Font metrics, text-on-path | Precise text rendering/animation |
| **canvg** | SVG → canvas raster | Per-frame SVG render fallback |

---

## 4. Video Export Pipeline (CORE — sabse important)

| Tool | Kaam | Kyun |
|---|---|---|
| **WebCodecs `VideoEncoder`** ⭐ | GPU H.264/H.265 encode | **10x faster than realtime**, hardware accelerated |
| **mp4-muxer** ⭐ | Raw H.264 chunks → playable .mp4 | WebCodecs sirf NAL units deta; ye container banata |
| **webm-muxer** | WebM output | VP9/AV1 ke liye (same author) |
| **MediaBunny** | All-in-one media read/write (TS) | OpenReel use karta; mux/demux ka modern option |
| **native ffmpeg** | Audio mux, format convert, presets | Breadth ke liye (ProRes, platform presets) |

**⚠️ Critical gotcha (research se):** frame capture se pehle `requestAnimationFrame` await karna ZAROORI hai —
warna GPU compositing complete nahi hoti aur **blank/duplicate frames** aate hain.

**Pipeline:** `GSAP.seek(t)` → Pixi render @4K → `await raf()` → `new VideoFrame(canvas)` →
`encoder.encode()` → mp4-muxer → ffmpeg audio mux → final .mp4

---

## 5. State, Storage, Undo/Redo

| Tool | Kaam | Kyun |
|---|---|---|
| **Zustand** ⭐ | Global state | Lightweight (OpenReel bhi use karta) |
| **immer** | Immutable updates | Easy undo/redo snapshots |
| **Action/command pattern** | Undoable edits | OpenReel ka "action-based editing" model — har edit reversible |
| **Dexie.js** (IndexedDB) | Project persistence + autosave | Large project data local store; media blobs cache |

---

## 6. Coding Quality / Perfection

| Tool | Kaam |
|---|---|
| **TypeScript (strict mode)** | Type safety, `strict: true`, `noUncheckedIndexedAccess` |
| **Biome** (ya ESLint + Prettier) | Lint + format (Biome = fast all-in-one) |
| **Vitest** | Unit tests (timeline math, keyframe interpolation) |
| **Playwright** | E2E (UI flows, export pipeline) |
| **Husky + lint-staged** | Pre-commit checks → clean commits |

---

## 7. Decisions locked from research

- **Panels:** Dockview ✅
- **Encode:** WebCodecs + mp4-muxer (primary), native ffmpeg (mux/convert/presets) ✅
- **Render:** Pixi.js v8 (2D), Three.js sirf 3D needs pe (later) ✅
- **State/undo:** Zustand + immer + action pattern ✅
- **Storage:** Dexie/IndexedDB autosave ✅
- **UI kit:** Tailwind + Radix + lucide-react ✅
- **Quality:** TS strict + Biome + Vitest + Playwright ✅

---

## Sources
- IMG.LY — Open Source Video Editor SDKs 2025 roundup
- github.com/Augani/openreel-video
- github.com/designcombo/react-video-editor · github.com/ncounterspecialist/twick
- github.com/xzdarcy/react-timeline-editor · github.com/tlecoz/Mp4Maker
- dockview.dev · npmtrends (dockview vs flexlayout vs rc-dock)
- electron-vite.org · blog.modfy.video (Electron + FFmpeg)
- devtails.xyz (canvas → mp4 WebCodecs) · freecodecamp WebCodecs Handbook
- pinepaper.studio (browser-native MP4 export)
