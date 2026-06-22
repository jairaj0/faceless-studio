import { useState } from "react";
import { Split } from "./Split";
import { ProgramMonitor } from "./panels/ProgramMonitor";
import { ProjectPanel } from "./panels/ProjectPanel";
import { EffectControls } from "./panels/EffectControls";
import { TimelinePanel } from "./panels/TimelinePanel";

/** Premiere "Editing" workspace: monitors on top, project + timeline below. */
export function EditorShell() {
  const [activeTool, setActiveTool] = useState("select");

  return (
    <Split
      direction="vertical"
      initial={54}
      first={
        <Split
          direction="horizontal"
          initial={42}
          first={<EffectControls />}
          second={<ProgramMonitor />}
        />
      }
      second={
        <Split
          direction="horizontal"
          initial={22}
          first={<ProjectPanel />}
          second={<TimelinePanel activeTool={activeTool} onTool={setActiveTool} />}
        />
      }
    />
  );
}

export default EditorShell;
