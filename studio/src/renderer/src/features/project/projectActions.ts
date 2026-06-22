import { useApp } from "../../store";
import { serializeEditor, hydrateEditor } from "./serialize";

function baseName(path: string): string {
  return (path.split("/").pop() ?? "Untitled").replace(/\.(fstudio\.)?json$/i, "");
}

// The on-disk project shape, reused by Save and by autosave/recovery.
export function buildProjectFile(): unknown {
  const s = useApp.getState();
  return {
    app: "faceless-studio",
    version: 2,
    name: s.projectName,
    view: s.view,
    doc: s.doc,
    editor: serializeEditor(), // the timeline / media / comp
  };
}

export function newProject(): void {
  useApp.getState().newProject();
}

export async function saveProject(saveAs = false): Promise<void> {
  const s = useApp.getState();
  const json = JSON.stringify(buildProjectFile(), null, 2);
  const path = saveAs ? undefined : (s.currentPath ?? undefined);
  const r = await window.api.project.save(json, path);
  if (r && r.path) useApp.getState().setSaved(r.path, baseName(r.path));
  // A successful save supersedes any crash-recovery snapshot.
  void window.api.recovery?.clear();
}

// Load a project object (from Open or from recovery) into the stores.
export async function loadProjectFile(f: {
  name?: string;
  view?: "edit" | "export";
  doc?: { version: number; scene: unknown };
  editor?: Parameters<typeof hydrateEditor>[0];
}): Promise<void> {
  useApp.getState().loadProject({ name: f.name, view: f.view, doc: f.doc });
  if (f.editor) await hydrateEditor(f.editor);
}

export async function openProject(): Promise<void> {
  const r = await window.api.project.open();
  if (!r) return;
  try {
    const f = JSON.parse(r.json);
    await loadProjectFile(f);
    useApp.getState().setSaved(r.path, f.name ?? baseName(r.path));
    void window.api.recovery?.clear();
  } catch (e) {
    console.error("Failed to open project:", e);
  }
}
