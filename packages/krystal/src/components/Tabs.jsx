import React from "react";
import { onTelevision } from "../lib/television.js";
import { Icon } from "./Icon.jsx";
import { Pill } from "./Pill.jsx";

// Tabs — panels that share one place in a page, one shown at a time (WAI-ARIA tabs). The tabs are
// buttons that switch what is drawn below them; nothing navigates. Tabs that go to another page are
// SubTabs (a link strip) or TabDock (the phone's main navigation).
//
//   <Tabs defaultValue="a">
//     <TabList label="Sections">
//       <Tab value="a" icon="info">Overview</Tab>
//       <Tab value="b" count={3}>Alerts</Tab>
//     </TabList>
//     <TabPanel value="a">…</TabPanel>
//     <TabPanel value="b">…</TabPanel>
//   </Tabs>
//
// Tabs holds the chosen value: `value` with `onChange`, or `defaultValue` when the page does not need
// to know. `variant` is underline (default) or segmented, the strip OptionList draws; `size` is sm or
// md. `activation` is "auto" (default), where an arrow key moves focus and chooses the tab at once,
// or "manual", where it only moves focus and Enter or Space chooses. Home and End go to the first
// and last tab. A row wider than its column scrolls sideways, and the chosen tab is kept in view.
//
// A TabPanel is unmounted while it is not chosen; `keepMounted` keeps it drawn and hidden, for a
// panel whose state must survive a switch.
const TabsContext = React.createContext(null);

// A value is any string, and an id with a space in it is two names to aria-controls.
const tabId = (base, value) => base + "-tab-" + encodeURIComponent(String(value));
const panelId = (base, value) => base + "-panel-" + encodeURIComponent(String(value));

/**
 * @typedef {object} TabsOwnProps
 * @property {string | number} [value] The chosen tab's value.
 * @property {string | number} [defaultValue] The first chosen value when `value` is not given.
 * @property {(next: any) => void} [onChange] Receives the chosen tab's value.
 * @property {"underline" | "segmented"} [variant] `underline`, or `segmented` for the strip OptionList draws.
 * @property {"sm" | "md"} [size] `sm` or `md`.
 * @property {"auto" | "manual"} [activation] Whether an arrow key chooses the tab it focuses.
 * @property {string} [className] Extra class names on the root element.
 * @property {import("react").ReactNode} [children] A TabList and the TabPanels.
 * @typedef {TabsOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof TabsOwnProps | "onChange">} TabsProps
 */
/** @type {import("react").ForwardRefExoticComponent<TabsProps & import("react").RefAttributes<HTMLDivElement>>} */
const Tabs = React.forwardRef(function Tabs({
  value, defaultValue, onChange, variant = "underline", size = "md", activation = "auto",
  className, children, ...rest
}, ref) {
  const base = React.useId();
  const [inner, setInner] = React.useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : inner;
  const select = React.useCallback((next) => {
    if (!controlled) setInner(next);
    if (onChange) onChange(next);
  }, [controlled, onChange]);
  const ctx = React.useMemo(
    () => ({ base, current, select, activation, variant, size }),
    [base, current, select, activation, variant, size],
  );
  return (
    <TabsContext.Provider value={ctx}>
      <div ref={ref} className={"k-tabs k-tabs--" + variant + " k-tabs--" + size + (className ? " " + className : "")} {...rest}>
        {children}
      </div>
    </TabsContext.Provider>
  );
});

function useTabs() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("Tab, TabList and TabPanel belong inside <Tabs>");
  return ctx;
}

/**
 * @typedef {object} TabListOwnProps
 * @property {string} [label] The list's accessible name.
 * @property {string} [className] Extra class names on the tab strip.
 * @property {import("react").ReactNode} [children] The Tabs.
 * @typedef {TabListOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof TabListOwnProps>} TabListProps
 */
