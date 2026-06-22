import { create } from "zustand";

export type AppView = "edit" | "import" | "export";

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

  setView: (v: AppView) => void;
  newProject: () => void;
  loadProject: (p: { name?: string; view?: AppView; doc?: ProjectDoc }) => void;
  setSaved: (path: string, name?: string) => void;
}

export const useApp = create<AppState>((set) => ({
  view: "edit",
  projectName: "Untitled",
  currentPath: null,
  doc: emptyDoc(),

  setView: (v) => set({ view: v }),
  newProject: () =>
    set({ projectName: "Untitled", currentPath: null, doc: emptyDoc(), view: "edit" }),
  loadProject: (p) =>
    set({
      projectName: p.name ?? "Untitled",
      view: p.view ?? "edit",
      doc: p.doc ?? emptyDoc(),
    }),
  setSaved: (path, name) =>
    set((s) => ({ currentPath: path, projectName: name ?? s.projectName })),
}));
