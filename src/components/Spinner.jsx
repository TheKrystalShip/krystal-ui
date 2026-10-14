// Spinner — work in progress that has no measurable progress. A ring in the current text colour, so
// it takes the ink of whatever it sits in: a primary button's, a notice's, a muted line's.
//
// It is decoration beside words that say what is happening ("Saving…"), so it is hidden from
// assistive technology by default. Alone, give it a `label`: it is then announced as a status.
/**
 * @param {object} props
 * @param {number} [props.size] Diameter in pixels.
 * @param {string} [props.label] Announces the spinner as a status; without it the spinner is hidden from assistive technology.
 * @param {string} [props.className]
 */
function Spinner({ size = 16, label, className }) {
  return (
    <span
      className={"k-spinner" + (className ? " " + className : "")}
      style={{ width: size, height: size }}
      {...(label ? { role: "status", "aria-label": label } : { "aria-hidden": "true" })} />
  );
}

export { Spinner };
export default Spinner;
