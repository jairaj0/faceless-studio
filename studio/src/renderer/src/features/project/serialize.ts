import {
  useEditor,
  DEFAULT_TRANSFORM,
  DEFAULT_MIX,
  type AudioMix,
  type Clip,
  type Composition,
  type MediaItem,
  type Track,
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
  tracks?: Track[]; // v3: multi-track
  clips?: Clip[]; // v2: single track (migrated on open)
  audio: SerializedMedia | null;
  audioMix?: AudioMix;
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
    tracks: s.tracks,
    audio: s.audio ? strip(s.audio) : null,
    audioMix: s.audioMix,
  };
}

async function loadSrc(path: string): Promise<string> {
  const bytes = await window.api.media.bytes(path);
  return URL.createObjectURL(new Blob([bytes as BlobPart]));
}

// Fill in fields that older saves may not have, so clips stay valid.
const migrateClip = (c: Clip): Clip => ({
  ...c,
  type: c.type ?? "media",
  trimStart: c.trimStart ?? 0,
  fit: c.fit ?? "contain",
  transform: c.transform ?? { ...DEFAULT_TRANSFORM },
});

const newId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

// Build the track list from either v3 (tracks) or v2 (single gapless clips).
function migrateTracks(d: ProjectEditor, ids: Set<string>): Track[] {
  // Media clips need their source; text/background/code layers are self-contained.
  const keep = (c: Clip): boolean => c.type !== "media" || ids.has(c.mediaId);
  if (d.tracks?.length) {
    return d.tracks.map((t) => ({
      id: t.id ?? newId(),
      name: t.name ?? "V1",
      kind: "video",
      hidden: !!t.hidden,
      locked: !!t.locked,
      solo: !!t.solo,
      clips: (t.clips ?? []).map(migrateClip).filter(keep),
    }));
  }
  // v2: wrap the old single gapless track, recomputing absolute starts.
  let t = 0;
  const clips = (d.clips ?? []).map(migrateClip).filter(keep).map((c) => {
    const start = t;
    t += c.duration;
    return { ...c, start };
  });
  return [{ id: newId(), name: "V1", kind: "video", hidden: false, locked: false, solo: false, clips }];
}

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
    tracks: migrateTracks(d, ids),
    audio,
    audioMix: { ...DEFAULT_MIX, ...(d.audioMix ?? {}) },
    playhead: 0,
    playing: false,
    selectedClipId: null,
  });
}
