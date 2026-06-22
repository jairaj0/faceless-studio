import { useEditor } from "./store/editorStore";
import { emptyScene } from "./scene/emptyScene";

/** Save current project (.json). saveAs forces a new file dialog. */
export async function saveProject(saveAs = false): Promise<void> {
  const s = useEditor.getState();
  const json = JSON.stringify(s.scene);
  const path = saveAs ? undefined : (s.currentPath ?? undefined);
  const r = await window.api.saveProject(json, path);
  if (r && r.path) useEditor.getState().setCurrentPath(r.path);
}

export async function openProject(): Promise<void> {
  const r = await window.api.openProject();
  if (!r) return;
  try {
    const scene = JSON.parse(r.json);
    useEditor.getState().loadScene(scene);
    useEditor.getState().setCurrentPath(r.path);
  } catch (e) {
    console.error("Failed to open project:", e);
  }
}

export function newProject(): void {
  useEditor.getState().loadScene(emptyScene);
  useEditor.getState().setCurrentPath(null);
}
