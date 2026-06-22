import { useGlobalKeymap } from "../commands";
import { registerBuiltins } from "../commands/builtins";
import { MenuBar } from "../features/menus/MenuBar";
import { WindowHost } from "../features/windows/WindowHost";

// Register the commands available so far (grows each milestone).
registerBuiltins();

export default function App() {
  useGlobalKeymap();

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <MenuBar />
      <div style={{ flex: 1, minHeight: 0 }}>
        <WindowHost />
      </div>
    </div>
  );
}
