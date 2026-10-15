import React from "react";
import { Icon } from "./Icon.jsx";
import { useNear } from "../hooks/useNear.js";

// The parts a site is drawn from on a television, under a root marked `data-tv` (styles/tv.css).
// A television is read from across a room and driven by a remote that moves focus from element to
// element, so every part here is sized for the distance and says nothing about how focus moves: the
// site's navigator reads where things are, and these parts only put them there.

// TvBar — the strip across the top of a page: the mark, the places, and the site's own buttons at the
// right. Each item is a link (`href`, `onClick`); the one for the page that is open carries
// `active`, which is `aria-current`, where focus lands when it comes up into the bar. `hidden` slides
// the bar away, for a page scrolled past its top.
/**
 * @param {object} props
 * @param {string} [props.mark] An image URL.
 * @param {string} [props.name] The site's name: the mark's alt text and the nav's accessible name.
 * @param {{ id: string, label: import("react").ReactNode, active?: boolean, href?: string, onClick?: import("react").MouseEventHandler<HTMLAnchorElement> }[]} props.items The places, each a link `{ id, label, active, href, onClick }`.
 * @param {import("react").ReactNode} [props.actions] The site's own buttons at the right, usually TvBarButtons.
 * @param {boolean} [props.hidden] Slides the bar away.
 */
function TvBar({ mark, name, items, actions, hidden = false }) {
  return (
    <header className="k-tv-bar" data-hidden={hidden ? "" : undefined}>
      {mark && <img className="k-tv-bar__mark" src={mark} alt={name || ""} />}
      <nav className="k-tv-bar__nav" aria-label={name}>
        {items.map(({ id, label, active, href, onClick }) => (
          <a key={id} className="k-tv-bar__item" href={href} onClick={onClick} aria-current={active ? "page" : undefined}>
            {label}
          </a>
        ))}
      </nav>
      {actions && <div className="k-tv-bar__actions">{actions}</div>}
    </header>
  );
}

// TvBarButton — a round button among the bar's actions: an icon, or `children` drawn in its place
// (an avatar). `label` is its accessible name; `dot` marks something waiting behind it.
/**
 * @typedef {object} TvBarButtonOwnProps
 * @property {string} [icon] A Lucide name.
 * @property {string} label The accessible name.
 * @property {boolean} [dot] Marks something waiting behind it.
 * @property {import("react").ReactNode} [children] Drawn in place of the icon.
 * @property {string} [className] Extra class names on the root element.
 * @typedef {TvBarButtonOwnProps & Omit<import("react").ComponentPropsWithoutRef<"button">, keyof TvBarButtonOwnProps>} TvBarButtonProps
 */
/** @param {TvBarButtonProps} props */
function TvBarButton({ icon, label, dot = false, children, className, ...rest }) {
  return (
    <button type="button" className={"k-tv-bar__button" + (className ? " " + className : "")} aria-label={label} {...rest}>
      {children || <Icon name={icon} size={17} />}
      {dot && <span className="k-tv-bar__dot" />}
    </button>
  );
}

// TvBackdrop — the artwork behind a page, at its right, fading into the canvas to its left and below.
// A new `src` is loaded out of sight and faded in over the last, so moving along a row never shows the
// canvas between two pictures. `size` is how far down it reaches: "tall" behind a page's opening
// spotlight, "short" behind one drawn above a row, "page" across most of a page that is about one
// thing.
/**
 * @param {object} props
 * @param {string} [props.src] The artwork's image URL; a new one fades in over the last.
 * @param {"tall" | "short" | "page"} [props.size] How far down it reaches: `tall`, `short` or `page`.
 */
function TvBackdrop({ src, size = "tall" }) {
  const [layers, setLayers] = React.useState(() => (src ? [{ src, key: 0 }] : []));
  const next = React.useRef(1);
  React.useEffect(() => {
    if (!src) return undefined;
    let live = true;
    const image = new Image();
    image.src = src;
    // Decoded before it is put on the page, so the fade never waits on a decode mid-way.
    const show = () => {
      if (!live) return;
      setLayers((prev) => (prev.length > 0 && prev[prev.length - 1].src === src
        ? prev
        : [...prev.slice(-1), { src, key: next.current++ }]));
    };
    image.decode().then(show, show);
    return () => { live = false; };
  }, [src]);
  return (
    <div className={"k-tv-backdrop k-tv-backdrop--" + size} aria-hidden="true">
      {layers.map((layer) => <img key={layer.key} className="k-tv-backdrop__art" src={layer.src} alt="" decoding="async" />)}
      <div className="k-tv-backdrop__shade" />
    </div>
  );
}

