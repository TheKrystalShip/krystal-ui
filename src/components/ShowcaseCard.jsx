import { Icon } from "./Icon.jsx";

// ShowcaseCard — a catalogue tile: key art with the name set on it, three facts in a row under it,
// and a foot carrying one status line and the card's action. The whole card opens the thing
// (`onPick`); the action is its own control when it does something else.
//
//   art      a CSS background-image value (`url(...)`, a gradient, or both), or nothing for the
//            surface the card already has
//   corner   { label, icon?, title? }   a caution chip on the art's top-left
//   badge    { label, tone: "accent" | "info", dot?: "idle" | "live", title? }   the art's top-right
//   specs    [{ icon, value, label }]   a null value reads as an em-dash, muted
//   status   { label, icon?, tone?: "success" | "warning" | "notice" | "active", live?, title? }
//   action   { label, onClick?, title? }   a button when it has onClick, otherwise the card's cue
//
// A status left out still keeps its line, so a card with nothing to say is as tall as one that has.
function ShowcaseCard({ name, art, onPick, corner, badge, specs = [], status, action, className }) {
  const open = () => { if (onPick) onPick(); };
  return (
    <article
      className={"showcase-card" + (className ? " " + className : "")}
      onClick={open}
      role="button" tabIndex={0}
      onKeyDown={e => { if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) { e.preventDefault(); open(); } }}
    >
      <div className="showcase-card__art" style={art ? { backgroundImage: art, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
        {corner && (
          <span className="showcase-card__corner" title={corner.title}>
            {corner.icon && <Icon name={corner.icon} size={11} strokeWidth={2.1} />} {corner.label}
          </span>
        )}
        {badge && (
          <span className={"showcase-card__badge showcase-card__badge--" + (badge.tone || "accent")} title={badge.title}>
            {badge.dot && <span className={"showcase-card__badge-dot" + (badge.dot === "live" ? " is-live" : "")}></span>}
            {badge.label}
          </span>
        )}
        <div className="showcase-card__veil"></div>
        <h3 className="showcase-card__name">{name}</h3>
      </div>

      {specs.length > 0 && (
        <div className="showcase-card__specs" style={{ gridTemplateColumns: `repeat(${specs.length}, 1fr)` }}>
          {specs.map(s => (
            <div key={s.label} className={"showcase-spec" + (s.value == null ? " showcase-spec--unknown" : "")}>
              <span className="showcase-spec__val">
                {s.icon && <span className="showcase-spec__ico"><Icon name={s.icon} size={12} strokeWidth={2} /></span>} {s.value ?? "—"}
              </span>
              <span className="showcase-spec__lbl">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="showcase-card__foot">
        {status ? (
          <span className={"showcase-card__status" + (status.tone ? " showcase-card__status--" + status.tone : "")} title={status.title}>
            {status.live && <span className="showcase-card__livedot"></span>}
            {status.icon && <Icon name={status.icon} size={11} />}
            {status.label}
          </span>
        ) : <span className="showcase-card__status"></span>}
        {action && (action.onClick ? (
          <button
            type="button"
            className="showcase-card__cta showcase-card__cta--act"
            title={action.title}
            onClick={e => { e.stopPropagation(); action.onClick(); }}
          >
            {action.label} <Icon name="arrow-right" size={13} strokeWidth={2.2} />
          </button>
        ) : (
          <span className="showcase-card__cta">
            {action.label} <Icon name="arrow-right" size={13} strokeWidth={2.2} />
          </span>
        ))}
      </div>
    </article>
  );
}

export { ShowcaseCard };
