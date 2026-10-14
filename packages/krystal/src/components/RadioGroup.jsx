import React from "react";
import { Icon } from "./Icon.jsx";

// RadioGroup — a small single choice drawn inline or stacked, each option a button with role radio
// (WAI-ARIA radio group): one tab stop on the chosen option, arrow keys that move to the next
// enabled option and choose it, wrapping at the ends.
//
// OptionList is the other single choice: full-width rows with a detail and an aside, for a choice
// that is a form field on its own. RadioGroup is the compact one, for a handful of short labels
// beside other controls or inside a dense row.
//
//   options      [{ value, label, icon, title, disabled }]
//   value        the chosen value; `onChange` receives the next one
//   orientation  horizontal (default) lays the options in a row, vertical stacks them
//   variant      radio (default) draws a dot before each label; segmented draws one framed strip
//                with the chosen option filled
//   size         sm or md (default)
//   label        the group's accessible name, for one whose heading is drawn elsewhere
//
// `disabled` makes every option inert; an option is disabled by its own `disabled`.
/**
 * @template {string | number} [V=string | number]
 * @typedef {object} RadioGroupItem
 * @property {V} value
 * @property {import("react").ReactNode} label
 * @property {string} [icon] A Lucide name drawn before the label.
 * @property {string} [title] A hover hint.
 * @property {boolean} [disabled]
 */
/**
 * @typedef {object} RadioGroupOwnProps
 * @property {RadioGroupItem[]} options
 * @property {any} [value] The chosen value.
 * @property {(next: any) => void} [onChange] The next value.
 * @property {"horizontal" | "vertical"} [orientation]
 * @property {"radio" | "segmented"} [variant]
 * @property {"sm" | "md"} [size]
 * @property {string} [label] The group's accessible name.
 * @property {boolean} [disabled]
 * @property {string} [className]
 * @typedef {RadioGroupOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof RadioGroupOwnProps | "onChange">} RadioGroupProps
 */
/** @type {import("react").ForwardRefExoticComponent<RadioGroupProps & import("react").RefAttributes<HTMLDivElement>>} */
const RadioGroup = React.forwardRef(function RadioGroup({
  options, value, onChange, orientation = "horizontal", variant = "radio", size = "md", label,
  disabled = false, className, onKeyDown, ...rest
}, ref) {
  const own = React.useRef(null);
  const setRef = (el) => {
    own.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  };
  const isOn = (o) => value !== undefined && value !== null && value === o.value;

  // With nothing chosen, the first enabled option is the one Tab key lands on.
  React.useLayoutEffect(() => {
    const group = own.current;
    if (!group || group.querySelector('[role="radio"][aria-checked="true"]')) return;
    const first = group.querySelector('[role="radio"]:not(:disabled)');
    if (first) first.tabIndex = 0;
  });

  const keys = (e) => {
    if (onKeyDown) onKeyDown(e);
    if (e.defaultPrevented) return;
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1
      : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    const items = Array.from(own.current.querySelectorAll('[role="radio"]:not(:disabled)'));
    const at = items.indexOf(document.activeElement);
    if (at < 0) return;
    e.preventDefault();
    const to = items[(at + step + items.length) % items.length];
    to.focus();
    to.click();
  };

  const cls = "k-radios k-radios--" + variant + " k-radios--" + orientation + " k-radios--" + size
    + (className ? " " + className : "");
  return (
    <div ref={setRef} role="radiogroup" aria-label={label} aria-disabled={disabled || undefined}
      aria-orientation={orientation} className={cls} onKeyDown={keys} {...rest}>
      {options.map((o) => {
        const on = isOn(o);
        const off = disabled || !!o.disabled;
        return (
          <button key={String(o.value)} type="button" role="radio" aria-checked={on} title={o.title}
            disabled={off} tabIndex={on ? 0 : -1}
            className={"k-radios__item" + (on ? " k-is-on" : "")}
            onClick={() => { if (!on && onChange) onChange(o.value); }}>
            {variant === "radio" && <span className="k-radios__mark" aria-hidden="true" />}
            {o.icon && <Icon name={o.icon} size={size === "sm" ? 13 : 14} />}
            <span className="k-radios__label">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
});

export { RadioGroup };
