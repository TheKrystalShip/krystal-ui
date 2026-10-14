import { forwardRef } from "react";
import { Icon } from "./Icon.jsx";

// Card — a framed surface: an optional head (a title, a quieter line under it, the card's own
// actions), the body, and an optional foot.
//
//   title, sub, icon   the head's text; `icon` is a Lucide name before the title
//   actions            Buttons and IconButtons at the head's end. They are their own targets
//   foot               a strip under the body, set off by a hairline
//   padding            md (default) | none | sm | lg: the body's inset. `none` lets a List, a Table or
//                      artwork sit flush to the frame; the head and foot keep their own
//   tone               ok | info | warn | danger | accent: a thin edge on the card's leading side
//   onOpen, href       the whole card opens: the title (or `label`, when there is no head) becomes a
//                      button or a link whose hit area covers the card, and `actions` sit above it
//   selected           the accent tint and edge
// `as` picks the root element (section, article, li; div by default). Other props reach the root.
/**
 * @typedef {object} CardOwnProps
 * @property {import("react").ReactNode} [title]
 * @property {import("react").ReactNode} [sub]
 * @property {string} [icon] A Lucide name.
 * @property {import("react").ReactNode} [actions]
 * @property {import("react").ReactNode} [foot]
 * @property {"none" | "sm" | "md" | "lg"} [padding]
 * @property {"ok" | "info" | "warn" | "danger" | "accent"} [tone]
 * @property {(event: import("react").MouseEvent<HTMLElement>) => void} [onOpen]
 * @property {string} [href]
 * @property {string} [label] The open control's accessible name when there is no title.
 * @property {boolean} [selected]
 * @property {"div" | "section" | "article" | "li" | "aside"} [as]
 * @property {string} [className]
 * @property {import("react").ReactNode} [children]
 * @typedef {CardOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof CardOwnProps | "title">} CardProps
 */
/** @type {import("react").ForwardRefExoticComponent<CardProps & import("react").RefAttributes<HTMLElement>>} */
const Card = forwardRef(function Card({
  title, sub, icon, actions, foot, padding = "md", tone, onOpen, href, label, selected = false, as: Root = "div", className, children, ...rest
}, ref) {
  const openable = onOpen != null || href != null;
  const hasHead = title != null || sub != null || actions != null;
  const openProps = { className: "k-card__open", "aria-current": selected || undefined };
  const titleNode = title != null && (
    <h3 className="k-card__title">
      {icon && <Icon name={icon} size={14} className="k-card__icon" />}
      {openable
        ? (href != null
          ? <a {...openProps} href={href} onClick={onOpen}>{title}</a>
          : <button type="button" {...openProps} onClick={onOpen}>{title}</button>)
        : <span className="k-card__title-text">{title}</span>}
    </h3>
  );
  const Tag = /** @type {any} */ (Root);
  return (
    <Tag {...rest} ref={ref}
      className={"k-card k-card--pad-" + padding + (openable ? " k-card--open" : "") + (selected ? " k-is-selected" : "")
        + (tone ? " k-card--" + tone : "") + (className ? " " + className : "")}>
      {hasHead && (
        <div className="k-card__head">
          <div className="k-card__heading">
            {titleNode}
            {sub != null && <div className="k-card__sub">{sub}</div>}
          </div>
          {actions != null && <div className="k-card__actions">{actions}</div>}
        </div>
      )}
      {openable && title == null && (href != null
        ? <a {...openProps} className="k-card__open k-card__open--bare" href={href} onClick={onOpen} aria-label={label} />
        : <button type="button" {...openProps} className="k-card__open k-card__open--bare" onClick={onOpen} aria-label={label} />)}
      {children != null && <div className="k-card__body">{children}</div>}
      {foot != null && <div className="k-card__foot">{foot}</div>}
    </Tag>
  );
});

export { Card };
