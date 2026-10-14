import { Icon } from "./Icon.jsx";

// StatTile — one measured figure with its label: the glance card of a dashboard or an overview.
// `StatTiles` lays several in a responsive grid.
//
//   label   what the figure is, in small capitals; `icon` (a Lucide name) sits before it
//   value   the figure. A null or undefined value draws an explicit "—", read aloud as "unknown":
//           a figure nobody measured is never drawn as 0. A string or a node draws as given
//   unit    a small trailing unit
//   delta   a change beside the value, `deltaTone` ok | warn | danger | muted colouring it
//   sub     a quieter line under the figure
//   tone    ok | info | warn | danger | muted colours the value; warn and danger add a hairline along
//           the tile's top, so a calm surface stays quiet and a problem one stands out
//   spark   a node drawn under the figure: a trace, a meter, whatever the figure's own shape is
//   size    md (default) | sm, the dense variant for a band of many
// `onOpen` or `href` makes the whole tile a button or a link.
/**
 * @typedef {object} StatTileOwnProps
 * @property {import("react").ReactNode} label
 * @property {string} [icon] A Lucide name.
 * @property {import("react").ReactNode | null} [value] Null or undefined draws "unknown".
 * @property {import("react").ReactNode} [unit]
 * @property {import("react").ReactNode} [delta]
 * @property {"ok" | "warn" | "danger" | "muted"} [deltaTone]
 * @property {import("react").ReactNode} [sub]
 * @property {"ok" | "info" | "warn" | "danger" | "muted"} [tone]
 * @property {import("react").ReactNode} [spark]
 * @property {"sm" | "md"} [size]
 * @property {() => void} [onOpen]
 * @property {string} [href]
 * @property {string} [className]
 * @typedef {StatTileOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof StatTileOwnProps>} StatTileProps
 */
/** @param {StatTileProps} props */
function StatTile({ label, icon, value, unit, delta, deltaTone = "muted", sub, tone = "muted", spark, size = "md", onOpen, href, className, ...rest }) {
  const unknown = value == null;
  const openable = onOpen != null || href != null;
  const cls = "k-stat k-stat--" + tone + " k-stat--" + size + (openable ? " k-stat--open" : "") + (className ? " " + className : "");
  const head = (
    <span className="k-stat__label">
      {icon && <Icon name={icon} size={size === "sm" ? 11 : 12} />}
      <span className="k-stat__label-text">{label}</span>
    </span>
  );
  return (
    <div {...rest} className={cls}>
      {openable
        ? (href != null
          ? <a className="k-stat__open" href={href} onClick={onOpen}>{head}</a>
          : <button type="button" className="k-stat__open" onClick={onOpen}>{head}</button>)
        : head}
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
  );
}

/**
 * @typedef {object} StatTilesOwnProps
 * @property {string | number} [min] The narrowest a tile gets before the grid drops a column: a CSS length, a number is pixels.
 * @property {string} [className]
 * @property {import("react").ReactNode} [children]
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
