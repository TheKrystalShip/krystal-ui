import React from "react";
import { Button } from "./Button.jsx";
import { Calendar } from "./Calendar.jsx";
import { Drawer } from "./Drawer.jsx";
import { Icon } from "./Icon.jsx";
import { Popover } from "./Popover.jsx";
import { TimeInput } from "./TimeInput.jsx";
import { usePhone } from "../hooks/usePhone.js";
import { dateKey, parseDate, parseMoment, timeKey, timeOf, timeRange } from "../lib/datetime.js";

// DateTimePicker and DatePicker — a field that shows a moment (or a day) and opens a picker for it. The
// field is a button in Input's frame and height ladder (sm 30, md 34, lg 38): a calendar mark, the value
// in words (the time in mono) or the placeholder, and a chevron. It opens a Popover under it on a
// desktop and a bottom Drawer on a phone (usePhone), holding a Calendar.
//
// DateTimePicker's picker holds the Calendar beside a time column: a TimeInput, and every `step`
// minutes of the day as buttons (a strip that scrolls sideways on a phone). Picking changes a draft;
// Done hands the draft to `onChange` and closes, Clear hands it "" and closes, and Escape, a press
// outside or the close button leave the value as it was. Done waits for a day and a time inside `min`
// and `max`. DatePicker's picker is the Calendar alone, and picking a day hands it over and closes;
// `clearable` adds a foot with Clear.
//
// Values are local keys (lib/datetime): a moment "YYYY-MM-DDTHH:mm" for DateTimePicker, a day
// "YYYY-MM-DD" for DatePicker; "" or null for none. `min` and `max` are keys of the same form. Days and
// times outside them are dimmed and cannot be picked. Words come from `Intl` in `locale`: "Wed 21 Oct
// 2026" in en-GB, and today and tomorrow by name in the picker's summary.
//
// `name` adds a hidden input carrying the value; every other prop reaches the field's button, so a
// Field's label names it and `aria-describedby` reaches it.
/**
 * @typedef {object} PickerFieldProps
 * @property {"sm" | "md" | "lg"} [size] Height step shared with Input: `sm`, `md` or `lg`.
 * @property {string} [placeholder] Shown in the field while there is no value.
 * @property {string} [title] The picker's heading on a phone and its accessible name.
 * @property {string} [locale] The locale `Intl` words dates in; the browser's when left out.
 * @property {number} [weekStartsOn] The Calendar's first column, 0 (Sunday) to 6 (Saturday); 1 when left out.
 * @property {boolean} [invalid] Danger border and aria-invalid.
 * @property {boolean} [disabled] The field cannot be opened.
 * @property {boolean} [wide] Fills its container.
 * @property {string} [name] Adds a hidden input carrying the value.
 * @property {string} [clearLabel] The Clear button's words.
 * @property {string} [className] Extra class names on the field.
 */
/**
 * @typedef {object} DateTimePickerOwnProps
 * @property {string | null} [value] The moment, "YYYY-MM-DDTHH:mm"; "" or null for none.
 * @property {(moment: string) => void} [onChange] Receives the moment on Done, "" on Clear.
 * @property {string} [min] The earliest moment that can be picked.
 * @property {string} [max] The latest moment that can be picked.
 * @property {number} [step] Minutes between the times in the column; 30 when left out.
 * @property {string} [doneLabel] The Done button's words.
 * @property {string} [timeLabel] The time column's accessible name.
 * @typedef {DateTimePickerOwnProps & PickerFieldProps & Omit<import("react").ComponentPropsWithoutRef<"button">, keyof DateTimePickerOwnProps | keyof PickerFieldProps | "onChange">} DateTimePickerProps
 */
/**
 * @typedef {object} DatePickerOwnProps
 * @property {string | null} [value] The day, "YYYY-MM-DD"; "" or null for none.
 * @property {(day: string) => void} [onChange] Receives the day picked, "" on Clear.
 * @property {string} [min] The first day that can be picked.
 * @property {string} [max] The last day that can be picked.
 * @property {boolean} [clearable] Adds a foot with Clear.
 * @typedef {DatePickerOwnProps & PickerFieldProps & Omit<import("react").ComponentPropsWithoutRef<"button">, keyof DatePickerOwnProps | keyof PickerFieldProps | "onChange">} DatePickerProps
 */

/** @param {string | undefined} locale @param {string} s */
const capital = (locale, s) => s.charAt(0).toLocaleUpperCase(locale) + s.slice(1);

