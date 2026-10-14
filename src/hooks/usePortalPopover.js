// usePortalPopover — a generic hook for portaled popovers that float over the
// page (z-indexed above any docked panel). Returns { pos, menuRef }: render via
// createPortal(..., document.body) with style={pos} and attach menuRef (a callback ref).
// Floating UI places it against the anchor — flipped to the side with room and shifted to stay inside
// the window — and follows the anchor when the page moves it; outside-click closes.
// `options.placement` overrides the side and alignment; by default the popover opens below the anchor,
// lined up with the anchor's edge nearest the window's near side.

import React from "react";
import { useFloating, autoUpdate, offset, flip, shift, size } from "@floating-ui/react-dom";

const GAP = 8;
const EDGE = 8;

/**
 * @param {boolean} open
 * @param {(open: boolean) => void} setOpen
 * @param {import("react").RefObject<HTMLElement>} ref The anchor.
 * @param {{ placement?: import("@floating-ui/react-dom").Placement }} [options]
 * @returns {{ pos: import("react").CSSProperties | null, menuRef: (el: HTMLElement | null) => void }}
 */
function usePortalPopover(open, setOpen, ref, options) {
  const placement = options && options.placement;
  const [side, setSide] = React.useState(/** @type {import("@floating-ui/react-dom").Placement} */ ("bottom-start"));
  const { refs, floatingStyles, isPositioned } = useFloating({
    open,
    strategy: "fixed",
    placement: placement || side,
    transform: false,
    middleware: [
      offset(GAP),
      flip({ padding: EDGE }),
      shift({ padding: EDGE }),
      size({
        padding: EDGE,
        apply({ availableWidth, elements }) {
          elements.floating.style.maxWidth = Math.max(0, availableWidth) + "px";
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
  });
  const menuEl = React.useRef(null);
  const menuRef = React.useCallback((el) => {
    menuEl.current = el;
    refs.setFloating(el);
  }, [refs]);
  React.useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setSide((r.left + r.right) / 2 > window.innerWidth / 2 ? "bottom-end" : "bottom-start");
    refs.setReference(ref.current);
  }, [open, ref, refs]);

  React.useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (ref.current && ref.current.contains(e.target)) return;
      if (menuEl.current && menuEl.current.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, setOpen, ref]);

  const { position, top, left } = floatingStyles;
  // Hidden until the first measurement lands, so the popover never shows at the window's corner.
  const pos = open ? { position, top, left, visibility: /** @type {"visible" | "hidden"} */ (isPositioned ? "visible" : "hidden") } : null;
  return { pos, menuRef };
}

export { usePortalPopover };
