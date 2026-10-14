// The token reference: every base token of tokens.css by group, its value in the theme applied now
// (read from the document, so it follows the theme picker) and whether a theme may re-value it.
import React from "react";
import data from "../generated/tokens.json";

const CATEGORIES = [
  ["colour", "Colour"], ["type", "Type"], ["spacing", "Spacing"], ["radius", "Radius"],
  ["edge", "Edge"], ["shadow", "Shadow and focus"], ["motion", "Motion"], ["layout", "Layout"],
];

/** The computed value of every token on the document, re-read whenever the theme changes. */
function useComputedTokens() {
  const [values, setValues] = React.useState({});
  React.useEffect(() => {
    const read = () => {
      const style = getComputedStyle(document.documentElement);
      setValues(Object.fromEntries(data.tokens.map((t) => [t.name, style.getPropertyValue(t.name).trim()])));
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "style", "class"] });
    return () => observer.disconnect();
  }, []);
  return values;
}

function Sample({ token }) {
  const v = `var(${token.name})`;
  switch (token.category) {
    case "colour":
      return <span className="pg-swatch"><span style={{ background: v }} /></span>;
    case "spacing":
      return <span className="pg-space" style={{ width: v }} />;
    case "radius":
      return <span className="pg-radius" style={{ borderRadius: v }} />;
    case "edge":
      return <span className="pg-edge" style={{ border: v }} />;
    case "shadow":
      return <span className="pg-shadow" style={{ boxShadow: v }} />;
    case "type":
      if (token.name.startsWith("--font")) return <span style={{ fontFamily: v, fontSize: 15 }}>Aa Bb 0123</span>;
      if (token.name.startsWith("--text")) return <span style={{ fontSize: v, lineHeight: 1 }}>Aa</span>;
      if (token.name.startsWith("--w-")) return <span style={{ fontWeight: v, fontSize: 15 }}>Aa</span>;
      return <span className="pg-lh" style={{ lineHeight: v }}>Line<br />height</span>;
    case "motion":
      return token.name.startsWith("--d-")
        ? <span className="pg-motion"><span style={{ transitionDuration: v }} /></span>
        : <span className="pg-dim">curve</span>;
    default:
      return <span className="pg-dim">—</span>;
  }
}

export function TokensPage() {
  const values = useComputedTokens();
  return (
    <article>
      <header className="pg-head">
        <p className="pg-eyebrow">Reference</p>
        <h1>Tokens</h1>
        <p className="pg-summary">Every token of <code className="pg-code">tokens.css</code>, grouped by role, with its value in the theme applied now. Change the theme above and the values follow.</p>
        <p className="pg-dim">
          A theme may re-value the tokens marked <span className="pg-badge pg-badge--yes">theme</span> and no others:
          the colours its contract requires, the optional <code className="pg-code">--on-*</code> inks and the structural set
          (corner geometry, edge, elevation, focus, UI font and motion). A token marked <span className="pg-badge">fixed</span> is the same in every theme.
          The contract is <code className="pg-code">theme-contract.json</code>.
        </p>
      </header>
      {CATEGORIES.map(([category, title]) => {
        const groups = [...new Set(data.tokens.filter((t) => t.category === category).map((t) => t.group))];
        return (
          <section key={category} className="pg-section" aria-labelledby={"tok-" + category} id={"tokens-" + category}>
            <h2 id={"tok-" + category}>{title}</h2>
            {groups.map((group) => (
              <div key={group}>
                <h3 className="pg-group">{group}</h3>
                <div className="pg-table-wrap">
                  <table className="pg-table pg-tokens">
                    <thead><tr><th>Sample</th><th>Token</th><th>Value now</th><th>Theme</th></tr></thead>
                    <tbody>
                      {data.tokens.filter((t) => t.group === group).map((t) => (
                        <tr key={t.name}>
                          <td className="pg-sample"><Sample token={t} /></td>
                          <td><code className="pg-code">{t.name}</code></td>
                          <td className="pg-type"><code className="pg-code">{values[t.name] ?? t.value}</code></td>
                          <td>{t.themeable ? <span className="pg-badge pg-badge--yes" title={`Contract list: ${t.contract}`}>theme</span> : <span className="pg-badge">fixed</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </article>
  );
}
