import { create } from "zustand";
import { useEditor } from "./editor";

export type AppView = "edit" | "export";

/** Placeholder document — future milestones fill `scene`. */
export interface ProjectDoc {
  version: number;
  scene: unknown;
}

const emptyDoc = (): ProjectDoc => ({ version: 1, scene: null });

interface AppState {
  view: AppView;
  projectName: string;
  currentPath: string | null;
  doc: ProjectDoc;
  dirty: boolean; // unsaved edits since the last Save/Open/New (drives autosave)

  setView: (v: AppView) => void;
  newProject: () => void;
  loadProject: (p: { name?: string; view?: AppView; doc?: ProjectDoc }) => void;
  setSaved: (path: string, name?: string) => void;
  markDirty: () => void;
}

export const useApp = create<AppState>((set) => ({
  view: "edit",
  projectName: "Untitled",
  currentPath: null,
  doc: emptyDoc(),
  dirty: false,

  setView: (v) => set({ view: v }),
  newProject: () => {
    useEditor.getState().reset();
    set({ projectName: "Untitled", currentPath: null, doc: emptyDoc(), view: "edit", dirty: false });
  },
  loadProject: (p) =>
    set({
      projectName: p.name ?? "Untitled",
      view: p.view ?? "edit",
      doc: p.doc ?? emptyDoc(),
      dirty: false,
    }),
  setSaved: (path, name) =>
    set((s) => ({ currentPath: path, projectName: name ?? s.projectName, dirty: false })),
  markDirty: () => set((s) => (s.dirty ? s : { dirty: true })),
}));
