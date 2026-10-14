import React from "react";
import { Icon } from "./Icon.jsx";
import { IconButton } from "./Button.jsx";

// The form controls: a text field, a multi-line field, a checkbox, and the labelled frame a form
// lays them out in. Each one is the native element with the package's look; every prop a native
// element takes reaches it (value, onChange(event), placeholder, autoFocus, maxLength, …), and the
// element's ref is forwarded, so a caller focuses or measures it as it would a plain one.

// Input — a single-line field. Sizes share Button's heights (sm 30, md 34, lg 38) so a field and its
// button sit on one line. `mono` for an identifier, a path, a port; `wide` fills its container;
// `invalid` marks it (aria-invalid) with the danger border.
//
// `prefix` and `suffix` are words or marks inside the field's frame, before and after what is typed —
// the unit a number is in, the domain a name is completed with. The frame then draws the field and
// the native input inside it is bare; the ref still reaches the input.
/**
 * @typedef {object} InputOwnProps
 * @property {"sm" | "md" | "lg"} [size]
 * @property {boolean} [mono] Monospace, for an identifier, a path, a port.
 * @property {boolean} [wide] Fills its container.
 * @property {boolean} [invalid] Danger border and aria-invalid.
 * @property {import("react").ReactNode} [prefix] Inside the frame, before what is typed.
 * @property {import("react").ReactNode} [suffix] Inside the frame, after what is typed.
 * @property {string} [className]
 * @typedef {InputOwnProps & Omit<import("react").ComponentPropsWithoutRef<"input">, keyof InputOwnProps>} InputProps
 */
/** @type {import("react").ForwardRefExoticComponent<InputProps & import("react").RefAttributes<HTMLInputElement>>} */
const Input = React.forwardRef(function Input(
  { size = "md", mono = false, wide = false, invalid = false, prefix, suffix, className, ...rest }, ref) {
  const cls = "k-input k-input--" + size
    + (mono ? " k-input--mono" : "")
    + (wide ? " k-input--wide" : "")
    + (className ? " " + className : "");
  if (prefix == null && suffix == null) {
    return <input ref={ref} className={cls} aria-invalid={invalid || undefined} {...rest} />;
  }
  return (
    <span className={cls + " k-input--affixed" + (rest.disabled ? " k-is-disabled" : "")
      + (invalid ? " k-is-invalid" : "")}>
      {prefix != null && <span className="k-input__affix">{prefix}</span>}
      <input ref={ref} className="k-input__el" aria-invalid={invalid || undefined} {...rest} />
      {suffix != null && <span className="k-input__affix">{suffix}</span>}
    </span>
  );
});

// PasswordInput — an Input whose suffix is a button revealing what is typed. `revealLabel` is the
// button's accessible name in each state, [hidden, shown]; every other prop is Input's and reaches the
// input, and the ref reaches it too. A press on the button leaves focus in the input.
/**
 * @typedef {object} PasswordInputOwnProps
 * @property {[string, string]} [revealLabel] The reveal button's accessible name, [hidden, shown].
 * @typedef {PasswordInputOwnProps & Omit<InputProps, keyof PasswordInputOwnProps | "type">} PasswordInputProps
 */
/** @type {import("react").ForwardRefExoticComponent<PasswordInputProps & import("react").RefAttributes<HTMLInputElement>>} */
const PasswordInput = React.forwardRef(function PasswordInput(
  { revealLabel = ["Show password", "Hide password"], size = "md", ...inputProps }, ref) {
  const [shown, setShown] = React.useState(false);
  return (
    <Input {...inputProps} ref={ref} size={size} type={shown ? "text" : "password"}
      suffix={(
        <IconButton variant="ghost" size={size === "sm" ? "xs" : "sm"} className="k-input__reveal"
          icon={shown ? "eye-off" : "eye"} label={shown ? revealLabel[1] : revealLabel[0]}
          disabled={inputProps.disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShown((v) => !v)} />
      )} />
  );
});

