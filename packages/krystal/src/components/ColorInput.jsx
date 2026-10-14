import React from "react";
import { Icon } from "./Icon.jsx";

// ColorInput — the browser's own colour picker as a round swatch: a native `<input type="color">`
// laid over a disc that shows the colour once `selected`, and a pipette before that. It sits beside
// the palette swatches of a RadioGroup `variant="swatch"` (which draws one itself with `picker`), or
// on its own for a colour that has no palette.
//
//   <ColorInput value="#ffcc00" label="Text colour" selected onChange={(hex) => …} />
//
// `onChange` receives the colour as `#rrggbb`. `label` is the input's accessible name.
/**
 * @typedef {object} ColorInputOwnProps
 * @property {string} [value] The colour, as `#rrggbb`; black when absent.
 * @property {(value: string) => void} [onChange] Receives the colour chosen.
 * @property {boolean} [selected] The disc shows `value` and is marked as the chosen one.
 * @property {"sm" | "md"} [size] `sm` or `md`; `md` by default.
 * @property {string} [label] The input's accessible name.
 * @property {string} [title] A hover hint.
 * @property {string} [className] Extra class names on the swatch.
 * @typedef {ColorInputOwnProps & Omit<import("react").ComponentPropsWithoutRef<"input">, keyof ColorInputOwnProps | "type" | "onChange">} ColorInputProps
 */
/** @type {import("react").ForwardRefExoticComponent<ColorInputProps & import("react").RefAttributes<HTMLInputElement>>} */
const ColorInput = React.forwardRef(function ColorInput({
  value = "#000000", onChange, selected = false, size = "md", label, title, className, disabled, ...rest
}, ref) {
  return (
    <label className={"k-swatch k-swatch--picker k-swatch--" + size + (selected ? " k-is-on" : "") + (disabled ? " k-is-disabled" : "")
      + (className ? " " + className : "")}
    title={title} style={/** @type {any} */ (selected ? { "--k-swatch": value } : undefined)}>
      {!selected && <Icon name="pipette" size={size === "sm" ? 11 : 13} />}
      <input {...rest} ref={ref} type="color" className="k-swatch__input" value={value} disabled={disabled}
        aria-label={label} onChange={(e) => onChange && onChange(e.target.value)} />
    </label>
  );
});

export { ColorInput };
