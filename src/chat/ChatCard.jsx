import { Button } from "../components/Button.jsx";
import { Icon } from "../components/Icon.jsx";

// The card a product draws under an answer: an icon tile, a title with a `sub` line under it in
// monospace, and on the right how sure the assistant is and the way to the full context. The body is
// the product's own, as children.
//
// `tone` colours the icon tile — neutral (the default), ok, danger or muted; a muted card is one the
// conversation has moved past, and dims. `confidence` is confirmed (measured), likely (inferred from
// correlation) or possible (cannot be measured), drawn as a badge. `onOpen` with `openLabel` is the
// way to the full context; `action` is any other node for the head's right end, and wins over it.
const CONFIDENCE = {
  confirmed: { label: "Confirmed", icon: "badge-check", title: "Directly measured" },
  likely: { label: "Likely", icon: "trending-up", title: "Inferred from correlation" },
  possible: { label: "Possible", icon: "help-circle", title: "Can’t be measured directly" },
};

function ConfidenceBadge({ level }) {
  const meta = CONFIDENCE[level];
  if (!meta) return null;
  return (
    <span className={"ev-conf ev-conf--" + level} title={meta.title}>
      <Icon name={meta.icon} size={10} strokeWidth={2.4} />
      {meta.label}
    </span>
  );
}

function ChatCard({ icon, tone = "neutral", title, sub, confidence, onOpen, openLabel = "Open", action, className, children }) {
  const right = action !== undefined
    ? action
    : onOpen && (
      <Button variant="outline" size="xs" iconRight="arrow-right" className="ev-card__open" onClick={onOpen}>
        {openLabel}
      </Button>
    );
  return (
    <div className={"ev-card ev-card--" + tone + (className ? " " + className : "")}>
      <div className="ev-card__head">
        {icon && <span className="ev-card__icon"><Icon name={icon} size={13} /></span>}
        <div className="ev-card__titles">
          <span className="ev-card__title">{title}</span>
          {sub && <span className="ev-card__sub">{sub}</span>}
        </div>
        {CONFIDENCE[confidence] && <span className="ev-card__conf-label">Confidence:</span>}
        <ConfidenceBadge level={confidence} />
        {right}
      </div>
      {children}
    </div>
  );
}

export { ChatCard, ConfidenceBadge };
