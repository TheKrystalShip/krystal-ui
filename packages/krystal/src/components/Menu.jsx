import React from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon.jsx";
import { Kbd } from "./Kbd.jsx";
import { focusTrigger, returnFocus, useOverlay } from "../hooks/useOverlay.js";
import { useOpenState } from "../hooks/useOpenState.js";
import { chain, elementRef, mergeRefs } from "../lib/refs.js";

// Menu — a list of commands opened from a button, the WAI-ARIA menu button pattern. The panel is
// portaled and placed by Floating UI; every item is a real <button> that takes focus by script, so
// Tab never walks through it.
//
//   <Menu trigger={<Button>Actions</Button>}>
//     <MenuItem icon="pencil" onSelect={rename} shortcut="R">Rename</MenuItem>
//     <MenuSeparator />
//     <MenuGroup label="View">
//       <MenuCheckboxItem checked={grid} onCheckedChange={setGrid}>Grid</MenuCheckboxItem>
//     </MenuGroup>
//     <MenuItem icon="trash-2" tone="danger" onSelect={remove}>Delete</MenuItem>
//   </Menu>
//
// Keyboard: Enter, Space and ArrowDown on the trigger open it with the first item focused (a chosen
// radio item first when there is one); ArrowUp opens it on the last. In the panel the arrows move
// with wrap, Home and End jump, a typed letter moves to the next item whose label starts with what
// was typed, Enter and Space select, Escape closes and returns focus to the trigger, and Tab closes
// it and moves on from the trigger. The pointer moves focus as it passes over an item.
//
// An item's `onSelect` receives the click event; a plain item and a radio item close the menu after
// it, a checkbox item stays open, and `closeOnSelect` overrides either. `event.preventDefault()`
// inside `onSelect` keeps the menu open. A disabled item stays visible, is skipped by the arrows and
// is announced as disabled.
//
// `header` draws a line of context above the items (who is signed in); `matchWidth` makes the panel
// at least as wide as the trigger. The panel is portaled to `document.body`; `container` (an element,
// or a function returning one when the menu opens) portals it into another, which a fullscreen
// element needs, since nothing outside it is drawn while it is fullscreen. An item's `sub` is a
// quieter second line under its label; a radio item that is `readOnly` shows its state and takes
// focus but cannot be chosen. A control that needs no `trigger` of its own passes `open`,
// `onOpenChange` and `anchorRef` instead.

const MenuContext = React.createContext({ close: (/** @type {boolean} */ _focus) => {} });
const RadioContext = React.createContext(/** @type {{ value: any, onChange?: (value: any) => void } | null} */ (null));

const ITEMS = "[role^='menuitem']:not([aria-disabled='true'])";

/** @param {any} shortcut */
function drawShortcut(shortcut) {
  if (Array.isArray(shortcut)) return <Kbd size="sm" keys={shortcut} />;
  if (typeof shortcut === "string") {
    const keys = shortcut.split("+").map((k) => k.trim()).filter(Boolean);
    return keys.length > 1 ? <Kbd size="sm" keys={keys} /> : <Kbd size="sm">{shortcut}</Kbd>;
  }
  return shortcut;
}

/**
 * @typedef {object} MenuOwnProps
 * @property {import("react").ReactElement} [trigger] The button that opens it; cloned.
 * @property {boolean} [open] Controlled open state.
 * @property {boolean} [defaultOpen] Initial open state when uncontrolled.
 * @property {(open: boolean) => void} [onOpenChange] Receives the next open state.
 * @property {import("react").RefObject<HTMLElement>} [anchorRef] The element the panel hangs from, when there is no `trigger`.
 * @property {import("@floating-ui/react-dom").Placement} [placement] Preferred side and alignment of the panel; flips when there is no room.
 * @property {string} [label] The menu's accessible name; the trigger names it otherwise.
 * @property {import("react").ReactNode} [header] A line of context above the items.
 * @property {boolean} [matchWidth] The panel is at least as wide as its anchor.
 * @property {Element | null | (() => Element | null)} [container] Where the panel is portaled; `document.body` by default. A function is read each time the menu opens.
 * @property {import("react").ReactNode} [children] MenuItem, MenuCheckboxItem, MenuRadioGroup, MenuGroup and MenuSeparator.
 * @property {string} [className] Class name added to the root element.
 * @typedef {MenuOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof MenuOwnProps>} MenuProps
 */
