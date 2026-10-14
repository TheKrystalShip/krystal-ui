import { Icon } from "./Icon.jsx";
import { Pill } from "./Pill.jsx";

// SubTabs — the shared in-page section switcher (desktop button strip + a mobile
// <select>). Used by the server-detail tabs (App.jsx) and the host diagnostics
// deep-dive (DiagnosticsPage.jsx). Lives here, not inlined in either, so the two
// can't drift and neither has to import the other (the diagnostics page is imported
// BY App, so pulling SubTabs from App would be a circular import — this was the
// "SubTabs is not defined" crash the host deep-dive hit once it rendered with
// real telemetry).
// A tab may carry an optional `title` for a hover hint (the leaf config page puts each leaf's
// role there). Everything else is unchanged.
/**
 * @param {object} props
 * @param {{ id: string, label: import("react").ReactNode, icon?: string, title?: string, badge?: number, badgeTone?: "info" | "neutral" | "accent" | "ok" | "warn" | "danger" | "muted", badgeNoun?: string }[]} props.tabs The tabs, each `{ id, label, icon, title, badge, badgeTone, badgeNoun }`; `title` is a hover hint and `badgeNoun` names what the badge counts.
 * @param {string} props.active The active tab's id.
 * @param {(id: string) => void} props.onChange Receives the id of the tab the person chose.
 */
export function SubTabs({ tabs, active, onChange }) {
  const current = tabs.find(t => t.id === active) || tabs[0];
  return (
    <>
      <div className="k-subtabs">
        {tabs.map(t => (
          <button key={t.id}
            className={"k-subtab" + (t.id === active ? " k-subtab--active" : "")}
            onClick={() => onChange(t.id)}
            title={t.title}>
            <Icon name={t.icon} size={14} />
            {t.label}
            {t.badge > 0 && <Pill size="sm" tone={t.badgeTone && t.badgeTone !== "info" ? t.badgeTone : "neutral"} className={"k-subtab__badge k-subtab__badge--" + (t.badgeTone || "info")}>{t.badge}</Pill>}
          </button>
        ))}
      </div>
      <label className="k-subtabs-mobile" aria-label="Section">
        <Icon name={current.icon} size={16} />
        <span className="k-subtabs-mobile__label">{current.label}</span>
        {/* The badge's noun is the tab's own, because a badge counts whatever that tab holds — alerts
            on one page and unanswered offers on another, and "2 alerts" over a list of offers would
            name something that is not there. */}
        <select value={active} onChange={e => onChange(e.target.value)}>
          {tabs.map(t => (
            <option key={t.id} value={t.id}>
              {t.label}
              {t.badge ? " · " + t.badge + " " + (t.badgeNoun || "alert") + (t.badge === 1 ? "" : "s") : ""}
            </option>
          ))}
        </select>
        <Icon name="chevron-down" size={16} />
      </label>
    </>
  );
}
