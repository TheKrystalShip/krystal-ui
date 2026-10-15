import { Icon } from "./Icon.jsx";
import { Pill } from "./Pill.jsx";

// ShowcaseCard — a catalogue tile: key art with the name set on it, three facts in a row under it,
// and a foot carrying one status line and the card's action. The whole card opens the thing
// (`onPick`); the action is its own control when it does something else.
//
//   art      a CSS background-image value (`url(...)`, a gradient, or both), or nothing for the
//            surface the card already has
//   eyebrow  { label, icon?, tone?: "accent" }   what kind of thing it is, a short line set on the
//            art above the name
//   corner   { label, icon?, title?, tone?: "neutral" | "accent", mono? }   a frosted chip on the art's top-left: a
//            caution by default, `neutral` or `accent` for a fact that is not one, `mono` for figures
//   badge   { label, tone: "accent" | "info", dot?: "idle" | "live", title? }   the art's top-right
//   specs    [{ icon, value, label }]   a null value reads as an em-dash, muted
//   status   { label, icon?, tone?: "success" | "warning" | "notice" | "active", live?, title? }
//   action   { label, onClick?, title? }   a button when it has onClick, otherwise the card's cue
//   tools    [{ icon, label, onClick, on?, tone?: "danger" }]   small round buttons on the art's
//            top-right, under the badge: what is done to the thing besides opening it. `on` marks a
//            switch that is on. Shown on hover or focus where there is a pointer that hovers, always
//            on a touch screen
//   progress a number from 0 to 1, drawn as a bar along the art's foot; 1 is complete
//   segments [number from 0 to 1]   the thing as parts in order (a series' seasons), drawn along the
//            art's foot as one short bar per part, each filled as far as its number. It takes the
//            foot in place of `progress`
//   ribbon   { icon, iconOn?, on, label, onClick, disabled? }   a switch hanging from the art's top
//            edge on the left, for keeping the thing: filled with `iconOn` while on and always shown,
//            otherwise shown like the tools. `onClick` gets the press's event, whose `currentTarget`
//            is the ribbon, for anything drawn beside it. A `corner` moves over to make room
//
// `--k-showcase-progress-track`, set on the card or an ancestor, is the colour of the bar's empty part.
//
// A status left out still keeps its line, so a card with nothing to say is as tall as one that has.
/**
 * @typedef {object} ShowcaseCardProps
 * @property {import("react").ReactNode} name The thing's name, set on the art.
 * @property {string} [art] A CSS background-image value.
 * @property {() => void} [onPick] Opens the thing.
 * @property {{ label: import("react").ReactNode, icon?: string, tone?: "accent" }} [eyebrow] What kind of thing it is, over the name.
 * @property {{ label: import("react").ReactNode, icon?: string, title?: string, tone?: "neutral" | "accent", mono?: boolean }} [corner] A frosted chip on the art's top-left: a caution, or `neutral` or `accent` tone; `mono` sets it in the monospace face.
 * @property {{ label: import("react").ReactNode, tone?: "accent" | "info", dot?: "idle" | "live", title?: string }} [badge] The art's top-right.
 * @property {{ icon?: string, value: import("react").ReactNode | null, label: string }[]} [specs] A null value reads as an em-dash.
 * @property {{ label: import("react").ReactNode, icon?: string, tone?: "success" | "warning" | "notice" | "active", live?: boolean, title?: string }} [status] The foot's one status line; a card without one keeps the line's height.
 * @property {{ label: import("react").ReactNode, onClick?: () => void, title?: string }} [action] A button with `onClick`, otherwise the card's cue.
 * @property {{ icon: string, label: string, onClick: () => void, on?: boolean, tone?: "danger" }[]} [tools] Round buttons on the art's top-right.
 * @property {number} [progress] 0 to 1, a bar along the art's foot.
 * @property {number[]} [segments] Each 0 to 1, one short bar per part; takes the foot in place of `progress`.
 * @property {{ icon: string, iconOn?: string, on?: boolean, label: string, onClick: (event: import("react").MouseEvent<HTMLButtonElement>) => void, disabled?: boolean }} [ribbon] A keep switch hanging from the art's top-left edge.
 * @property {string} [className] Extra class names on the root element.
 */
