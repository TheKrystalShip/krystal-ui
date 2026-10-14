import React from "react";

/**
 * Open state a component holds itself until its caller controls it with `open`.
 * @param {boolean | undefined} open
 * @param {boolean} defaultOpen
 * @param {((open: boolean) => void) | undefined} onOpenChange
 * @returns {[boolean, (next: boolean) => void]}
 */
function useOpenState(open, defaultOpen, onOpenChange) {
  const [own, setOwn] = React.useState(defaultOpen);
  const controlled = open !== undefined;
  const current = controlled ? open : own;
  const live = React.useRef({ current, onOpenChange });
  live.current = { current, onOpenChange };
  const set = React.useCallback((next) => {
    if (next === live.current.current) return;
    if (!controlled) setOwn(next);
    if (live.current.onOpenChange) live.current.onOpenChange(next);
  }, [controlled]);
  return [current, set];
}

export { useOpenState };