// TvSpotlight — what one thing is, large: a line above its name, its name, a line of facts, and below
// them the `overview` (clamped to a few lines), a `credit` line ("Directed by <b>Name</b>"), the
// `actions` (buttons in a row) and then whatever else the site puts there. `size` "lg" opens a page;
// "md" sits above a row and describes the card focused in it. `titleSize` sets the name's size: `sm`
// for a long one, `md` (the default), `lg` for a short one on a page's own head. `overviewLines` is how
// many lines the overview shows before it is cut (3, or 2 above a row). On a television every button
// in `actions` is one height, whatever size it asks for.
/**
 * @param {object} props
 * @param {import("react").ReactNode} [props.eyebrow] A line above the name.
 * @param {import("react").ReactNode} props.title The thing's name.
 * @param {import("react").ReactNode} [props.meta] A line of facts under the name.
 * @param {import("react").ReactNode} [props.overview] A few lines of text under the facts, clamped.
 * @param {import("react").ReactNode} [props.credit] A quiet line between the overview and the actions; a `b` inside it is the name.
 * @param {import("react").ReactNode} [props.actions] Buttons in a row under the overview and credit.
 * @param {"lg" | "md"} [props.size] `lg` opens a page; `md` sits above a row.
 * @param {"sm" | "md" | "lg"} [props.titleSize] The name's size: `sm`, `md` (the default) or `lg`.
 * @param {number} [props.overviewLines] Lines of the overview shown before it is cut; 3, or 2 above a row.
 * @param {string} [props.className] Extra class names on the root element.
 * @param {import("react").ReactNode} [props.children] What sits below the actions, such as a progress line.
 */
function TvSpotlight({ eyebrow, title, meta, overview, credit, actions, size = "lg", titleSize = "md", overviewLines, className, children }) {
  return (
    <section className={"k-tv-spot k-tv-spot--" + size + (titleSize !== "md" ? " k-tv-spot--title-" + titleSize : "") + (className ? " " + className : "")}
      style={overviewLines ? /** @type {any} */ ({ "--tv-overview-lines": overviewLines }) : undefined}>
      {eyebrow && <span className="k-tv-spot__eyebrow">{eyebrow}</span>}
      <h1 className="k-tv-spot__title">{title}</h1>
      {meta && <div className="k-tv-spot__meta">{meta}</div>}
      {overview && <p className="k-tv-spot__overview">{overview}</p>}
      {credit && <span className="k-tv-spot__credit">{credit}</span>}
      {actions && <div className="k-tv-spot__actions">{actions}</div>}
      {children}
    </section>
  );
}

// TvHeading — a heading read from across a room: an optional `lead` (an avatar) and `icon`, an
// `eyebrow` over the `title`, and a `count` after it. `size` "sm" is a row's small uppercase label;
// "lg" names a whole page of cards, its title as large as a spotlight's. `as` is the element
// (an `h2` by default).
/**
 * @param {object} props
 * @param {import("react").ReactNode} props.title The heading's words.
 * @param {import("react").ReactNode} [props.eyebrow] A line over the title.
 * @param {import("react").ReactNode} [props.count] A figure after the title.
 * @param {string} [props.icon] A Lucide name before the title.
 * @param {import("react").ReactNode} [props.lead] A node before everything, such as an avatar.
 * @param {"sm" | "lg"} [props.size] `sm` (a row's label) or `lg` (a page's name); `sm` by default.
 * @param {"h1" | "h2" | "h3" | "div"} [props.as] The element.
 * @param {string} [props.className] Extra class names on the root element.
 */
function TvHeading({ title, eyebrow, count, icon, lead, size = "sm", as: Tag = "h2", className }) {
  return (
    <Tag className={"k-tv-heading k-tv-heading--" + size + (className ? " " + className : "")}>
      {lead}
      {icon && <Icon name={icon} size={14} />}
      <span className="k-tv-heading__text">
        {eyebrow && <span className="k-tv-spot__eyebrow">{eyebrow}</span>}
        <span className="k-tv-heading__title">{title}</span>
      </span>
      {count != null && <span className="k-tv-row__count">{count}</span>}
    </Tag>
  );
}

