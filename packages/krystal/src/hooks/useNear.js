import React from "react";

// useNear — whether an element is near being seen, once it has been: what a part that draws artwork
// waits for before asking for its images, so parts further down a page or along a row cost nothing
// until then. The browser's own lazy loading reaches much further, which on a page a few screens tall
// is all of it.

/** How far ahead a part asks: half a screen past the screen, and half of each scroller past its edge. */
const AHEAD = { rootMargin: "50% 0px", scrollMargin: "50%" };

/**
 * One observer for each `ahead`, shared by every part that asks with it, made when the first one
 * does. `scrollMargin` is what reaches past a row's clipped edge; an engine without it could not see a
 * part there until it was scrolled into view, so there it is `null`, every part is near from the
 * start, and its images are left to the browser's own lazy loading.
 */
const observers = new Map();
/**
 * @typedef {object} NearMargins
 * @property {string} rootMargin
 * @property {string} scrollMargin
 */
/**
 * @param {NearMargins} ahead
 * @returns {{ watch(el: Element, near: () => void): () => void } | null}
 */
function observer(ahead) {
  const key = ahead.rootMargin + "|" + ahead.scrollMargin;
  if (observers.has(key)) return observers.get(key);
  if (typeof IntersectionObserver !== "function" || !("scrollMargin" in IntersectionObserver.prototype)) {
    observers.set(key, null);
    return null;
  }
  const waiting = new Map();
  const watcher = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const near = waiting.get(entry.target);
      waiting.delete(entry.target);
      watcher.unobserve(entry.target);
      if (near) near();
    }
  }, ahead);
  const shared = {
    watch(el, near) {
      waiting.set(el, near);
      watcher.observe(el);
      return () => { waiting.delete(el); watcher.unobserve(el); };
    },
  };
  observers.set(key, shared);
  return shared;
}

/**
 * Whether the element `ref` holds is near being seen, once it has been. `ahead` is how far: an
 * IntersectionObserver's `rootMargin` and `scrollMargin`, the same object for every call that shares
 * one observer.
 */
/**
 * @param {import("react").RefObject<Element>} ref
 * @param {NearMargins} [ahead]
 * @returns {boolean}
 */
export function useNear(ref, ahead = AHEAD) {
  const [near, setNear] = React.useState(() => observer(ahead) === null);
  React.useEffect(() => {
    if (near || !ref.current) return undefined;
    return observer(ahead).watch(ref.current, () => setNear(true));
  }, [near, ref, ahead]);
  return near;
}
