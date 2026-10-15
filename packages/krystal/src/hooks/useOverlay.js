// useOverlay — the floating panel behind Popover, Menu and Combobox's list: Floating UI placement
// through usePortalPopover, plus the dismissal every non-modal panel shares.
//
// Open panels form a module-level stack. Only the topmost one answers Escape, on `document`, and it
// marks the key handled (`preventDefault`) so a dialog around it stays open; a press anywhere outside
// the panel and its anchor closes it, and a press inside a panel opened from it (a menu in a popover)
// is inside both. `onClose` receives "escape" or "outside" and is read through a ref.
//
// `focusTrigger` is how a panel hands focus back: the anchor itself when it can take focus, else the
// first focusable inside it (an anchor that is a wrapper around the trigger).

import React from "react";
import { usePortalPopover } from "./usePortalPopover.js";

const FOCUSABLE = "a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])";
const stack = [];
const noop = () => {};

/**
 * @param {boolean} open
 * @param {(reason: "escape" | "outside") => void} onClose
 * @param {import("react").RefObject<HTMLElement>} anchorRef
 * @param {{ placement?: import("@floating-ui/react-dom").Placement, matchWidth?: boolean }} [options]
 *   `matchWidth` sets the panel's minimum width to the anchor's.
 * @returns {{ pos: import("react").CSSProperties | null, panelRef: (el: HTMLElement | null) => void,
 *   panelEl: import("react").MutableRefObject<HTMLElement | null>, ready: boolean }}
 */
function useOverlay(open, onClose, anchorRef, options) {
  const live = React.useRef(onClose);
  live.current = onClose;
  const panelEl = React.useRef(/** @type {HTMLElement | null} */ (null));
  // Outside presses are this hook's, so nested panels count as inside; the placement hook's own
  // handler is given nothing to call.
  const { pos, menuRef } = usePortalPopover(open, noop, anchorRef, options);
  const panelRef = React.useCallback((el) => { panelEl.current = el; menuRef(el); }, [menuRef]);

  React.useEffect(() => {
    if (!open) return undefined;
    const entry = { panel: panelEl, anchor: anchorRef };
    stack.push(entry);
    const onKey = (e) => {
      if (e.key !== "Escape" || e.defaultPrevented || stack[stack.length - 1] !== entry) return;
      e.preventDefault();
      live.current("escape");
    };
    const onPress = (e) => {
      const at = stack.indexOf(entry);
      const inside = stack.slice(at).some((x) => (x.panel.current && x.panel.current.contains(e.target))
        || (x.anchor.current && x.anchor.current.contains(e.target)));
      if (!inside) live.current("outside");
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPress, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPress, true);
      stack.splice(stack.indexOf(entry), 1);
    };
  }, [open, anchorRef]);

  const [width, setWidth] = React.useState(0);
  const matchWidth = !!(options && options.matchWidth);
  React.useLayoutEffect(() => {
    if (open && matchWidth && anchorRef.current) setWidth(anchorRef.current.getBoundingClientRect().width);
  }, [open, matchWidth, anchorRef]);

  const ready = !!pos && pos.visibility === "visible";
  const styled = pos && matchWidth && width ? { ...pos, minWidth: width } : pos;
  return { pos: styled, panelRef, panelEl, ready };
}

/**
 * Puts focus on the anchor, or on the first focusable control inside it.
 * @param {HTMLElement | null} anchor
 */
function focusTrigger(anchor) {
  if (!anchor) return;
  const target = anchor.matches(FOCUSABLE) ? anchor : /** @type {HTMLElement | null} */ (anchor.querySelector(FOCUSABLE));
  (target || anchor).focus({ preventScroll: true });
}

/**
 * What a panel does with focus when it closes. Escape returns it to the trigger. A press outside
 * leaves it where the press put it; when focus was inside the panel and the press landed on nothing
 * that takes focus, it falls to the document, so it returns to the trigger instead.
 * @param {"escape" | "outside"} reason
 * @param {HTMLElement | null} anchor
 * @param {HTMLElement | null} panel
 */
function returnFocus(reason, anchor, panel) {
  if (reason === "escape") { focusTrigger(anchor); return; }
  if (!panel || !panel.contains(document.activeElement)) return;
  setTimeout(() => {
    const at = document.activeElement;
    if (!at || at === document.body) focusTrigger(anchor);
  }, 0);
}

export { focusTrigger, returnFocus, useOverlay };
