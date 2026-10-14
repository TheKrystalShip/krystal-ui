import { Icon } from "./Icon.jsx";

// Pill — the one small non-interactive label every surface draws: a count after a nav link or a tab,
// a state on a card, a kind on a list row.
//
//   tone   neutral (default) | accent | info | ok | warn | danger | muted
//          neutral is the quiet count, muted the quieter state ("Locked"), accent the one solid fill
//   size   md (default) | sm — a dense strip such as a tab row or a card's title line takes sm
//   icon   a Lucide name drawn before the text
//   dot    a leading status dot instead of an icon; `"live"` colours it as a running thing,
//          `true` leaves it the pill's own ink
//   dotClassName   a class on the dot, for a component that keeps its own name for it
//
// A site's own class beside `k-pill` (`className`) restyles one placement: position, a scrim behind
// artwork, a solid fill on a corner pip. Anything else spreads onto the span.
/**
 * @typedef {object} PillOwnProps
 * @property {"neutral" | "accent" | "info" | "ok" | "warn" | "danger" | "muted"} [tone] The colour family; neutral by default.
 * @property {string} [icon] A Lucide name drawn before the text.
 * @property {boolean | "live"} [dot] A leading status dot instead of an icon; "live" colours it as a running thing.
 * @property {"sm" | "md"} [size] `sm` or `md`; md by default.
 * @property {string} [className] Class name added to the root element.
 * @property {string} [dotClassName] A class on the dot.
 * @property {import("react").ReactNode} [children] The label.
 * @typedef {PillOwnProps & Omit<import("react").ComponentPropsWithoutRef<"span">, keyof PillOwnProps>} PillProps
 */
/** @param {PillProps} props */
function Pill({ tone = "neutral", icon, dot, size = "md", className, dotClassName, children, ...rest }) {
  return (
    <span {...rest} className={"k-pill k-pill--" + tone + " k-pill--" + size + (className ? " " + className : "")}>
      {dot ? <span className={"k-pill__dot" + (dot === "live" ? " k-is-live" : "") + (dotClassName ? " " + dotClassName : "")} aria-hidden="true"></span>
        : icon ? <Icon name={icon} size={size === "sm" ? 10 : 12} className="k-pill__icon" /> : null}
      {children}
    </span>
  );
}

export { Pill };
