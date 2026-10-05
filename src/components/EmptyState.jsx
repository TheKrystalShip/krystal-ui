import { Icon } from "./Icon.jsx";

// What a place shows when it has nothing else to: an icon in a disc, a title, a line or two of
// `children` under it, and `actions` beneath. `tone` colours the disc — neutral (the default),
// accent, warn or danger. `detail` is a block of monospace text under the copy, for the error a
// failure screen quotes.
//
// `page` makes it the whole screen — centred on the canvas, on a card — for a site that has nothing
// else to draw: signed out, no access, crashed. Without it, it centres in whatever holds it.
function EmptyState({ icon, title, tone = "neutral", detail, actions, page = false, className, children }) {
  const body = (
    <div className={"k-empty k-empty--" + tone + (page ? " k-empty--card" : "") + (className && !page ? " " + className : "")}>
      {icon && <span className="k-empty__icon"><Icon name={icon} size={page ? 28 : 22} /></span>}
      {title && <h2 className="k-empty__title">{title}</h2>}
      {children && <div className="k-empty__body">{children}</div>}
      {detail && <pre className="k-empty__detail">{detail}</pre>}
      {actions && <div className="k-empty__actions">{actions}</div>}
    </div>
  );
  if (!page) return body;
  return <div className={"k-empty-page" + (className ? " " + className : "")}>{body}</div>;
}

export { EmptyState };
