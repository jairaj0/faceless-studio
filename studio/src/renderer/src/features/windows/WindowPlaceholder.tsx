export function WindowPlaceholder({
  icon,
  title,
  lines,
}: {
  icon: string;
  title: string;
  lines: string[];
}) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        textAlign: "center",
        color: "var(--fg-3)",
        padding: 24,
      }}
    >
      <div style={{ fontSize: 40, opacity: 0.5 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "var(--fg)" }}>{title} window</div>
      {lines.map((l, i) => (
        <div key={i} style={{ fontSize: 12, maxWidth: 460 }}>
          {l}
        </div>
      ))}
    </div>
  );
}

export default WindowPlaceholder;
