// Breadcrumbs — the trail above a page, drawn from `items` the site computes:
// `{ label, href? }`, root first, the page you are on last. Every item but the last that has an
// `href` is a real link, so middle-click, copy-link and keyboard focus work; the last is the
// current page; an item without an `href` in between is plain text.
//
// `onNavigate(href, event)` lets a single-page site take a plain left click itself. A click with a
// modifier key, a non-primary button or an already-prevented event is left to the browser.
// A string label is also the crumb's `title`, so a label cut short by the width can be read whole.
/**
 * @param {object} props
 * @param {{ label: import("react").ReactNode, href?: string }[]} props.items Root first, the current page last.
 * @param {(href: string, event: import("react").MouseEvent<HTMLAnchorElement>) => void} [props.onNavigate] Takes a plain left click.
 * @param {string} [props.className]
 */
export function Breadcrumbs({ items, onNavigate, className }) {
  if (!items || items.length === 0) return null;
  const last = items.length - 1;
  const click = (href) => (e) => {
    if (!onNavigate || e.defaultPrevented || e.button !== 0
      || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(href, e);
  };
  return (
    <nav aria-label="Breadcrumb" className={"crumbs" + (className ? " " + className : "")}>
      <ol className="crumbs__list">
        {items.map((it, i) => {
          const title = typeof it.label === "string" ? it.label : undefined;
          return (
            <li key={i} className="crumbs__item">
              {i === last ? (
                <span className="crumbs__current" aria-current="page" title={title}>{it.label}</span>
              ) : it.href ? (
                <a className="crumbs__link" href={it.href} title={title} onClick={click(it.href)}>{it.label}</a>
              ) : (
                <span className="crumbs__text" title={title}>{it.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
