import { icons } from "lucide-react";

// Icon — wraps lucide-react so call sites name icons in kebab-case, the way
// Lucide's own catalogue does (e.g. <Icon name="rotate-cw" />).
//
// lucide-react ships each icon as a PascalCase component plus an `icons` map.
// We convert the kebab name and look it up; unknown names render an empty,
// correctly-sized box so layout never jumps.
const toPascal = (name) =>
  String(name || "")
    .split(/[-_]/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");

// Kebab names that resolve to a differently-named lucide-react component.
const ALIASES = {
  home: "House",
  "line-chart": "ChartLine",
  "loader-2": "LoaderCircle",
};

// Lucide names a glyph in a shape shape-first (`circle-x`, `triangle-alert`, `square-terminal`), and
// many call sites, including names that arrive as data, write it glyph-first (`x-circle`,
// `alert-triangle`, `check-circle-2`). A name that does not resolve is tried shape-first, its
// trailing variant number dropped.
const GLYPH_IN_SHAPE = /^(.+)-(circle|square|triangle)(?:-\d+)?$/;

/** @param {string} name */
function lookup(name) {
  const direct = icons[ALIASES[name] || toPascal(name)];
  if (direct) return direct;
  const m = GLYPH_IN_SHAPE.exec(String(name || ""));
  return m ? icons[toPascal(m[2] + "-" + m[1])] : undefined;
}

/**
 * @param {object} props
 * @param {string} props.name A Lucide icon name in kebab-case.
 * @param {number} [props.size]
 * @param {number} [props.strokeWidth]
 * @param {string} [props.className]
 * @param {import("react").CSSProperties} [props.style]
 */
export function Icon({ name, size = 18, strokeWidth = 1.7, className, style }) {
  const Cmp = lookup(name);
  const base = { display: "inline-flex", ...(style || {}) };
  if (!Cmp) {
    if (import.meta.env.DEV && name) console.warn(`[Icon] unknown lucide icon: "${name}"`);
    return <span className={className} style={{ ...base, width: size, height: size }} aria-hidden="true" />;
  }
  return <Cmp size={size} strokeWidth={strokeWidth} className={className} style={base} aria-hidden="true" />;
}

export default Icon;
