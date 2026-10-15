import { Icon } from "./Icon.jsx";

// A line the page says about itself — something that failed, something to know before acting —
// inside the content it is about, with an icon before it. `tone` is info (the default), ok, warn or
// danger, and picks the icon unless `icon` names one. A danger notice is announced as an alert.
// `action` is a control at the notice's end (a Retry button), centred against the text. `block` makes the
// text a column that fills the notice, its children stacked and aligned to the start (a title over a
// value to copy).
const ICONS = { info: "info", ok: "check-circle-2", warn: "alert-triangle", danger: "alert-triangle" };

/**
 * @param {object} props
 * @param {"info" | "ok" | "warn" | "danger"} [props.tone] `info`, `ok`, `warn` or `danger`; info by default.
 * @param {string} [props.icon] A Lucide name; defaults to the tone's icon.
 * @param {boolean} [props.block] The text fills the notice as a column of stacked children.
 * @param {import("react").ReactNode} [props.action] A control at the notice's end, such as a Retry button.
 * @param {string} [props.className] Class name added to the root element.
 * @param {import("react").ReactNode} [props.children] The message.
 */
function Notice({ tone = "info", icon, action, block = false, className, children }) {
  return (
    <div className={"k-notice k-notice--" + tone + (className ? " " + className : "")}
      role={tone === "danger" ? "alert" : undefined}>
      <Icon name={icon || ICONS[tone] || ICONS.info} size={14} className="k-notice__icon" />
      <div className={"k-notice__text" + (block ? " k-notice__text--block" : "")}>{children}</div>
      {action != null && <div className="k-notice__action">{action}</div>}
    </div>
  );
}

export { Notice };
