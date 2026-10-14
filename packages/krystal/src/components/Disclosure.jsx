import React from "react";
import { Icon } from "./Icon.jsx";

// Disclosure — a summary that shows or hides its content (WAI-ARIA disclosure), and Accordion, a
// group of them (WAI-ARIA accordion).
//
//   <Disclosure summary="Advanced" icon="settings" aside={<Pill>3</Pill>} defaultOpen>…</Disclosure>
//
//   <Accordion type="single" defaultValue="a">
//     <Disclosure value="a" summary="First">…</Disclosure>
//     <Disclosure value="b" summary="Second">…</Disclosure>
//   </Accordion>
//
// The summary is a button inside a heading of `level` (3 by default), so the page outline names it.
// It carries `aria-expanded` and `aria-controls`, and the content is a region the summary labels.
// `summary` is any node, `icon` a Lucide name before it, `aside` a node at the row's end (a count, a
// state). `caret` puts the chevron at the `start` (default) or the `end` of the row.
//
// A Disclosure is open by `open` and `onOpenChange`, or by `defaultOpen`. In an Accordion its `value`
// names it and the Accordion holds which are open: `type="single"` keeps one open (`value` is that
// value or null; `collapsible={false}` keeps it from being closed), `type="multiple"` any number
// (`value` is an array). Up and Down Arrow, Home and End move focus between the summaries of an
// Accordion.
//
// The height animates, and not under reduced motion. Closed content stays mounted, hidden from the
// tab order and from assistive technology, so state inside it survives.
//
// `variant` is `framed` (a bordered card; an Accordion draws its Disclosures as one bordered group)
// or `plain` (a section head with a rule under it, for a heading over a long list).
const AccordionContext = React.createContext(null);

/**
 * @typedef {object} DisclosureOwnProps
 * @property {import("react").ReactNode} summary The always-visible row.
 * @property {string} [icon] A Lucide name drawn before the summary.
 * @property {import("react").ReactNode} [aside] At the row's end.
 * @property {1 | 2 | 3 | 4 | 5 | 6} [level] The heading level around the summary.
 * @property {boolean} [open]
 * @property {boolean} [defaultOpen]
 * @property {(open: boolean) => void} [onOpenChange]
 * @property {string | number} [value] The name inside an Accordion.
 * @property {boolean} [disabled]
 * @property {"start" | "end"} [caret]
 * @property {"framed" | "plain"} [variant]
 * @property {string} [className]
 * @property {import("react").ReactNode} [children] The content.
 * @typedef {DisclosureOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof DisclosureOwnProps>} DisclosureProps
 */
/** @type {import("react").ForwardRefExoticComponent<DisclosureProps & import("react").RefAttributes<HTMLDivElement>>} */
const Disclosure = React.forwardRef(function Disclosure({
  summary, icon, aside, level = 3, open, defaultOpen = false, onOpenChange, value, disabled = false,
  caret = "start", variant, className, children, ...rest
}, ref) {
  const ownId = React.useId();
  const group = React.useContext(AccordionContext);
  const [inner, setInner] = React.useState(defaultOpen);
  const name = value !== undefined ? value : ownId;
  const isOpen = group ? group.isOpen(name) : open !== undefined ? open : inner;
  const shape = group ? group.variant : variant || "framed";

  const toggle = () => {
    if (disabled) return;
    if (group) { group.toggle(name); return; }
    if (open === undefined) setInner(!isOpen);
    if (onOpenChange) onOpenChange(!isOpen);
  };

  const Heading = /** @type {"h3"} */ ("h" + Math.min(6, Math.max(1, level)));
  const chevron = <Icon name="chevron-right" size={16} className="k-disclosure__caret" />;
  const cls = "k-disclosure k-disclosure--" + shape + (group && shape === "framed" ? " k-disclosure--grouped" : "")
    + (isOpen ? " k-is-open" : "") + (disabled ? " k-is-disabled" : "") + (className ? " " + className : "");
  return (
    <div ref={ref} className={cls} {...rest}>
      <Heading className="k-disclosure__heading">
        <button type="button" id={ownId + "-summary"} className={"k-disclosure__summary k-disclosure__summary--" + caret}
          aria-expanded={isOpen} aria-controls={ownId + "-content"} disabled={disabled} onClick={toggle}>
          {caret === "start" && chevron}
          {icon && <Icon name={icon} size={16} className="k-disclosure__icon" />}
          <span className="k-disclosure__title">{summary}</span>
          {aside != null && <span className="k-disclosure__aside">{aside}</span>}
          {caret === "end" && chevron}
        </button>
      </Heading>
      <div id={ownId + "-content"} role="region" aria-labelledby={ownId + "-summary"} className="k-disclosure__panel">
        <div className="k-disclosure__clip">
          <div className="k-disclosure__body">{children}</div>
        </div>
      </div>
    </div>
  );
});

/**
 * @typedef {object} AccordionOwnProps
 * @property {"single" | "multiple"} [type] One open at a time, or any number.
 * @property {string | number | null | (string | number)[]} [value] The open value; with `multiple`, the array of open values.
 * @property {string | number | null | (string | number)[]} [defaultValue]
 * @property {(next: any) => void} [onChange] The next open value, or array of values.
 * @property {boolean} [collapsible] With `single`, whether the open one can be closed (default true).
 * @property {"framed" | "plain"} [variant] Applies to every Disclosure inside.
 * @property {string} [className]
 * @property {import("react").ReactNode} [children] Disclosures.
 * @typedef {AccordionOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof AccordionOwnProps | "onChange" | "defaultValue">} AccordionProps
 */
/** @type {import("react").ForwardRefExoticComponent<AccordionProps & import("react").RefAttributes<HTMLDivElement>>} */
const Accordion = React.forwardRef(function Accordion({
  type = "single", value, defaultValue, onChange, collapsible = true, variant = "framed", className, children,
  onKeyDown, ...rest
}, ref) {
  const multiple = type === "multiple";
  const [inner, setInner] = React.useState(defaultValue !== undefined ? defaultValue : multiple ? [] : null);
  const controlled = value !== undefined;
  const current = controlled ? value : inner;
  const open = React.useMemo(
    () => new Set(/** @type {any[]} */ (multiple ? (current || []) : current === null || current === undefined ? [] : [current])),
    [multiple, current],
  );
  const own = React.useRef(null);
  const setRef = (el) => {
    own.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  };

  const ctx = React.useMemo(() => ({
    variant,
    isOpen: (name) => open.has(name),
    toggle: (name) => {
      let next;
      if (multiple) next = open.has(name) ? [...open].filter((v) => v !== name) : [...open, name];
      else next = open.has(name) ? (collapsible ? null : name) : name;
      if (!controlled) setInner(next);
      if (onChange) onChange(next);
    },
  }), [variant, open, multiple, collapsible, controlled, onChange]);

  const keys = (e) => {
    if (onKeyDown) onKeyDown(e);
    if (e.defaultPrevented) return;
    const items = Array.from(own.current.querySelectorAll(".k-disclosure__summary:not(:disabled)"))
      .filter((el) => el.closest(".k-accordion") === own.current);
    const at = items.indexOf(document.activeElement);
    if (at < 0) return;
    const to = e.key === "ArrowDown" ? (at + 1) % items.length
      : e.key === "ArrowUp" ? (at - 1 + items.length) % items.length
        : e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    items[to].focus();
  };

  return (
    <AccordionContext.Provider value={ctx}>
      <div ref={setRef} className={"k-accordion k-accordion--" + variant + (className ? " " + className : "")}
        onKeyDown={keys} {...rest}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
});

export { Accordion, Disclosure };