// Textarea — Input's look over several lines. It grows by the person dragging it, vertically only.
/**
 * @typedef {object} TextareaOwnProps
 * @property {boolean} [mono]
 * @property {boolean} [invalid]
 * @property {number} [rows]
 * @property {string} [className]
 * @typedef {TextareaOwnProps & Omit<import("react").ComponentPropsWithoutRef<"textarea">, keyof TextareaOwnProps>} TextareaProps
 */
/** @type {import("react").ForwardRefExoticComponent<TextareaProps & import("react").RefAttributes<HTMLTextAreaElement>>} */
const Textarea = React.forwardRef(function Textarea(
  { mono = false, invalid = false, rows = 4, className, ...rest }, ref) {
  return (
    <textarea ref={ref} rows={rows}
      className={"k-input k-textarea k-input--wide"
        + (mono ? " k-input--mono" : "")
        + (className ? " " + className : "")}
      aria-invalid={invalid || undefined}
      {...rest} />
  );
});

// Checkbox — a native checkbox in the accent colour, with its words beside it. The whole line is
// the hit target. `onChange` receives the new checked state, not the event.
/**
 * @typedef {object} CheckboxOwnProps
 * @property {boolean} [checked]
 * @property {(checked: boolean) => void} [onChange] Receives the new checked state, not the event.
 * @property {boolean} [disabled]
 * @property {import("react").ReactNode} [children] The words beside the box.
 * @property {string} [className]
 * @typedef {CheckboxOwnProps & Omit<import("react").ComponentPropsWithoutRef<"input">, keyof CheckboxOwnProps | "type">} CheckboxProps
 */
/** @param {CheckboxProps} props */
function Checkbox({ checked, onChange, disabled = false, children, className, ...rest }) {
  return (
    <label className={"k-check" + (disabled ? " k-check--disabled" : "") + (className ? " " + className : "")}>
      <input type="checkbox" className="k-check__box" checked={!!checked} disabled={disabled}
        onChange={(e) => onChange && onChange(e.target.checked)} {...rest} />
      {children != null && <span className="k-check__label">{children}</span>}
    </label>
  );
}

// Field — one labelled control: the label, the control, then either a hint or an error. The frame
// is a <label>, so a click on the words reaches the control without an id. A frame holding several
// controls passes `group`, and becomes a labelled group instead.
//
// `aside` sits after the label in a quieter weight ("optional", a character count). `hintId` and
// `errorId` name the hint and the error line, for a control's aria-describedby; every other prop
// lands on the frame.
/**
 * @typedef {object} FieldOwnProps
 * @property {import("react").ReactNode} [label]
 * @property {import("react").ReactNode} [aside]  After the label, quieter.
 * @property {import("react").ReactNode} [hint]
 * @property {import("react").ReactNode} [error] Replaces the hint.
 * @property {string} [hintId] The hint line's id.
 * @property {string} [errorId] The error line's id.
 * @property {boolean} [group] A labelled group instead of a <label>, for several controls.
 * @property {string} [className]
 * @property {import("react").ReactNode} [children]
 * @typedef {FieldOwnProps & Omit<import("react").HTMLAttributes<HTMLElement>, keyof FieldOwnProps>} FieldProps
 */
/** @param {FieldProps} props */
function Field({ label, aside, hint, error, hintId, errorId, group = false, className, children, ...rest }) {
  const Tag = group ? "div" : "label";
  return (
    <Tag className={"k-field" + (className ? " " + className : "")}
      {...(group && label != null ? { role: "group", "aria-label": typeof label === "string" ? label : undefined } : {})}
      {...rest}>
      {label != null && (
        <span className="k-field__label">
          {label}
          {aside != null && <span className="k-field__aside">{aside}</span>}
        </span>
      )}
      {children}
      {error
        ? <span id={errorId} className="k-field__error"><Icon name="alert-triangle" size={12} /> {error}</span>
        : hint != null && <span id={hintId} className="k-field__hint">{hint}</span>}
    </Tag>
  );
}

export { Checkbox, Field, Input, PasswordInput, Textarea };
