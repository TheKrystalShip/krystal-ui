import React from "react";
import { IconButton } from "./Button.jsx";
import { addDays, dateKey, parseDate } from "../lib/datetime.js";

// Calendar — one month as a grid of days, to pick a date from: the WAI-ARIA date grid. Its title names
// the month, with buttons to the month before and after; each day is a button in a cell of the grid,
// and the cell of the chosen day is `aria-selected`.
//
// Dates are local keys, "YYYY-MM-DD" (lib/datetime). `value` is the chosen day and `onChange` receives
// the day picked. Days before `min` or after `max` stay in the grid, dimmed and `aria-disabled`, and
// cannot be picked; the month buttons stop at the months that hold them. `marked` puts a dot under
// each of its days, for a day that already holds something. Today is ringed.
//
// One day is the grid's tab stop: the chosen one, else today, else the first that can be picked. The
// arrows move a day or a week, Home and End to the ends of the week, PageUp and PageDown a month (with
// Shift, a year), crossing into the next month where they lead; Enter and Space pick the day.
//
// Words come from `Intl` in `locale` (the browser's when left out): the month's name, the weekdays
// over the columns and each day's accessible name. `weekStartsOn` is the first column, 0 Sunday to
// 6 Saturday; Monday when left out.
/**
 * @typedef {object} CalendarOwnProps
 * @property {string | null} [value] The chosen day, "YYYY-MM-DD".
 * @property {(day: string) => void} [onChange] Receives the day picked, "YYYY-MM-DD".
 * @property {string} [min] The first day that can be picked.
 * @property {string} [max] The last day that can be picked.
 * @property {string[]} [marked] Days drawn with a dot under them.
 * @property {string} [locale] The locale `Intl` words the month and days in; the browser's when left out.
 * @property {number} [weekStartsOn] The first column, 0 (Sunday) to 6 (Saturday); 1 when left out.
 * @property {boolean} [autoFocus] Marks the tab stop `data-autofocus`, the day a Popover focuses when it opens.
 * @property {string} [prevLabel] The accessible name of the button to the month before.
 * @property {string} [nextLabel] The accessible name of the button to the month after.
 * @property {string} [className] Extra class names on the root element.
 * @typedef {CalendarOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof CalendarOwnProps | "onChange">} CalendarProps
 */

/** @param {number} y @param {number} m */
const monthOf = (y, m) => ({ y: y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 });

