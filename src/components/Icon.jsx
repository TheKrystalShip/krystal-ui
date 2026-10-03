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
  "alert-triangle": "TriangleAlert",
  "help-circle": "CircleHelp",
  home: "House",
  "line-chart": "ChartLine",
  "loader-2": "LoaderCircle",
  "terminal-square": "SquareTerminal",
};

export function Icon({ name, size = 18, strokeWidth = 1.7, className, style }) {
  const Cmp = icons[ALIASES[name] || toPascal(name)];
  const base = { display: "inline-flex", ...(style || {}) };
  if (!Cmp) {
    if (import.meta.env.DEV && name) console.warn(`[Icon] unknown lucide icon: "${name}"`);
    return <span className={className} style={{ ...base, width: size, height: size }} aria-hidden="true" />;
  }
  return <Cmp size={size} strokeWidth={strokeWidth} className={className} style={base} aria-hidden="true" />;
}

export default Icon;