/** @param {ShowcaseCardProps} props */
function ShowcaseCard({ name, art, onPick, eyebrow, corner, badge, specs = [], status, action, tools, progress, segments, ribbon, className }) {
  const open = () => { if (onPick) onPick(); };
  return (
    <article
      className={"k-showcase-card" + (className ? " " + className : "")}
      onClick={open}
      role="button" tabIndex={0}
      onKeyDown={e => { if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) { e.preventDefault(); open(); } }}
    >
      <div
        className={"k-showcase-card__art" + (ribbon ? " k-showcase-card__art--ribbon" : "")}
        style={art ? { backgroundImage: art, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        {ribbon && (
          <button
            type="button"
            className={"k-showcase-card__ribbon" + (ribbon.on ? " k-is-on" : "")}
            aria-label={ribbon.label}
            aria-pressed={!!ribbon.on}
            title={ribbon.label}
            disabled={ribbon.disabled}
            onClick={e => { e.stopPropagation(); ribbon.onClick(e); }}
          >
            <span className="k-showcase-card__ribbon-tab">
              <Icon name={ribbon.on ? ribbon.iconOn || ribbon.icon : ribbon.icon} size={15} strokeWidth={2.1} />
            </span>
          </button>
        )}
        {corner && (
          <span className={"k-showcase-card__corner" + (corner.tone ? " k-showcase-card__corner--" + corner.tone : "") + (corner.mono ? " k-showcase-card__corner--mono" : "")} title={corner.title}>
            {corner.icon && <Icon name={corner.icon} size={11} strokeWidth={2.1} />} {corner.label}
          </span>
        )}
        {badge && (
          <Pill tone={badge.tone || "accent"} dot={badge.dot ? (badge.dot === "live" ? "live" : true) : undefined}
            dotClassName="k-showcase-card__badge-dot" title={badge.title}
            className={"k-showcase-card__badge k-showcase-card__badge--" + (badge.tone || "accent")}>
            {badge.label}
          </Pill>
        )}
        {tools && tools.length > 0 && (
          <div className={"k-showcase-card__tools" + (badge ? " k-showcase-card__tools--under" : "")}>
            {tools.map(t => (
              <button
                key={t.label}
                type="button"
                className={"k-showcase-card__tool" + (t.on ? " k-is-on" : "") + (t.tone ? " k-showcase-card__tool--" + t.tone : "")}
                aria-label={t.label}
                aria-pressed={t.on === undefined ? undefined : t.on}
                title={t.label}
                onClick={e => { e.stopPropagation(); t.onClick(); }}
              >
                <Icon name={t.icon} size={15} strokeWidth={2} />
              </button>
            ))}
          </div>
        )}
        <div className="k-showcase-card__veil"></div>
        <div className="k-showcase-card__caption">
          {eyebrow && (
            <span className={"k-showcase-card__eyebrow" + (eyebrow.tone ? " k-showcase-card__eyebrow--" + eyebrow.tone : "")}>
              {eyebrow.icon && <Icon name={eyebrow.icon} size={12} strokeWidth={2.1} />}
              {eyebrow.label}
            </span>
          )}
          <h3 className="k-showcase-card__name">{name}</h3>
        </div>
        {segments && segments.length > 0 ? (
          <span className="k-showcase-card__segments" aria-hidden="true">
            {segments.map((f, i) => (
              <span key={i}><span style={{ width: `${Math.round(100 * Math.min(1, Math.max(0, f)))}%` }}></span></span>
            ))}
          </span>
        ) : progress != null && (
          <span className={"k-showcase-card__progress" + (progress >= 1 ? " k-is-done" : "")} aria-hidden="true">
            <span style={{ width: `${Math.round(100 * Math.min(1, Math.max(0, progress)))}%` }}></span>
          </span>
        )}
      </div>

      {specs.length > 0 && (
        <div className="k-showcase-card__specs" style={{ gridTemplateColumns: `repeat(${specs.length}, 1fr)` }}>
          {specs.map(s => (
            <div key={s.label} className={"k-showcase-spec" + (s.value == null ? " k-showcase-spec--unknown" : "")}>
              <span className="k-showcase-spec__val">
                {s.icon && <span className="k-showcase-spec__ico"><Icon name={s.icon} size={12} strokeWidth={2} /></span>} {s.value ?? "—"}
              </span>
              <span className="k-showcase-spec__lbl">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="k-showcase-card__foot">
        {status ? (
          <span className={"k-showcase-card__status" + (status.tone ? " k-showcase-card__status--" + status.tone : "")} title={status.title}>
            {status.live && <span className="k-showcase-card__livedot"></span>}
            {status.icon && <Icon name={status.icon} size={11} />}
            <span className="k-showcase-card__status-text">{status.label}</span>
          </span>
        ) : <span className="k-showcase-card__status"></span>}
        {action && (action.onClick ? (
          <button
            type="button"
            className="k-showcase-card__cta k-showcase-card__cta--act"
            title={action.title}
            onClick={e => { e.stopPropagation(); action.onClick(); }}
          >
            {action.label} <Icon name="arrow-right" size={13} strokeWidth={2.2} />
          </button>
        ) : (
          <span className="k-showcase-card__cta">
            {action.label} <Icon name="arrow-right" size={13} strokeWidth={2.2} />
          </span>
        ))}
      </div>
    </article>
  );
}

export { ShowcaseCard };
