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
// them whatever the site puts there (an overview, its actions). `size` "lg" opens a page; "md" sits
// above a row and describes the card focused in it.
/**
 * @param {object} props
 * @param {import("react").ReactNode} [props.eyebrow] A line above the name.
 * @param {import("react").ReactNode} props.title The thing's name.
 * @param {import("react").ReactNode} [props.meta] A line of facts under the name.
 * @param {"lg" | "md"} [props.size] `lg` opens a page; `md` sits above a row.
 * @param {string} [props.className] Extra class names on the root element.
 * @param {import("react").ReactNode} [props.children] What sits below the facts, such as an overview or actions.
 */
function TvSpotlight({ eyebrow, title, meta, size = "lg", className, children }) {
  return (
    <section className={"k-tv-spot k-tv-spot--" + size + (className ? " " + className : "")}>
      {eyebrow && <span className="k-tv-spot__eyebrow">{eyebrow}</span>}
      <h1 className="k-tv-spot__title">{title}</h1>
      {meta && <div className="k-tv-spot__meta">{meta}</div>}
      {children}
    </section>
  );
}

// TvRow — one row of cards that runs past the right of the screen: a heading with its icon and count,
// then the cards, then `end`, the tile that leads past the row. It is a `data-tv-row`, which a
// navigator places on the page's line when focus is in it.
/**
 * @param {object} props
 * @param {string} [props.icon] A Lucide name.
 * @param {import("react").ReactNode} props.title The row's heading.
 * @param {import("react").ReactNode} [props.count] A figure after the heading.
 * @param {import("react").ReactNode} [props.end] The tile that leads past the row.
 * @param {string} [props.className] Extra class names on the root element.
 * @param {import("react").ReactNode} [props.children] The row's cards.
 */
function TvRow({ icon, title, count, end, className, children }) {
  return (
    <section className={"k-tv-row" + (className ? " " + className : "")} data-tv-row="">
      <h2 className="k-tv-row__head">
        {icon && <Icon name={icon} size={14} />}
        {title}
        {count != null && <span className="k-tv-row__count">{count}</span>}
      </h2>
      <div className="k-tv-row__track">
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
 * @property {string} [className] Extra class names on the root element.
 * @property {import("react").ReactNode} [children] Drawn over the picture.
 * @typedef {TvCardOwnProps & Omit<import("react").ComponentPropsWithoutRef<"a">, keyof TvCardOwnProps>} TvCardProps
 */
/** @type {import("react").ForwardRefExoticComponent<TvCardProps & import("react").RefAttributes<HTMLAnchorElement>>} */
const TvCard = React.forwardRef(function TvCard({ art, shape = "poster", label, progress, badge, className, children, ...rest }, ref) {
  const own = React.useRef(null);
  const near = useNear(own, CARD_AHEAD);
  const attach = React.useCallback((el) => {
    own.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  }, [ref]);
  return (
    <a ref={attach} className={"k-tv-card k-tv-card--" + shape + (className ? " " + className : "")} aria-label={label} {...rest}>
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

export { TvBackdrop, TvBar, TvBarButton, TvCard, TvRow, TvSpotlight, TvTile };
