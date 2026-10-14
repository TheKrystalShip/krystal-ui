// List and ListRow — a framed list of rows, each a person, a rule, a service or a grant: a `lead`
// (an avatar, an icon in a tile), a title with a quieter line under it, a strip of Pills, a
// monospace aside, and the row's own actions.
//
// List is the `ul`: the surface, the edge and a hairline between rows. A List with no rows draws
// nothing, so a caller shows an EmptyState in its place.
//
// ListRow is the `li`:
//   lead      a node before the title
//   title     the row's name
//   sub       a quieter line under the title
//   meta      Pills, in a row after the title
//   aside     quiet monospace text at the end (an id, a time, a count)
//   actions   Buttons and IconButtons. They are their own targets; they never sit inside the title's link.
//   onOpen    makes the title a button; `href` makes it a link. Its hit area stretches over the whole
//             row, so a press anywhere on the row but an action opens it.
//   selected  the accent tint and edge (aria-current on the title control)
//   disabled  dims the row and blocks opening
//   tone      ok | info | warn | danger | accent: a thin edge on the row's leading side
// `data-*` and the other props reach the `li`. At phone width `meta` and `aside` wrap under the
// title and `actions` stay at the end.
/**
 * @param {object} props
 * @param {string} [props.label]
 * @param {string} [props.className]
 * @param {import("react").ReactNode} [props.children]
 */
function List({ label, children, className }) {
  return <ul className={"k-list" + (className ? " " + className : "")} aria-label={label}>{children}</ul>;
}

/**
 * @typedef {object} ListRowOwnProps
 * @property {import("react").ReactNode} [lead]
 * @property {import("react").ReactNode} title
 * @property {import("react").ReactNode} [sub]
 * @property {import("react").ReactNode} [meta] Pills.
 * @property {import("react").ReactNode} [aside] Quiet monospace text at the end.
 * @property {import("react").ReactNode} [actions]
 * @property {(event: import("react").MouseEvent<HTMLElement>) => void} [onOpen] Makes the title a button.
 * @property {string} [href] Makes the title a link.
 * @property {boolean} [selected]
 * @property {boolean} [disabled]
 * @property {"ok" | "info" | "warn" | "danger" | "accent"} [tone]
 * @property {string} [className]
 * @typedef {ListRowOwnProps & Omit<import("react").ComponentPropsWithoutRef<"li">, keyof ListRowOwnProps | "title">} ListRowProps
 */
/** @param {ListRowProps} props */
function ListRow({ lead, title, sub, meta, aside, actions, onOpen, href, selected = false, disabled = false, tone, className, ...rest }) {
  const openable = !disabled && (onOpen != null || href != null);
  /** @type {{ className: string, "aria-current": "true" | undefined }} */
  const titleProps = {
    className: "k-listrow__title" + (openable ? " k-listrow__open" : ""),
    "aria-current": selected ? "true" : undefined,
  };
  let head;
  if (disabled && onOpen != null) {
    head = <button type="button" {...titleProps} disabled>{title}</button>;
  } else if (openable && href != null) {
    head = <a {...titleProps} href={href} onClick={onOpen}>{title}</a>;
  } else if (openable) {
    head = <button type="button" {...titleProps} onClick={onOpen}>{title}</button>;
  } else {
    head = <span {...titleProps}>{title}</span>;
  }
  return (
    <li {...rest}
      className={"k-listrow" + (openable ? " k-listrow--open" : "") + (selected ? " k-is-selected" : "")
        + (disabled ? " k-is-disabled" : "") + (tone ? " k-listrow--" + tone : "") + (className ? " " + className : "")}>
      {lead != null && <span className="k-listrow__lead">{lead}</span>}
      <div className="k-listrow__main">
        {head}
        {sub != null && <span className="k-listrow__sub">{sub}</span>}
      </div>
      {meta != null && <div className="k-listrow__meta">{meta}</div>}
      {aside != null && <span className="k-listrow__aside">{aside}</span>}
      {actions != null && <div className="k-listrow__actions">{actions}</div>}
    </li>
  );
}

export { List, ListRow };