// TvRow — one row of cards that runs past the right of the screen: a heading with its icon and count
// (none when there is no `title`), the `lead` under it (season pills), then the cards, then `end`,
// the tile that leads past the row. It is a `data-tv-row`, which a navigator places on the page's
// line when focus is in it. `trackClassName` is a class on the scrolling track.
/**
 * @param {object} props
 * @param {string} [props.icon] A Lucide name.
 * @param {import("react").ReactNode} [props.title] The row's heading; without it the row has none.
 * @param {import("react").ReactNode} [props.count] A figure after the heading.
 * @param {import("react").ReactNode} [props.lead] A node between the heading and the cards.
 * @param {import("react").ReactNode} [props.end] The tile that leads past the row.
 * @param {string} [props.trackClassName] Extra class names on the scrolling track.
 * @param {string} [props.className] Extra class names on the root element.
 * @param {import("react").ReactNode} [props.children] The row's cards.
 */
function TvRow({ icon, title, count, lead, end, trackClassName, className, children }) {
  return (
    <section className={"k-tv-row" + (className ? " " + className : "")} data-tv-row="">
      {(title != null || icon || count != null) && <TvHeading className="k-tv-row__head" icon={icon} title={title} count={count} />}
      {lead}
      <div className={"k-tv-row__track" + (trackClassName ? " " + trackClassName : "")}>
        {children}
        {end}
      </div>
    </section>
  );
}

// TvCard — a picture that is a link: "poster" (2:3) or "wide" (16:9). `progress` (0 to 1) draws how
// far somebody got; `badge` sits on its top left. `label` is its accessible name. Every other prop
// reaches the link, so a site hands it `href`, `onClick` and `onFocus`. A card asks for its picture
// once it is within a quarter of its scrollers of being seen (`useNear`), and shows its surface until
// then: a television's page column and its rows are both scrollers, so that is a quarter screen ahead
// down the page and along a row, which keeps a page to the pictures it is about to show.
const CARD_AHEAD = { rootMargin: "0px", scrollMargin: "25%" };
/**
 * @typedef {object} TvCardOwnProps
 * @property {string} [art] Image URL.
 * @property {"poster" | "wide"} [shape] `poster` (2:3) or `wide` (16:9).
 * @property {string} [label] The accessible name.
 * @property {number} [progress] 0 to 1.
 * @property {import("react").ReactNode} [badge] A node on the card's top left.
 * @property {boolean} [dimmed] The card steps back, as the others in a row do while one has focus.
 * @property {string} [className] Extra class names on the root element.
 * @property {import("react").ReactNode} [children] Drawn over the picture.
 * @typedef {TvCardOwnProps & Omit<import("react").ComponentPropsWithoutRef<"a">, keyof TvCardOwnProps>} TvCardProps
 */
/** @type {import("react").ForwardRefExoticComponent<TvCardProps & import("react").RefAttributes<HTMLAnchorElement>>} */
const TvCard = React.forwardRef(function TvCard({ art, shape = "poster", label, progress, badge, dimmed = false, className, children, ...rest }, ref) {
  const own = React.useRef(null);
  const near = useNear(own, CARD_AHEAD);
  const attach = React.useCallback((el) => {
    own.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  }, [ref]);
  return (
    <a ref={attach} className={"k-tv-card k-tv-card--" + shape + (dimmed ? " k-is-dimmed" : "") + (className ? " " + className : "")} aria-label={label} {...rest}>
      {art ? (near && <img className="k-tv-card__art" src={art} alt="" loading="lazy" decoding="async" />) : <span className="k-tv-card__name">{label}</span>}
      {badge && <span className="k-tv-card__badge">{badge}</span>}
      {progress != null && (
        <span className="k-tv-card__progress"><span style={{ width: Math.round(Math.min(1, Math.max(0, progress)) * 100) + "%" }} /></span>
      )}
      {children}
    </a>
  );
});

// TvTile — the tile that ends a row: an icon over a few words, the size of the row's cards.
/**
 * @typedef {object} TvTileOwnProps
 * @property {string} [icon] A Lucide name.
 * @property {import("react").ReactNode} label The tile's words.
 * @property {"poster" | "wide"} [shape] `poster` or `wide`, the size of the row's cards.
 * @property {string} [className] Extra class names on the root element.
 * @typedef {TvTileOwnProps & Omit<import("react").ComponentPropsWithoutRef<"a">, keyof TvTileOwnProps>} TvTileProps
 */
/** @param {TvTileProps} props */
function TvTile({ icon = "arrow-right", label, shape = "poster", className, ...rest }) {
  return (
    <a className={"k-tv-card k-tv-tile k-tv-card--" + shape + (className ? " " + className : "")} {...rest}>
      <Icon name={icon} size={28} />
      <span>{label}</span>
    </a>
  );
}

export { TvBackdrop, TvBar, TvBarButton, TvCard, TvHeading, TvRow, TvSpotlight, TvTile };
