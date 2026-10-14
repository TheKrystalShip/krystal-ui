import React from "react";

// Slider — one value picked along a line (WAI-ARIA slider). The thumb is the one tab stop:
// Left/Down and Right/Up move by `step`, PageDown and PageUp by a tenth of the range (never less
// than a step), Home and End to the ends. A press or drag anywhere on the line moves the thumb
// there, by mouse, pen or finger; the page still scrolls vertically under a finger.
//
//   value / defaultValue   the number chosen; `onChange` receives each next one while it moves
//   onChangeEnd            receives the final value when a drag is let go and after each key press, for
//                          a value that is costly to apply on every move (a request, a re-layout)
//   min, max, step         the range (0 to 100) and the grid values snap to (1)
//   marks                  ticks along the line: numbers, or `{ value, label }` to word one
//   format                 `(value) => string`, the words a screen reader and `showValue` say
//                          ("30%", "12 GB"); the number itself when left out
//   showValue              draws the formatted value after the line
//   label                  the accessible name, for a slider whose heading is drawn elsewhere
//
// The fill is drawn in the accent, `size` is sm or md (a phone raises md to a 40px target).
/**
 * @typedef {object} SliderMark
 * @property {number} value The mark's position on the line.
 * @property {import("react").ReactNode} [label]
 */
/**
 * @typedef {object} SliderOwnProps
 * @property {number} [value] The chosen number, for a slider the site controls.
 * @property {number} [defaultValue] The starting number when the slider holds its own.
 * @property {(next: number) => void} [onChange] Receives each next value while the thumb moves.
 * @property {(final: number) => void} [onChangeEnd] Receives the final value when a drag is let go and after each key press.
 * @property {number} [min] The lowest value.
 * @property {number} [max] The highest value.
 * @property {number} [step] The grid values snap to, and the distance an arrow key moves.
 * @property {(number | SliderMark)[]} [marks] Ticks along the line: numbers, or `{ value, label }` to word one.
 * @property {(value: number) => string} [format] Words a value for a screen reader and `showValue` ("30%"); the number itself when left out.
 * @property {boolean} [showValue] Draws the formatted value after the line.
 * @property {string} [label] The accessible name.
 * @property {boolean} [disabled] Makes the slider inert.
 * @property {"sm" | "md"} [size] `sm` or `md`; a phone raises `md` to a larger touch target.
 * @property {string} [className] Extra class names on the root element.
 * @typedef {SliderOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof SliderOwnProps | "onChange" | "defaultValue">} SliderProps
 */
/** @type {import("react").ForwardRefExoticComponent<SliderProps & import("react").RefAttributes<HTMLDivElement>>} */
const Slider = React.forwardRef(function Slider({
  value, defaultValue, onChange, onChangeEnd, min = 0, max = 100, step = 1, marks, format, showValue = false,
  label, disabled = false, size = "md", className, ...rest
}, ref) {
  const [inner, setInner] = React.useState(defaultValue ?? min);
  const controlled = value !== undefined;
  const decimals = (String(step).split(".")[1] || "").length;
  const snap = React.useCallback((n) => {
    const stepped = min + Math.round((n - min) / step) * step;
    return Math.min(max, Math.max(min, Number(stepped.toFixed(decimals))));
  }, [min, max, step, decimals]);
  const current = snap(controlled ? value : inner);
  const latest = React.useRef(current);
  latest.current = current;

  const trackRef = React.useRef(null);
  const thumbRef = React.useRef(null);
  const dragging = React.useRef(false);
  const [active, setActive] = React.useState(false);

  const move = (next) => {
    const v = snap(next);
    if (v === latest.current) return;
    latest.current = v;
    if (!controlled) setInner(v);
    if (onChange) onChange(v);
  };
  const end = () => { if (onChangeEnd) onChangeEnd(latest.current); };

  const fromPointer = (e) => {
    const box = trackRef.current.getBoundingClientRect();
    const ratio = box.width > 0 ? (e.clientX - box.left) / box.width : 0;
    return min + Math.min(1, Math.max(0, ratio)) * (max - min);
  };
  const down = (e) => {
    if (disabled || (e.pointerType === "mouse" && e.button !== 0)) return;
    dragging.current = true;
    setActive(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    thumbRef.current.focus({ preventScroll: true });
    move(fromPointer(e));
  };
  const drag = (e) => { if (dragging.current) move(fromPointer(e)); };
  const up = (e) => {
    if (!dragging.current) return;
    dragging.current = false;
    setActive(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* released with the pointer */ }
    end();
  };

  const keys = (e) => {
    if (disabled) return;
    const page = Math.max(step, (max - min) / 10);
    const to = e.key === "ArrowRight" || e.key === "ArrowUp" ? current + step
      : e.key === "ArrowLeft" || e.key === "ArrowDown" ? current - step
        : e.key === "PageUp" ? current + page
          : e.key === "PageDown" ? current - page
            : e.key === "Home" ? min : e.key === "End" ? max : null;
    if (to === null) return;
    e.preventDefault();
    move(to);
    end();
  };

  const pct = (n) => (max > min ? ((n - min) / (max - min)) * 100 : 0) + "%";
  const words = format ? format(current) : String(current);
  const ticks = (marks || []).map((m) => (typeof m === "number" ? { value: m } : m))
    .filter((m) => m.value >= min && m.value <= max);
  const labelled = ticks.some((m) => m.label != null);

  const cls = "k-slider k-slider--" + size + (disabled ? " k-is-disabled" : "") + (active ? " k-is-active" : "")
    + (labelled ? " k-slider--marked" : "") + (className ? " " + className : "");
  return (
    <div ref={ref} className={cls} {...rest}>
      <div className="k-slider__control" onPointerDown={down} onPointerMove={drag} onPointerUp={up}
        onPointerCancel={up}>
        <div ref={trackRef} className="k-slider__track">
          <div className="k-slider__rail">
            <div className="k-slider__fill" style={{ width: pct(current) }} />
          </div>
          {ticks.map((m) => (
            <span key={m.value} className={"k-slider__mark" + (m.value <= current ? " k-is-passed" : "")}
              style={{ left: pct(m.value) }}>
              <span className="k-slider__tick" />
              {m.label != null && <span className="k-slider__mark-label">{m.label}</span>}
            </span>
          ))}
          <div ref={thumbRef} role="slider" tabIndex={disabled ? -1 : 0} aria-label={label}
            aria-valuemin={min} aria-valuemax={max} aria-valuenow={current} aria-valuetext={words}
            aria-disabled={disabled || undefined} className="k-slider__thumb" style={{ left: pct(current) }}
            onKeyDown={keys} />
        </div>
      </div>
      {showValue && <output className="k-slider__value">{words}</output>}
    </div>
  );
});

export { Slider };
