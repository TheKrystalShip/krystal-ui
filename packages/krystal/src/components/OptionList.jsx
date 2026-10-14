import React from "react";
import { Icon } from "./Icon.jsx";

// OptionList — a set of choices drawn as full-width rows in one bordered group, the whole row the
// hit target. `multiple` makes it checkboxes; without it, it is a radio group, and the chosen row is
// tinted with the accent. Every row holds a real <input> inside its <label>, so a click on the words
// reaches it, a screen reader names it, and a radio group moves its choice with the arrow keys.
//
//   options   — [{ value, label, detail, aside, disabled }]. `detail` is a quieter word after the
//               label ("Stereo"); `aside` sits at the row's end in monospace (a size, a count).
//   value     — the chosen value; with `multiple`, the array of chosen values.
//   onChange  — receives the next value; with `multiple`, the next array, in `options` order.
//   label     — the group's accessible name, for a group whose heading is drawn elsewhere.
//   name      — the inputs' form name; one is made up when it is left out.
//   disabled  — every row inert; a single option is disabled by its own `disabled`.
//
// `size` is md (52px rows) or sm (44px rows, for a pointer; a phone raises it to 48px).
// `variant="segmented"` lays the options side by side in one strip, the label over its `aside`, for
// a short single choice on a wide screen.
//
// `collapsedAfter` shows that many rows and ends the group with a row that reveals the rest;
// `moreLabel(hiddenCount)` words it ("9 more languages"), and is "N more" when left out. A chosen
// option past the cut is shown anyway, in its place, so a choice is never hidden.
/**
 * @template {string | number} [V=string | number]
 * @typedef {object} OptionListItem
 * @property {V} value
 * @property {import("react").ReactNode} label
 * @property {import("react").ReactNode} [detail] A quieter word after the label.
 * @property {import("react").ReactNode} [aside] At the row's end, in monospace.
 * @property {boolean} [disabled]
 */
/**
 * @typedef {object} OptionListOwnProps
 * @property {OptionListItem[]} options
 * @property {any} [value] The chosen value; with `multiple`, the array of chosen values.
 * @property {(next: any) => void} [onChange] The next value; with `multiple`, the next array in `options` order.
 * @property {boolean} [multiple] Checkboxes instead of a radio group.
 * @property {string} [label] The group's accessible name.
 * @property {string} [name] The inputs' form name.
 * @property {boolean} [disabled]
 * @property {"sm" | "md"} [size]
 * @property {"list" | "segmented"} [variant]
 * @property {number} [collapsedAfter] Rows shown before a reveal row.
 * @property {(hiddenCount: number) => string} [moreLabel]
 * @property {string} [className]
 * @typedef {OptionListOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof OptionListOwnProps | "onChange">} OptionListProps
 */
/** @param {OptionListProps} props */
function OptionList({
  options, value, onChange, multiple = false, label, name, disabled = false,
  size = "md", variant = "list", collapsedAfter, moreLabel, className, ...rest
}) {
  const autoName = React.useId();
  const groupName = name || autoName;
  const [expanded, setExpanded] = React.useState(false);
  const revealRef = React.useRef(null);
  const focusReveal = React.useRef(false);

  const chosen = multiple ? new Set(value || []) : null;
  const isOn = (o) => (multiple ? chosen.has(o.value) : value === o.value);

  const cut = !expanded && collapsedAfter != null && options.length > collapsedAfter;
  const shown = cut ? options.filter((o, i) => i < collapsedAfter || isOn(o)) : options;
  const hidden = options.length - shown.length;
  const firstRevealed = expanded ? options.find((o, i) => i >= collapsedAfter && !isOn(o)) : undefined;

  React.useEffect(() => {
    if (expanded && focusReveal.current && revealRef.current) {
      focusReveal.current = false;
      revealRef.current.focus();
    }
  }, [expanded]);

  const pick = (o, checked) => {
    if (!onChange) return;
    if (!multiple) { onChange(o.value); return; }
    onChange(options.filter((x) => (x.value === o.value ? checked : chosen.has(x.value))).map((x) => x.value));
  };

  const cls = "k-optlist k-optlist--" + variant + " k-optlist--" + size
    + (multiple ? " k-optlist--multiple" : " k-optlist--single")
    + (className ? " " + className : "");

  return (
    <div className={cls} role={multiple ? "group" : "radiogroup"} aria-label={label}
      aria-disabled={disabled || undefined} {...rest}>
      {shown.map((o) => {
        const on = isOn(o);
        const off = disabled || !!o.disabled;
        return (
          <label key={String(o.value)}
            className={"k-optlist__row" + (on ? " k-is-on" : "") + (off ? " k-is-disabled" : "")}>
            <input ref={o === firstRevealed ? revealRef : undefined}
              type={multiple ? "checkbox" : "radio"} className="k-optlist__input" name={groupName}
              value={String(o.value)} checked={on} disabled={off}
              onChange={(e) => pick(o, e.target.checked)} />
            <span className="k-optlist__mark" aria-hidden="true">
              {multiple && on && <Icon name="check" size={14} strokeWidth={3} />}
            </span>
            <span className="k-optlist__text">
              <span className="k-optlist__label">{o.label}</span>
              {o.detail != null && <span className="k-optlist__detail">{o.detail}</span>}
            </span>
            {o.aside != null && <span className="k-optlist__aside">{o.aside}</span>}
          </label>
        );
      })}
      {hidden > 0 && (
        <button type="button" className="k-optlist__more" disabled={disabled}
          onClick={() => { focusReveal.current = true; setExpanded(true); }}>
          <span className="k-optlist__mark" aria-hidden="true" />
          <span className="k-optlist__text">{moreLabel ? moreLabel(hidden) : hidden + " more"}</span>
          <Icon name="chevron-down" size={16} className="k-optlist__chev" />
        </button>
      )}
    </div>
  );
}

export { OptionList };
