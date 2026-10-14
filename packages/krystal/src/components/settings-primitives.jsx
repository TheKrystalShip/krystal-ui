import { BriefCard } from "./BriefCard.jsx";
import { Icon } from "./Icon.jsx";

// settings-primitives.jsx — the settings furniture: a titled section of rows, and a row
// with its controls on the right.

// `tone` (success | warn | danger | info) tints the left rule + icon chip via the
// shared brief-item modifiers — for a row that carries a verdict, not just a value.
// A control that fits beside the words stays there; one that does not drops under them, full width.
// Omitted, the row is the neutral one every existing caller renders.
/**
 * @param {object} props
 * @param {string} props.icon A Lucide name.
 * @param {import("react").ReactNode} props.title
 * @param {import("react").ReactNode} [props.sub]
 * @param {"success" | "warn" | "danger" | "info"} [props.tone] Tints the row for a verdict.
 * @param {import("react").ReactNode} [props.children] The row's controls.
 */
function SettingsRow({ icon, title, sub, tone, children }) {
  return (
    <div className={"k-brief__item k-brief__item--static k-settings-row" + (tone ? " k-brief__item--" + tone : "")}>
      <span className="k-brief__icon"><Icon name={icon} size={14} /></span>
      <div className="k-brief__body">
        <span className="k-brief__item-title"><span className="k-brief__titletext">{title}</span></span>
        {sub && <span className="k-brief__detail" style={{ whiteSpace: "normal" }}>{sub}</span>}
      </div>
      <div className="k-settings-row__controls">{children}</div>
    </div>
  );
}

/**
 * @param {object} props
 * @param {string} [props.icon] A Lucide name.
 * @param {import("react").ReactNode} props.title
 * @param {import("react").ReactNode} [props.meta]
 * @param {import("react").ReactNode} [props.action]
 * @param {string} [props.className]
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
