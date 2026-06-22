# 🌟 North Star — Project Goals (authoritative)

> **One line:** Jo abhi tak nahi bana — ek faceless animation editor jahan **720p / low-end PC
> bhi 4K video edit AUR export kare, smooth + fast + high quality.** Quality limits todna hai,
> chahe sirf faceless (animation) mode me hi sahi.

---

## The Core Insight (kyun ye possible hai)

Animation ≠ Video footage.

- **Footage** = crore pixels/frame stored. 4K edit = har frame decode = heavy = low-end lag → **proxy chahiye**.
- **Animation** (SVG / text / shapes / GSAP) = **instructions** (a recipe), resolution-independent.
  - Edit: recipe ko 720p viewport pe draw → halka → **any PC smooth**
  - Export: **same recipe** ko 4K pe offline draw → GPU vectors rasterize → footage-decode se bahut halka
  - ➡️ **No proxy needed. 720p PC → 4K export possible.**

**Caveat:** raster assets (4K image / b-roll clip) animation me daalo to wo part heavy. Pure
vector/text/shape = zero proxy. Mixed = us asset ko optimize karna.

---

## Architecture — One app, two paths

| Path | Content | Proxy? | Engine (OpenReel) |
|---|---|---|---|
| **Faceless (HERO)** | SVG, text, shapes, GSAP animation | ❌ No (resolution-independent) | `animation/gsap-engine`, `composition-renderer`, `graphics` |
| **With-face** | Real video footage | ✅ Yes (footage only) | `video/video-engine` |

Proxy ka jhanjhat **sirf footage mode** me. Faceless me bilkul nahi.

---

## 4 Goals

1. **Resolution-independent faceless render** — 720p edit → 4K export, no proxy. *(THE breakthrough)*
2. **Shareable preview URL** — dusre PC ke browser me editing dekhe. Video stream nahi —
   project data bhejo, viewer ka browser khud render kare (same engine). LAN first, remote later.
3. **Fast + smooth + high quality** video output (core).
4. **Premade faceless templates** (listicle, quote, explainer, news-style) — fully editable/custom.

---

## Honest reality check
- "Low-end + 4K **footage editing** smooth" = sirf proxy se (with-face path).
- "Low-end + 4K **animation editing+export** smooth" = **native possible, no proxy** (faceless path). ← humara focus.
- Export offline hai (real-time nahi), isliye weak GPU bhi 4K kar lega — bas time zyada.
