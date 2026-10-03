import { Icon } from "./Icon.jsx";

// GitHub's mark. Lucide carries no brand glyphs, and a link to github.com is recognised by this one.
function GithubMark({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"
         style={{ display: "block" }}>
      <path fillRule="evenodd" clipRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

// A link opens in a new tab unless the site handles it itself: given `onClick`, a plain click is
// the site's (a client-side navigation) and a modified click still opens `href` the browser's way.
function FooterLink({ link }) {
  const own = typeof link.onClick === "function";
  const onClick = own ? (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    link.onClick();
  } : undefined;
  return (
    <a className={"kfoot__link" + (link.featured ? " kfoot__link--featured" : "")}
       href={link.href} onClick={onClick}
       {...(own ? {} : { target: "_blank", rel: "noreferrer noopener" })}>
      <span className="kfoot__link-ico">
        {link.glyph || <Icon name={link.icon || "link"} size={15} />}
      </span>
      <span className="kfoot__link-text">
        <span className="kfoot__link-name">
          {link.scope && <span className="kfoot__link-scope">{link.scope}</span>}{link.name}
        </span>
        {link.sub && <span className="kfoot__link-sub">{link.sub}</span>}
      </span>
      <span className="kfoot__link-arrow">
        <Icon name={own ? "arrow-right" : "arrow-up-right"} size={14} strokeWidth={2.2} />
      </span>
    </a>
  );
}

// The footer a page ends with, pinned to the bottom of the main column when the page is short.
//
// The brand block is the site's `mark` and `wordmark` over its `tagline`, with an optional `note`
// beneath (`live` puts a pulsing dot before it). Beside it sit the link `groups`, each
// `{ label, columns, mono, links }` (`mono` sets the names as code, for repositories and the like), a
// link being `{ name, href, scope?, sub?, icon? | glyph?, featured?,
// onClick? }`. The bar under both carries `copy` on the left and `end` on the right.
function Footer({ mark, wordmark, tagline, note, live = false, groups = [], copy, end }) {
  return (
    <footer className="kfoot" role="contentinfo">
      <div className="kfoot__inner">
        <div className="kfoot__brand">
          <div className="kfoot__brand-row">
            {mark && <img src={mark} width="34" height="34" alt="" className="kfoot__mark" />}
            <span className="kfoot__wordmark">{wordmark}</span>
          </div>
          {tagline && <p className="kfoot__tagline">{tagline}</p>}
          {note && (
            <div className="kfoot__note">
              {live && <span className="kfoot__note-dot" />}
              {note}
            </div>
          )}
        </div>

        <div className="kfoot__groups">
          {groups.map((g) => (
            <div key={g.label} className={"kfoot__group" + (g.mono ? " kfoot__group--mono" : "")}
                 style={{ "--kfoot-columns": g.columns || 1 }}>
              <div className="kfoot__group-label">{g.label}</div>
              <div className="kfoot__group-links">
                {g.links.map((l) => <FooterLink key={l.href} link={l} />)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {(copy || end) && (
        <div className="kfoot__bar">
          <span className="kfoot__copy">{copy}</span>
          {end && <span className="kfoot__end">{end}</span>}
        </div>
      )}
    </footer>
  );
}

export { Footer, GithubMark };
