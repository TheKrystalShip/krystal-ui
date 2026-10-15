import { BriefCard } from "./BriefCard.jsx";
import { Icon } from "./Icon.jsx";

// settings-primitives.jsx — the settings furniture: a titled section of rows, and a row
// with its controls on the right.

// `tone` (success | warn | danger | info) tints the left rule + icon chip via the
// shared brief-item modifiers — for a row that carries a verdict, not just a value.
// `value` is a read-only figure in the control's place; `mono` sets it as an identifier.
// A control that fits beside the words stays there; one that does not drops under them, full width.
// `controlsBelow` puts the controls under the words at phone width whatever their size.
// Omitted, the row is the neutral one every existing caller renders.
/**
 * @param {object} props
 * @param {string} props.icon A Lucide name.
 * @param {import("react").ReactNode} props.title The row's label.
 * @param {import("react").ReactNode} [props.sub] A quieter line under the title.
 * @param {"success" | "warn" | "danger" | "info"} [props.tone] Tints the row for a verdict.
 * @param {import("react").ReactNode} [props.value] A read-only value, drawn where a control sits.
 * @param {boolean} [props.mono] Sets `value` in the monospace face (an id, a path).
 * @param {boolean} [props.controlsBelow] At phone width the controls take their own line under the words, indented to them; a `wide` field or a Select fills it.
 * @param {string} [props.className] Extra class names on the row.
 * @param {import("react").ReactNode} [props.children] The row's controls, after `value`.
 */
function SettingsRow({ icon, title, sub, tone, value, mono = false, controlsBelow = false, className, children }) {
  return (
    <div className={"k-brief__item k-brief__item--static k-settings-row" + (tone ? " k-brief__item--" + tone : "")
      + (controlsBelow ? " k-settings-row--below" : "") + (className ? " " + className : "")}>
      <span className="k-brief__icon"><Icon name={icon} size={14} /></span>
      <div className="k-brief__body">
        <span className="k-brief__item-title"><span className="k-brief__titletext">{title}</span></span>
        {sub && <span className="k-brief__detail" style={{ whiteSpace: "normal" }}>{sub}</span>}
      </div>
      <div className="k-settings-row__controls">
        {value != null && <span className={"k-settings-value" + (mono ? " k-settings-value--mono" : "")}>{value}</span>}
        {children}
      </div>
    </div>
  );
}

/**
 * @param {object} props
 * @param {string} [props.icon] A Lucide name.
 * @param {import("react").ReactNode} props.title The section's heading.
 * @param {import("react").ReactNode} [props.meta] A quiet node after the heading, such as a count or a status.
 * @param {import("react").ReactNode} [props.action] A control at the heading's end.
 * @param {string} [props.className] Extra class names on the root element.
 * @param {import("react").ReactNode} [props.children] SettingsRows.
 */
function SettingsSection({ icon, title, meta, action, className, children }) {
  return (
    <BriefCard icon={icon} title={title} meta={meta} action={action} className={className}>
      <div className="k-brief__list">{children}</div>
    </BriefCard>
  );
}

export { SettingsRow, SettingsSection };
