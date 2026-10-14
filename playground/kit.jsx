// The playground's own layout pieces, shared by main.jsx and every file in sections/. A section file
// draws one <Section id="<its file name>"> so the nav link generated from its name lands on it.
export const row = { display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 12 };
export const col = { display: "grid", gap: 14, maxWidth: 420, marginBottom: 12 };

export function Section({ id, title, children }) {
  return (
    <section id={id} style={{ margin: "32px 0" }}>
      <h2 style={{ margin: "0 0 14px", fontSize: 18 }}>{title}</h2>
      {children}
    </section>
  );
}

export function Sub({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h3 style={{ margin: "0 0 8px", fontSize: 12, textTransform: "uppercase", opacity: 0.6 }}>{title}</h3>
      {children}
    </div>
  );
}
