import { Icon } from "./Icon.jsx";

// A line the page says about itself — something that failed, something to know before acting —
// inside the content it is about, with an icon before it. `tone` is info (the default), ok, warn or
// danger, and picks the icon unless `icon` names one. A danger notice is announced as an alert.
const ICONS = { info: "info", ok: "check-circle-2", warn: "alert-triangle", danger: "alert-triangle" };

function Notice({ tone = "info", icon, className, children }) {
  return (
    <div className={"k-notice k-notice--" + tone + (className ? " " + className : "")}
      role={tone === "danger" ? "alert" : undefined}>
      <Icon name={icon || ICONS[tone] || ICONS.info} size={14} className="k-notice__icon" />
      <div className="k-notice__text">{children}</div>
    </div>
  );
}

export { Notice };
