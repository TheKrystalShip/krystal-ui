import React from "react";
import { Icon } from "./Icon.jsx";
import { Pill } from "./Pill.jsx";

// Rail — a horizontal, scroll-snapped shelf inside a brief card, so one row can
// reach a WHOLE collection instead of rendering only what fits.
//
// It is a real scroll container, not a transform carousel, and that is the whole
// point: swipe on touch is native scrolling (momentum, rubber-band, no
// swipe-vs-tap ambiguity against cards that are themselves click targets),
// trackpad and shift-wheel work for free, and tabbing to an off-screen card
// scrolls it into view. The arrows only call `scrollBy` — there is no slide
// index to keep, so nothing can desync from what is on screen.
//
// How many cards fit is decided in CSS, by container query units against
// `--rail-per-view` (see styles/rail.css) — deliberately a FRACTION, so the next
// card is always cut off at the right edge. That peek is the primary "there is
// more" affordance; the arrows and the edge fade are the secondary ones.
//
// `perView` is how many cards the shelf shows: a number, or an object of stops keyed by the rail's own
// width in pixels, each the count from that width up (`{ 0: 1.25, 430: 2.35, 640: 3.4, 1000: 5.4 }`).
// The rail measures itself, so the count follows whatever narrows it. `--rail-per-view` is the same
// number as a custom property: set on the rail or any ancestor it is the default, and `perView` wins.
//
/**
 * @template T
 * @param {object} props
 * @param {string} [props.icon] A Lucide name.
 * @param {string} props.title The shelf's heading; it also names the scroll arrows.
 * @param {import("react").ReactNode} [props.count] A figure after the heading, such as the collection's size.
 * @param {import("react").ReactNode} [props.pin] A node in the header beside the arrows.
 * @param {() => void} [props.onViewAll] Draws a view-all button in the header; called when it is pressed.
 * @param {string} [props.viewAllLabel] The view-all button's words.
 * @param {T[]} props.items The collection the shelf scrolls through.
 * @param {(item: T) => import("react").ReactNode} props.renderItem Draws one item as a card.
 * @param {(item: T) => string | number} [props.itemKey] Defaults to `item.id`, then the index.
 * @param {boolean} [props.disabled] Hides the arrows and leaves the row without horizontal swipe.
 * @param {number | Record<number, number>} [props.perView] Cards in view: a number, or stops keyed by the rail's width in pixels, each the count from that width up.
 * @param {string} [props.variant] A modifier class, `k-rail--<variant>`, that a site's styles target.
 * @param {string} [props.className] Extra class names on the root element.
 * @param {import("react").CSSProperties} [props.style] Inline style on the root element.
 * @param {string} [props.ariaLabel] The scroller's accessible name; the title when left out.
 */
function Rail({ icon, title, count, pin, onViewAll, viewAllLabel = "View all", items, renderItem, itemKey, disabled = false, perView, variant, className, style, ariaLabel }) {
  const trackRef = React.useRef(null);
  const rootRef = React.useRef(null);
  const [width, setWidth] = React.useState(0);
  // atStart/atEnd drive the arrows' disabled state and which edge fades;
  // `scrollable` is false when everything already fits, which hides the arrows
  // entirely rather than showing two dead buttons.
  const [edge, setEdge] = React.useState({ start: true, end: true, scrollable: false });

  const measure = React.useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    if (rootRef.current) setWidth(rootRef.current.clientWidth);
    const max = el.scrollWidth - el.clientWidth;
    const x = el.scrollLeft;
    const next = { start: x <= 1, end: x >= max - 1, scrollable: max > 1 };
    setEdge(prev => (prev.start === next.start && prev.end === next.end && prev.scrollable === next.scrollable) ? prev : next);
  }, []);

  React.useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    // The rail's width changes with whatever sits beside it (a sidebar, a docked
    // panel), none of which resizes the window — so observe the track, not `resize`.
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", measure); ro.disconnect(); };
  }, [measure, items]);

  const page = (dir) => {
    const el = trackRef.current;
    if (!el || typeof el.scrollBy !== "function") return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Just under a full viewport, so the card that was peeking stays in sight and
    // the jump keeps its context.
    el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.9), behavior: reduce ? "auto" : "smooth" });
  };

  const showArrows = edge.scrollable && !disabled;
  let shown = null;
  if (typeof perView === "number") shown = perView;
  else if (perView && width > 0) {
    const stops = Object.keys(perView).map(Number).filter((k) => k <= width).sort((a, b) => a - b);
    if (stops.length) shown = perView[stops[stops.length - 1]];
  }

  return (
    <div ref={rootRef} className={"k-brief k-rail" + (variant ? " k-rail--" + variant : "") + (className ? " " + className : "")}
      style={style} data-disabled={disabled ? "" : undefined}>
      <div className="k-brief__head">
        <span className="k-brief__title">
          {icon ? <Icon name={icon} size={13} /> : null} {title}
          {count != null && <Pill size="sm" tone="muted" className="k-brief__count k-brief__count--neutral">{count}</Pill>}
        </span>
        <div className="k-rail__nav">
          {pin}
          {showArrows && (
            <>
              <button
                type="button" className="k-rail__arrow"
                aria-label={"Scroll " + title + " left"} title="Scroll left"
                disabled={edge.start} onClick={() => page(-1)}
              >
                <Icon name="chevron-left" size={15} strokeWidth={2.2} />
              </button>
              <button
                type="button" className="k-rail__arrow"
                aria-label={"Scroll " + title + " right"} title="Scroll right"
                disabled={edge.end} onClick={() => page(1)}
              >
                <Icon name="chevron-right" size={15} strokeWidth={2.2} />
              </button>
            </>
          )}
          {onViewAll && (
            <button className="k-view-all" onClick={onViewAll}>
              {viewAllLabel} <Icon name="arrow-right" size={11} strokeWidth={2.2} />
            </button>
          )}
        </div>
      </div>

      <div
        className="k-rail__track"
        ref={trackRef}
        style={shown != null ? /** @type {any} */ ({ "--rail-per-view": shown }) : undefined}
        role="group"
        aria-label={ariaLabel || title}
        tabIndex={0}
        // Claims the horizontal gesture so useMobileSwipe leaves it alone — a
        // card near the viewport edge sits inside the drawer's edge zone.
        data-hswipe={disabled ? undefined : ""}
        data-start={edge.start ? "" : undefined}
        data-end={edge.end ? "" : undefined}
      >
        {items.map((item, i) => (
          <div className="k-rail__item" key={itemKey ? itemKey(item) : (/** @type {any} */ (item).id ?? i)}>
            {renderItem(item)}
          </div>
        ))}
      </div>
    </div>
  );
}

export { Rail };
export default Rail;
