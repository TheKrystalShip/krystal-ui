import React from "react";
import { Icon } from "./Icon.jsx";
import { Pill } from "./Pill.jsx";
import { buzz, useDockDrag } from "../hooks/useDockDrag.js";
import { useOpenState } from "../hooks/useOpenState.js";

// TabDock — the phone's way around a site: a bar of five tabs along the bottom edge that grows upward
// into a sheet of every page. The bar is the person's five favourites: Home in the middle, always, and
// four free slots they fill with any page; the sheet holds every page the site has, in the site's
// sections. Drawn only on phones, in `AppShell`'s `tabBar`; on a wide screen the sidebar is the way
// around.
//
// The bar is drawn with the `k-tabbar` classes. A press that travels is a drag (`useDockDrag`): from
// anywhere on the bar the sheet follows the finger up, and on the open sheet's head, or its body
// scrolled to the top, down. A tap on the handle toggles the sheet, a tap on a tab goes to its page,
// and a long-press on a tab opens the sheet in edit mode with that tab's slot chosen. In edit mode a
// tap on a free slot chooses it and a tap on a page puts that page there; a page already on the bar
// swaps places with the one it replaces. Every change is reported at once through `onSlotsChange`.
//
// A tile is a page: `onClick` takes the person there, and the sheet closes. A section of actions is
// one more section of the same tiles. While the sheet is drawn, `document.body` carries
// `data-tabdock-open`, so a site can give way to it. The component knows nothing of routers,
// accounts or storage: the site hands it items and a setter.

const FREE = 4; // the four free slots; Home is the fifth tab, between the second and the third
const HOME_AT = 2;
const OPEN_SHARE = 0.75; // the open sheet's top edge stands no higher than this share of the screen's height

const DEFAULT_STRINGS = {
  pages: "Pages",
  edit: "Edit",
  editTitle: "Edit tab bar",
  done: "Done",
  reset: "Reset",
  open: "Open pages",
  close: "Close pages",
  locked: "Locked",
  onBar: "On the tab bar",
  empty: "Empty slot",
};

/**
 * @typedef {object} TabDockItem
 * @property {string} id The page's id; what `slots` and `defaultSlots` name.
 * @property {string} icon A Lucide name.
 * @property {string} label The words under the icon.
 * @property {boolean} [active] Marks the current page (`aria-current`).
 * @property {() => void} [onClick] Called when the tab or the tile is pressed.
 * @property {number} [badge] Drawn on the icon when above zero.
 * @property {"info" | "warn" | "danger"} [tone] Colours the badge; warn by default.
 * @property {boolean} [disabled] Dims the tab or tile and blocks it.
 */
/**
 * @typedef {object} TabDockSection
 * @property {string} id The section's key.
 * @property {string} label The small-caps heading over its tiles.
 * @property {TabDockItem[]} items The tiles, in order.
 */
/**
 * @typedef {object} TabDockStrings
 * @property {string} [pages] The sheet's name.
 * @property {string} [edit] The button that enters edit mode.
 * @property {string} [editTitle] The sheet's name in edit mode.
 * @property {string} [done] The button that leaves edit mode.
 * @property {string} [reset] The button that puts the defaults back.
 * @property {string} [open] The handle's name while the sheet is closed.
 * @property {string} [close] The handle's name while the sheet is open.
 * @property {string} [locked] What the lock on Home says.
 * @property {string} [onBar] What the dot on a page that is on the bar says.
 * @property {string} [empty] An empty free slot's name in edit mode.
 */
/**
 * @typedef {object} TabDockProps
 * @property {TabDockItem} home The middle tab, locked in its slot. Home also appears as a tile in whichever section the site puts an item with the same id.
 * @property {TabDockSection[]} sections The sheet's sections, in the site's order.
 * @property {string[]} [slots] The four free slots' page ids, left to right. An id no section holds, a repeated id or a missing entry takes that position's default; a default no section holds leaves the slot empty. Without it the dock keeps its own.
 * @property {string[]} defaultSlots The four free slots when the person has chosen none, and what Reset puts back.
 * @property {(ids: string[]) => void} [onSlotsChange] Called with the four ids at once on every change; a slot left empty is "".
 * @property {boolean} [open] Whether the sheet is open; the dock keeps its own state without it.
 * @property {(open: boolean) => void} [onOpenChange] Called with `true` when the sheet opens and `false` when it closes.
 * @property {TabDockStrings} [strings] Every word the component draws; English by default.
 * @property {string} [label] The bar's accessible name; "Main" by default.
 */

