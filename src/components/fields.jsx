import React from "react";
import { Icon } from "./Icon.jsx";

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
    <span className={cls + " k-input--affixed" + (rest.disabled ? " is-disabled" : "")
      + (invalid ? " is-invalid" : "")}>
      {prefix != null && <span className="k-input__affix">{prefix}</span>}
      <input ref={ref} className="k-input__el" aria-invalid={invalid || undefined} {...rest} />
      {suffix != null && <span className="k-input__affix">{suffix}</span>}
    </span>
  );
});

// Textarea — Input's look over several lines. It grows by the person dragging it, vertically only.
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
// `aside` sits after the label in a quieter weight ("optional", a character count).
function Field({ label, aside, hint, error, group = false, className, children }) {
  const Tag = group ? "div" : "label";
  return (
    <Tag className={"k-field" + (className ? " " + className : "")}
      {...(group ? { role: "group", "aria-label": typeof label === "string" ? label : undefined } : {})}>
      {label != null && (
        <span className="k-field__label">
          {label}
          {aside != null && <span className="k-field__aside">{aside}</span>}
        </span>
      )}
      {children}
      {error
        ? <span className="k-field__error"><Icon name="alert-triangle" size={12} /> {error}</span>
        : hint != null && <span className="k-field__hint">{hint}</span>}
    </Tag>
  );
}

export { Checkbox, Field, Input, Textarea };
