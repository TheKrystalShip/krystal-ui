import React from "react";

// Phones only: a swipe in from the LEFT edge opens the drawer, a swipe in from the RIGHT edge opens
// the dock, and a swipe the other way closes whichever is open. Bound only below 769px.
//
// An element marked `data-hswipe` owns its own sideways gesture (a horizontal scroller whose items
// sit inside the edge zone), so a touch that starts inside one is left alone.
/**
 * @param {boolean} drawerOpen
 * @param {(open: boolean) => void} setDrawerOpen
 * @param {boolean} [dockOpen]
 * @param {(open: boolean) => void} [setDockOpen]
 */
function useEdgeSwipe(drawerOpen, setDrawerOpen, dockOpen, setDockOpen) {
  React.useEffect(() => {
    if (window.innerWidth > 768) return undefined;
    let sx = 0, sy = 0, fromLeft = false, fromRight = false, tracking = false;
    const EDGE = 28, THRESH = 60;
    const onStart = (e) => {
      const t = e.touches[0];
      if (e.target && e.target.closest && e.target.closest("[data-hswipe]")) {
        tracking = false;
        return;
      }
      sx = t.clientX; sy = t.clientY;
      fromLeft = sx <= EDGE;
      fromRight = sx >= window.innerWidth - EDGE;
      tracking = fromLeft || fromRight || drawerOpen || dockOpen;
    };
    const onEnd = (e) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) < THRESH || Math.abs(dy) > Math.abs(dx)) return;
      if (dx > 0) {
        if (fromLeft && !drawerOpen) setDrawerOpen(true);
        else if (dockOpen) setDockOpen(false);
      } else {
        if (fromRight && !dockOpen && setDockOpen) setDockOpen(true);
        else if (drawerOpen) setDrawerOpen(false);
      }
    };
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-binds on open/close; the setters are stable
  }, [drawerOpen, dockOpen]);
}

export { useEdgeSwipe };
