import { useEditor } from "../../store/editor";

// Shared by the Media Bin buttons and the File-menu commands so there's one
// import path. Images can be multi-selected; audio is a single track.
export async function importImages(): Promise<void> {
  const items = await window.api.media.import("image");
  if (items?.length) useEditor.getState().addMedia(items);
}

export async function importAudio(): Promise<void> {
  const items = await window.api.media.import("audio");
  if (items?.[0]) useEditor.getState().setAudio(items[0]);
}
