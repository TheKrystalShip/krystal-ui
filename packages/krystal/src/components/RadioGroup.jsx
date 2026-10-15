import React from "react";
import { onTelevision } from "../lib/television.js";
import { ColorInput } from "./ColorInput.jsx";
import { Icon } from "./Icon.jsx";

// RadioGroup — a small single choice drawn inline or stacked, each option a button with role radio
// (WAI-ARIA radio group): one tab stop on the chosen option, and the arrows along the group's line
// (left and right in a row, up and down in a stack) move to the next enabled option and choose it,
// wrapping at the ends. The cross-axis arrows are left to the page. On a television (`data-tv`) the
// group takes no arrow at all: spatial focus reaches every radio, and OK chooses the focused one.
//
// OptionList is the other single choice: full-width rows with a detail and an aside, for a choice
// that is a form field on its own. RadioGroup is the compact one, for a handful of short labels
// beside other controls or inside a dense row.
//
//   options      [{ value, label, icon, title, disabled }]
//   value        the chosen value; `onChange` receives the next one
//   orientation  horizontal (default) lays the options in a row, vertical stacks them
//   variant      radio (default) draws a dot before each label; segmented draws one framed strip
//                with the chosen option filled; swatch draws each option as a round disc of its
//                `color`, named by its `label` (a palette). `picker` adds a ColorInput after the
//                discs, for a colour that is not in the palette: it is marked when `value` is none
//                of the options, and `onChange` receives its `#rrggbb`
//   size         sm or md (default)
//   fill         the group takes its container's width and its options share it equally
//   label        the group's accessible name, for one whose heading is drawn elsewhere
//
// `disabled` makes every option inert; an option is disabled by its own `disabled`.
/**
 * @template {string | number} [V=string | number]
 * @typedef {object} RadioGroupItem
 * @property {V} value
 * @property {import("react").ReactNode} label
 * @property {string} [icon] A Lucide name drawn before the label.
 * @property {string} [color] A CSS colour, for the `swatch` variant's disc.
 * @property {string} [title] A hover hint.
 * @property {boolean} [disabled]
 */
/**
 * @typedef {object} RadioGroupOwnProps
 * @property {RadioGroupItem[]} options The choices, each `{ value, label, icon, title, disabled }`.
 * @property {any} [value] The chosen value.
 * @property {(next: any) => void} [onChange] The next value.
 * @property {"horizontal" | "vertical"} [orientation] `horizontal` lays the options in a row; `vertical` stacks them.
 * @property {"radio" | "segmented" | "swatch"} [variant] `radio` draws a dot before each label; `segmented` draws one framed strip with the chosen option filled; `swatch` draws each option as a disc of its `color`.
 * @property {string} [picker] With `variant="swatch"`, draws a ColorInput after the discs, named by this text.
 * @property {"sm" | "md"} [size] `sm` or `md`.
 * @property {boolean} [fill] The group takes its container's width, and its options share it equally.
 * @property {string} [label] The group's accessible name.
 * @property {boolean} [disabled] Makes every option inert.
 * @property {string} [className] Extra class names on the group.
 * @typedef {RadioGroupOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof RadioGroupOwnProps | "onChange">} RadioGroupProps
 */
/** @type {import("react").ForwardRefExoticComponent<RadioGroupProps & import("react").RefAttributes<HTMLDivElement>>} */
const RadioGroup = React.forwardRef(function RadioGroup({
  options, value, onChange, orientation = "horizontal", variant = "radio", size = "md", fill = false, label,
  disabled = false, picker, className, onKeyDown, ...rest
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
    // Arrows along the group's own line move the choice; the cross-axis ones are left to the page,
    // and on a television all four are spatial focus's, which reaches each radio and lets OK choose.
    if (onTelevision()) return;
    const vertical = orientation === "vertical";
    const step = e.key === (vertical ? "ArrowDown" : "ArrowRight") ? 1
      : e.key === (vertical ? "ArrowUp" : "ArrowLeft") ? -1 : 0;
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
    + (fill ? " k-radios--fill" : "") + (className ? " " + className : "");
  return (
    <div ref={setRef} role="radiogroup" aria-label={label} aria-disabled={disabled || undefined}
      aria-orientation={orientation} className={cls} onKeyDown={keys} {...rest}>
      {options.map((o) => {
        const on = isOn(o);
        const off = disabled || !!o.disabled;
        return (
          <button key={String(o.value)} type="button" role="radio" aria-checked={on} title={o.title || (variant === "swatch" && typeof o.label === "string" ? o.label : undefined)}
            disabled={off} tabIndex={on ? 0 : -1}
            className={(variant === "swatch" ? "k-swatch k-swatch--" + size : "k-radios__item") + (on ? " k-is-on" : "")}
            aria-label={variant === "swatch" && typeof o.label === "string" ? o.label : undefined}
            style={variant === "swatch" ? /** @type {any} */ ({ "--k-swatch": o.color }) : undefined}
            onClick={() => { if (!on && onChange) onChange(o.value); }}>
            {variant === "radio" && <span className="k-radios__mark" aria-hidden="true" />}
            {o.icon && <Icon name={o.icon} size={size === "sm" ? 13 : 14} />}
            {variant !== "swatch" && <span className="k-radios__label">{o.label}</span>}
          </button>
        );
      })}
      {variant === "swatch" && picker && (
        <ColorInput label={picker} title={picker} size={size} disabled={disabled}
          value={typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : undefined}
          selected={value != null && !options.some((o) => o.value === value)}
          onChange={(v) => { if (onChange) onChange(v); }} />
      )}
    </div>
  );
});

export { RadioGroup };
