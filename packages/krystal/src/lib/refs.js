import React from "react";

// Helpers for a component that clones its single child element to wire a ref and handlers onto it.

/**
 * The ref the element already carries, wherever this React version keeps it.
 * @param {import("react").ReactElement} element
 */
function elementRef(element) {
  const props = /** @type {any} */ (element.props);
  if (props && props.ref !== undefined) return props.ref;
  return Number.parseInt(React.version, 10) >= 19 ? null : /** @type {any} */ (element).ref;
}

/**
 * One callback ref that fills every ref given.
 * @param {...(import("react").Ref<any> | undefined | null)} refs
 * @returns {(el: any) => void}
 */
function mergeRefs(...refs) {
  return (el) => {
    refs.forEach((r) => {
      if (typeof r === "function") r(el);
      else if (r) /** @type {any} */ (r).current = el;
    });
  };
}

/**
 * An element's own handler runs first; the wired one runs unless it called preventDefault.
 * @template {Function} F
 * @param {F | undefined} own
 * @param {(event: any) => void} wired
 */
function chain(own, wired) {
  return (event) => {
    if (own) own(event);
    if (!event.defaultPrevented) wired(event);
  };
}

export { chain, elementRef, mergeRefs };