/** @param {MenuProps} props */
function Menu({
  trigger, open: openProp, defaultOpen = false, onOpenChange, anchorRef, placement, label, header,
  matchWidth = false, container, children, className, ...rest
}) {
  const [open, setOpen] = useOpenState(openProp, defaultOpen, onOpenChange);
  const own = React.useRef(null);
  const anchor = trigger ? own : (anchorRef || own);
  const menuId = React.useId();
  const triggerId = React.useId();
  const first = React.useRef(/** @type {"first" | "last"} */ ("first"));
  const typed = React.useRef({ text: "", at: 0 });

  const close = React.useCallback((toTrigger) => {
    setOpen(false);
    if (toTrigger) focusTrigger(anchor.current);
  }, [setOpen, anchor]);
  const panelHolder = React.useRef(/** @type {import("react").MutableRefObject<HTMLElement | null> | null} */ (null));
  const onClose = React.useCallback((reason) => {
    returnFocus(reason, anchor.current, panelHolder.current && panelHolder.current.current);
    setOpen(false);
  }, [setOpen, anchor]);
  const { pos, panelRef, panelEl, ready } = useOverlay(open, onClose, anchor, { placement, matchWidth });
  panelHolder.current = panelEl;

  const focused = React.useRef(false);
  React.useEffect(() => {
    if (!open) { focused.current = false; return; }
    const el = panelEl.current;
    if (!ready || focused.current || !el) return;
    focused.current = true;
    const items = /** @type {HTMLElement[]} */ (Array.from(el.querySelectorAll(ITEMS)));
    const chosen = items.find((i) => i.getAttribute("aria-checked") === "true");
    const target = first.current === "last" ? items[items.length - 1] : (chosen || items[0]);
    (target || el).focus({ preventScroll: true });
    first.current = "first";
  }, [open, ready, panelEl]);

  const onKeyDown = (e) => {
    const items = /** @type {HTMLElement[]} */ (Array.from(e.currentTarget.querySelectorAll(ITEMS)));
    const at = items.indexOf(/** @type {HTMLElement} */ (document.activeElement));
    const go = (i) => { e.preventDefault(); if (items.length) items[(i + items.length) % items.length].focus({ preventScroll: true }); };
    if (e.key === "ArrowDown") go(at + 1);
    else if (e.key === "ArrowUp") go(at < 0 ? -1 : at - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(-1);
    else if (e.key === "Tab") {
      close(true);
      if (e.shiftKey) e.preventDefault();
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey
      && (e.key !== " " || (typed.current.text && Date.now() - typed.current.at <= 700))) {
      e.preventDefault();
      const now = Date.now();
      const text = (now - typed.current.at > 700 ? "" : typed.current.text) + e.key.toLowerCase();
      typed.current = { text, at: now };
      // The same key struck again steps through the items that start with it.
      const cycle = text.length > 1 && [...text].every((c) => c === text[0]);
      const needle = cycle ? text[0] : text;
      const from = text.length === 1 || cycle ? at + 1 : Math.max(at, 0);
      const order = items.map((_, i) => items[(from + i) % items.length]);
      const hit = order.find((i) => (i.textContent || "").trim().toLowerCase().startsWith(needle));
      if (hit) hit.focus({ preventScroll: true });
    }
  };

  let triggerEl = null;
  if (trigger && React.isValidElement(trigger)) {
    const t = /** @type {any} */ (trigger);
    triggerEl = React.cloneElement(t, {
      ref: mergeRefs(own, elementRef(t)),
      id: t.props.id || triggerId,
      "aria-haspopup": "menu",
      "aria-expanded": open,
      "aria-controls": open ? menuId : undefined,
      onClick: chain(t.props.onClick, () => { first.current = "first"; setOpen(!open); }),
      onKeyDown: chain(t.props.onKeyDown, (e) => {
        if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
        e.preventDefault();
        first.current = e.key === "ArrowUp" ? "last" : "first";
        setOpen(true);
      }),
    });
  }
  const labelledBy = trigger && !label ? ((/** @type {any} */ (trigger)).props.id || triggerId) : undefined;

  return (
    <>
      {triggerEl}
      {open && pos && createPortal(
        <MenuContext.Provider value={{ close }}>
          <div ref={panelRef} id={menuId} role="menu" data-inert-exempt="" tabIndex={-1}
            aria-label={label} aria-labelledby={labelledBy} aria-orientation="vertical"
            style={pos} onKeyDown={onKeyDown} {...rest}
            className={"k-menu" + (className ? " " + className : "")}>
            {header != null && <div className="k-menu__header" role="presentation">{header}</div>}
            {children}
          </div>
        </MenuContext.Provider>,
        (typeof container === "function" ? container() : container) || document.body,
      )}
    </>
  );
}

/**
 * @typedef {object} MenuItemOwnProps
 * @property {string | import("react").ReactNode} [icon] A Lucide name or a node, before the label.
 * @property {(event: import("react").MouseEvent<HTMLButtonElement>) => void} [onSelect] Runs on Enter, Space or a click; `preventDefault()` keeps the menu open.
 * @property {boolean} [disabled] Dims the item and keeps it from being chosen.
 * @property {"danger"} [tone] `danger` colours the item as a destructive one.
 * @property {string | string[] | import("react").ReactNode} [shortcut] The item's keyboard shortcut at the row's end,
 *   drawn as keys: a string is split on "+" into a chord ("Ctrl+K"), an array is the chord's keys, any
 *   other node is drawn as it is.
 * @property {import("react").ReactNode} [sub] A quieter line under the label.
 * @property {import("react").ReactNode} [aside] At the row's end, in the accent.
 * @property {boolean} [closeOnSelect] Closes the menu after `onSelect`; true for an item.
 * @property {import("react").ReactNode} [children] The label.
 * @property {string} [className] Class name added to the root element.
 * @typedef {MenuItemOwnProps & Omit<import("react").ComponentPropsWithoutRef<"button">, keyof MenuItemOwnProps | "onSelect">} MenuItemProps
 */

/**
 * The row every kind of item draws.
 * @param {MenuItemProps & { role: string, checked?: boolean, readOnly?: boolean, lead?: import("react").ReactNode }} props
 */
function Row({
  role, checked, lead, icon, onSelect, disabled = false, readOnly = false, tone, shortcut, sub, aside, closeOnSelect = true,
  children, className, onClick, ...rest
}) {
  const { close } = React.useContext(MenuContext);
  const press = (e) => {
    if (onClick) onClick(e);
    if (disabled || readOnly) { if (readOnly) e.preventDefault(); return; }
    if (onSelect) onSelect(e);
    if (closeOnSelect && !e.defaultPrevented) close(true);
  };
  const glyph = lead !== undefined ? lead : (typeof icon === "string" ? <Icon name={icon} size={14} /> : icon);
  return (
    <button type="button" role={role} tabIndex={-1} aria-disabled={disabled || undefined}
      aria-checked={checked === undefined ? undefined : checked}
      onClick={press}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.focus({ preventScroll: true }); }}
      {...rest}
      className={"k-menu__item" + (tone ? " k-menu__item--" + tone : "") + (readOnly ? " k-is-readonly" : "") + (className ? " " + className : "")}>
      {glyph != null && glyph !== false && <span className="k-menu__lead">{glyph}</span>}
      <span className="k-menu__label">{children}{sub != null && <span className="k-menu__sub">{sub}</span>}</span>
      {aside != null && <span className="k-menu__aside">{aside}</span>}
      {shortcut != null && <span className="k-menu__shortcut">{drawShortcut(shortcut)}</span>}
    </button>
  );
}

