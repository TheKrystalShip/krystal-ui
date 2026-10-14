import { Icon } from "./Icon.jsx";

// Steps — where somebody is in a sequence they can move around in (a tour, an interview of several
// questions): one button per step, the current one marked. Choosing a step calls `onChange(value)`;
// the site shows its page. It draws the marks and holds no position of its own.
//
//   <Steps label="Tour steps" variant="dots" steps={tour} value={step} onChange={setStep} />
//   <Steps label="Questions" variant="rail" steps={questions} value={at} onChange={setAt} />
//
// `variant` is the shape:
//   rail  (default) a vertical list, each step a numbered badge with its `label` and, under it, its
//         `detail` (the answer given so far); a `done` step's badge is filled. At phone width the rail
//         is a row of badges alone, scrolling sideways, since the numbers still say where you are
//   dots  small marks in a row, the current one long; each is named by its `label` for a screen reader
//
// The current step carries `aria-current="step"`. A step's `done` is the site's to say: the rail
// shows it, and nothing here checks the order steps are visited in.
/**
 * @typedef {object} Step
 * @property {string | number} value The step's key.
 * @property {import("react").ReactNode} label What the step is; the accessible name of a dot.
 * @property {import("react").ReactNode} [detail] A quieter line under the label (rail).
 * @property {boolean} [done] The step is complete (rail).
 */
/**
 * @typedef {object} StepsOwnProps
 * @property {Step[]} steps The steps, in order.
 * @property {string | number} [value] The current step's `value`.
 * @property {(value: any) => void} [onChange] Receives the `value` of the step chosen.
 * @property {"rail" | "dots"} [variant] `rail` is numbered and labelled, `dots` is marks only; `rail` by default.
 * @property {string} [label] The group's accessible name.
 * @property {string} [className] Class name added to the root element.
 * @typedef {StepsOwnProps & Omit<import("react").ComponentPropsWithoutRef<"nav">, keyof StepsOwnProps>} StepsProps
 */
/** @param {StepsProps} props */
function Steps({ steps, value, onChange, variant = "rail", label, className, ...rest }) {
  return (
    <nav {...rest} aria-label={label} className={"k-steps k-steps--" + variant + (className ? " " + className : "")}>
      {steps.map((s, i) => {
        const current = String(s.value) === String(value);
        const name = typeof s.label === "string" ? s.label : undefined;
        return (
          <button key={s.value} type="button"
            className={"k-steps__step" + (s.done && !current ? " k-is-done" : "")}
            aria-current={current ? "step" : undefined}
            aria-label={variant === "dots" ? name : undefined}
            onClick={() => onChange && onChange(s.value)}>
            {variant === "rail" && (
              <>
                <span className="k-steps__n">{s.done && !current ? <Icon name="check" size={12} strokeWidth={2.4} /> : i + 1}</span>
                <span className="k-steps__text">
                  <span className="k-steps__label">{s.label}</span>
                  {s.detail != null && <span className="k-steps__detail">{s.detail}</span>}
                </span>
              </>
            )}
          </button>
        );
      })}
    </nav>
  );
}

export { Steps };
