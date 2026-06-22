import { useEffect } from "react";
import { useGlobalKeymap } from "../commands";
import { registerBuiltins } from "../commands/builtins";
import { MenuBar } from "../features/menus/MenuBar";
import { WindowHost } from "../features/windows/WindowHost";
import { RecoveryBanner } from "../features/project/RecoveryBanner";
import { useAutosave } from "../features/project/autosave";

// Register the commands available so far (grows each milestone).
registerBuiltins();

export default function App() {
  useGlobalKeymap();
  useAutosave();

  // Stop the window from navigating away when a file is dropped outside a
  // designated drop zone (the Media Bin handles its own drops).
  useEffect(() => {
    const prevent = (e: DragEvent): void => e.preventDefault();
    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);
    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", prevent);
    };
  }, []);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <MenuBar />
      <RecoveryBanner />
      <div style={{ flex: 1, minHeight: 0 }}>
        <WindowHost />
      </div>
    </div>
  );
}
