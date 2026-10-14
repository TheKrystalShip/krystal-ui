import { Icon } from "./Icon.jsx";
import { Pill } from "./Pill.jsx";

// BriefCard — the "briefing card" shell. A titled header (icon + label + optional
// count chip + optional action) sitting over a bordered surface-1 card. Every
// titled card renders through this one component so the card family stays
// visually identical and never drifts.
//
// The body is passed as children — a `.chat-brief__list` of rows, a
// `.chat-brief__empty` placeholder, or any custom content (e.g. a grid).
//
// Props:
//   icon, title            — header (icon + label)
//   count, countTone       — optional pill after the title; countTone "neutral"
//                            for a quiet grey chip, omit for the default accent
//   countTitle             — optional tooltip on that pill, for a count that has to
//                            qualify itself (a window, a floor)
//   meta                   — optional muted sub-strip under the header (cadence,
//                            retention, "5 of 10 slots used", …)
//   pin                    — optional header-right NODE, rendered before the action. A node
//                            rather than a descriptor, so the card stays ignorant of whatever
//                            the site pins things to.
//   onViewAll, viewAllLabel— convenience right-side affordance ("View all →")
//   action                 — custom header-right node; when provided it wins
//                            over onViewAll (pass null for nothing)
//   collapsible, open,     — controlled collapse: the whole header becomes the
//   onToggle                 toggle and the body is unmounted when shut. Left
//                            uncontrolled the card renders exactly as before.
//   className, children
/**
 * @param {object} props
 * @param {string} [props.icon] A Lucide name.
 * @param {import("react").ReactNode} props.title
 * @param {import("react").ReactNode | false} [props.count] A pill after the title.
 * @param {"neutral" | "accent" | "info" | "ok" | "warn" | "danger" | "muted"} [props.countTone]
 * @param {string} [props.countTitle] Tooltip on the count pill.
 * @param {import("react").ReactNode} [props.meta] A muted strip under the header.
 * @param {import("react").ReactNode} [props.pin] Header-right node before the action.
 * @param {() => void} [props.onViewAll]
 * @param {string} [props.viewAllLabel]
 * @param {import("react").ReactNode} [props.action] Header-right node; wins over `onViewAll`, null for nothing.
 * @param {boolean} [props.collapsible]
 * @param {boolean} [props.open] Controlled collapse state.
 * @param {() => void} [props.onToggle]
 * @param {string} [props.className]
 * @param {import("react").ReactNode} [props.children]
 */
function BriefCard({ icon, title, count, countTone, countTitle, meta, pin, onViewAll, viewAllLabel = "View all", action,
  collapsible = false, open = true, onToggle, className = "", children }) {
  const right = action !== undefined
    ? action
    : (onViewAll
        ? (
          <button className="dash-section__more" onClick={onViewAll}>
            {viewAllLabel} <Icon name="arrow-right" size={11} strokeWidth={2.2} />
          </button>
        )
        : null);
  const shut = collapsible && !open;
  const head = (
    <>
      <span className="chat-brief__title">
        {icon && <Icon name={icon} size={13} />} {title}
        {count != null && count !== false && (
          <Pill size="sm" tone={countTone === "neutral" ? "muted" : countTone || "warn"} title={countTitle}
            className={"chat-brief__count" + (countTone ? " chat-brief__count--" + countTone : "")}>{count}</Pill>
        )}
      </span>
      {pin}
      {right}
      {collapsible && <Icon name="chevron-down" size={16} className="chat-brief__chev" />}
    </>
  );
  return (
    <div className={"chat-brief" + (shut ? " chat-brief--shut" : "") + (className ? " " + className : "")}>
      {collapsible
        ? (
          <button type="button" className="chat-brief__head chat-brief__head--toggle"
            onClick={onToggle} aria-expanded={open}>
            {head}
          </button>
        )
        : <div className="chat-brief__head">{head}</div>}
      {!shut && meta && <div className="chat-brief__meta">{meta}</div>}
      {!shut && children}
    </div>
  );
}

export { BriefCard };
