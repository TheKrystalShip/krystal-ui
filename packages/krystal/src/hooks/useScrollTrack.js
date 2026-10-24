import React from "react";

// useScrollTrack — the horizontal scrolling that Rail and Shelf share. The track is a real scroll
// container, not a transform carousel: swipe on touch is native scrolling (momentum, rubber-band, no
// swipe-vs-tap ambiguity against cards that are themselves click targets), trackpad and shift-wheel
// work for free, and tabbing to an off-screen card scrolls it into view. The arrows only call
// `scrollBy`, so there is no slide index to keep and nothing can desync from what is on screen.
//
// It measures whether the track is at either end (the arrows' disabled state and which edge fades),
// whether it scrolls at all (a row that fits draws no arrows), and the root's width, against which a
// `perView` of stops resolves to the count in view.
//
/**
 * @typedef {object} ScrollTrack
 * @property {import("react").RefObject<any>} rootRef The element, of any kind, whose width resolves `perView`'s stops.
 * @property {import("react").RefObject<HTMLDivElement>} trackRef The scroll container.
 * @property {{ start: boolean, end: boolean, scrollable: boolean }} edge Whether the track is at its start, at its end, and whether it scrolls at all.
 * @property {number | null} shown The count in view `perView` resolves to at the root's width; null when it names none.
 * @property {(dir: -1 | 1) => void} page Scrolls the track one view back (-1) or on (1).
 */
/**
 * @param {number | Record<number, number>} [perView] Cards in view: a number, or stops keyed by the root's width in pixels, each the count from that width up.
 * @param {unknown} [content] Anything that changes what the track holds; the track is measured again when it changes.
 * @returns {ScrollTrack}
 */
export function useScrollTrack(perView, content) {
  const trackRef = React.useRef(null);
  const rootRef = React.useRef(null);
  const [width, setWidth] = React.useState(0);
  const [edge, setEdge] = React.useState({ start: true, end: true, scrollable: false });

  const measure = React.useCallback(() => {
    const el = trackRef.current;
    if (rootRef.current) setWidth(rootRef.current.clientWidth);
    if (!el) return;
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
    // The track's width changes with whatever sits beside it (a sidebar, a docked panel), none of
    // which resizes the window, so the track is observed rather than `resize`.
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", measure); ro.disconnect(); };
  }, [measure, content]);

  const page = React.useCallback((dir) => {
    const el = trackRef.current;
    if (!el || typeof el.scrollBy !== "function") return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Just under a full view, so the card that was peeking stays in sight and the jump keeps its context.
    el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.9), behavior: reduce ? "auto" : "smooth" });
  }, []);

  let shown = null;
  if (typeof perView === "number") shown = perView;
  else if (perView && width > 0) {
    const stops = Object.keys(perView).map(Number).filter((k) => k <= width).sort((a, b) => a - b);
    if (stops.length) shown = perView[stops[stops.length - 1]];
  }

  return { rootRef, trackRef, edge, shown, page };
}
