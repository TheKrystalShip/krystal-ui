import React from "react";
import { Icon } from "./Icon.jsx";
import { Pill } from "./Pill.jsx";
import { useScrollTrack } from "../hooks/useScrollTrack.js";

// Rail — a horizontal, scroll-snapped row inside a brief card, so one row can reach a WHOLE
// collection instead of rendering only what fits. The scrolling is useScrollTrack's, which Shelf
// shares; Rail is the framed form, for a dashboard's card, where Shelf sits on the page.
//
// How many cards fit is decided in CSS, by container query units against `--rail-per-view` (see
// styles/rail.css): deliberately a FRACTION, so the next card is always cut off at the right edge.
// That peek is the primary "there is more" affordance; the arrows and the edge fade are the
// secondary ones.
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
  const { rootRef, trackRef, edge, shown, page } = useScrollTrack(perView, items);
  const showArrows = edge.scrollable && !disabled;

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
        // Claims the horizontal gesture so useEdgeSwipe leaves it alone — a
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
