import { Icon } from "./Icon.jsx";

// The one styled <select>. appearance:none + a custom chevron so
// the control reads identically across browsers/OSes — the native OS arrow is what
// made every ad-hoc <select> look different. Extra props spread straight onto the
// native <select>, so value / onChange(event) / disabled / aria-* behave exactly like
// a plain select. Pass either an `options` array (each {value, label}) or explicit
// <option> children — the two patterns are interchangeable.
//
//   variant="field" (default) — full-width form field. 38px tall unless `size` says otherwise.
//   variant="inline"          — sized to its options, for a control beside other words.
//   variant="chip"            — compact inline picker for a card header.
//
// `size` (sm 30, md 34, lg 38) gives a field or an inline select the height of the Input and
// Button beside it.
/**
 * @typedef {object} SelectOwnProps
 * @property {"field" | "inline" | "chip"} [variant] `field` fills the width, `inline` is sized to its options, `chip` is a compact picker for a card header.
 * @property {"sm" | "md" | "lg"} [size] `sm`, `md` or `lg`, the height of the Input or Button beside it.
 * @property {string} [className] Extra class names on the select.
 * @property {{ value: string | number, label: import("react").ReactNode }[]} [options] Alternative to <option> children.
 * @property {import("react").ReactNode} [children] <option> elements.
 * @typedef {SelectOwnProps & Omit<import("react").ComponentPropsWithoutRef<"select">, keyof SelectOwnProps>} SelectProps
 */
/** @param {SelectProps} props */
export function Select({ variant = "field", size, className = "", options, children, ...rest }) {
  const content = options
    ? options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)
    : children;
  return (
    <span className={"k-select k-select--" + variant + (size ? " k-select--" + size : "")
      + (className ? " " + className : "")}>
      <select className="k-select__el" {...rest}>{content}</select>
      <Icon name="chevron-down" size={variant === "chip" ? 13 : 16} className="k-select__chev" />
    </span>
  );
}
