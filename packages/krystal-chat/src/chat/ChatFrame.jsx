import React from "react";

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

export { ChatEvidence };
