// usePortalPopover — a generic hook for portaled popovers that float over the
// page (z-indexed above any docked panel). Returns { pos, menuRef }: render via
// createPortal(..., document.body) with style={pos} and attach menuRef.
// Auto-places on both axes, and follows the button when the page moves it; outside-click closes.

import React from "react";

function usePortalPopover(open, setOpen, ref) {
  const menuRef = React.useRef(null);
  const [pos, setPos] = React.useState(null);
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (ref.current && ref.current.contains(e.target)) return;
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, setOpen, ref]);
  React.useLayoutEffect(() => {
    if (!open) return;
    let at = null;
    const place = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      at = r.top + "," + r.left;
      const vw = window.innerWidth, vh = window.innerHeight;
      const horiz = (r.left + r.right) / 2 > vw / 2
        ? { right: Math.round(vw - r.right) }
        : { left: Math.round(Math.max(0, r.left)) };
      const vert = r.top > vh / 2
        ? { bottom: Math.round(vh - r.top + 8) }
        : { top: Math.round(r.bottom + 8) };
      setPos({ ...horiz, ...vert });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    // A layout change that is neither moves the button too (a bar coming back, a panel growing): each
    // frame the popover is open compares where the button stands with where it was placed against.
    let frame = 0;
    const follow = () => {
      const el = ref.current;
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.top + "," + r.left !== at) place();
      }
      frame = requestAnimationFrame(follow);
    };
    frame = requestAnimationFrame(follow);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, ref]);
  return { pos, menuRef };
}

export { usePortalPopover };
