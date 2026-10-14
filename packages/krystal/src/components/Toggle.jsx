// Toggle — an on/off switch that takes effect the moment it is flipped, with no Save after it. A
// choice that is only applied by a later button is a Checkbox.
//
// `onChange` receives the new state. `label` is the accessible name, for a switch whose words sit
// elsewhere in the row. `disabled` renders it inert and faded — for a setting that exists but cannot
// be changed from here (one turned off for everyone, say). It stays visible rather than being hidden,
// because a missing switch reads as "no such setting" when the truth is "not yours to change"; the
// row around it says which.
/**
 * @param {object} props
 * @param {boolean} [props.on] Whether the switch is on.
 * @param {(next: boolean) => void} [props.onChange] Receives the new state.
 * @param {boolean} [props.disabled] Inert and faded, still visible.
 * @param {string} [props.label] The accessible name.
 * @param {string} [props.className] Extra class names on the root element.
 */
function Toggle({ on, onChange, disabled = false, label, className }) {
  return (
    <button type="button" role="switch" aria-checked={!!on} aria-label={label} disabled={disabled}
      className={"k-toggle" + (className ? " " + className : "")}
      onClick={() => !disabled && onChange && onChange(!on)}>
      <span className="k-toggle__knob" />
    </button>
  );
}

export { Toggle };
export default Toggle;
