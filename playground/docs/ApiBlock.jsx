// One export's generated API: its import line, its props or arguments as a table, what it returns,
// and the native element it forwards the rest to. Everything shown comes from generated/api.json.

const Code = ({ children }) => <code className="pg-code">{children}</code>;

/** Text with `backticked` spans drawn as code. */
export const inline = (text) => text.split(/(`[^`]+`)/g).map((part, i) => (part.startsWith("`") ? <Code key={i}>{part.slice(1, -1)}</Code> : part));

function PropsTable({ rows, withDefault }) {
  return (
    <div className="pg-table-wrap">
      <table className="pg-table">
        <thead>
          <tr><th>Name</th><th>Type</th>{withDefault && <th>Default</th>}<th>Description</th></tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.name}>
              <td className="pg-name"><Code>{p.name}</Code>{p.required && <span className="pg-req" title="Required"> *</span>}</td>
              <td className="pg-type"><Code>{p.type}</Code></td>
              {withDefault && <td>{p.default ? <Code>{p.default}</Code> : <span className="pg-dim">—</span>}</td>}
              <td>{p.description ? inline(p.description) : <span className="pg-dim">—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ApiBlock({ name, entry }) {
  const rows = entry.props ?? entry.params ?? [];
  return (
    <div className="pg-api" id={"api-" + name}>
      <h3 className="pg-api__name"><Code>{entry.kind === "component" ? `<${name}>` : name}</Code> <span className="pg-kind">{entry.kind}</span></h3>
      <p className="pg-import"><Code>{`import { ${name} } from "${entry.package}";`}</Code></p>
      {entry.kind === "value" && <p className="pg-dim"><Code>{entry.type}</Code></p>}
      {entry.kind === "namespace" && <p>Exports: <Code>{entry.type}</Code></p>}
      {rows.length > 0 && <PropsTable rows={rows} withDefault={Boolean(entry.props)} />}
      {entry.props && entry.props.length === 0 && !entry.native && <p className="pg-dim">No props.</p>}
      {entry.native && (
        <p className="pg-native">
          Plus every <Code>{entry.native === "element" ? "HTML element" : `<${entry.native}>`}</Code> attribute, which reaches the root element.
          {entry.ref && " The ref reaches it too."}
        </p>
      )}
      {entry.returns && <p className="pg-returns">Returns <Code>{entry.returns}</Code></p>}
    </div>
  );
}
