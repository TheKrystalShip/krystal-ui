import React from "react";
import { createPortal } from "react-dom";
import { useFloating, autoUpdate, offset, flip, shift } from "@floating-ui/react-dom";
import { chain, elementRef, mergeRefs } from "../lib/refs.js";

// Tooltip — a short text label for a control that has no words of its own, or whose words need a
// line more. It shows when a mouse or pen rests on the control (after `delay`) and when the control
// takes keyboard focus; a touch never shows it. It hides on leave, blur, a press and Escape. A tip is
// not a layer the person opened, so it leaves Escape unhandled: the press that hides it also closes
// the dialog or popover it sits in, one press as without the tip. The panel is text only, never
// interactive, so a pointer can pass over it without keeping it open.
//
// `children` is one element, cloned with its handlers and `aria-describedby` while the tip shows.
// The tip describes the control: a control without visible words still needs its own accessible
// name. A disabled control swallows pointer events in some browsers, so a disabled one is wrapped
// in a <span>.
/**
 * @typedef {object} TooltipProps
 * @property {import("react").ReactNode} label The text. Nothing shows when it is empty.
 * @property {import("react").ReactElement} children The control the tip belongs to; cloned.
 * @property {import("@floating-ui/react-dom").Placement} [placement]
 * @property {number} [delay] Milliseconds a resting pointer waits before the tip shows.
 * @property {string} [className]
 */
/** @param {TooltipProps} props */
function Tooltip({ label, children, placement = "top", delay = 450, className }) {
  const [open, setOpen] = React.useState(false);
  const id = React.useId();
  const timer = React.useRef(0);
  const { refs, floatingStyles, isPositioned } = useFloating({
    open,
    strategy: "fixed",
    placement,
    transform: false,
    middleware: [offset(6), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const hide = React.useCallback(() => { window.clearTimeout(timer.current); setOpen(false); }, []);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const empty = label == null || label === false || label === "";
  if (empty || !React.isValidElement(children)) return children;
  const child = /** @type {any} */ (children);
  const p = child.props;

  const wired = React.cloneElement(child, {
    ref: mergeRefs(refs.setReference, elementRef(child)),
    "aria-describedby": open ? id : p["aria-describedby"],
    onPointerEnter: chain(p.onPointerEnter, (e) => {
      if (e.pointerType === "touch") return;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setOpen(true), delay);
    }),
    onPointerLeave: chain(p.onPointerLeave, hide),
    onPointerDown: chain(p.onPointerDown, hide),
    onFocus: chain(p.onFocus, (e) => {
      if (e.target.matches && e.target.matches(":focus-visible")) { window.clearTimeout(timer.current); setOpen(true); }
    }),
    onBlur: chain(p.onBlur, hide),
  });

  return (
    <>
      {wired}
      {open && createPortal(
        <div ref={refs.setFloating} id={id} role="tooltip" data-inert-exempt=""
          className={"k-tooltip" + (className ? " " + className : "")}
          style={{ ...floatingStyles, visibility: isPositioned ? "visible" : "hidden" }}>
          {label}
        </div>,
        document.body,
      )}
    </>
  );
}

export { Tooltip };
