import React from "react";
import { createPortal } from "react-dom";
import { useOverlay } from "../hooks/useOverlay.js";
import { useOpenState } from "../hooks/useOpenState.js";
import { chain, elementRef, mergeRefs } from "../lib/refs.js";

// Popover — a non-modal floating panel anchored to a trigger, for content that is more than a list
// of commands: a filter form, a notification list, a short confirmation. It is the WAI-ARIA
// non-modal dialog pattern. The panel is portaled, placed by Floating UI beside the trigger and
// flipped to the side with room.
//
// `trigger` is one element, which the Popover clones with its ref, `aria-haspopup="dialog"`,
// `aria-expanded`, `aria-controls` and a click that toggles. Without a trigger the caller controls
// `open` and names the element the panel hangs from in `anchorRef`.
//
// Focus moves into the panel on open, to the first control (the panel itself when it holds none).
// Escape closes it and returns focus to the trigger; so does Tab past either end of the panel, which
// leaves focus on the trigger for the browser to move on from. A press outside closes it and leaves
// focus where the press put it.
//
// `title` is the panel's heading and its accessible name; a panel without a visible heading takes
// `label` instead. `children` may be a function, which receives `{ close }`.
/**
 * @typedef {object} PopoverOwnProps
 * @property {import("react").ReactElement} [trigger] The element that opens it; cloned.
 * @property {boolean} [open] Controlled open state.
 * @property {boolean} [defaultOpen] Initial open state when uncontrolled.
 * @property {(open: boolean) => void} [onOpenChange]
 * @property {import("react").RefObject<HTMLElement>} [anchorRef] The element the panel hangs from, when there is no `trigger`.
 * @property {import("@floating-ui/react-dom").Placement} [placement] Preferred side and alignment; flips when there is no room.
 * @property {import("react").ReactNode} [title] The heading, drawn at the top and naming the panel.
 * @property {string} [label] The accessible name of a panel with no `title`.
 * @property {boolean} [matchWidth] The panel is at least as wide as its anchor.
 * @property {import("react").ReactNode | ((api: { close: () => void }) => import("react").ReactNode)} [children]
 * @property {string} [className]
 * @typedef {PopoverOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof PopoverOwnProps>} PopoverProps
 */
/** @param {PopoverProps} props */
function Popover({
  trigger, open: openProp, defaultOpen = false, onOpenChange, anchorRef, placement, title, label,
  matchWidth = false, children, className, ...rest
}) {
  const [open, setOpen] = useOpenState(openProp, defaultOpen, onOpenChange);
  const own = React.useRef(null);
  const anchor = trigger ? own : (anchorRef || own);
  const panelId = React.useId();
  const titleId = React.useId();

  const close = React.useCallback(() => setOpen(false), [setOpen]);
  const onClose = React.useCallback((reason) => {
    setOpen(false);
    if (reason === "escape" && anchor.current) anchor.current.focus({ preventScroll: true });
  }, [setOpen, anchor]);
  const { pos, panelRef, panelEl, ready } = useOverlay(open, onClose, anchor, { placement, matchWidth });

  const focused = React.useRef(false);
  React.useEffect(() => {
    if (!open) { focused.current = false; return; }
    const el = panelEl.current;
    if (!ready || focused.current || !el) return;
    focused.current = true;
    if (el.contains(document.activeElement)) return;
    const first = /** @type {HTMLElement | null} */ (el.querySelector("[data-autofocus]") || firstFocusable(el));
    (first || el).focus({ preventScroll: true });
  }, [open, ready, panelEl]);

  const onKeyDown = (e) => {
    if (e.key !== "Tab" || !anchor.current) return;
    const items = focusables(e.currentTarget);
    const at = document.activeElement;
    if (!e.shiftKey && (items.length === 0 || at === items[items.length - 1])) {
      setOpen(false);
      anchor.current.focus({ preventScroll: true });
    } else if (e.shiftKey && (items.length === 0 || at === items[0] || at === e.currentTarget)) {
      e.preventDefault();
      setOpen(false);
      anchor.current.focus({ preventScroll: true });
    }
  };

  let triggerEl = null;
  if (trigger && React.isValidElement(trigger)) {
    const t = /** @type {any} */ (trigger);
    triggerEl = React.cloneElement(t, {
      ref: mergeRefs(own, elementRef(t)),
      "aria-haspopup": "dialog",
      "aria-expanded": open,
      "aria-controls": open ? panelId : undefined,
      onClick: chain(t.props.onClick, () => setOpen(!open)),
    });
  }

  return (
    <>
      {triggerEl}
      {open && pos && createPortal(
        <div ref={panelRef} id={panelId} role="dialog" data-inert-exempt=""
          aria-labelledby={title != null ? titleId : undefined}
          aria-label={title == null ? label : undefined}
          tabIndex={-1} style={pos} onKeyDown={onKeyDown} {...rest}
          className={"k-popover" + (className ? " " + className : "")}>
          {title != null && <div className="k-popover__title" id={titleId}>{title}</div>}
          {typeof children === "function" ? children({ close }) : children}
        </div>,
        document.body,
      )}
    </>
  );
}

const FOCUSABLE = "a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])";

/** @param {Element} root @returns {HTMLElement[]} */
function focusables(root) {
  return Array.from(/** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll(FOCUSABLE)))
    .filter((el) => el.getClientRects().length > 0);
}

/** @param {Element} root */
function firstFocusable(root) {
  return focusables(root)[0] || null;
}

export { Popover };