/** @param {MenuItemProps} props */
function MenuItem(props) {
  return <Row role="menuitem" {...props} />;
}

/**
 * @typedef {object} MenuCheckboxItemOwnProps
 * @property {boolean} [checked] Whether the item is ticked.
 * @property {(checked: boolean) => void} [onCheckedChange] Receives the new state.
 * @typedef {MenuCheckboxItemOwnProps & Omit<MenuItemProps, keyof MenuCheckboxItemOwnProps>} MenuCheckboxItemProps
 */
/** @param {MenuCheckboxItemProps} props */
function MenuCheckboxItem({ checked = false, onCheckedChange, onSelect, closeOnSelect = false, ...rest }) {
  return (
    <Row role="menuitemcheckbox" checked={checked} closeOnSelect={closeOnSelect}
      lead={checked ? <Icon name="check" size={14} strokeWidth={2.4} /> : ""}
      onSelect={(e) => { if (onSelect) onSelect(e); if (onCheckedChange) onCheckedChange(!checked); }}
      {...rest} />
  );
}

/**
 * @typedef {object} MenuRadioItemOwnProps
 * @property {any} value Chosen when the group's value equals it.
 * @property {boolean} [readOnly] Shows the state and takes focus, but a press changes nothing and keeps the menu open.
 * @typedef {MenuRadioItemOwnProps & Omit<MenuItemProps, keyof MenuRadioItemOwnProps>} MenuRadioItemProps
 */
