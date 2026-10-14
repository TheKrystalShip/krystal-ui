import React from "react";
import { createPortal } from "react-dom";
import { useModalBehaviour } from "../hooks/useModalBehaviour.js";

// Modal — the shared overlay primitive. Portals a fixed, full-viewport scrim to <body> and gives
// its content the behaviour of a dialog (see hooks/useModalBehaviour.js):
//   • focus moves into the sheet, Tab and Shift+Tab stay in it, and focus returns to the opener
//     on close
//   • the rest of the document is `inert` while it is the topmost modal
//   • Escape closes the topmost modal only, so a dialog opened from a dialog leaves its parent open
//   • a mouse-down on the scrim *outside* the content closes it (target === currentTarget, so a
//     press that starts inside the box, such as a text drag, never closes)
//   • Escape and the scrim are both gated by `canClose` (pass false to block close while a request
//     is in flight)
//
// The caller owns the inner content AND the scrim's visual class (`scrimClassName`), so each site
// keeps its exact look (`.k-modal-scrim`, `.k-backdrop`, `.console-modal-scrim`, …). All of them are
// `position: fixed; inset: 0`, so portaling to <body> never shifts them; it lifts them out of any
// `transform`/`overflow` ancestor that could clip them. Mark the element that should take focus on
// open with `data-autofocus` (or React's `autoFocus`).
/**
 * @param {object} props
 * @param {() => void} [props.onClose] Runs when Escape or a press on the scrim asks to close.
 * @param {boolean} [props.canClose] False blocks Escape and scrim close.
 * @param {string} [props.scrimClassName] The scrim's own class, which gives it its look.
 * @param {import("react").ReactNode} [props.children] The sheet, drawn over the scrim.
 */
function Modal({ onClose, canClose = true, scrimClassName = "k-modal-scrim", children }) {
  const scrim = React.useRef(null);
  useModalBehaviour(scrim, { onClose, canClose });

  const onScrimDown = (e) => {
    if (e.target === e.currentTarget && canClose && onClose) onClose();
  };

  return createPortal(
    <div ref={scrim} className={scrimClassName} onMouseDown={onScrimDown}>
      {children}
    </div>,
    document.body,
  );
}

export { Modal };
