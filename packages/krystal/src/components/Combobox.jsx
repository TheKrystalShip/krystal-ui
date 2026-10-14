import React from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon.jsx";
import { Input } from "./fields.jsx";
import { Spinner } from "./Spinner.jsx";
import { useOverlay } from "../hooks/useOverlay.js";
import { mergeRefs } from "../lib/refs.js";

// Combobox — a text field that filters a list of options and picks one: the WAI-ARIA editable
// combobox with a listbox popup. The input keeps focus the whole time; the option the arrows are on
// is named by `aria-activedescendant`, and the list is portaled under the field at its width.
//
//   options   — [{ value, label, detail, disabled }]. `label` is a string, because it is what the field
//               shows once the option is chosen; `detail` is a quieter word after it in the list.
//   value     — the chosen option's value (null for none); `onChange(value, option)` receives the
//               chosen one, or `(null, null)` when Escape clears it.
//   inputValue / onInputChange(text) — the text in the field, for a site that searches a server: it
//               takes the text, fetches, and passes the matching `options` back. `filter={false}`
//               then shows `options` as given; a function `(option, query) => boolean` replaces the
//               default, a case-insensitive match on label and detail.
//   empty     — the line shown when nothing matches; `loading` shows a spinner in the field and, with
//               no options yet, a `loadingText` line in the list.
//
// Keyboard: typing opens the list and moves the highlight to the first match; ArrowDown and ArrowUp
// move it (opening the list first), Alt+ArrowDown opens without moving, Enter picks the highlighted
// option (and never submits a form while the list is open), Escape closes the list, then clears the
// field. Tab closes the list. Leaving the field puts the chosen option's label back in it.
//
// `size` is Input's ladder (sm 30, md 34, lg 38), and `invalid`, `wide`, `mono`, `prefix`, `className`
// and every other input attribute are Input's. `name` adds a hidden input carrying the value.
/**
 * @template {string | number} [V=string | number]
 * @typedef {object} ComboboxOption
 * @property {V} value What the option stands for.
 * @property {string} label The option's text.
 * @property {import("react").ReactNode} [detail] A quieter word after the label, in the list.
 * @property {boolean} [disabled] Dims the option and keeps it from being chosen.
 */
/**
 * @typedef {object} ComboboxOwnProps
 * @property {ComboboxOption[]} options The choices.
 * @property {any} [value] The chosen option's value; null or undefined for none.
 * @property {any} [defaultValue] The initial value when uncontrolled.
 * @property {(value: any, option: ComboboxOption | null) => void} [onChange] Receives the chosen value and its option, or null and null when cleared.
 * @property {string} [inputValue] The text in the field, when the caller owns it.
 * @property {(text: string) => void} [onInputChange] Receives every change of the text, typed or put back.
 * @property {false | ((option: ComboboxOption, query: string) => boolean)} [filter] How typing narrows `options`; false shows them as given.
 * @property {import("react").ReactNode} [empty] The line shown when nothing matches.
 * @property {boolean} [loading] Shows `loadingText` while options are on their way.
 * @property {import("react").ReactNode} [loadingText] The line shown in the list while `loading` and there are no options.
 * @property {"sm" | "md" | "lg"} [size] `sm`, `md` or `lg`, sharing Input's heights.
 * @property {boolean} [wide] Fills its container.
 * @property {boolean} [mono] Sets the text in the monospace face.
 * @property {import("react").ReactNode} [prefix] Inside the frame, before what is typed.
 * @property {boolean} [invalid] Marks the field as holding an error.
 * @property {boolean} [disabled] Keeps the field from being used.
 * @property {string} [name] Adds a hidden input carrying the chosen value.
 * @property {string} [placeholder] The hint shown while the field is empty.
 * @property {string} [className] Class name added to the root element.
 * @typedef {ComboboxOwnProps & Omit<import("react").ComponentPropsWithoutRef<"input">, keyof ComboboxOwnProps | "value" | "defaultValue" | "onChange" | "size">} ComboboxProps
 */
/** The default filter: a case-insensitive match on the label and a text detail. */
function defaultMatch(o, query) {
  const text = o.label + " " + (typeof o.detail === "string" ? o.detail : "");
  return text.toLowerCase().includes(query.trim().toLowerCase());
}