/** @type {import("react").ForwardRefExoticComponent<TabListProps & import("react").RefAttributes<HTMLDivElement>>} */
const TabList = React.forwardRef(function TabList({ label, className, children, onKeyDown, ...rest }, ref) {
  const { current, activation } = useTabs();
  const listRef = React.useRef(null);
  const setRef = (el) => {
    listRef.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  };

  // The chosen tab is kept inside the scrolled row whenever the choice changes.
  React.useEffect(() => {
    const list = listRef.current;
    const tab = list && list.querySelector('[role="tab"][aria-selected="true"]');
    if (!tab || list.scrollWidth <= list.clientWidth) return;
    const left = tab.offsetLeft - list.offsetLeft;
    const right = left + tab.offsetWidth;
    if (left < list.scrollLeft) list.scrollLeft = left;
    else if (right > list.scrollLeft + list.clientWidth) list.scrollLeft = right - list.clientWidth;
  }, [current]);

  // With nothing chosen, the first enabled tab is the one Tab key lands on.
  React.useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || list.querySelector('[role="tab"][aria-selected="true"]')) return;
    const first = list.querySelector('[role="tab"]:not(:disabled)');
    if (first) first.tabIndex = 0;
  });

  const keys = (e) => {
    if (onKeyDown) onKeyDown(e);
    // On a television the arrows are spatial focus's, which reaches each tab; OK chooses.
    if (e.defaultPrevented || onTelevision()) return;
    const tabs = Array.from(listRef.current.querySelectorAll('[role="tab"]:not(:disabled)'));
    const at = tabs.indexOf(document.activeElement);
    if (at < 0) return;
    const horizontal = e.currentTarget.getAttribute("aria-orientation") !== "vertical";
    const prev = horizontal ? "ArrowLeft" : "ArrowUp";
    const next = horizontal ? "ArrowRight" : "ArrowDown";
    const to = e.key === next ? (at + 1) % tabs.length
      : e.key === prev ? (at - 1 + tabs.length) % tabs.length
        : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    tabs[to].focus();
    if (activation === "auto") tabs[to].click();
  };

  return (
    <div ref={setRef} role="tablist" aria-label={label} onKeyDown={keys}
      className={"k-tabs__list" + (className ? " " + className : "")} {...rest}>
      {children}
    </div>
  );
});

/**
 * @typedef {object} TabOwnProps
 * @property {string | number} value Pairs the tab with the TabPanel of the same value.
 * @property {string} [icon] A Lucide name drawn before the label.
 * @property {number} [count] A count drawn after the label as a Pill when above zero.
 * @property {"neutral" | "accent" | "info" | "ok" | "warn" | "danger" | "muted"} [countTone] Colours the count Pill.
 * @property {string} [className] Extra class names on the tab.
 * @property {import("react").ReactNode} [children] The label.
 * @typedef {TabOwnProps & Omit<import("react").ComponentPropsWithoutRef<"button">, keyof TabOwnProps>} TabProps
 */
/** @type {import("react").ForwardRefExoticComponent<TabProps & import("react").RefAttributes<HTMLButtonElement>>} */
const Tab = React.forwardRef(function Tab({
  value, icon, count, countTone = "neutral", className, children, onClick, disabled, ...rest
}, ref) {
  const { base, current, select, size } = useTabs();
  const on = current !== undefined && String(current) === String(value);
  const setRef = (el) => {
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  };
  return (
    <button ref={setRef} type="button" role="tab" id={tabId(base, value)}
      aria-selected={on} aria-controls={on ? panelId(base, value) : undefined}
      tabIndex={on ? 0 : -1} disabled={disabled}
      className={"k-tabs__tab k-tabs__tab--" + size + (on ? " k-is-on" : "") + (className ? " " + className : "")}
      onClick={(e) => { if (onClick) onClick(e); if (!e.defaultPrevented) select(value); }} {...rest}>
      {icon && <Icon name={icon} size={size === "sm" ? 13 : 14} />}
      <span className="k-tabs__label">{children}</span>
      {count > 0 && <Pill size="sm" tone={countTone} className="k-tabs__count">{count}</Pill>}
    </button>
  );
});

/**
 * @typedef {object} TabPanelOwnProps
 * @property {string | number} value The Tab's value.
 * @property {boolean} [keepMounted] Stay drawn, hidden, while not chosen.
 * @property {string} [className] Extra class names on the panel.
 * @property {import("react").ReactNode} [children] The panel's content.
 * @typedef {TabPanelOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof TabPanelOwnProps>} TabPanelProps
 */
/** @type {import("react").ForwardRefExoticComponent<TabPanelProps & import("react").RefAttributes<HTMLDivElement>>} */
const TabPanel = React.forwardRef(function TabPanel({ value, keepMounted = false, className, children, ...rest }, ref) {
  const { base, current } = useTabs();
  const on = current !== undefined && String(current) === String(value);
  if (!on && !keepMounted) return null;
  return (
    <div ref={ref} role="tabpanel" id={panelId(base, value)} aria-labelledby={tabId(base, value)}
      tabIndex={0} hidden={!on} className={"k-tabs__panel" + (className ? " " + className : "")} {...rest}>
      {children}
    </div>
  );
});

export { Tabs, TabList, Tab, TabPanel };
