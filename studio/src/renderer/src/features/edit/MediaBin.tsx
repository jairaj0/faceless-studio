import { useEditor } from "../../store/editor";
import { importImages, importAudio } from "./importActions";

export function MediaBin() {
  const media = useEditor((s) => s.media);
  const audio = useEditor((s) => s.audio);
  const addClip = useEditor((s) => s.addClip);
  const removeMedia = useEditor((s) => s.removeMedia);
  const setAudio = useEditor((s) => s.setAudio);

  return (
    <div
      style={{
        width: 248,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-1)",
        borderRight: "1px solid var(--border)",
      }}
    >
      <Header>Media</Header>

      <div style={{ display: "flex", gap: 6, padding: "8px 10px" }}>
        <Btn onClick={importImages}>+ Image</Btn>
        <Btn onClick={importAudio}>+ Audio</Btn>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 8px" }}>
        {media.length === 0 && (
          <Empty>Import images, then click one to add it to the timeline.</Empty>
        )}
        {media.map((m) => (
          <div
            key={m.id}
            onDoubleClick={() => addClip(m.id)}
            title="Double-click to add to timeline"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: 6,
              marginBottom: 4,
              borderRadius: 6,
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
            }}
          >
            <img
              src={m.dataUrl}
              alt=""
              style={{ width: 44, height: 28, objectFit: "cover", borderRadius: 3, flexShrink: 0 }}
            />
            <span
              style={{
                flex: 1,
                fontSize: 11,
                color: "var(--fg-2)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {m.name}
            </span>
            <IconBtn onClick={() => addClip(m.id)} title="Add to timeline">
              +
            </IconBtn>
            <IconBtn onClick={() => removeMedia(m.id)} title="Remove">
              ×
            </IconBtn>
          </div>
        ))}
      </div>

      <Header>Audio</Header>
      <div style={{ padding: "8px 10px" }}>
        {audio ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: 6,
              borderRadius: 6,
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
            }}
          >
            <span style={{ fontSize: 14 }}>🎵</span>
            <span
              style={{
                flex: 1,
                fontSize: 11,
                color: "var(--fg-2)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {audio.name}
            </span>
            <IconBtn onClick={() => setAudio(null)} title="Remove audio">
              ×
            </IconBtn>
          </div>
        ) : (
          <Empty>No audio track. Add one to mux into the export.</Empty>
        )}
      </div>
    </div>
  );
}

function Header({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "6px 10px",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        color: "var(--fg-3)",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
      }}
    >
      {children}
    </div>
  );
}

function Btn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "6px 8px",
        fontSize: 11,
        color: "var(--fg)",
        background: "var(--bg-2)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function IconBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 20,
        height: 20,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        lineHeight: 1,
        color: "var(--fg-3)",
        background: "none",
        border: "none",
        borderRadius: 4,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, color: "var(--fg-3)", lineHeight: 1.5, padding: "4px 2px" }}>
      {children}
    </p>
  );
}

export default MediaBin;
