// A page's heading: its title, an optional `sub` line under it, and `actions` — the page-level
// controls — opposite the title, wrapping under it when the row runs out of room.
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
