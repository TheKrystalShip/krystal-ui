// A page's heading: its title, an optional `sub` line under it, and `actions` — the page-level
// controls — opposite the title, wrapping under it when the row runs out of room.
/**
 * @param {object} props
 * @param {import("react").ReactNode} props.title The page's heading.
 * @param {import("react").ReactNode} [props.sub] A line under the title.
 * @param {import("react").ReactNode} [props.actions] Page-level controls opposite the title.
 * @param {string} [props.className] Extra class names on the root element.
 */
function PageHeader({ title, sub, actions, className }) {
  return (
    <header className={"k-pagehead" + (className ? " " + className : "")}>
      <div className="k-pagehead__titles">
        <h1 className="k-pagehead__title">{title}</h1>
        {sub && <div className="k-pagehead__sub">{sub}</div>}
      </div>
      {actions && <div className="k-pagehead__actions">{actions}</div>}
    </header>
  );
}

export { PageHeader };
