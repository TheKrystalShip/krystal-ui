// Meter — a thin rounded bar that fills to a value, with an optional caption line under it.
//
// `value` (out of `max`, 100 by default) is one fill in the accent: how far something has got. It is
// a progressbar unless `role` says otherwise.
//
// `segments` is a measurement split into parts, laid end to end: [{ value, tone, label }], `tone`
// one of neutral, accent, success, warn or danger (neutral when left out) — the space already used
// in a neutral tone and what is about to take more in the accent. It is a meter, its value the sum,
// and its spoken value is each part's label and share unless `valueText` gives one. A part above
// zero is always drawn at least a sliver wide, so a small one stays visible beside a large one.
//
// `label` is the bar's accessible name. `start` and `end` are the caption's two ends, in monospace;
// either alone is a one-sided caption.
/**
 * @typedef {object} MeterSegment
 * @property {number} value
 * @property {"neutral" | "accent" | "success" | "warn" | "danger"} [tone]
 * @property {string} [label]
 */
/**
 * @typedef {object} MeterOwnProps
 * @property {number} [value] One accent fill, out of `max`.
 * @property {MeterSegment[]} [segments] A measurement split into parts; overrides `value`.
 * @property {number} [max]
 * @property {string} [label] The bar's accessible name.
 * @property {string} [valueText]
 * @property {string} [role]
 * @property {import("react").ReactNode} [start] Caption's left end.
 * @property {import("react").ReactNode} [end] Caption's right end.
 * @property {string} [className]
 * @typedef {MeterOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof MeterOwnProps>} MeterProps
 */
/** @param {MeterProps} props */
function Meter({ value, segments, max = 100, label, valueText, role, start, end, className, ...rest }) {
  const parts = segments || [{ value: value || 0, tone: "accent" }];
  const total = parts.reduce((sum, p) => sum + (p.value || 0), 0);
  const pct = (v) => Math.max(0, Math.min(100, (100 * (v || 0)) / (max || 1)));
  const spoken = valueText != null ? valueText
    : segments ? parts.filter((p) => p.label != null).map((p) => p.label + " " + Math.round(pct(p.value)) + "%").join(", ")
      || undefined
      : undefined;

  const bar = (
    <div className="k-meter__track" role={role || (segments ? "meter" : "progressbar")} aria-label={label}
      aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.min(total, max)} aria-valuetext={spoken}>
      {parts.map((p, i) => (
        <span key={i}
          className={"k-meter__fill k-meter__fill--" + (p.tone || (segments ? "neutral" : "accent"))
            + (p.value > 0 ? " k-is-some" : "")}
          style={{ width: pct(p.value) + "%" }} />
      ))}
    </div>
  );

  return (
    <div className={"k-meter" + (className ? " " + className : "")} {...rest}>
      {bar}
      {(start != null || end != null) && (
        <div className="k-meter__caption">
          <span>{start}</span>
          {end != null && <span>{end}</span>}
        </div>
      )}
    </div>
  );
}

export { Meter };