/**
 * A day in the field's words: "Wed 21 Oct 2026".
 * @param {string | undefined} locale @param {Date} day @param {boolean} [year]
 */
function dayWords(locale, day, year = true) {
  return new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", ...(year ? { year: "numeric" } : {}) }).format(day);
}

/**
 * A day as the picker's summary says it: today and tomorrow by name, any other day in short words.
 * @param {string | undefined} locale @param {string} key
 */
function dayName(locale, key) {
  const day = parseDate(key);
  if (!day) return "";
  const away = Math.round((+day - +(/** @type {Date} */ (parseDate(dateKey(new Date()))))) / 86400000);
  if (away >= -1 && away <= 1) return capital(locale, new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(away, "day"));
  return dayWords(locale, day, false);
}

/**
 * The field both pickers show: a button in Input's frame.
 * @param {{ fieldRef: import("react").RefObject<HTMLButtonElement>, open: boolean, onToggle: () => void, size: string,
 *   invalid: boolean, disabled: boolean, wide: boolean, className?: string, text: import("react").ReactNode,
 *   placeholder: string, rest: object }} props
 */
function PickerField({ fieldRef, open, onToggle, size, invalid, disabled, wide, className, text, placeholder, rest }) {
  return (
    <button ref={fieldRef} type="button" aria-haspopup="dialog" aria-expanded={open} aria-invalid={invalid || undefined}
      disabled={disabled} onClick={onToggle}
      className={"k-datetime k-datetime--" + size + (wide ? " k-datetime--wide" : "") + (invalid ? " k-is-invalid" : "")
        + (open ? " k-is-open" : "") + (className ? " " + className : "")}
      {...rest}>
      <Icon name="calendar" size={size === "sm" ? 14 : 16} className="k-datetime__icon" />
      {text ? <span className="k-datetime__value">{text}</span> : <span className="k-datetime__placeholder">{placeholder}</span>}
      <Icon name="chevron-down" size={size === "sm" ? 14 : 16} className="k-datetime__chev" />
    </button>
  );
}

/**
 * Where a picker's content opens: a Popover under the field on a desktop, a bottom Drawer on a phone.
 * @param {{ phone: boolean, open: boolean, onClose: () => void, fieldRef: import("react").RefObject<HTMLElement>,
 *   title: string, foot?: import("react").ReactNode, children: import("react").ReactNode }} props
 */
function PickerFrame({ phone, open, onClose, fieldRef, title, foot, children }) {
  if (phone) {
    if (!open) return null;
    return <Drawer title={title} onClose={onClose} foot={foot} footLayout="pair" className="k-datetime__sheet">{children}</Drawer>;
  }
  return (
    <Popover open={open} onOpenChange={(next) => { if (!next) onClose(); }} anchorRef={fieldRef} placement="bottom-start"
      label={title} className="k-datetime__panel">
      {children}
      {foot && <div className="k-datetime__foot">{foot}</div>}
    </Popover>
  );
}

