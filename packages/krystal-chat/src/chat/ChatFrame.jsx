import React from "react";
import { Modal } from "@thekrystalship/krystal";

// ChatModal — the chat popped out to the whole window: a blurred scrim over the page and a frame that
// fills it (edge to edge at phone width), with the chat as its child. A press on the scrim, or Escape,
// calls `onClose`. `label` is the dialog's accessible name.
/**
 * @param {object} props
 * @param {() => void} props.onClose Called by a press on the scrim or Escape.
 * @param {string} [props.label] The dialog's accessible name.
 * @param {import("react").ReactNode} [props.children] The chat, usually a `Chat` with `docked={false}`.
 */
function ChatModal({ onClose, label = "Assistant", children }) {
  return (
    <Modal onClose={onClose} scrimClassName="k-chat-modal-scrim">
      <div className="k-chat-modal" role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </div>
    </Modal>
  );
}

// ChatEvidence — the column a turn's evidence cards stand in, under the answer: one card per row, a
// small gap between them. It draws nothing when it has no children.
/**
 * @param {object} props
 * @param {string} [props.className] Extra class names on the root element.
 * @param {import("react").ReactNode} [props.children] The cards.
 */
function ChatEvidence({ className, children }) {
  if (React.Children.count(children) === 0) return null;
  return <div className={"k-chat-evidence" + (className ? " " + className : "")}>{children}</div>;
}

export { ChatEvidence, ChatModal };
