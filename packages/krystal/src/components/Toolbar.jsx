import React from "react";
import { Icon } from "./Icon.jsx";
import { Menu, MenuRadioGroup, MenuRadioItem, MenuSeparator } from "./Menu.jsx";
import { Popover } from "./Popover.jsx";
import { useDebouncedValue } from "./Pagination.jsx";

// Toolbar — the reusable filter / search / sort / action bar.
//
// One quiet row that sits directly on the page (no heavy bordered card):
// transparent ghost controls, surface-2 hovers, a single teal accent reserved for active state, and
// secondary dimensions tucked into a popover instead of a wall of inline
// selects.
//
// Composition, not configuration — a page assembles the pieces it needs:
//
//   <Toolbar>
//     <ToolbarSearch value={q} onChange={setQ} pending={searching} placeholder="Search…" />
//     <ToolbarFilters fields={[
//       { id:"status", label:"Status", value:status, onChange:setStatus, default:"all",
//         options:[{ value:"all", label:"All", count:6 }, { value:"online", label:"Online", count:3 }] },
//       { id:"game", label:"Game", value:game, onChange:setGame, default:"all", options:gameOpts },
//     ]} onReset={resetAll} />
//     <ToolbarSpacer />
//     <ToolbarCount shown={n} total={m} unit="servers" />
//     <ToolbarButton icon="refresh-cw" onClick={refresh} spinning={busy}>Refresh</ToolbarButton>
//   </Toolbar>
//
// ToolbarFilters owns the single "Filters" popover (a Popover holding one radio group per field)
// AND the inline active-filter chips, so the two always stay in sync. ToolbarSort is the dedicated
// ordering control that sits beside it — a Menu (sort key, then asc/desc direction as radio items),
// for a page whose rows are tiles or cards; a table sorts from its own column headers instead.

/**
 * @param {object} props
 * @param {import("react").ReactNode} [props.children] ToolbarSearch, ToolbarFilters and ToolbarSort are placed in their own columns; anything else follows.
 * @param {string} [props.className] Extra class names on the bar.
 */
function Toolbar({ children, className }) {
  const search = [], filters = [], rest = [];
  React.Children.forEach(children, child => {
    if (!React.isValidElement(child)) { rest.push(child); return; }
    const t = child.type;
    if (t === ToolbarSearch) search.push(child);
    else if (t === ToolbarFilters || t === ToolbarSort) filters.push(child);
    else rest.push(child);
  });

  return (
    <div className={"k-toolbar" + (className ? " " + className : "")}>
      <div className="k-toolbar__col-search">{search}</div>
      <div className="k-toolbar__col-filters">{filters}</div>
      <div className="k-toolbar__col-rest">{rest}</div>
    </div>
  );
}

/**
 * @param {object} props
 * @param {string} props.value The query text.
 * @param {(value: string) => void} props.onChange Receives the next query text.
 * @param {string} [props.placeholder] Hint text in the empty field.
 * @param {boolean} [props.pending] Shows a searching mark.
 * @param {boolean} [props.autoFocus] Focuses the field when it mounts.
 * @param {string} [props.ariaLabel] The field's accessible name.
 */
function ToolbarSearch({ value, onChange, placeholder, pending, autoFocus, ariaLabel }) {
  return (
    <div className="k-toolbar__search">
      <Icon name="search" size={16} />
      <input
        placeholder={placeholder || "Search…"}
        value={value}
        onChange={e => onChange(e.target.value)}
        spellCheck="false"
        autoFocus={autoFocus}
        aria-label={ariaLabel || placeholder || "Search"} />
      {pending && (
        <span className="k-toolbar__search-pending" title="Searching…"><Icon name="loader-2" size={14} /></span>
      )}
      {value && !pending && (
        <button className="k-toolbar__search-clear" onClick={() => onChange("")} title="Clear" aria-label="Clear search">
          <Icon name="x" size={13} />
        </button>
      )}
    </div>
  );
}

function ToolbarSpacer() { return <span className="k-toolbar__spacer" />; }

// ToolbarSort — the ordering control for card/tile grids that can't carry
// sortable column headers. A Menu of radio items: pick the sort key, then the
// direction (a second group, which leaves the menu open). Re-picking the
// active key flips direction, mirroring CardTable's header behaviour, so the
// two sort surfaces feel identical across the app.
//
//   value:   current sort key
//   dir:     "asc" | "desc"
//   onChange(key, dir)
//   options: [{ value, label, defaultDir }]  — defaultDir applied when you
//            switch TO that key (numbers usually "desc", names "asc").
/**
 * @param {object} props
 * @param {string} props.value The current sort key.
 * @param {"asc" | "desc"} [props.dir] The current direction, `asc` or `desc`.
 * @param {(key: string, dir: "asc" | "desc") => void} props.onChange Receives the chosen key and its direction.
 * @param {{ value: string, label: import("react").ReactNode, defaultDir?: "asc" | "desc" }[]} props.options The sort keys, each `{ value, label, defaultDir }`; `defaultDir` applies when switching to that key.
 * @param {string} [props.label] The control's words and accessible name.
 */
