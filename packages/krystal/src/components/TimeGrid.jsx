import React from "react";
import { minutesOf, nextStep, timeKey, timeRange } from "../lib/datetime.js";

// TimeGrid — times of day laid out as a grid of buttons, to start something at: one time, or several
// with `multiple`. Each time is a two-state button (aria-pressed) in mono; a chosen one takes the
// pressed look every pressed control here has.
//
// Times are local keys, "HH:mm" (lib/datetime). The grid holds `times` when given, else every `step`
// minutes from `from` to `to`. `from` is the first step after now when left out, so a grid opened at
// 16:15 with 30-minute steps starts at 16:30; `to` is 23:30 when left out. `min` and `max` disable the
// times outside them, and `disable` any other time it returns true for.
//
// `value` is the chosen time, or with `multiple` the chosen times; `onChange` receives the time
// pressed, or the chosen times after the press.
//
// Columns are as many as fit at the slot's width, or `columns` across. One time is the tab stop; the
// arrows move along the grid, up and down a row by where the times sit, Home and End to the ends.
/**
 * @typedef {object} TimeGridOwnProps
 * @property {string | string[] | null} [value] The chosen time, "HH:mm", or the chosen times with `multiple`.
 * @property {(next: any) => void} [onChange] Receives the time pressed, or the chosen times with `multiple`.
 * @property {boolean} [multiple] Several times can be chosen.
 * @property {string[]} [times] The times to show, in place of `from`, `to` and `step`.
 * @property {string} [from] The first time; the first step after now when left out.
 * @property {string} [to] The last time; "23:30" when left out.
 * @property {number} [step] Minutes between times; 30 when left out.
 * @property {string} [min] Times before it are disabled.
 * @property {string} [max] Times after it are disabled.
 * @property {(time: string) => boolean} [disable] Disables each time it returns true for.
 * @property {number} [columns] Times across; as many as fit when left out.
 * @property {string} [label] The group's accessible name.
 * @property {import("react").ReactNode} [empty] Drawn in place of the grid when it holds no times.
 * @property {string} [className] Extra class names on the group.
 * @typedef {TimeGridOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof TimeGridOwnProps | "onChange">} TimeGridProps
 */
/** @param {TimeGridProps} props */
function TimeGrid({
  value, onChange, multiple = false, times, from, to = "23:30", step = 30, min, max, disable, columns,
  label, empty, className, style, ...rest
}) {
  const own = React.useRef(/** @type {HTMLDivElement | null} */ (null));
  const start = from || timeKey(nextStep(new Date(), step));
  // A first step past midnight belongs to tomorrow, so today's grid has no time left.
  const list = times || (minutesOf(start) < minutesOf(timeKey(new Date())) && !from ? [] : timeRange(start, to, step));
  const chosen = new Set(multiple ? (Array.isArray(value) ? value : []) : (value ? [String(value)] : []));
  const closed = (t) => (min != null && t < min) || (max != null && t > max) || (!!disable && disable(t));
  const stop = list.find((t) => chosen.has(t) && !closed(t)) || list.find((t) => !closed(t));

  const press = (t) => {
    if (!onChange) return;
    if (!multiple) { onChange(t); return; }
    onChange(chosen.has(t) ? [...chosen].filter((x) => x !== t) : [...chosen, t].sort());
  };

  const onKeyDown = (e) => {
    const items = /** @type {HTMLButtonElement[]} */ (Array.from(own.current.querySelectorAll(".k-timegrid__slot:not(:disabled)")));
    const at = items.indexOf(/** @type {HTMLButtonElement} */ (document.activeElement));
    if (at < 0) return;
    let to = -1;
    if (e.key === "ArrowRight") to = Math.min(at + 1, items.length - 1);
    else if (e.key === "ArrowLeft") to = Math.max(at - 1, 0);
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = items.length - 1;
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      const here = items[at];
      const down = e.key === "ArrowDown";
      const row = items.filter((b) => (down ? b.offsetTop > here.offsetTop : b.offsetTop < here.offsetTop));
      if (row.length) {
        const top = down ? Math.min(...row.map((b) => b.offsetTop)) : Math.max(...row.map((b) => b.offsetTop));
        const line = row.filter((b) => b.offsetTop === top);
        const near = line.reduce((a, b) => (Math.abs(b.offsetLeft - here.offsetLeft) < Math.abs(a.offsetLeft - here.offsetLeft) ? b : a));
        to = items.indexOf(near);
      } else to = at;
    }
    if (to < 0) return;
    e.preventDefault();
    items.forEach((b, i) => { b.tabIndex = i === to ? 0 : -1; });
    items[to].focus();
  };

  if (list.length === 0 && empty != null) return <div className="k-timegrid__empty">{empty}</div>;
  return (
    <div ref={own} role="group" aria-label={label} onKeyDown={onKeyDown}
      className={"k-timegrid" + (columns ? " k-timegrid--fixed" : "") + (className ? " " + className : "")}
      style={columns ? /** @type {any} */ ({ "--k-timegrid-columns": columns, ...style }) : style} {...rest}>
      {list.map((t) => {
        const off = closed(t);
        return (
          <button key={t} type="button" className="k-timegrid__slot" aria-pressed={chosen.has(t)} disabled={off}
            tabIndex={t === stop ? 0 : -1} onClick={() => press(t)}>
            {t}
          </button>
        );
      })}
    </div>
  );
}

export { TimeGrid };
