import {
  useEditor,
  DEFAULT_TRANSFORM,
  type Clip,
  type Composition,
  type MediaItem,
} from "../../store/editor";
import type { MediaKind } from "../../../../shared/media";

// What goes into the saved .json. Media is referenced by absolute path (not the
// bytes) — on open we re-read each file from disk and rebuild a blob URL. Clips
// keep their mediaId so references survive a round-trip.
interface SerializedMedia {
  id: string;
  kind: MediaKind;
  name: string;
  path: string;
  duration?: number;
}

export interface ProjectEditor {
  comp: Composition;
  media: SerializedMedia[];
  clips: Clip[];
  audio: SerializedMedia | null;
}

const strip = (m: MediaItem): SerializedMedia => ({
  id: m.id,
  kind: m.kind,
  name: m.name,
  path: m.path,
  duration: m.duration,
});

export function serializeEditor(): ProjectEditor {
  const s = useEditor.getState();
  return {
    comp: s.comp,
    media: s.media.map(strip),
    clips: s.clips,
    audio: s.audio ? strip(s.audio) : null,
  };
}

async function loadSrc(path: string): Promise<string> {
  const bytes = await window.api.media.bytes(path);
  return URL.createObjectURL(new Blob([bytes as BlobPart]));
}

// Fill in fields that older saves may not have, so clips stay valid.
const migrateClip = (c: Clip): Clip => ({
  ...c,
  trimStart: c.trimStart ?? 0,
  fit: c.fit ?? "contain",
  transform: c.transform ?? { ...DEFAULT_TRANSFORM },
});

export async function hydrateEditor(d: ProjectEditor): Promise<void> {
  const media: MediaItem[] = [];
  for (const sm of d.media ?? []) {
    if (!sm.path) continue; // can't rebuild without a source file
    media.push({ ...sm, src: await loadSrc(sm.path), isBlob: true });
  }
  let audio: MediaItem | null = null;
  if (d.audio?.path) {
    audio = { ...d.audio, src: await loadSrc(d.audio.path), isBlob: true };
  }
  const ids = new Set(media.map((m) => m.id));

  const st = useEditor.getState();
  st.reset(); // revoke any existing blob URLs
  st.replaceAll({
    comp: d.comp,
    media,
    clips: (d.clips ?? []).map(migrateClip).filter((c) => ids.has(c.mediaId)),
    audio,
    playhead: 0,
    playing: false,
    selectedClipId: null,
  });
}
