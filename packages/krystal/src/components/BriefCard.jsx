import { Icon } from "./Icon.jsx";
import { Pill } from "./Pill.jsx";

// BriefCard — the "briefing card" shell. A titled header (icon + label + optional
// count chip + optional action) sitting over a bordered surface-1 card. Every
// titled card renders through this one component so the card family stays
// visually identical and never drifts.
//
// The body is passed as children — a `.k-brief__list` of rows, a
// `.k-brief__empty` placeholder, or any custom content (e.g. a grid).
//
// Props:
//   icon, title            — header (icon + label); with no title and no `collapsible` the card
//                            has no header, only its body
//   count, countTone       — optional pill after the title; countTone "neutral"
//                            for a quiet grey chip, omit for the default accent
//   countTitle             — optional tooltip on that pill, for a count that has to
//                            qualify itself (a window, a floor)
//   value                  — optional node in the header after the title (a figure the card is about)
//   wrapHead               — the header wraps: what does not fit beside the title drops under it
//   fill                   — the card fills the height it is given and its list, empty state or body
//                            takes what the header leaves (a card in a row of equal cards)
//   revealPin              — the `pin` shows while the card is hovered or holds focus (always on a
//                            touch screen, and while the pin is pressed)
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
//
// Public tokens, set on the card or any ancestor: `--k-brief-head-padding` (10px 14px) and
// `--k-brief-head-gap` (10px) space the header.
/**
 * @param {object} props
 * @param {string} [props.icon] A Lucide name.
 * @param {import("react").ReactNode} [props.title] The header's label; without it (and without `collapsible`) the card draws no header.
 * @param {import("react").ReactNode | false} [props.count] A pill after the title.
 * @param {"neutral" | "accent" | "info" | "ok" | "warn" | "danger" | "muted"} [props.countTone] `neutral` for a quiet grey count pill; the accent when omitted.
 * @param {string} [props.countTitle] Tooltip on the count pill.
 * @param {import("react").ReactNode} [props.value] A node in the header after the title, such as the figure the card is about.
 * @param {boolean} [props.wrapHead] The header wraps, so a value or pin that does not fit beside the title drops under it.
 * @param {boolean} [props.fill] The card fills the height it is given, and its list, empty state or body takes the rest.
 * @param {boolean} [props.revealPin] The pin shows while the card is hovered or has focus, always on a touch screen and while the pin is pressed.
 * @param {import("react").ReactNode} [props.meta] A muted strip under the header.
 * @param {import("react").ReactNode} [props.pin] Header-right node before the action.
 * @param {() => void} [props.onViewAll] Called by the "View all" affordance at the header's end.
 * @param {string} [props.viewAllLabel] The text of the "View all" affordance.
 * @param {import("react").ReactNode} [props.action] Header-right node; wins over `onViewAll`, null for nothing.
 * @param {boolean} [props.collapsible] Makes the whole header a toggle that unmounts the body when shut.
 * @param {boolean} [props.open] Controlled collapse state.
 * @param {() => void} [props.onToggle] Called with the next state when a collapsible header is pressed.
 * @param {string} [props.className] Extra classes on the card.
 * @param {import("react").ReactNode} [props.children] The body: a `k-brief__list` of rows, a `k-brief__empty`, or any content.
 */
function BriefCard({ icon, title, count, countTone, countTitle, value, wrapHead = false, fill = false, revealPin = false, meta, pin, onViewAll, viewAllLabel = "View all", action,
  collapsible = false, open = true, onToggle, className = "", children }) {
  const right = action !== undefined
    ? action
    : (onViewAll
        ? (
          <button className="k-view-all" onClick={onViewAll}>
            {viewAllLabel} <Icon name="arrow-right" size={11} strokeWidth={2.2} />
          </button>
        )
        : null);
  const shut = collapsible && !open;
  const head = (
    <>
      <span className="k-brief__title">
        {icon && <Icon name={icon} size={13} />} {title}
        {count != null && count !== false && (
          <Pill size="sm" tone={countTone === "neutral" ? "muted" : countTone || "warn"} title={countTitle}
            className={"k-brief__count" + (countTone ? " k-brief__count--" + countTone : "")}>{count}</Pill>
        )}
      </span>
      {value != null && <span className="k-brief__value">{value}</span>}
      {pin != null && (revealPin ? <span className="k-brief__pin">{pin}</span> : pin)}
      {right}
      {collapsible && <Icon name="chevron-down" size={16} className="k-brief__chev" />}
    </>
  );
  return (
    <div className={"k-brief" + (shut ? " k-brief--shut" : "") + (fill ? " k-brief--fill" : "") + (wrapHead ? " k-brief--wrap" : "") + (className ? " " + className : "")}>
      {title == null && !collapsible
        ? null
        : collapsible
        ? (
          <button type="button" className="k-brief__head k-brief__head--toggle"
            onClick={onToggle} aria-expanded={open}>
            {head}
          </button>
        )
        : <div className="k-brief__head">{head}</div>}
      {!shut && meta && <div className="k-brief__meta">{meta}</div>}
      {!shut && children}
    </div>
  );
}

export { BriefCard };
