import React from "react";
import { Icon } from "./Icon.jsx";
import { minutesOf } from "../lib/datetime.js";

// TimeInput — a time of day typed as two fields, hours and minutes, on the 24-hour clock, in Input's
// frame and height ladder (sm 30, md 34, lg 38). Each field is a spin button: digits type into it and
// move on once the field is full (or once its first digit can start nothing longer: a 3 in the hours,
// a 7 in the minutes), ":" or "." moves on, Backspace in empty minutes goes back to the hours, and the
// up and down arrows step it, the minutes by `minuteStep`, wrapping round the clock.
//
// The value is a local key, "HH:mm" (lib/datetime). `onChange` receives a time once both fields hold
// one, and "" once both are emptied; a time typed halfway is held in the fields and reported to nobody.
// `invalid` draws the danger border (aria-invalid), `name` adds a hidden input carrying the value.
/**
 * @typedef {object} TimeInputOwnProps
 * @property {string | null} [value] The time, "HH:mm"; "" or null for none.
 * @property {(time: string) => void} [onChange] Receives the time once both fields hold one, and "" once both are emptied.
 * @property {"sm" | "md" | "lg"} [size] Height step shared with Input: `sm`, `md` or `lg`.
 * @property {number} [minuteStep] Minutes the arrows step by; 1 when left out.
 * @property {boolean} [invalid] Danger border and aria-invalid.
 * @property {boolean} [disabled] Both fields inert.
 * @property {boolean} [autoFocus] Focuses the hours on mount.
 * @property {string} [label] The accessible name of the pair.
 * @property {[string, string]} [fieldLabels] The accessible names of the fields, [hours, minutes].
 * @property {[string, string]} [placeholders] What each empty field shows, [hours, minutes].
 * @property {string} [name] Adds a hidden input carrying the value.
 * @property {string} [className] Extra class names on the frame.
 * @typedef {TimeInputOwnProps & Omit<import("react").ComponentPropsWithoutRef<"span">, keyof TimeInputOwnProps | "onChange">} TimeInputProps
 */

/** @param {string} s */
const digits = (s) => s.replace(/\D/g, "");
/** @param {string | null | undefined} v @returns {[string, string]} */
const split = (v) => (minutesOf(v) == null ? ["", ""] : [String(v).slice(0, 2), String(v).slice(3, 5)]);

/** @param {TimeInputProps} props */
function TimeInput({
  value, onChange, size = "md", minuteStep = 1, invalid = false, disabled = false, autoFocus = false, label,
  fieldLabels = ["Hours", "Minutes"], placeholders = ["hh", "mm"], name, className, ...rest
}) {
  const [parts, setParts] = React.useState(() => split(value));
  const hours = React.useRef(/** @type {HTMLInputElement | null} */ (null));
  const minutes = React.useRef(/** @type {HTMLInputElement | null} */ (null));

  // A value from outside replaces what the fields hold; the one this field last reported does not.
  const reported = React.useRef(value || "");
  React.useEffect(() => {
    if ((value || "") === reported.current) return;
    reported.current = value || "";
    setParts(split(value));
  }, [value]);

  const report = (h, m) => {
    setParts([h, m]);
    let next = null;
    if (h === "" && m === "") next = "";
    else if (h.length === 2 && m.length === 2 && minutesOf(h + ":" + m) != null) next = h + ":" + m;
    if (next == null) return;
    reported.current = next;
    if (onChange) onChange(next);
  };

  const typeHours = (raw) => {
    let h = digits(raw).slice(-2);
    if (h.length === 2 && +h > 23) h = h.slice(1);
    const full = h.length === 2 || (h.length === 1 && +h > 2);
    if (full) h = h.padStart(2, "0");
    report(h, parts[1]);
    if (full && minutes.current) { minutes.current.focus(); minutes.current.select(); }
  };

  const typeMinutes = (raw) => {
    let m = digits(raw).slice(-2);
    if (m.length === 2 && +m > 59) m = m.slice(1);
    if (m.length === 1 && +m > 5) m = m.padStart(2, "0");
    report(parts[0], m);
  };

  const spin = (which, by) => {
    if (which === 0) {
      const h = parts[0] === "" ? 0 : (+parts[0] + by + 24) % 24;
      report(String(h).padStart(2, "0"), parts[1]);
    } else {
      const now = parts[1] === "" ? 0 : +parts[1];
      const m = parts[1] === "" ? 0 : (Math.round((now + by * minuteStep) / minuteStep) * minuteStep + 60) % 60;
      report(parts[0], String(m).padStart(2, "0"));
    }
  };

  const keys = (which) => (e) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      spin(which, e.key === "ArrowUp" ? 1 : -1);
    } else if (which === 0 && (e.key === ":" || e.key === ".")) {
      e.preventDefault();
      if (parts[0].length === 1) report(parts[0].padStart(2, "0"), parts[1]);
      if (minutes.current) minutes.current.focus();
    } else if (which === 1 && e.key === "Backspace" && parts[1] === "" && hours.current) {
      e.preventDefault();
      hours.current.focus();
    }
  };

  const field = (which) => {
    const v = parts[which];
    return (
      <input ref={which === 0 ? hours : minutes} className="k-timeinput__field" type="text" inputMode="numeric"
        role="spinbutton" aria-label={fieldLabels[which]} aria-valuemin={0} aria-valuemax={which === 0 ? 23 : 59}
        aria-valuenow={v === "" ? undefined : +v} aria-valuetext={v === "" ? "" : v}
        aria-invalid={invalid || undefined} autoComplete="off" spellCheck={false} maxLength={3}
        placeholder={placeholders[which]} value={v} disabled={disabled}
        autoFocus={which === 0 ? autoFocus : undefined}
        onFocus={(e) => e.target.select()}
        onChange={(e) => (which === 0 ? typeHours(e.target.value) : typeMinutes(e.target.value))}
        onKeyDown={keys(which)} />
    );
  };

  return (
    <span role="group" aria-label={label}
      className={"k-timeinput k-timeinput--" + size + (invalid ? " k-is-invalid" : "") + (disabled ? " k-is-disabled" : "")
        + (className ? " " + className : "")} {...rest}>
      <Icon name="clock" size={size === "sm" ? 13 : 15} className="k-timeinput__icon" />
      {field(0)}
      <span className="k-timeinput__sep" aria-hidden="true">:</span>
      {field(1)}
      {name && <input type="hidden" name={name} value={parts[0].length === 2 && parts[1].length === 2 ? parts[0] + ":" + parts[1] : ""} />}
    </span>
  );
}

export { TimeInput };
