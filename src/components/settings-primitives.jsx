import { BriefCard } from "./BriefCard.jsx";
import { Icon } from "./Icon.jsx";

// settings-primitives.jsx — the settings furniture: a titled section of rows, and a row
// with its controls on the right.

// `tone` (success | warn | danger | info) tints the left rule + icon chip via the
// shared brief-item modifiers — for a row that carries a verdict, not just a value.
// Omitted, the row is the neutral one every existing caller renders.
function SettingsRow({ icon, title, sub, tone, children }) {
  return (
    <div className={"chat-brief__item chat-brief__item--static" + (tone ? " chat-brief__item--" + tone : "")}>
      <span className="chat-brief__icon"><Icon name={icon} size={14} /></span>
      <div className="chat-brief__body">
        <span className="chat-brief__item-title"><span className="chat-brief__titletext">{title}</span></span>
        {sub && <span className="chat-brief__detail" style={{ whiteSpace: "normal" }}>{sub}</span>}
      </div>
      <div className="settings-row__controls">{children}</div>
    </div>
  );
}

function SettingsSection({ icon, title, meta, action, className, children }) {
  return (
    <BriefCard icon={icon} title={title} meta={meta} action={action} className={className}>
      <div className="chat-brief__list">{children}</div>
    </BriefCard>
  );
}

export { SettingsRow, SettingsSection };
