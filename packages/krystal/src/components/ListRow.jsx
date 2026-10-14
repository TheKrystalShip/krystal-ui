// List and ListRow — a framed list of rows, each a person, a rule, a service or a grant: a `lead`
// (an avatar, an icon in a tile), a title with a quieter line under it, a strip of Pills, a
// monospace aside, and the row's own actions.
//
// List is the `ul`: the surface, the edge and a hairline between rows. A List with no rows draws
// nothing, so a caller shows an EmptyState in its place.
//
// ListRow is the `li`, or a `div` with `as="div"` for a row that stands in a container of the site's
// own (a timeline that is not a List):
//   lead      a node before the title
//   title     the row's name
//   sub       a quieter line under the title
//   detail    a wrapping line under `sub` for chips (a provenance, a key and its value)
//   meta      Pills, in a row after the title
//   aside     quiet monospace text at the end (an id, a time, a count)
//   actions   Buttons and IconButtons. They are their own targets; they never sit inside the title's link.
//   onOpen    makes the title a button; `href` makes it a link. Its hit area stretches over the whole
//             row, so a press anywhere on the row but an action opens it.
//   selected  the accent tint and edge (aria-current on the title control)
//   disabled  dims the row and blocks opening
//   tone      ok | info | warn | danger | accent: a thin edge on the row's leading side
// `data-*` and the other props reach the root. At phone width `meta` and `aside` wrap under the
// title and `actions` stay at the end.
/**
 * @param {object} props
 * @param {string} [props.label] The list's accessible name.
 * @param {string} [props.className] Class name added to the root element.
 * @param {import("react").ReactNode} [props.children] The rows.
 */
function List({ label, children, className }) {
  return <ul className={"k-list" + (className ? " " + className : "")} aria-label={label}>{children}</ul>;
}

/**
 * @typedef {object} ListRowOwnProps
 * @property {import("react").ReactNode} [lead] A node before the title, such as an icon or avatar.
 * @property {import("react").ReactNode} title The row's main text.
 * @property {import("react").ReactNode} [sub] A quieter line under the title.
 * @property {import("react").ReactNode} [detail] A wrapping line under `sub`, for chips.
 * @property {"li" | "div"} [as] The root element: `li` inside a List (the default), `div` for a row that stands on its own.
 * @property {import("react").ReactNode} [meta] Pills.
 * @property {import("react").ReactNode} [aside] Quiet monospace text at the end.
 * @property {import("react").ReactNode} [actions] Controls at the row's end.
 * @property {(event: import("react").MouseEvent<HTMLElement>) => void} [onOpen] Makes the title a button.
 * @property {string} [href] Makes the title a link.
 * @property {boolean} [selected] Marks the row as the chosen one.
 * @property {boolean} [disabled] Dims the row and keeps it from opening.
 * @property {"ok" | "info" | "warn" | "danger" | "accent"} [tone] Tints the row's lead edge with a status colour.
 * @property {string} [className] Class name added to the root element.
 * @typedef {ListRowOwnProps & Omit<import("react").ComponentPropsWithoutRef<"li">, keyof ListRowOwnProps | "title">} ListRowProps
 */
/** @param {ListRowProps} props */
function ListRow({ as: Root = "li", lead, title, sub, detail, meta, aside, actions, onOpen, href, selected = false, disabled = false, tone, className, ...rest }) {
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
    <Root {...rest}
      className={"k-listrow" + (openable ? " k-listrow--open" : "") + (selected ? " k-is-selected" : "")
        + (disabled ? " k-is-disabled" : "") + (tone ? " k-listrow--" + tone : "") + (className ? " " + className : "")}>
      {lead != null && <span className="k-listrow__lead">{lead}</span>}
      <div className="k-listrow__main">
        {head}
        {sub != null && <span className="k-listrow__sub">{sub}</span>}
        {detail != null && <div className="k-listrow__detail">{detail}</div>}
      </div>
      {meta != null && <div className="k-listrow__meta">{meta}</div>}
      {aside != null && <span className="k-listrow__aside">{aside}</span>}
      {actions != null && <div className="k-listrow__actions">{actions}</div>}
    </Root>
  );
}

export { List, ListRow };