/** @param {MenuRadioItemProps} props */
function MenuRadioItem({ value, onSelect, readOnly, ...rest }) {
  const group = React.useContext(RadioContext);
  const checked = !!group && group.value === value;
  return (
    <Row role="menuitemradio" checked={checked} readOnly={readOnly}
      lead={<span className={"k-menu__dot" + (checked ? " k-is-on" : "")} aria-hidden="true" />}
      onSelect={(e) => {
        if (onSelect) onSelect(e);
        if (group && group.onChange && group.value !== value) group.onChange(value);
      }}
      {...rest} />
  );
}

/**
 * @typedef {object} MenuGroupProps
 * @property {import("react").ReactNode} [label] The group's heading and accessible name.
 * @property {import("react").ReactNode} [children] The group's items.
 * @property {string} [className] Class name added to the root element.
 */
/** @param {MenuGroupProps} props */
function MenuGroup({ label, children, className }) {
  const id = React.useId();
  return (
    <div role="group" aria-labelledby={label != null ? id : undefined}
      className={"k-menu__group" + (className ? " " + className : "")}>
      {label != null && <div className="k-menu__group-label" id={id} role="presentation">{label}</div>}
      {children}
    </div>
  );
}

/**
 * @typedef {object} MenuRadioGroupOwnProps
 * @property {any} value The chosen item's `value`.
 * @property {(value: any) => void} [onChange] Receives the value of an item that was not the chosen one.
 * @typedef {MenuRadioGroupOwnProps & MenuGroupProps} MenuRadioGroupProps
 */
/** @param {MenuRadioGroupProps} props */
function MenuRadioGroup({ value, onChange, ...group }) {
  const ctx = React.useMemo(() => ({ value, onChange }), [value, onChange]);
  return <RadioContext.Provider value={ctx}><MenuGroup {...group} /></RadioContext.Provider>;
}

/**
 * @param {object} props
 * @param {string} [props.className] Class name added to the separator.
 */
function MenuSeparator({ className }) {
  return <div role="separator" className={"k-menu__sep" + (className ? " " + className : "")} />;
}

export { Menu, MenuCheckboxItem, MenuGroup, MenuItem, MenuRadioGroup, MenuRadioItem, MenuSeparator };