function ToolbarSort({ value, dir = "desc", onChange, options, label = "Sort" }) {
  const [open, setOpen] = React.useState(false);
  const opts = options || [];
  const current = opts.find(o => o.value === value) || opts[0];
  const arrow = dir === "asc" ? "arrow-up" : "arrow-down";
  const pick = (o) => {
    if (o.value === value) onChange(o.value, dir === "asc" ? "desc" : "asc");
    else onChange(o.value, o.defaultDir || "desc");
  };
  const setDir = (d) => { if (d !== dir) onChange(value, d); };

  return (
    <div className="k-toolbar-filter k-toolbar-sort">
      <Menu open={open} onOpenChange={setOpen} label={label} matchWidth
        trigger={(
          <button type="button"
            className={"k-toolbar-btn k-toolbar-filter__trigger" + (open ? " k-toolbar-btn--on" : "")}
            title="Sort order">
            <Icon name="arrow-up-down" size={14} />
            <span>{label}{current ? ": " + current.label : ""}</span>
            <Icon name={arrow} size={13} strokeWidth={2.3} className="k-toolbar-sort__dir-ico" />
          </button>
        )}>
        <MenuRadioGroup label={label + " by"} value={value}>
          {opts.map(o => (
            <MenuRadioItem key={o.value} value={o.value} onSelect={() => pick(o)}
              aside={o.value === value ? <Icon name={arrow} size={13} strokeWidth={2.4} /> : undefined}>
              {o.label}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
        <MenuSeparator />
        <MenuRadioGroup label="Direction" value={dir}>
          <MenuRadioItem value="asc" closeOnSelect={false} onSelect={() => setDir("asc")}
            aside={<Icon name="arrow-up" size={13} strokeWidth={2.4} />}>Ascending</MenuRadioItem>
          <MenuRadioItem value="desc" closeOnSelect={false} onSelect={() => setDir("desc")}
            aside={<Icon name="arrow-down" size={13} strokeWidth={2.4} />}>Descending</MenuRadioItem>
        </MenuRadioGroup>
      </Menu>
    </div>
  );
}

/**
 * @param {object} props
 * @param {number} [props.shown] How many rows are shown.
 * @param {number} [props.total] How many exist across the whole list.
 * @param {string} [props.unit] The plural noun counted ("rows").
 * @param {import("react").ReactNode} [props.children] Replaces the "shown of total unit" text.
 */
function ToolbarCount({ shown, total, unit, children }) {
  if (children) return <span className="k-toolbar__count">{children}</span>;
  return <span className="k-toolbar__count"><b>{shown}</b> of {total} {unit}</span>;
}

/**
 * @param {object} props
 * @param {string} [props.icon] A Lucide name.
 * @param {import("react").ReactNode} [props.children] The button's label.
 * @param {import("react").MouseEventHandler<HTMLButtonElement>} [props.onClick] Called when the button is pressed.
 * @param {boolean} [props.disabled] Makes the button inert.
 * @param {string} [props.title] A hover hint.
 * @param {boolean} [props.spinning] Spins the icon while work runs.
 * @param {boolean} [props.active] Marks a setting that is on, in the accent.
 * @param {string} [props.ariaLabel] The accessible name, for an icon-only button.
 */
function ToolbarButton({ icon, children, onClick, disabled, title, spinning, active, ariaLabel }) {
  return (
    <button
      className={"k-toolbar-btn" + (active ? " k-toolbar-btn--on" : "") + (children ? "" : " k-toolbar-btn--icon")}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel || (typeof children === "string" ? children : title)}>
      {icon && <Icon name={icon} size={children ? 13 : 15} className={spinning ? "k-is-spinning" : ""} />}
      {children && <span>{children}</span>}
    </button>
  );
}

// Resolve a field's currently-selected option (for chip labels).
/** @param {ToolbarFilterField} field */
function optionFor(field) {
  return (field.options || []).find(o => o.value === field.value) || null;
}
/** @param {ToolbarFilterField} field */
function fieldActive(field) {
  return field.value !== (field.default != null ? field.default : (field.options && field.options[0] && field.options[0].value));
}

// ToolbarFilters — single Filters popover + inline active-filter chips.
/**
 * @typedef {object} ToolbarFilterField
 * @property {string} id The field's key.
 * @property {string} label The field's heading in the popover and on its chip.
 * @property {any} value The chosen option's value.
 * @property {(value: any) => void} onChange Receives the next value.
 * @property {any} [default] The value that counts as unfiltered; the first option's by default.
 * @property {{ value: any, label: import("react").ReactNode, count?: number }[]} options The choices, each `{ value, label, count }`; `count` is how many rows it matches.
 * @property {boolean} [hidden] Leaves the field out.
 */
/**
 * @param {object} props
 * @param {ToolbarFilterField[]} props.fields The filters, one radio group each.
 * @param {() => void} [props.onReset] Draws a reset action that clears every filter.
 * @param {string} [props.label] The Filters button's words.
 */
function ToolbarFilters({ fields, onReset, label = "Filters" }) {
  const [open, setOpen] = React.useState(false);
  const name = React.useId();

  const visible = (fields || []).filter(f => !f.hidden);
  const active = visible.filter(fieldActive);
  const reset = () => {
    visible.forEach(f => f.onChange(f.default != null ? f.default : (f.options[0] && f.options[0].value)));
    if (onReset) onReset();
  };

  return (
    <div className="k-toolbar-filter">
      <Popover open={open} onOpenChange={setOpen} label={label} className="k-toolbar-filter__menu"
        trigger={(
          <button type="button"
            className={"k-toolbar-btn k-toolbar-filter__trigger" + (open ? " k-toolbar-btn--on" : "")}
            title="Filters">
            <Icon name="sliders-horizontal" size={14} />
            <span>{label}</span>
            {active.length > 0 && <span className="k-toolbar-filter__badge">{active.length}</span>}
          </button>
        )}>
        <div className="k-toolbar-filter__head">
          <span className="k-toolbar-filter__head-label">{label}</span>
          {active.length > 0 && (
            <button type="button" className="k-toolbar-filter__reset" onClick={reset}>
              <Icon name="rotate-ccw" size={12} /> Reset
            </button>
          )}
        </div>
        <div className="k-toolbar-filter__body">
          {visible.map(f => (
            <div className="k-toolbar-filter__group" key={f.id} role="radiogroup" aria-label={f.label}>
              <div className="k-toolbar-filter__group-label" aria-hidden="true">{f.label}</div>
              <div className="k-toolbar-filter__opts">
                {(f.options || []).map(o => {
                  const on = o.value === f.value;
                  return (
                    <label key={o.value}
                      className={"k-toolbar-filter__opt" + (on ? " k-toolbar-filter__opt--on" : "")}>
                      <input type="radio" className="k-toolbar-filter__input" name={name + f.id}
                        checked={on} onChange={() => f.onChange(o.value)} />
                      <span className="k-toolbar-filter__radio" aria-hidden="true" />
                      <span className="k-toolbar-filter__opt-label">{o.label}</span>
                      {o.count != null && <span className="k-toolbar-filter__opt-count">{o.count}</span>}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Popover>

      {/* inline active-filter chips — clearing the field, not just the chip */}
      {active.map(f => {
        const opt = optionFor(f);
        return (
          <button
            key={f.id}
            className="k-toolbar-chip"
            title={"Clear " + f.label.toLowerCase() + " filter"}
            onClick={() => f.onChange(f.default != null ? f.default : (f.options[0] && f.options[0].value))}>
            <span className="k-toolbar-chip__key">{f.label}</span>
            <span className="k-toolbar-chip__val">{opt ? opt.label : f.value}</span>
            <Icon name="x" size={12} strokeWidth={2.4} />
          </button>
        );
      })}
    </div>
  );
}

// useFilters — optional state helper so a page declares its filter schema once
// instead of wiring N useState calls. Pages with bespoke filtering logic can
// keep their own state and just feed the Toolbar; this is the convenience path.
//
//   const f = useFilters({ search:"", status:"all", game:"all" });
//   f.query, f.setQuery, f.debouncedQuery, f.searchPending
//   f.values.status, f.set("status", v), f.reset(), f.activeCount
/**
 * @template {Record<string, any>} T
 * @param {{ search?: string } & T} [defaults]
 * @param {{ debounce?: number }} [options]
 */
function useFilters(defaults = /** @type {any} */ ({}), { debounce = 250 } = {}) {
  const { search = "", ...rest } = defaults;
  const [query, setQuery] = React.useState(search);
  const [values, setValues] = React.useState(rest);
  const debouncedQuery = useDebouncedValue(query, debounce);
  const searchPending = query.trim() !== debouncedQuery.trim();
  const set = React.useCallback((key, val) => setValues(v => ({ ...v, [key]: val })), []);
  const reset = React.useCallback(() => { setQuery(search); setValues(rest); }, []); // eslint-disable-line
  const activeCount =
    (query.trim() ? 1 : 0) +
    Object.keys(rest).filter(k => values[k] !== rest[k]).length;
  return { query, setQuery, debouncedQuery, searchPending, values, set, reset, activeCount };
}

export { Toolbar, ToolbarButton, ToolbarCount, ToolbarFilters, ToolbarSearch, ToolbarSort, ToolbarSpacer, useFilters };
