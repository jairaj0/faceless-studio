import { useApp } from "../../store";
import { EditWindow } from "./EditWindow";
import { ExportWindow } from "./ExportWindow";

// Window switching lives in the header (MenuBar). This just renders the active one.
export function WindowHost() {
  const view = useApp((s) => s.view);
  return view === "export" ? <ExportWindow /> : <EditWindow />;
}

export default WindowHost;