/** The pages by id, the first of an id winning. */
function indexItems(/** @type {TabDockSection[]} */ sections) {
  const known = new Map();
  for (const section of sections) for (const item of section.items) if (!known.has(item.id)) known.set(item.id, item);
  return known;
}

/** The four free slots as drawn: what the person chose where the site still has it, else the default, else nothing. */
function resolveSlots(/** @type {string[] | undefined} */ slots, /** @type {string[] | undefined} */ defaults, /** @type {Map<string, TabDockItem>} */ known, /** @type {string} */ homeId) {
  const used = new Set([homeId]);
  /** @type {(string | null)[]} */
  const out = [];
  for (let i = 0; i < FREE; i++) {
    const pick = [slots && slots[i], defaults && defaults[i]].find((id) => id && known.has(id) && !used.has(id)) || null;
    if (pick) used.add(pick);
    out.push(pick);
  }
  return out;
}

const refuse = (/** @type {{ preventDefault: () => void }} */ e) => e.preventDefault();

function Badge({ item, className }) {
  return item.badge > 0
    ? <Pill size="sm" tone={item.tone || "warn"} className={className + " " + className + "--" + (item.tone || "warn")}>{item.badge}</Pill>
    : null;
}

/** @param {TabDockProps} props */
function TabDock({ home, sections, slots, defaultSlots, onSlotsChange, open: openProp, onOpenChange, strings, label = "Main" }) {
  const words = { ...DEFAULT_STRINGS, ...strings };
  const [open, setOpen] = useOpenState(openProp, false, onOpenChange);
  const [ownSlots, setOwnSlots] = React.useState(defaultSlots);
  const [editing, setEditing] = React.useState(false);
  const [chosen, setChosen] = React.useState(/** @type {number | null} */ (null));
  const id = React.useId();
  const titleId = id + "-title";
  const sheetId = id + "-sheet";
  const bar = React.useRef(/** @type {any} */ (null));
  const content = React.useRef(/** @type {any} */ (null));
  const barHandle = React.useRef(/** @type {any} */ (null));
  const returning = React.useRef(false);
  const placed = React.useRef(false);

  const known = indexItems(sections);
  const resolved = resolveSlots(slots === undefined ? ownSlots : slots, defaultSlots, known, home.id);
  const onBar = new Set(resolved.filter(Boolean));

  const drag = useDockDrag({
    open,
    onOpenChange: setOpen,
    eager: false,
    measure: ({ edge }) => {
      const bottom = bar.current && getComputedStyle(bar.current).display !== "none" ? bar.current.getBoundingClientRect().height : 0;
      for (const node of [drag.panel.current, drag.scrim.current]) if (node) node.style.setProperty("--k-tabdock-bar", `${bottom}px`);
      const drawn = drag.head.current && content.current;
      return {
        shut: edge,
        natural: drawn ? edge + drag.head.current.offsetHeight + content.current.offsetHeight : null,
        cap: Math.round(document.documentElement.clientHeight * OPEN_SHARE) - bottom,
      };
    },
    onHold: ({ target }) => {
      const tab = target instanceof Element ? target.closest("[data-tab]") : null;
      if (!tab) return false;
      const at = Number(tab.getAttribute("data-tab"));
      setEditing(true);
      setChosen(at === HOME_AT ? 0 : at < HOME_AT ? at : at - 1);
      setOpen(true);
      return true;
    },
  });
  const { measure, rest, grabbing } = drag;

  // The sheet stands on the bar, whatever the bar measures: its border, the safe-area inset and a
  // phone's fractional pixels all move its bottom edge.
  React.useLayoutEffect(() => {
    const place = () => {
      measure();
      if (!grabbing()) rest(placed.current);
      placed.current = true;
    };
    place();
    window.addEventListener("resize", place);
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(place) : null;
    if (observer) for (const node of [bar.current, drag.head.current, content.current]) if (node) observer.observe(node);
    return () => {
      window.removeEventListener("resize", place);
      if (observer) observer.disconnect();
    };
  }, [measure, rest, grabbing, drag.head]);

  React.useEffect(() => {
    if (!drag.live) return undefined;
    document.body.setAttribute("data-tabdock-open", "");
    return () => document.body.removeAttribute("data-tabdock-open");
  }, [drag.live]);

  React.useEffect(() => {
    if (!open) return undefined;
    const escape = (/** @type {KeyboardEvent} */ e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open, setOpen]);

  // Closing leaves edit mode, and focus that was in the sheet returns to the handle.
  React.useEffect(() => {
    if (open) return;
    setEditing(false);
    setChosen(null);
    if (returning.current) { returning.current = false; if (barHandle.current) barHandle.current.focus({ preventScroll: true }); }
  }, [open]);
  const wasOpen = React.useRef(open);
  if (wasOpen.current && !open) {
    const sheet = drag.panel.current;
    returning.current = Boolean(sheet && document.activeElement && sheet.contains(document.activeElement));
  }
  wasOpen.current = open;

  // Opened, focus goes to the current page's tile, else the first.
  const shown = open && drag.live;
  React.useEffect(() => {
    const sheet = drag.panel.current;
    if (!shown || !sheet) return;
    const tile = sheet.querySelector('.k-tabdock__tile[aria-current="page"]:not(:disabled)') || sheet.querySelector(".k-tabdock__tile:not(:disabled)");
    if (tile) tile.focus({ preventScroll: true });
  }, [shown, drag.panel]);

  const commit = (/** @type {(string | null)[]} */ next) => {
    const ids = next.map((value) => value || "");
    if (slots === undefined) setOwnSlots(ids);
    if (onSlotsChange) onSlotsChange(ids);
  };
  const reset = () => commit(resolveSlots(defaultSlots, defaultSlots, known, home.id));
  const assign = (/** @type {string} */ pageId) => {
    if (pageId === home.id) return;
    const at = chosen ?? 0;
    const next = [...resolved];
    const from = next.indexOf(pageId);
    if (from >= 0 && from !== at) next[from] = next[at];
    next[at] = pageId;
    setChosen(at);
    commit(next);
  };
  const go = (/** @type {TabDockItem} */ item) => {
    if (item.onClick) item.onClick();
    setOpen(false);
  };
  const toggle = () => { buzz(); setOpen(!open); };
  const edit = () => {
    if (editing) { setEditing(false); setChosen(null); return; }
    setEditing(true);
    setChosen(0);
  };

  /** One tab of the bar. `slot` is the free slot it is, or null for Home. */
  const tab = (/** @type {TabDockItem | null} */ item, /** @type {number} */ position, /** @type {number | null} */ slot) => {
    const locked = slot === null;
    const picked = editing && slot !== null && chosen === slot;
    const lit = Boolean(item && item.active) && !editing;
    if (!item) {
      return editing
        ? <button key={position} type="button" data-tab={position} aria-label={words.empty}
          className={"k-tabbar__tab k-tabdock__tab k-tabdock__tab--slot" + (picked ? " k-tabdock__tab--chosen" : "")}
          onClick={() => setChosen(slot)} />
        : <span key={position} className="k-tabdock__gap" aria-hidden="true" />;
    }
    return (
      <button key={position} type="button" data-tab={position}
        className={"k-tabbar__tab k-tabdock__tab" + (lit ? " k-tabbar__tab--active" : "") + (picked ? " k-tabbar__tab--active k-tabdock__tab--chosen" : "")
          + (editing && !locked ? " k-tabdock__tab--slot" : "") + (editing && locked ? " k-tabdock__tab--locked" : "")}
        aria-current={lit ? "page" : undefined}
        disabled={item.disabled}
        onClick={editing ? (locked ? undefined : () => setChosen(slot)) : () => go(item)}>
        <span className="k-tabbar__icon">
          <Icon name={item.icon} size={22} />
          <Badge item={item} className="k-tabbar__badge" />
        </span>
        <span className="k-tabbar__label">{item.label}</span>
        {editing && locked && <span className="k-tabdock__lock" role="img" aria-label={words.locked}><Icon name="lock" size={11} /></span>}
      </button>
    );
  };

  const tabs = [];
  for (let position = 0; position <= FREE; position++) {
    if (position === HOME_AT) { tabs.push(tab(home, position, null)); continue; }
    const slot = position < HOME_AT ? position : position - 1;
    const pageId = resolved[slot];
    tabs.push(tab(pageId ? known.get(pageId) : null, position, slot));
  }

  const tile = (/** @type {TabDockItem} */ item) => {
    const locked = item.id === home.id;
    const lit = Boolean(item.active) && !editing;
    const inSlot = editing && chosen !== null && resolved[chosen] === item.id;
    return (
      <button key={item.id} type="button"
        className={"k-tabdock__tile" + (lit ? " k-tabdock__tile--active" : "") + (inSlot ? " k-tabdock__tile--chosen" : "") + (editing && locked ? " k-tabdock__tile--locked" : "")}
        aria-current={lit ? "page" : undefined}
        disabled={item.disabled || (editing && locked)}
        onClick={editing ? () => assign(item.id) : () => go(item)}>
        <span className="k-tabdock__tile-icon">
          <Icon name={item.icon} size={22} />
          <Badge item={item} className="k-tabdock__tile-badge" />
        </span>
        <span className="k-tabdock__tile-label">{item.label}</span>
        {onBar.has(item.id) && !(editing && locked) && <span className="k-tabdock__dot" role="img" aria-label={words.onBar} />}
        {editing && locked && <span className="k-tabdock__lock" role="img" aria-label={words.locked}><Icon name="lock" size={11} /></span>}
      </button>
    );
  };

  const handleMark = <span className="k-tabdock__mark" aria-hidden="true" />;

  return (
    <div className="k-tabdock">
      <nav ref={bar} className="k-tabbar k-tabdock__bar" aria-label={label} onContextMenu={refuse} {...drag.grip}>
        <button ref={barHandle} type="button" className={"k-tabdock__handle" + (drag.live ? " k-is-covered" : "")}
          aria-label={open ? words.close : words.open} aria-expanded={open} aria-controls={sheetId}
          tabIndex={drag.live ? -1 : undefined} onClick={toggle}>
          {handleMark}
        </button>
        {tabs}
      </nav>
      <div ref={drag.scrim} className={"k-tabdock__scrim" + (open ? " k-is-open" : "")} aria-hidden="true" onClick={() => setOpen(false)} />
      <div ref={drag.panel} id={sheetId} role="dialog" aria-labelledby={titleId}
        className={"k-tabdock__sheet" + (drag.live ? "" : " k-is-idle")}>
        <div className="k-tabdock__pane">
          <div ref={drag.head} className="k-tabdock__head" onContextMenu={refuse} {...drag.grip}>
            <button type="button" className="k-tabdock__handle k-tabdock__handle--sheet" aria-label={words.close} onClick={toggle}>
              {handleMark}
            </button>
            <span id={titleId} className="k-tabdock__title">{editing ? words.editTitle : words.pages}</span>
            <span className="k-tabdock__actions">
              {editing && <button type="button" className="k-tabdock__btn" onClick={reset}>{words.reset}</button>}
              <button type="button" className={"k-tabdock__btn k-tabdock__btn--edit" + (editing ? " k-tabdock__btn--on" : "")} onClick={edit}>
                {editing ? words.done : words.edit}
              </button>
            </span>
          </div>
          <div ref={drag.body} className="k-tabdock__body">
            <div ref={content} className="k-tabdock__content">
              {sections.filter((section) => section.items.length > 0).map((section) => (
                <div key={section.id} className="k-tabdock__section" role="group" aria-labelledby={id + "-" + section.id}>
                  <span id={id + "-" + section.id} className="k-tabdock__heading">{section.label}</span>
                  <div className="k-tabdock__grid">{section.items.map(tile)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { TabDock };