/** @param {DateTimePickerProps} props */
function DateTimePicker({
  value, onChange, min, max, step = 30, locale, weekStartsOn, placeholder = "Pick a date and time",
  title = "Pick a date and time", clearLabel = "Clear", doneLabel = "Done", timeLabel = "Time", size = "md",
  invalid = false, disabled = false, wide = false, name, className, ...rest
}) {
  const phone = usePhone();
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState({ date: "", time: "" });
  const field = React.useRef(/** @type {HTMLButtonElement | null} */ (null));
  const list = React.useRef(/** @type {HTMLDivElement | null} */ (null));
  const moment = parseMoment(value);
  const minDate = min ? min.slice(0, 10) : undefined;
  const maxDate = max ? max.slice(0, 10) : undefined;

  const begin = () => {
    const first = parseMoment(min);
    setDraft(moment ? { date: dateKey(moment), time: timeKey(moment) } : { date: first ? dateKey(first) : dateKey(new Date()), time: "" });
    setOpen(true);
  };
  const close = () => setOpen(false);

  // The column opens scrolled to the chosen time, else to the first one that can be picked.
  React.useEffect(() => {
    const box = list.current;
    if (!open || !box) return;
    const at = /** @type {HTMLElement | null} */ (box.querySelector('[aria-pressed="true"]') || box.querySelector("button:not(:disabled)"));
    if (!at) return;
    const a = at.getBoundingClientRect(), b = box.getBoundingClientRect();
    if (phone) box.scrollLeft += a.left - b.left;
    else box.scrollTop += a.top - b.top - (b.height - a.height) / 2;
  }, [open, phone]);

  const outside = (date, time) => (min != null && date + "T" + time < min) || (max != null && date + "T" + time > max);
  const ready = !!draft.date && !!draft.time && !outside(draft.date, draft.time);
  const times = timeRange("00:00", timeOf(1440 - step), step);

  const done = () => {
    if (!ready) return;
    if (onChange) onChange(draft.date + "T" + draft.time);
    setOpen(false);
    if (field.current) field.current.focus();
  };
  const clear = () => {
    if (onChange) onChange("");
    setOpen(false);
    if (field.current) field.current.focus();
  };

  const summary = draft.date && draft.time
    ? <>{dayName(locale, draft.date)} · <span className="k-datetime__time">{draft.time}</span></>
    : draft.date ? dayName(locale, draft.date) : null;
  const foot = (
    <>
      {!phone && <span className="k-datetime__summary">{summary}</span>}
      <Button variant={phone ? "secondary" : "ghost"} size={phone ? "xl" : "sm"} onClick={clear}>{clearLabel}</Button>
      <Button variant="primary" size={phone ? "xl" : "sm"} disabled={!ready} onClick={done}>
        {phone && ready ? summary : doneLabel}
      </Button>
    </>
  );

  return (
    <>
      <PickerField fieldRef={field} open={open} onToggle={() => (open ? close() : begin())} size={size} invalid={invalid}
        disabled={disabled} wide={wide} className={className} placeholder={placeholder} rest={rest}
        text={moment && <>{dayWords(locale, moment)} · <span className="k-datetime__time">{timeKey(moment)}</span></>} />
      {name && <input type="hidden" name={name} value={value || ""} />}
      <PickerFrame phone={phone} open={open} onClose={close} fieldRef={field} title={title} foot={foot}>
        <div className="k-datetime__body">
          <Calendar value={draft.date || null} min={minDate} max={maxDate} locale={locale} weekStartsOn={weekStartsOn} autoFocus
            className="k-datetime__calendar" onChange={(date) => setDraft((d) => ({ ...d, date }))} />
          <div className="k-datetime__times">
            <TimeInput label={timeLabel} size={phone ? "lg" : "md"} value={draft.time} minuteStep={5}
              invalid={!!draft.time && !!draft.date && outside(draft.date, draft.time)}
              onChange={(time) => setDraft((d) => ({ ...d, time }))} />
            <div ref={list} role="group" aria-label={timeLabel} className="k-datetime__list">
              {times.map((t) => (
                <button key={t} type="button" className="k-datetime__slot" aria-pressed={t === draft.time}
                  disabled={!!draft.date && outside(draft.date, t)} onClick={() => setDraft((d) => ({ ...d, time: t }))}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PickerFrame>
    </>
  );
}

/** @param {DatePickerProps} props */
function DatePicker({
  value, onChange, min, max, locale, weekStartsOn, placeholder = "Pick a date", title = "Pick a date",
  clearable = false, clearLabel = "Clear", size = "md", invalid = false, disabled = false, wide = false, name, className, ...rest
}) {
  const phone = usePhone();
  const [open, setOpen] = React.useState(false);
  const field = React.useRef(/** @type {HTMLButtonElement | null} */ (null));
  const day = parseDate(value);

  const finish = (next) => {
    if (onChange) onChange(next);
    setOpen(false);
    if (field.current) field.current.focus();
  };

  return (
    <>
      <PickerField fieldRef={field} open={open} onToggle={() => setOpen(!open)} size={size} invalid={invalid}
        disabled={disabled} wide={wide} className={className} placeholder={placeholder} rest={rest}
        text={day && dayWords(locale, day)} />
      {name && <input type="hidden" name={name} value={value || ""} />}
      <PickerFrame phone={phone} open={open} onClose={() => setOpen(false)} fieldRef={field} title={title}
        foot={clearable ? <Button variant={phone ? "secondary" : "ghost"} size={phone ? "xl" : "sm"} onClick={() => finish("")}>{clearLabel}</Button> : null}>
        <div className="k-datetime__body k-datetime__body--date">
          <Calendar value={value || null} min={min} max={max} locale={locale} weekStartsOn={weekStartsOn} autoFocus
            className="k-datetime__calendar" onChange={finish} />
        </div>
      </PickerFrame>
    </>
  );
}

export { DatePicker, DateTimePicker };
