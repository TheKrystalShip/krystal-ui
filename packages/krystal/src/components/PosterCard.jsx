import { Icon } from "./Icon.jsx";
import { Pill } from "./Pill.jsx";

// PosterCard — a title on a shelf with no frame: the poster, and under it the name, a line of facts and
// one status line. The card opens the thing (`onPick`) from anywhere on it; `action` is a play button
// over the poster that does the card's shortcut instead (watch, resume, join), shown on a desktop
// pointer's hover and on keyboard focus. A touch screen opens the thing and acts from there.
//
// The name is the card's one button to open it, stretched over the whole card, so the poster, the name
// and the facts all open it while the controls on the poster stay their own.
//
//   art      a CSS background-image value (`url(...)`, a gradient, or both)
//   facts    [{ value, label, icon? }]   the line under the name, each value with its label as a title;
//            a null value is left out
//   status   { label, icon?, tone?: "success" | "warning" | "notice" | "active", title? }
//   action   { label, onClick, icon? }   the play button; `icon` is play when left out
//   badge    { label, tone?: "accent" | "info", title? }   the poster's top-right
//   corner   { label?, icon?, title?, tone?: "neutral" | "accent", mono? }   a chip on the poster's top-left,
//            `mono` for figures
//   ribbon   { icon, iconOn?, on, label, onClick, disabled? }   a keep switch hanging from the top-left edge
//   tools    [{ icon, label, onClick, on?, tone?: "danger" }]   round buttons on the top-right
//   progress a number from 0 to 1 along the poster's foot; segments one short bar per part in its place
//
// A status left out still keeps its line, so the cards of a row stand level.
/**
 * @typedef {object} PosterCardProps
 * @property {import("react").ReactNode} name The thing's name, under the poster; a string also names the play button.
 * @property {string} [art] A CSS background-image value.
 * @property {() => void} [onPick] Opens the thing.
 * @property {{ value: import("react").ReactNode | null, label: string, icon?: string }[]} [facts] The line under the name; a null value is left out.
 * @property {{ label: import("react").ReactNode, icon?: string, tone?: "success" | "warning" | "notice" | "active", title?: string }} [status] The one status line; a card without one keeps the line's height.
 * @property {{ label: string, onClick: () => void, icon?: string }} [action] The play button over the poster, on a desktop pointer's hover and on focus.
 * @property {{ label: import("react").ReactNode, tone?: "accent" | "info", title?: string }} [badge] The poster's top-right.
 * @property {{ label?: import("react").ReactNode, icon?: string, title?: string, tone?: "neutral" | "accent", mono?: boolean }} [corner] A chip on the poster's top-left; `mono` sets it in the monospace face.
 * @property {{ icon: string, iconOn?: string, on?: boolean, label: string, onClick: (event: import("react").MouseEvent<HTMLButtonElement>) => void, disabled?: boolean }} [ribbon] A keep switch hanging from the poster's top-left edge.
 * @property {{ icon: string, label: string, onClick: () => void, on?: boolean, tone?: "danger" }[]} [tools] Round buttons on the poster's top-right.
 * @property {number} [progress] 0 to 1, a bar along the poster's foot.
 * @property {number[]} [segments] Each 0 to 1, one short bar per part; takes the foot in place of `progress`.
 * @property {string} [className] Extra class names on the root element.
 */
/** @param {PosterCardProps} props */
function PosterCard({ name, art, onPick, facts = [], status, action, badge, corner, ribbon, tools, progress, segments, className }) {
  const shown = facts.filter((f) => f.value != null);
  const fill = (f) => `${Math.round(100 * Math.min(1, Math.max(0, f)))}%`;
  return (
    <article className={"k-poster" + (className ? " " + className : "")}>
      <div className={"k-poster__art" + (ribbon ? " k-poster__art--ribbon" : "")}
        style={art ? { backgroundImage: art } : undefined}>
        {ribbon && (
          <button type="button" className={"k-poster__ribbon" + (ribbon.on ? " k-is-on" : "")}
            aria-label={ribbon.label} aria-pressed={!!ribbon.on} title={ribbon.label} disabled={ribbon.disabled}
            onClick={(e) => ribbon.onClick(e)}>
            <span className="k-poster__ribbon-tab">
              <Icon name={ribbon.on ? ribbon.iconOn || ribbon.icon : ribbon.icon} size={15} strokeWidth={2.1} />
            </span>
          </button>
        )}
        {corner && (
          <span className={"k-poster__corner" + (corner.tone ? " k-poster__corner--" + corner.tone : "") + (corner.mono ? " k-poster__corner--mono" : "")} title={corner.title}>
            {corner.icon && <Icon name={corner.icon} size={11} strokeWidth={2.1} />}{corner.label}
          </span>
        )}
        {badge && (
          <Pill tone={badge.tone || "accent"} title={badge.title}
            className={"k-poster__badge k-poster__badge--" + (badge.tone || "accent")}>
            {badge.label}
          </Pill>
        )}
        {tools && tools.length > 0 && (
          <div className={"k-poster__tools" + (badge ? " k-poster__tools--under" : "")}>
            {tools.map((t) => (
              <button key={t.label} type="button"
                className={"k-poster__tool" + (t.on ? " k-is-on" : "") + (t.tone ? " k-poster__tool--" + t.tone : "")}
                aria-label={t.label} aria-pressed={t.on === undefined ? undefined : t.on} title={t.label}
                onClick={() => t.onClick()}>
                <Icon name={t.icon} size={15} strokeWidth={2} />
              </button>
            ))}
          </div>
        )}
        {action && (
          <button type="button" className="k-poster__play"
            aria-label={typeof name === "string" ? action.label + " " + name : action.label} title={action.label}
            onClick={() => action.onClick()}>
            <Icon name={action.icon || "play"} size={20} strokeWidth={2} />
          </button>
        )}
        {segments && segments.length > 0 ? (
          <span className="k-poster__segments" aria-hidden="true">
            {segments.map((f, i) => <span key={i}><span style={{ width: fill(f) }}></span></span>)}
          </span>
        ) : progress != null && (
          <span className={"k-poster__progress" + (progress >= 1 ? " k-is-done" : "")} aria-hidden="true">
            <span style={{ width: fill(progress) }}></span>
          </span>
        )}
      </div>
      <div className="k-poster__caption">
        <h3 className="k-poster__name">
          <button type="button" className="k-poster__pick" onClick={() => { if (onPick) onPick(); }}>{name}</button>
        </h3>
        {shown.length > 0 && (
          <span className="k-poster__facts">
            {shown.map((f) => (
              <span key={f.label} className="k-poster__fact" title={f.label}>
                {f.icon && <Icon name={f.icon} size={12} strokeWidth={2} />}{f.value}
              </span>
            ))}
          </span>
        )}
        <span className={"k-poster__status" + (status && status.tone ? " k-poster__status--" + status.tone : "")} title={status ? status.title : undefined}>
          {status && status.icon && <Icon name={status.icon} size={11} />}
          {status && <span className="k-poster__status-text">{status.label}</span>}
        </span>
      </div>
    </article>
  );
}

export { PosterCard };