/** @param {CalendarProps} props */
function Calendar({
  value, onChange, min, max, marked, locale, weekStartsOn = 1, autoFocus = false,
  prevLabel = "Previous month", nextLabel = "Next month", className, ...rest
}) {
  const today = dateKey(new Date());
  const startDay = parseDate(value) || parseDate(min && min > today ? min : today) || new Date();
  const [view, setView] = React.useState(() => ({ y: startDay.getFullYear(), m: startDay.getMonth() }));
  const [focus, setFocus] = React.useState(/** @type {string | null} */ (null));
  const grid = React.useRef(/** @type {HTMLTableElement | null} */ (null));
  const moved = React.useRef(false);

  // A chosen day in another month brings its month into view.
  React.useEffect(() => {
    const day = parseDate(value);
    if (day) setView((v) => (v.y === day.getFullYear() && v.m === day.getMonth() ? v : { y: day.getFullYear(), m: day.getMonth() }));
  }, [value]);

  const out = (key) => (min != null && key < min) || (max != null && key > max);
  const markedSet = React.useMemo(() => new Set(marked || []), [marked]);
  const monthKey = (y, m) => y * 12 + m;
  const minDay = parseDate(min), maxDay = parseDate(max);
  const noPrev = !!minDay && monthKey(view.y, view.m) <= monthKey(minDay.getFullYear(), minDay.getMonth());
  const noNext = !!maxDay && monthKey(view.y, view.m) >= monthKey(maxDay.getFullYear(), maxDay.getMonth());

  const first = new Date(view.y, view.m, 1);
  const count = new Date(view.y, view.m + 1, 0).getDate();
  const lead = (first.getDay() - weekStartsOn + 7) % 7;
  const days = Array.from({ length: count }, (_, i) => dateKey(new Date(view.y, view.m, i + 1)));
  const inView = (key) => key && key.slice(0, 7) === days[0].slice(0, 7);

  // The tab stop: the focused day when it is in this month, else the chosen day, today, or the first open day.
  const stop = [focus, value, today].find((k) => inView(k)) || days.find((k) => !out(k)) || days[0];

  React.useEffect(() => {
    if (!moved.current || !grid.current) return;
    moved.current = false;
    const el = /** @type {HTMLElement | null} */ (grid.current.querySelector(`[data-day="${stop}"]`));
    if (el) el.focus();
  });

  const fmtTitle = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
  const fmtDay = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const fmtShort = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const fmtLong = new Intl.DateTimeFormat(locale, { weekday: "long" });
  const weekdays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, 7 + ((weekStartsOn + i) % 7));
    return { short: fmtShort.format(d), long: fmtLong.format(d) };
  });

  const shiftMonth = (by) => setView((v) => monthOf(v.y, v.m + by));

  const goTo = (key) => {
    const day = parseDate(key);
    if (!day) return;
    moved.current = true;
    setFocus(key);
    setView({ y: day.getFullYear(), m: day.getMonth() });
  };

  const onKey = (e, key) => {
    const day = /** @type {Date} */ (parseDate(key));
    const col = (day.getDay() - weekStartsOn + 7) % 7;
    let next = null;
    if (e.key === "ArrowLeft") next = addDays(key, -1);
    else if (e.key === "ArrowRight") next = addDays(key, 1);
    else if (e.key === "ArrowUp") next = addDays(key, -7);
    else if (e.key === "ArrowDown") next = addDays(key, 7);
    else if (e.key === "Home") next = addDays(key, -col);
    else if (e.key === "End") next = addDays(key, 6 - col);
    else if (e.key === "PageUp" || e.key === "PageDown") {
      const by = (e.key === "PageUp" ? -1 : 1) * (e.shiftKey ? 12 : 1);
      const to = monthOf(day.getFullYear(), day.getMonth() + by);
      const last = new Date(to.y, to.m + 1, 0).getDate();
      next = dateKey(new Date(to.y, to.m, Math.min(day.getDate(), last)));
    }
    if (next == null) return;
    e.preventDefault();
    goTo(next);
  };

  const cells = [...Array(lead).fill(null), ...days];
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const title = fmtTitle.format(first);
  return (
    <div className={"k-calendar" + (className ? " " + className : "")} {...rest}>
      <div className="k-calendar__head">
        <span className="k-calendar__title" aria-live="polite">{title}</span>
        <IconButton variant="ghost" size="sm" icon="chevron-left" label={prevLabel} disabled={noPrev} onClick={() => shiftMonth(-1)} />
        <IconButton variant="ghost" size="sm" icon="chevron-right" label={nextLabel} disabled={noNext} onClick={() => shiftMonth(1)} />
      </div>
      <table ref={grid} role="grid" aria-label={title} className="k-calendar__grid">
        <thead>
          <tr>
            {weekdays.map((w) => <th key={w.long} scope="col" abbr={w.long} className="k-calendar__weekday">{w.short}</th>)}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, i) => (
            <tr key={i}>
              {week.map((key, j) => {
                if (!key) return <td key={"e" + j} className="k-calendar__blank" />;
                const chosen = key === value;
                const closed = out(key);
                return (
                  <td key={key} aria-selected={chosen}>
                    <button type="button" data-day={key} tabIndex={key === stop ? 0 : -1}
                      data-autofocus={autoFocus && key === stop ? "" : undefined}
                      aria-label={fmtDay.format(/** @type {Date} */ (parseDate(key)))}
                      aria-disabled={closed || undefined}
                      aria-current={key === today ? "date" : undefined}
                      className={"k-calendar__day" + (chosen ? " k-is-selected" : "") + (key === today ? " k-is-today" : "")
                        + (markedSet.has(key) ? " k-is-marked" : "") + (closed ? " k-is-disabled" : "")}
                      onFocus={() => setFocus(key)}
                      onKeyDown={(e) => onKey(e, key)}
                      onClick={() => { if (!closed && onChange) onChange(key); }}>
                      {+key.slice(8)}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { Calendar };
