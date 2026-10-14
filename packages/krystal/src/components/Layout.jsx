// Layout — the four boxes a page's structure is built from, so a site draws no flex or grid wrapper of
// its own: Stack (a vertical flow), Cluster (a wrapping row), Grid (columns that fit the width) and
// Container (the page's centred column).
//
// `gap` is a step of the spacing scale (0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20: `--s-N`) or a name for
// one: xs (1), sm (2), md (4), lg (6), xl (8). Anything else leaves the box's own default, a `--s-4`.
// Every box takes `as` for its element (a `ul` for a list, a `section` for a page region) and passes
// `className`, `style` and the rest of its props to that element.

const SCALE = new Set([0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20]);
const NAMED = { xs: 1, sm: 2, md: 4, lg: 6, xl: 8 };

/** @param {string | number | undefined} gap @returns {string | undefined} */
function gapVar(gap) {
  if (gap === undefined) return undefined;
  const step = typeof gap === "string" && gap in NAMED ? NAMED[/** @type {keyof typeof NAMED} */ (gap)] : Number(gap);
  return SCALE.has(step) ? "var(--s-" + step + ")" : undefined;
}

/** @param {string} base @param {Array<string | false | undefined>} parts */
function classes(base, parts) {
  return [base, ...parts.filter(Boolean)].join(" ");
}

/**
 * @typedef {object} LayoutOwnProps
 * @property {import("react").ElementType} [as] The element drawn. Defaults to a `div`.
 * @property {"xs" | "sm" | "md" | "lg" | "xl" | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20} [gap] A spacing step or its name.
 * @property {string} [className]
 * @property {import("react").CSSProperties} [style]
 * @property {import("react").ReactNode} [children]
 */

/**
 * @typedef {object} StackOwnProps
 * @property {"start" | "center" | "end" | "stretch"} [align] Cross-axis alignment; stretch by default.
 * @typedef {StackOwnProps & LayoutOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof StackOwnProps | keyof LayoutOwnProps>} StackProps
 */
// Stack — children in a column, `gap` apart.
/** @param {StackProps} props */
function Stack({ as: Tag = "div", gap, align, className, style, children, ...rest }) {
  const g = gapVar(gap);
  return (
    <Tag {...rest} className={classes("k-stack", [align && "k-stack--align-" + align, className])}
      style={g ? { "--k-gap": g, ...style } : style}>
      {children}
    </Tag>
  );
}

/**
 * @typedef {object} ClusterOwnProps
 * @property {"start" | "center" | "end" | "baseline" | "stretch"} [align] Cross-axis alignment; center by default.
 * @property {"start" | "center" | "end" | "between"} [justify] Main-axis distribution; start by default.
 * @property {boolean} [nowrap] Keeps the row on one line.
 * @typedef {ClusterOwnProps & LayoutOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof ClusterOwnProps | keyof LayoutOwnProps>} ClusterProps
 */
// Cluster — children in a row that wraps, `gap` apart: a toolbar, a set of tags, a pair of buttons.
/** @param {ClusterProps} props */
function Cluster({ as: Tag = "div", gap, align, justify, nowrap, className, style, children, ...rest }) {
  const g = gapVar(gap);
  return (
    <Tag {...rest}
      className={classes("k-cluster", [align && "k-cluster--align-" + align, justify && "k-cluster--justify-" + justify, nowrap && "k-cluster--nowrap", className])}
      style={g ? { "--k-gap": g, ...style } : style}>
      {children}
    </Tag>
  );
}

/**
 * @typedef {object} GridOwnProps
 * @property {number | string} [min] The narrowest a column gets (a number is pixels, a string any CSS length): as many columns fit as the width holds, each growing to share the row. 240 by default.
 * @property {number} [cols] A fixed number of equal columns, in place of `min`.
 * @property {boolean} [fill] With `min`, keeps the empty columns instead of growing the filled ones to take them.
 * @typedef {GridOwnProps & LayoutOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof GridOwnProps | keyof LayoutOwnProps>} GridProps
 */
// Grid — equal columns. `min` makes it responsive (260 draws one column on a phone and as many as fit
// on a desktop); `cols` fixes the count.
/** @param {GridProps} props */
function Grid({ as: Tag = "div", gap, min, cols, fill, className, style, children, ...rest }) {
  const g = gapVar(gap);
  /** @type {Record<string, string>} */
  const vars = {};
  if (g) vars["--k-gap"] = g;
  if (cols) vars["--k-grid-cols"] = String(cols);
  else if (min !== undefined) vars["--k-grid-min"] = typeof min === "number" ? min + "px" : min;
  return (
    <Tag {...rest}
      className={classes("k-grid", [cols && "k-grid--cols", fill && "k-grid--fill", className])}
      style={{ ...vars, ...style }}>
      {children}
    </Tag>
  );
}

/**
 * @typedef {object} ContainerOwnProps
 * @property {"sm" | "md" | "lg" | "xl" | "full"} [size] The column's widest: sm 640, md 880, lg 1120, xl the page width (`--content-max`), full no cap. xl by default.
 * @property {boolean} [flush] Drops the side gutter.
 * @typedef {ContainerOwnProps & Omit<LayoutOwnProps, "gap"> & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof ContainerOwnProps | keyof LayoutOwnProps>} ContainerProps
 */
// Container — a column centred in the page, capped at `size`, with the site gutter at its sides.
/** @param {ContainerProps} props */
function Container({ as: Tag = "div", size = "xl", flush, className, children, ...rest }) {
  return (
    <Tag {...rest} className={classes("k-container k-container--" + size, [flush && "k-container--flush", className])}>
      {children}
    </Tag>
  );
}

export { Stack, Cluster, Grid, Container };
