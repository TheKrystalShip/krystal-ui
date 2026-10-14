// A page's keyboard and screen-reader section: the curated key table and roles from behaviour.js, and
// the header comment of the source file each export is declared in.
import { inline } from "./ApiBlock.jsx";
import { BEHAVIOUR } from "./behaviour.js";

export function Behaviour({ id, headers }) {
  const b = BEHAVIOUR[id];
  return (
    <section className="pg-section" aria-labelledby="pg-behaviour">
      <h2 id="pg-behaviour">Keyboard and screen reader</h2>
      {b?.keys?.length > 0 && (
        <div className="pg-table-wrap">
          <table className="pg-table">
            <thead><tr><th>Key</th><th>Effect</th></tr></thead>
            <tbody>{b.keys.map(([key, effect]) => <tr key={key}><td><kbd className="pg-kbd">{key}</kbd></td><td>{inline(effect)}</td></tr>)}</tbody>
          </table>
        </div>
      )}
      {b?.keys && b.keys.length === 0 && <p className="pg-dim">Nothing here takes a key of its own.</p>}
      {b?.semantics?.length > 0 && <ul className="pg-list">{b.semantics.map((s) => <li key={s}>{inline(s)}</li>)}</ul>}
      {!b && <p className="pg-dim">Static content, or native elements only: nothing here adds keys or roles of its own beyond the element's.</p>}
      {headers.map(({ file, text }) => (
        <details key={file} className="pg-header">
          <summary>Header comment of <code className="pg-code">{file.replace(/^packages\/[^/]+\/src\//, "")}</code></summary>
          <pre>{text}</pre>
        </details>
      ))}
    </section>
  );
}
