import { Button } from "@thekrystalship/krystal";
import { Icon } from "@thekrystalship/krystal";

// The card a product draws under an answer: an icon tile, a title with a `sub` line under it, and on
// the right how sure the assistant is and the way to the full context. The body is the product's own,
// as children; `ChatCardRow` is the row grammar a body is written in.
//
// `tone` colours the icon tile — neutral (the default), accent, ok, warn, danger or muted; a muted
// card is one the conversation has moved past, and dims. `icon` is a Lucide name or a node (a spinner).
// `sub` is monospace, a figure or a path; `subMono={false}` sets it as prose. `confidence` is
// confirmed (measured), likely (inferred from correlation) or possible (cannot be measured), drawn as
// a dot and a word. `onOpen` with `openLabel` is the way to the full context; `action` is any other
// node for the head's right end, and wins over it.
const CONFIDENCE = {
  confirmed: { label: "Confirmed", title: "Directly measured" },
  likely: { label: "Likely", title: "Inferred from correlation" },
  possible: { label: "Possible", title: "Can’t be measured directly" },
};

/**
 * @param {object} props
 * @param {"confirmed" | "likely" | "possible"} [props.level] confirmed (measured), likely (inferred from correlation) or possible (cannot be measured); anything else draws nothing.
 */
function ConfidenceBadge({ level }) {
  const meta = CONFIDENCE[level];
  if (!meta) return null;
  return (
    <span className={"k-chat-confidence k-chat-confidence--" + level} title={meta.title}>
      {meta.label}
    </span>
  );
}

/**
 * @param {object} props
 * @param {string | import("react").ReactNode} [props.icon] a Lucide name or a node
 * @param {"neutral" | "accent" | "ok" | "warn" | "danger" | "muted"} [props.tone] The head's colour; `neutral` by default.
 * @param {import("react").ReactNode} [props.title] The card's heading.
 * @param {import("react").ReactNode} [props.sub] The line under the title, monospace unless `subMono` is false.
 * @param {boolean} [props.subMono] sets `sub` as code; false sets it as prose
 * @param {"confirmed" | "likely" | "possible"} [props.confidence] Draws a dot and word saying how the figures were obtained: confirmed, likely or possible.
 * @param {() => void} [props.onOpen] the way to the full context
 * @param {string} [props.openLabel] The words of the open button that `onOpen` shows; `Open` by default.
 * @param {import("react").ReactNode} [props.action] any other node for the head's right end; wins over `onOpen`
 * @param {string} [props.className] Extra class on the card.
 * @param {import("react").ReactNode} [props.children] The card's body.
 */
function ChatCard({
  icon, tone = "neutral", title, sub, subMono = true, confidence, onOpen, openLabel = "Open", action,
  className, children,
}) {
  const right = action !== undefined
    ? action
    : onOpen && (
      <Button variant="ghost" size="xs" iconRight="arrow-right" className="k-chat-card__open" onClick={onOpen}>
        {openLabel}
      </Button>
    );
  return (
    <div className={"k-chat-card k-chat-card--" + tone + (className ? " " + className : "")}>
      <div className="k-chat-card__head">
        {icon && (
          <span className="k-chat-card__icon">
            {typeof icon === "string" ? <Icon name={icon} size={14} strokeWidth={2} /> : icon}
          </span>
        )}
        <div className="k-chat-card__titles">
          <span className="k-chat-card__title">{title}</span>
          {sub && <span className={"k-chat-card__sub" + (subMono ? "" : " k-chat-card__sub--prose")}>{sub}</span>}
        </div>
        {(CONFIDENCE[confidence] || right) && (
          <div className="k-chat-card__end">
            <ConfidenceBadge level={confidence} />
            {right}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

// One line of a card's body: what was looked at, what it reads, and whether that is good. `verdict`
// is ok, warn, danger or neutral (`skip` is the same) and draws the mark at the end; neutral is a dash
// for a reading that judges neither way. A danger reading is set in the danger colour too, because it
// is the line the card exists to point at. `verdictLabel` is the mark's accessible name and tooltip,
// defaulting to the verdict's word. A row without a `label` is one sentence across both columns.
// `mono` sets the label as code, `valueMono` the value; `action` is a node at the row's end.
const VERDICTS = {
  ok: { icon: "check", label: "Passed" },
  warn: { icon: "alert-triangle", label: "Warning" },
  danger: { icon: "x", label: "Failed" },
  neutral: { icon: "minus", label: "Skipped" },
};

/**
 * @param {object} props
 * @param {import("react").ReactNode} [props.label] The row's name, set as code when `mono` is true.
 * @param {import("react").ReactNode} [props.value] The row's figure, set as code when `valueMono` is true.
 * @param {"ok" | "warn" | "danger" | "neutral" | "skip"} [props.verdict] The row's outcome, drawn as a mark: ok, warn, danger, neutral or skip.
 * @param {string} [props.verdictLabel] The words that name the verdict for assistive technology.
 * @param {boolean} [props.mono] sets the label as code
 * @param {boolean} [props.valueMono] sets the value as code
 * @param {import("react").ReactNode} [props.action] A node at the row's right end.
 */
function ChatCardRow({ label, value, verdict, verdictLabel, mono = false, valueMono = false, action }) {
  const tone = verdict === "skip" ? "neutral" : verdict;
  const v = VERDICTS[tone];
  const bare = label == null || label === "";
  return (
    <div className={"k-chat-card-row" + (v ? " k-chat-card-row--" + tone : "") + (bare ? " k-chat-card-row--bare" : "")}>
      {!bare && <span className={"k-chat-card-row__label" + (mono ? " k-chat-card-row__label--mono" : "")}>{label}</span>}
      <span className={"k-chat-card-row__value" + (valueMono ? " k-chat-card-row__value--mono" : "")}>{value}</span>
      {v && (
        <span className="k-chat-card-row__verdict" role="img" aria-label={verdictLabel || v.label} title={verdictLabel || v.label}>
          <Icon name={v.icon} size={14} strokeWidth={2.2} />
        </span>
      )}
      {action}
    </div>
  );
}

// The rows' frame under the card's head.
/**
 * @param {object} props
 * @param {import("react").ReactNode} [props.children] The `ChatCardRow`s of the group.
 */
function ChatCardRows({ children }) {
  return <div className="k-chat-card-rows">{children}</div>;
}

export { ChatCard, ChatCardRow, ChatCardRows, ConfidenceBadge };
