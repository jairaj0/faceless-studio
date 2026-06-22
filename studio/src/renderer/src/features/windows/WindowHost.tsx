import { useApp } from "../../store";
import { EditWindow } from "./EditWindow";
import { ExportWindow } from "./ExportWindow";
import { LibraryWindow } from "../library/LibraryWindow";

// Window switching lives in the header (MenuBar). This just renders the active one.
export function WindowHost() {
  const view = useApp((s) => s.view);
  if (view === "export") return <ExportWindow />;
  if (view === "library") return <LibraryWindow />;
  return <EditWindow />;
}

export default WindowHost;
