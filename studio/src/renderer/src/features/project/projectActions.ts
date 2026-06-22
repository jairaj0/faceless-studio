import { useApp } from "../../store";
import { serializeEditor, hydrateEditor } from "./serialize";

function baseName(path: string): string {
  return (path.split("/").pop() ?? "Untitled").replace(/\.(fstudio\.)?json$/i, "");
}

export function newProject(): void {
  useApp.getState().newProject();
}

export async function saveProject(saveAs = false): Promise<void> {
  const s = useApp.getState();
  const file = {
    app: "faceless-studio",
    version: 2,
    name: s.projectName,
    view: s.view,
    doc: s.doc,
    editor: serializeEditor(), // the timeline / media / comp
  };
  const json = JSON.stringify(file, null, 2);
  const path = saveAs ? undefined : (s.currentPath ?? undefined);
  const r = await window.api.project.save(json, path);
  if (r && r.path) useApp.getState().setSaved(r.path, baseName(r.path));
}

export async function openProject(): Promise<void> {
  const r = await window.api.project.open();
  if (!r) return;
  try {
    const f = JSON.parse(r.json);
    useApp.getState().loadProject({ name: f.name, view: f.view, doc: f.doc });
    useApp.getState().setSaved(r.path, f.name ?? baseName(r.path));
    if (f.editor) await hydrateEditor(f.editor);
  } catch (e) {
    console.error("Failed to open project:", e);
  }
}
