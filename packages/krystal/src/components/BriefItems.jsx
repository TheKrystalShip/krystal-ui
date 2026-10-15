import { Icon } from "./Icon.jsx";

// The furniture that goes inside a BriefCard: `BriefList` holds rows, `BriefItem` is one row (a tone
// stripe, an icon, what it is and what about it, a block below, and a trailing action), `BriefEmpty` is the card's
// answer when there is nothing to list, and `FactList` is label/value pairs for a card that states a
// handful of facts. They draw the `k-brief__*` markup, so a site restyles them through those classes.

/**
 * @typedef {"danger" | "warn" | "info" | "success" | "update"} BriefTone
 */

/**
 * A column of rows inside a BriefCard.
 * @param {import("react").ComponentPropsWithoutRef<"div">} props
 */
function BriefList({ className, children, ...rest }) {
  return <div className={"k-brief__list" + (className ? " " + className : "")} {...rest}>{children}</div>;
}

/**
 * @typedef {object} BriefItemOwnProps
 * @property {BriefTone} [tone] Colours the row's stripe and icon; omitted is neutral.
 * @property {string} [icon] A Lucide name, in the icon tile.
 * @property {import("react").ReactNode} title What the row is.
 * @property {boolean} [escalated] Marks a row that needs a person: a danger tint on the row and a filled "Needs you" mark after the title.
 * @property {boolean} [mono] Sets the title in the monospace face (a name, an id, a path).
 * @property {import("react").ReactNode} [tags] Pills after the title text, inside the title line.
 * @property {import("react").ReactNode} [detail] A muted line under the title.
 * @property {boolean} [wrapDetail] Lets the detail wrap onto several lines instead of ending in an ellipsis.
 * @property {import("react").ReactNode} [below] A block under the detail, in the text column (fields, a preview). Controls here belong on a row that is not itself a button or a link.
 * @property {boolean} [controlsBelow] At phone width the controls take their own line under the words, indented to them: a text field or Select that is `wide` fills the line and the rest keep their size.
 * @property {boolean} [disabled] The row is not available: it has no hover, and its `action` is quiet.
 * @property {import("react").ReactNode} [controls] Controls at the row's end in the settings arrangement: they wrap under the words when they do not fit beside them.
 * @property {import("react").ReactNode} [action] A link-styled label at the row's end, with an arrow.
 * @property {() => void} [onClick] Makes the row a button.
 * @property {string} [href] Makes the row a link.
 * @property {string} [className] Extra classes on the row.
 * @property {import("react").ReactNode} [children] Trailing content at the row's end, before the action (buttons).
 * @typedef {BriefItemOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof BriefItemOwnProps>} BriefItemProps
 */
/** @param {BriefItemProps} props */
function BriefItem({ tone, icon, title, escalated = false, mono = false, tags, detail, wrapDetail = false, below, controls, controlsBelow = false, disabled = false, action, onClick, href, className, children, ...rest }) {
  const live = Boolean(onClick || href);
  const cls = "k-brief__item" + (tone ? " k-brief__item--" + tone : "") + (live ? "" : " k-brief__item--static") + (escalated ? " k-brief__item--escalated" : "") + (controls != null ? " k-settings-row" : "") + (controls != null && controlsBelow ? " k-settings-row--below" : "") + (disabled ? " k-is-disabled" : "")
    + (className ? " " + className : "");
  const body = (
    <>
      {icon && <span className="k-brief__icon"><Icon name={icon} size={14} /></span>}
      <div className="k-brief__body">
        <span className={"k-brief__item-title" + (mono ? " k-brief__item-title--mono" : "")}>
          <span className="k-brief__titletext">{title}</span>
          {escalated && <span className="k-brief__needs-you"><Icon name="hand" size={9} strokeWidth={2.6} /> Needs you</span>}
          {tags}
        </span>
        {detail && <span className={"k-brief__detail" + (wrapDetail ? " k-brief__detail--wrap" : "")}>{detail}</span>}
        {below != null && <div className="k-brief__below">{below}</div>}
      </div>
      {children}
      {controls != null && <div className="k-settings-row__controls">{controls}</div>}
      {action && <span className="k-brief__ask">{action} <Icon name="arrow-right" size={12} strokeWidth={2.2} /></span>}
    </>
  );
  if (href) {
    return <a className={cls} href={href} onClick={onClick} {.../** @type {any} */ (rest)}>{body}</a>;
  }
  if (onClick) {
    const onKeyDown = (/** @type {import("react").KeyboardEvent<HTMLDivElement>} */ e) => {
      if (e.target !== e.currentTarget) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    };
    return <div className={cls} role="button" tabIndex={0} onClick={onClick} onKeyDown={onKeyDown} {...rest}>{body}</div>;
  }
  return <div className={cls} {...rest}>{body}</div>;
}

/**
 * @typedef {object} BriefEmptyOwnProps
 * @property {import("react").ReactNode} title What there is nothing of.
 * @property {import("react").ReactNode} [body] The line under the title.
 * @property {string} [icon] A Lucide name above the title.
 * @property {"ok" | "neutral"} [tone] ok reads as all-clear (the default); neutral is an absence that is neither good nor bad.
 * @property {string} [className] Extra classes on the root.
 * @property {import("react").ReactNode} [children] The body, after `body`: a node when the line under the title is more than text.
 * @typedef {BriefEmptyOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof BriefEmptyOwnProps>} BriefEmptyProps
 */
/** @param {BriefEmptyProps} props */
function BriefEmpty({ title, body, icon, tone = "ok", className, children, ...rest }) {
  return (
    <div className={"k-brief__empty" + (tone === "neutral" ? " k-brief__empty--neutral" : "") + (className ? " " + className : "")}
      {...rest}>
      {icon && <Icon name={icon} size={20} />}
      <span className="k-brief__empty-title">{title}</span>
      {body && <span className="k-brief__empty-sub">{body}</span>}
      {children}
    </div>
  );
}

/**
 * @typedef {object} Fact
 * @property {import("react").ReactNode} label
 * @property {import("react").ReactNode} value
 * @property {import("react").ReactNode} [hint] Under the pair, for a value that would invite the wrong reading.
 * @property {boolean} [mono]
 * @property {"ok" | "warn" | "danger"} [tone] Colours the value.
 */
/**
 * @typedef {object} FactListOwnProps
 * @property {(Fact | false | null | undefined)[]} rows Falsy entries are skipped.
 * @property {string} [className] Extra classes on the list.
 * @typedef {FactListOwnProps & Omit<import("react").ComponentPropsWithoutRef<"dl">, keyof FactListOwnProps>} FactListProps
 */
/** @param {FactListProps} props */
function FactList({ rows, className, ...rest }) {
  return (
    <dl className={"k-brief__facts" + (className ? " " + className : "")} {...rest}>
      {rows.filter((r) => Boolean(r)).map((r, i) => {
        const f = /** @type {Fact} */ (r);
        return (
          <div className="k-brief__fact" key={typeof f.label === "string" ? f.label : i}>
            <dt className="k-brief__fact-label">{f.label}</dt>
            <dd className={"k-brief__fact-value" + (f.mono ? " k-brief__fact-value--mono" : "") + (f.tone ? " k-brief__fact-value--" + f.tone : "")}>{f.value}</dd>
            {f.hint && <dd className="k-brief__fact-hint">{f.hint}</dd>}
          </div>
        );
      })}
    </dl>
  );
}

export { BriefEmpty, BriefItem, BriefList, FactList };