/** @type {import("react").ForwardRefExoticComponent<ComboboxProps & import("react").RefAttributes<HTMLInputElement>>} */
const Combobox = React.forwardRef(function Combobox({
  options, value: valueProp, defaultValue = null, onChange, inputValue, onInputChange, filter,
  empty = "No matches", loading = false, loadingText = "Loading…", size = "md", disabled = false, name,
  onKeyDown, onFocus, onBlur, onClick, className, ...rest
}, ref) {
  const [ownValue, setOwnValue] = React.useState(defaultValue);
  const value = valueProp !== undefined ? valueProp : ownValue;
  const selected = value == null ? null : options.find((o) => o.value === value) || null;
  const [typed, setTyped] = React.useState("");
  const [dirty, setDirty] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(-1);
  const id = React.useId();
  const listId = id + "-list";
  const input = React.useRef(/** @type {HTMLInputElement | null} */ (null));
  const frame = React.useRef(/** @type {HTMLElement | null} */ (null));
  const listEl = React.useRef(/** @type {HTMLDivElement | null} */ (null));

  const text = inputValue !== undefined ? inputValue : ((dirty || !selected) ? typed : selected.label);
  const setText = (next) => {
    setTyped(next);
    if (onInputChange) onInputChange(next);
  };

  const narrow = React.useCallback((query) => {
    if (filter === false || !query.trim()) return options;
    const match = filter || defaultMatch;
    return options.filter((o) => match(o, query));
  }, [options, filter]);
  const shown = React.useMemo(() => (dirty ? narrow(text) : options), [dirty, narrow, text, options]);

  const firstEnabled = (list, from = 0, step = 1) => {
    for (let i = from; i >= 0 && i < list.length; i += step) if (!list[i].disabled) return i;
    return -1;
  };

  const close = React.useCallback(() => setOpen(false), []);
  const { pos, panelRef } = useOverlay(open, close, frame, { placement: "bottom-start", matchWidth: true });

  React.useLayoutEffect(() => {
    frame.current = input.current ? input.current.parentElement : null;
  });

  React.useEffect(() => {
    if (!open || active < 0 || !listEl.current) return;
    const el = listEl.current.querySelector("#" + CSS.escape(id + "-opt-" + active));
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [open, active, id]);

  const pick = (option) => {
    if (!option || option.disabled) return;
    if (valueProp === undefined) setOwnValue(option.value);
    if (onChange) onChange(option.value, option);
    setDirty(false);
    setTyped(option.label);
    if (onInputChange) onInputChange(option.label);
    setOpen(false);
  };

  const openList = (to) => {
    const at = selected ? shown.indexOf(selected) : -1;
    setActive(to === "last" ? firstEnabled(shown, shown.length - 1, -1) : (at >= 0 ? at : firstEnabled(shown)));
    setOpen(true);
  };

  const move = (step) => {
    if (!open) { openList(step < 0 ? "last" : "first"); return; }
    let i = active + step;
    if (i < 0 || i >= shown.length) i = step > 0 ? 0 : shown.length - 1;
    const hit = firstEnabled(shown, i, step);
    setActive(hit >= 0 ? hit : firstEnabled(shown, step > 0 ? 0 : shown.length - 1, step));
  };

  const keyDown = (e) => {
    if (onKeyDown) onKeyDown(e);
    if (e.defaultPrevented) return;
    if (e.key === "ArrowDown" && e.altKey) { e.preventDefault(); if (!open) openList("first"); }
    else if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Enter" && open) {
      e.preventDefault();
      if (active >= 0 && shown[active]) pick(shown[active]);
    } else if (e.key === "Escape") {
      if (open) { e.preventDefault(); setOpen(false); }
      else if (text !== "" || selected) {
        e.preventDefault();
        setDirty(false);
        setText("");
        if (selected) {
          if (valueProp === undefined) setOwnValue(null);
          if (onChange) onChange(null, null);
        }
      }
    } else if (e.key === "Tab") setOpen(false);
  };

  const blur = (e) => {
    if (onBlur) onBlur(e);
    setOpen(false);
    setDirty(false);
    if (selected && text !== selected.label) setText(selected.label);
  };

  const change = (e) => {
    const next = e.target.value;
    setDirty(true);
    setText(next);
    setOpen(true);
    setActive(firstEnabled(narrow(next)));
  };

  const activeId = open && active >= 0 && shown[active] ? id + "-opt-" + active : undefined;
  const hasList = shown.length > 0;

  return (
    <>
      <Input ref={mergeRefs(input, ref)} size={size} className={"k-combobox" + (className ? " " + className : "")}
        role="combobox" aria-expanded={open} aria-autocomplete="list" aria-haspopup="listbox"
        aria-controls={open && hasList ? listId : undefined} aria-activedescendant={activeId}
        aria-busy={loading || undefined} autoComplete="off" spellCheck={false}
        disabled={disabled} value={text} onChange={change} onKeyDown={keyDown} onBlur={blur}
        onFocus={onFocus}
        onClick={(e) => { if (onClick) onClick(e); if (!open && !e.defaultPrevented) openList("first"); }}
        suffix={loading
          ? <Spinner size={14} />
          : <Icon name="chevron-down" size={15} className="k-combobox__chev" />}
        {...rest} />
      {name && <input type="hidden" name={name} value={value == null ? "" : String(value)} />}
      {open && pos && createPortal(
        <div ref={panelRef} data-inert-exempt="" style={pos} className="k-combobox__panel"
          onMouseDown={(e) => e.preventDefault()}>
          {hasList ? (
            <div ref={listEl} id={listId} role="listbox" aria-busy={loading || undefined}>
              {shown.map((o, i) => (
                <div key={String(o.value)} id={id + "-opt-" + i} role="option"
                  aria-selected={selected === o} aria-disabled={o.disabled || undefined}
                  className={"k-combobox__option" + (i === active ? " k-is-active" : "")}
                  onMouseMove={() => { if (!o.disabled && i !== active) setActive(i); }}
                  onClick={() => pick(o)}>
                  <span className="k-combobox__label">{o.label}</span>
                  {o.detail != null && <span className="k-combobox__detail">{o.detail}</span>}
                  {selected === o && <Icon name="check" size={14} strokeWidth={2.4} className="k-combobox__check" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="k-combobox__empty" role="status">
              {loading ? <><Spinner size={14} /> <span>{loadingText}</span></> : empty}
            </div>
          )}
        </div>,
        document.body,
      )}
    </>
  );
});

export { Combobox };
