import React from "react";
import { Icon } from "./Icon.jsx";
import { useScrollTrack } from "../hooks/useScrollTrack.js";

// Shelf — a titled section of a page whose items stand in one row that scrolls sideways: a heading
// with an optional line under it and an `action` opposite (a View all link), optional `controls` under
// the heading (chips that narrow what it shows), then the row. It has no frame of its own: it sits on
// the page, where Rail sits in a brief card. The scrolling is useScrollTrack's, which Rail shares.
//
// How many items stand in view is `--k-shelf-per-view`, resolved against the shelf's own width by
// container query (styles/shelf.css): a fraction, so the next item is cut off at the edge and says
// there is more. `perView` sets it, as a number or as stops keyed by the shelf's width.
//
// Borderless arrows beside the action page the row on a desktop pointer, and only while the row
// overflows. A touch screen swipes it, and a television scrolls it to whatever takes focus, so
// neither draws them.
//
/**
 * @param {object} props
 * @param {import("react").ReactNode} props.title The shelf's heading; a string also names the scroll arrows.
 * @param {import("react").ReactNode} [props.sub] A line under the heading.
 * @param {import("react").ReactNode} [props.action] A control opposite the heading, such as a View all link.
 * @param {import("react").ReactNode} [props.controls] A row under the heading, such as chips that narrow the items.
 * @param {number | Record<number, number>} [props.perView] Items in view: a number, or stops keyed by the shelf's width in pixels, each the count from that width up. 4.3 when left out, and 2.2 once the shelf is narrower than 560px.
 * @param {import("react").ReactNode} [props.empty] Drawn in place of the row when there are no items.
 * @param {"h2" | "h3"} [props.headingLevel] The heading's element; h2 when left out.
 * @param {import("react").ReactNode} [props.children] The items, each a cell of the row.
 * @param {string} [props.className] Extra class names on the root element.
 * @param {import("react").CSSProperties} [props.style] Inline style on the root element.
 */
function Shelf({ title, sub, action, controls, perView, empty, headingLevel = "h2", children, className, style }) {
  const id = React.useId();
  const Heading = headingLevel;
  const items = React.Children.toArray(children).filter(Boolean);
  const { rootRef, trackRef, edge, shown, page } = useScrollTrack(perView, items.length);
  const named = typeof title === "string" ? title + " " : "";
  return (
    <section ref={rootRef} className={"k-shelf" + (className ? " " + className : "")} style={style} aria-labelledby={id}>
      <div className="k-shelf__head">
        <div className="k-shelf__titles">
          <Heading id={id} className="k-shelf__title">{title}</Heading>
          {sub && <span className="k-shelf__sub">{sub}</span>}
        </div>
        {(edge.scrollable || action) && (
          <div className="k-shelf__nav">
            {edge.scrollable && (
              <>
                <button type="button" className="k-shelf__arrow" aria-label={"Scroll " + named + "left"} title="Scroll left"
                  aria-controls={id + "track"} disabled={edge.start} onClick={() => page(-1)}>
                  <Icon name="chevron-left" size={18} strokeWidth={2.2} />
                </button>
                <button type="button" className="k-shelf__arrow" aria-label={"Scroll " + named + "right"} title="Scroll right"
                  aria-controls={id + "track"} disabled={edge.end} onClick={() => page(1)}>
                  <Icon name="chevron-right" size={18} strokeWidth={2.2} />
                </button>
              </>
            )}
            {action && <div className="k-shelf__action">{action}</div>}
          </div>
        )}
      </div>
      {controls && <div className="k-shelf__controls">{controls}</div>}
      {items.length > 0 ? (
        <div
          id={id + "track"}
          className="k-shelf__track"
          ref={trackRef}
          style={shown != null ? /** @type {any} */ ({ "--k-shelf-per-view": shown }) : undefined}
          role="group"
          aria-labelledby={id}
          tabIndex={0}
          // Claims the horizontal gesture so useEdgeSwipe leaves it alone: an item near the viewport's
          // edge sits inside the drawer's edge zone.
          data-hswipe=""
          data-start={edge.start ? "" : undefined}
          data-end={edge.end ? "" : undefined}
        >
          {items.map((item) => <div className="k-shelf__item" key={/** @type {any} */ (item).key}>{item}</div>)}
        </div>
      ) : empty && <div className="k-shelf__empty">{empty}</div>}
    </section>
  );
}

export { Shelf };
