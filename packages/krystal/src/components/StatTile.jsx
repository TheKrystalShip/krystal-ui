import { Icon } from "./Icon.jsx";

// StatTile — one measured figure under a titled head: the glance card of a dashboard or an overview,
// in the briefing card's frame (an icon and uppercase title, the head's own controls, a divider, then
// the figure).
// `StatTiles` lays several in a responsive grid.
//
//   label   what the figure is, in small capitals; `icon` (a Lucide name) sits before it
//   value   the figure. A null or undefined value draws an explicit "—", read aloud as "unknown":
//           a figure nobody measured is never drawn as 0. A string or a node draws as given
//   unit    a small trailing unit
//   aside   a node at the head's end (a status dot, a pin). It is its own target: a press on it is
//           never a press on the tile
//   onView  draws a "View →" button at the head's end, named by `viewLabel`; at size sm the word drops
//           and the arrow stays, the label as its accessible name
//   delta   a change beside the value, `deltaTone` ok | warn | danger | muted colouring it
//   sub     a quieter line under the figure
//   tone    ok | info | warn | danger | muted | off colours the value (off is a dark, disabled grey); warn and danger add a hairline along
//           the tile's top, so a calm surface stays quiet and a problem one stands out
//   emphasis the hairline along the top is drawn on every tone (ok and info too), as the at-a-glance cue of a band
//   stale   the figure is the last one measured, not live: a dashed frame, the label and sub quiet; the colours
//           ease over when it changes
//   wrapSub the sub wraps over lines instead of ending in an ellipsis
//   deltaEnd the delta (and whatever the site puts in it) sits at the far end of the figure's row
//   spark   a node drawn under the figure: a trace, a meter, whatever the figure's own shape is
//   size    md (default) | sm, the dense variant for a band of many
// `onOpen` or `href` makes the whole tile a button or a link.
/**
 * @typedef {object} StatTileOwnProps
 * @property {import("react").ReactNode} label What the figure is, in small capitals.
 * @property {string} [icon] A Lucide name.
 * @property {import("react").ReactNode | null} [value] Null or undefined draws "unknown".
 * @property {import("react").ReactNode} [unit] A small trailing unit after the value.
 * @property {import("react").ReactNode} [aside] A node at the head's end, before the View button; controls in it stay pressable on an openable tile.
 * @property {() => void} [onView] Draws a "View" button with an arrow at the head's end.
 * @property {string} [viewLabel] The View button's words, and at size `sm` its accessible name; "View" by default.
 * @property {import("react").ReactNode} [delta] A change drawn beside the value.
 * @property {"ok" | "warn" | "danger" | "muted"} [deltaTone] `ok`, `warn`, `danger` or `muted`; colours the delta.
 * @property {import("react").ReactNode} [sub] A quieter line under the figure.
 * @property {"ok" | "info" | "warn" | "danger" | "muted" | "off"} [tone] Colours the value: `ok`, `info`, `warn`, `danger`, `muted` or `off` (a disabled grey); `warn` and `danger` add a hairline along the top.
 * @property {boolean} [emphasis] Draws the top hairline on every tone, not only `warn` and `danger`.
 * @property {boolean} [stale] The figure is the last one measured: a dashed frame and a quiet label and sub.
 * @property {boolean} [wrapSub] The sub wraps over lines instead of ending in an ellipsis.
 * @property {boolean} [deltaEnd] The delta sits at the far end of the figure's row.
 * @property {import("react").ReactNode} [spark] A node under the figure: a trace, a meter, whatever the figure's own shape is.
 * @property {"sm" | "md"} [size] `sm` is the dense variant for a band of many; `md` otherwise.
 * @property {() => void} [onOpen] Makes the whole tile a button; called when it is pressed.
 * @property {string} [href] Makes the whole tile a link.
 * @property {string} [className] Extra class names on the root element.
 * @typedef {StatTileOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof StatTileOwnProps>} StatTileProps
 */
/** @param {StatTileProps} props */
function StatTile({ label, icon, value, unit, aside, onView, viewLabel = "View", delta, deltaTone = "muted", sub, tone = "muted", emphasis = false, stale = false, wrapSub = false, deltaEnd = false, spark, size = "md", onOpen, href, className, ...rest }) {
  const unknown = value == null;
  const openable = onOpen != null || href != null;
  const cls = "k-stat k-stat--" + tone + " k-stat--" + size + (openable ? " k-stat--open" : "") + (emphasis ? " k-stat--emphasis" : "") + (stale ? " k-is-stale" : "") + (wrapSub ? " k-stat--wrapsub" : "") + (deltaEnd ? " k-stat--deltaend" : "") + (className ? " " + className : "");
  const head = (
    <span className="k-stat__label">
      {icon && <Icon name={icon} size={size === "sm" ? 11 : 12} />}
      <span className="k-stat__label-text">{label}</span>
    </span>
  );
  const labelRow = openable
    ? (href != null
      ? <a className="k-stat__open" href={href} onClick={onOpen}>{head}</a>
      : <button type="button" className="k-stat__open" onClick={onOpen}>{head}</button>)
    : head;
  const small = size === "sm";
  return (
    <div {...rest} className={cls}>
      <div className="k-stat__head">
        {labelRow}
        {aside != null && <div className="k-stat__aside">{aside}</div>}
        {onView && (
          <button type="button" className="k-stat__view" onClick={onView}
            aria-label={small ? viewLabel + " " + (typeof label === "string" ? label : "") : undefined}>
            {!small && viewLabel + " "}<Icon name="arrow-right" size={11} strokeWidth={2.2} />
          </button>
        )}
      </div>
      <div className="k-stat__body">
      <div className="k-stat__figure">
        <span className={"k-stat__value" + (unknown ? " k-is-unknown" : "")}>
          {unknown ? <><span aria-hidden="true">—</span><span className="k-stat__sr">unknown</span></> : value}
        </span>
        {!unknown && unit != null && <span className="k-stat__unit">{unit}</span>}
        {delta != null && <span className={"k-stat__delta k-stat__delta--" + deltaTone}>{delta}</span>}
      </div>
      {sub != null && <div className="k-stat__sub">{sub}</div>}
      {spark != null && <div className="k-stat__spark">{spark}</div>}
      </div>
    </div>
  );
}

/**
 * @typedef {object} StatTilesOwnProps
 * @property {string | number} [min] The narrowest a tile gets before the grid drops a column: a CSS length, a number is pixels.
 * @property {string} [className] Extra class names on the grid.
 * @property {import("react").ReactNode} [children] The StatTile cells.
 * @typedef {StatTilesOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof StatTilesOwnProps>} StatTilesProps
 */
/** @param {StatTilesProps} props */
function StatTiles({ min = 180, className, style, children, ...rest }) {
  const track = typeof min === "number" ? min + "px" : min;
  return (
    <div {...rest} className={"k-stats" + (className ? " " + className : "")}
      style={/** @type {any} */ ({ "--k-stats-min": track, ...style })}>
      {children}
    </div>
  );
}

export { StatTile, StatTiles };
