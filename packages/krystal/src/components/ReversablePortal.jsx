import React from "react";
import { createPortal } from "react-dom";
import { Modal } from "./Modal.jsx";

// ReversablePortal — keeps one child subtree mounted while moving its DOM node
// between an inline slot and a body-portal modal slot. Use for surfaces that host
// a stateful child (the Monaco editor in CodeEditor) which must pop to full screen
// WITHOUT remounting. Moving the real DOM node (instead of re-rendering the same
// JSX element at a new React tree position) keeps the child's fiber + internal
// state — Monaco's editor instance, model, undo stack, scroll — alive across the
// toggle, so the inline editor and the full-screen editor are literally the same
// instance. Edits therefore flow both ways through the existing `value`/`onChange`
// binding; closing the modal without saving never discards in-flight content.
//
// `children` is projected into a stable detached <div> via createPortal on every
// render; a layout effect adopts that div into the inline or modal slot before
// paint (so there is never a flash of an empty slot). The shared <Modal> primitive
// owns the dialog behaviour: focus trap and return, inert background, Esc + scrim-click close.
//
// Both slot divs and the stable host are `display: contents` (see kit/modal.css),
// so the projected subtree participates in the slot parent's layout exactly as it
// did before wrapping — Monaco measures its own `.fb-editor__monaco-wrap` box, not
// the slot, so layout is unaffected.
/**
 * @param {object} props
 * @param {boolean} [props.fullscreen] Moves the children's DOM into the modal.
 * @param {() => void} [props.onClose] Called when Escape or a press on the scrim closes the modal.
 * @param {string} [props.scrimClassName] The modal scrim's class; the modal primitive's own when left out.
 * @param {string} [props.modalClassName] Class of the dialog box the children are moved into.
 * @param {string} [props.ariaLabel] The dialog's accessible name.
 * @param {import("react").ReactNode} [props.placeholder] Shown in the inline slot while fullscreen.
 * @param {import("react").ReactNode} [props.children] The stateful subtree that stays mounted as it moves between the inline slot and the modal.
 */
function ReversablePortal({
  fullscreen,
  onClose,
  scrimClassName,
  modalClassName,
  ariaLabel,
  placeholder,
  children,
}) {
  // A single detached <div> created once and re-parented between the slots. It is
  // the portal target for `children`, so React reconciles the subtree in place
  // across toggles — the child fiber never tears, only its DOM container moves.
  const hostRef = React.useRef(null);
  if (hostRef.current === null) {
    const host = document.createElement("div");
    host.className = "k-portal-host";
    host.style.display = "contents";
    hostRef.current = host;
  }
  const inlineRef = React.useRef(null);
  const modalRef = React.useRef(null);

  // Re-adopt the host div into the active slot after every commit. Idempotent
  // (one parentNode check + conditional append) and avoids any init-order class
  // where a slot ref isn't ready at the exact effect tick. Runs before paint so no
  // flash of an empty slot. `display:contents` makes the host a no-box, so
  // appendChild only relocates its children's layout context, never re-flows it.
  React.useLayoutEffect(() => {
    const target = fullscreen ? modalRef.current : inlineRef.current;
    if (!target || !hostRef.current) return;
    if (hostRef.current.parentNode !== target) {
      target.appendChild(hostRef.current);
    }
  });

  return (
    <>
      <div ref={inlineRef} className="k-portal-slot">
        {fullscreen && placeholder}
      </div>
      {fullscreen && (
        <Modal onClose={onClose} scrimClassName={scrimClassName}>
          <div className={modalClassName} role="dialog" aria-modal="true" aria-label={ariaLabel}>
            <div ref={modalRef} className="k-portal-slot" />
          </div>
        </Modal>
      )}
      {createPortal(children, hostRef.current)}
    </>
  );
}

export { ReversablePortal };
export default ReversablePortal;