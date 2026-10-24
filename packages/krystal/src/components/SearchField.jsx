import React from "react";
import { Button } from "./Button.jsx";
import { Icon } from "./Icon.jsx";

// SearchField — a large search or naming field as one pill: a leading icon, the input and a submit
// button inside the same frame, which takes the accent border when the input has focus. It is a
// `<form role="search">`: Enter in the input and the button both call `onSubmit(value)`.
//
//   <SearchField value={draft} onChange={setDraft} onSubmit={run} placeholder="Any movie or show"
//     submitLabel="Search" size="xl" />
//
// Toolbar's ToolbarSearch is the small live filter that narrows a list as it is typed; this is the
// field a page opens with, whose answer waits for a press. `filters` is a FilterDrawer, drawn at the
// start of the field in the icon's place, its drawer dropping from the field's lower edge; the field
// takes the accent border while it is open. `icon` is any Lucide name, `actions` are
// more buttons before the submit (a Cancel), `submitLabel` words the button (`submit={false}` draws
// none) and `submitDisabled` holds it. `busy` shows the button's spinner; `disabled` makes the whole
// field inert. `inputProps` spread onto the inner `<input>` (`data-*`, `inputMode`), where `...rest`
// reaches the form. `size` is `lg` (the default) or `xl`, the page's first and largest control.
/**
 * @typedef {object} SearchFieldOwnProps
 * @property {string} [value] The text in the field.
 * @property {(value: string) => void} [onChange] Receives the next text.
 * @property {(value: string) => void} [onSubmit] Receives the text when Enter or the button is pressed.
 * @property {string} [placeholder] Hint text in the empty field.
 * @property {string} [label] The input's accessible name; the placeholder otherwise.
 * @property {string} [icon] A Lucide name before the input; `search` by default.
 * @property {import("react").ReactNode} [filters] A FilterDrawer, at the start of the field in the icon's place.
 * @property {import("react").ReactNode} [submitLabel] The submit button's words; "Search" by default.
 * @property {boolean} [submit] Draws the submit button; true by default.
 * @property {boolean} [submitDisabled] Holds the submit button.
 * @property {boolean} [busy] The submit button shows a spinner.
 * @property {import("react").ReactNode} [actions] Buttons between the input and the submit.
 * @property {boolean} [disabled] Makes the field and its buttons inert.
 * @property {boolean} [autoFocus] Focuses the input when it mounts.
 * @property {number} [maxLength] The input's maximum length.
 * @property {Omit<import("react").ComponentPropsWithoutRef<"input">, "value" | "onChange" | "disabled"> & Record<`data-${string}`, string | number | boolean | undefined>} [inputProps] Props spread onto the inner `<input>`, such as `data-*` attributes or `inputMode`.
 * @property {"lg" | "xl"} [size] `lg` or `xl`; `lg` by default.
 * @property {string} [className] Extra class names on the form.
 * @typedef {SearchFieldOwnProps & Omit<import("react").ComponentPropsWithoutRef<"form">, keyof SearchFieldOwnProps | "onChange" | "onSubmit">} SearchFieldProps
 */
/** @type {import("react").ForwardRefExoticComponent<SearchFieldProps & import("react").RefAttributes<HTMLInputElement>>} */
const SearchField = React.forwardRef(function SearchField({
  value = "", onChange, onSubmit, placeholder, label, icon = "search", filters, submitLabel = "Search", submit = true,
  submitDisabled = false, busy = false, actions, disabled = false, autoFocus, maxLength, inputProps, size = "lg", className, ...rest
}, ref) {
  return (
    <form role="search" {...rest} className={"k-searchfield k-searchfield--" + size + (filters ? " k-searchfield--filters" : "") + (disabled ? " k-is-disabled" : "") + (className ? " " + className : "")}
      onSubmit={(e) => { e.preventDefault(); if (!disabled && onSubmit) onSubmit(value); }}>
      {filters || <Icon name={icon} size={size === "xl" ? 20 : 17} className="k-searchfield__icon" />}
      <input enterKeyHint="search" spellCheck="false" autoComplete="off" {...inputProps}
        ref={ref} className={"k-searchfield__input" + (inputProps && inputProps.className ? " " + inputProps.className : "")}
        value={value} disabled={disabled} autoFocus={autoFocus} maxLength={maxLength} placeholder={placeholder}
        aria-label={label || placeholder}
        onChange={(e) => onChange && onChange(e.target.value)} />
      {actions}
      {submit && (
        <Button type="submit" variant="primary" size="lg" busy={busy} disabled={disabled || submitDisabled}>{submitLabel}</Button>
      )}
    </form>
  );
});

export { SearchField };
