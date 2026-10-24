import React from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button.jsx";
import { Icon } from "./Icon.jsx";
import { Input } from "./fields.jsx";
import { Slider } from "./Slider.jsx";
import { Toggle } from "./Toggle.jsx";
import { usePhone } from "../hooks/usePhone.js";
import { onTelevision } from "../lib/television.js";

// FilterDrawer — the filters of whatever a page shows, behind a button at the start of the page's
// SearchField (its `filters` slot). The button is an icon that counts the picks; pressing it drops a
// drawer from the field across the field's full width, over the page, which dims behind it. The drawer
// stays open while somebody picks, and closes on a press outside it, on the field's search, on Escape,
// and on a television's Back through `back()`.
//
//   <SearchField size="xl" value={q} onChange={setQ} onSubmit={run} placeholder="Any movie or show"
//     filters={<FilterDrawer sections={sections} values={values} onChange={setValues} />} />
//
// It knows nothing about what is filtered. The page hands it sections, built from what the page can
// show, and the values; every change comes back as the next whole `values`, and the page keeps them
// (in its address, so a filtered page can be linked). A section is one of six kinds:
//
//   one       exactly one option, starting on `base`        { value: "movies" }
//   optional  none or one option                            { value: "8" } or null
//   many      any number of options                         ["comedy", "horror"]
//   toggle    its one `option`, on or off                   true
//   range     a number from `min` to `max`; `any` is the value that filters nothing
//   tokens    words the person types                        ["tomatoes"]
//
// A picked option is shown by colour alone. The drawer is drawn three ways:
// - on a desktop, in columns: each section a heading over its options, a list longer than eight
//   wrapping into balanced sub-columns, a short section joining the first earlier column with room
//   under it, the columns sharing the width and wrapping onto another line when they do not fit; a
//   footer of one removable chip per pick and Clear all;
// - on a phone, a `one` section of up to four options as a segmented row, a toggle as a switch row at
//   the end, and every other section as a row that opens to its options as tags, one at a time; a
//   footer of Clear all and Done;
// - on a television (lib/television.js), a rail of the sections beside the controls of the one the
//   rail is on. It moves no focus between controls, which is the site's navigator's; it places focus
//   when it opens and when Back steps out of a section, as a dialog does.
//
// `back()` on the ref is for the television's Back: from a section's controls it returns to the rail,
// from the rail it closes the drawer, and it answers whether it used the key.

/**
 * @typedef {object} FilterOption
 * @property {string} value The option's value.
 * @property {string} label Its words, on the option and on its chip.
 */
/**
 * @typedef {object} FilterSection
 * @property {string} id The section's key in `values`.
 * @property {string} label Its heading.
 * @property {"one" | "optional" | "many" | "toggle" | "range" | "tokens"} kind What it holds.
 * @property {FilterOption[]} [options] A list section's options, in the page's order.
 * @property {string} [base] A `one` section's starting option, which counts as no filter.
 * @property {string} [option] A toggle's one option, the words of its switch and its chip.
 * @property {string} [note] A line under a toggle's option.
 * @property {number} [min] A range's lowest value.
 * @property {number} [max] A range's highest value.
 * @property {number} [step] A range's step; 1 by default.
 * @property {number} [any] The range value that filters nothing; `max` by default.
 * @property {(value: number) => string} [format] Words a range value, beside the slider and in the section's summary.
 * @property {(value: number) => string} [chip] Words a range value on its chip; `format` by default.
 * @property {string} [placeholder] A tokens section's field hint.
 */
/**
 * @typedef {object} FilterDrawerHandle
 * @property {() => void} open Opens the drawer.
 * @property {() => void} close Closes it.
 * @property {() => boolean} back A television's Back: leaves a section, then closes; whether it did anything.
 */
/**
 * @typedef {object} FilterDrawerProps
 * @property {FilterSection[]} sections The sections, in order; a page leaves out one with fewer than two options.
 * @property {Record<string, any>} values Each section's value by id: a string for `one` and `optional` (null for none), an array for `many` and `tokens`, a boolean for `toggle`, a number for `range`.
 * @property {(next: Record<string, any>) => void} onChange Receives the next whole `values`.
 * @property {string} [label] The button's accessible name and the drawer's; "Filters" by default.
 * @property {string} [clearLabel] Clear all's words.
 * @property {string} [doneLabel] The phone's Done.
 * @property {string} [anyLabel] A section's summary with nothing picked; "Any" by default.
 * @property {(n: number) => string} [countLabel] A section's summary with more than two picked.
 * @property {(label: string) => string} [removeLabel] A chip's accessible name.
 * @property {string} [className] Extra class names on the root element.
 */

const MaxRows = 8;
const ColumnRows = MaxRows + 2;
const ShortSection = 5.5;

const isList = (/** @type {FilterSection} */ s) => s.kind === "one" || s.kind === "optional" || s.kind === "many";
const rangeAny = (/** @type {FilterSection} */ s) => (s.any != null ? s.any : s.max);

/** A section's value as the drawer reads it, whatever the page left out. */
function valueOf(/** @type {FilterSection} */ s, /** @type {Record<string, any>} */ values) {
  const v = values ? values[s.id] : undefined;
  if (s.kind === "one") return v != null ? v : s.base;
  if (s.kind === "optional") return v != null ? v : null;
  if (s.kind === "many" || s.kind === "tokens") return Array.isArray(v) ? v : [];
  if (s.kind === "toggle") return !!v;
  return typeof v === "number" ? v : rangeAny(s);
}

/** A section with nothing picked. */
function blankOf(/** @type {FilterSection} */ s) {
  if (s.kind === "one") return s.base;
  if (s.kind === "optional") return null;
  if (s.kind === "toggle") return false;
  if (s.kind === "range") return rangeAny(s);
  return [];
}

const labelOf = (/** @type {FilterSection} */ s, /** @type {string} */ value) => {
  const o = (s.options || []).find((x) => x.value === value);
  return o ? o.label : value;
};

/**
 * What a section has picked: each pick's words, and the section's value without it.
 * @param {FilterSection} s
 * @param {any} v
 * @returns {{ label: string, without: any }[]}
 */
function picksOf(s, v) {
  if (s.kind === "one") return v != null && v !== s.base ? [{ label: labelOf(s, v), without: s.base }] : [];
  if (s.kind === "optional") return v != null ? [{ label: labelOf(s, v), without: null }] : [];
  if (s.kind === "many") return v.map((x) => ({ label: labelOf(s, x), without: v.filter((y) => y !== x) }));
  if (s.kind === "toggle") return v ? [{ label: s.option || s.label, without: false }] : [];
  if (s.kind === "range") return v !== rangeAny(s) ? [{ label: (s.chip || s.format || String)(v), without: rangeAny(s) }] : [];
  return v.map((x) => ({ label: x, without: v.filter((y) => y !== x) }));
}

/** A list section's sub-columns: at most eight rows, balanced. */
function rowsOf(/** @type {FilterSection} */ s) {
  const n = (s.options || []).length;
  const cols = Math.max(1, Math.ceil(n / MaxRows));
  return Math.max(1, Math.ceil(n / cols));
}

/** A section's height on a desktop, in rows of options. */
function heightOf(/** @type {FilterSection} */ s) {
  if (isList(s)) return 1.5 + rowsOf(s);
  if (s.kind === "tokens") return 4;
  return s.note ? 3.5 : 2.5;
}

/**
 * The desktop's columns: sections in the page's order, a short one joining the first earlier column of
 * short ones it fits under.
 * @param {FilterSection[]} sections
 * @returns {FilterSection[][]}
 */
function packColumns(sections) {
  /** @type {{ items: FilterSection[], h: number, short: boolean }[]} */
  const cols = [];
  for (const s of sections) {
    const h = heightOf(s);
    const short = h <= ShortSection;
    const room = short && cols.find((c) => c.short && c.h + 0.8 + h <= ColumnRows);
    if (room) { room.items.push(s); room.h += 0.8 + h; } else cols.push({ items: [s], h, short });
  }
  return cols.map((c) => c.items);
}

/** @type {import("react").ForwardRefExoticComponent<FilterDrawerProps & import("react").RefAttributes<FilterDrawerHandle>>} */
const FilterDrawer = React.forwardRef(function FilterDrawer({
  sections, values, onChange, label = "Filters", clearLabel = "Clear all", doneLabel = "Done", anyLabel = "Any",
  countLabel = (n) => n + " selected", removeLabel = (l) => "Remove " + l, className,
}, ref) {
  const phone = usePhone();
  const tv = onTelevision();
  const surface = tv ? "tv" : phone ? "phone" : "desk";
  const [open, setOpen] = React.useState(false);
  const [folded, setFolded] = React.useState(/** @type {string | null | undefined} */ (undefined));
  const [railOn, setRailOn] = React.useState(/** @type {string | null} */ (null));
  const [drafts, setDrafts] = React.useState(/** @type {Record<string, number>} */ ({}));
  const [room, setRoom] = React.useState(/** @type {number | null} */ (null));
  const rootRef = React.useRef(/** @type {HTMLDivElement | null} */ (null));
  const triggerRef = React.useRef(/** @type {HTMLButtonElement | null} */ (null));
  const panelRef = React.useRef(/** @type {HTMLDivElement | null} */ (null));
  const panelId = React.useId();

  const shown = sections || [];
  const read = (/** @type {FilterSection} */ s) => (s.kind === "range" && drafts[s.id] != null ? drafts[s.id] : valueOf(s, values));
  const set = (/** @type {string} */ id, /** @type {any} */ v) => onChange({ ...values, [id]: v });
  const picks = shown.flatMap((s) => picksOf(s, valueOf(s, values)).map((p) => ({ ...p, id: s.id })));
  const clear = () => onChange({ ...values, ...Object.fromEntries(shown.map((s) => [s.id, blankOf(s)])) });

  const choose = (/** @type {FilterSection} */ s, /** @type {string} */ option) => {
    const v = valueOf(s, values);
    if (s.kind === "one") set(s.id, option);
    else if (s.kind === "optional") set(s.id, v === option ? null : option);
    else set(s.id, v.includes(option) ? v.filter((/** @type {string} */ x) => x !== option) : [...v, option]);
  };
  const isOn = (/** @type {FilterSection} */ s, /** @type {string} */ option) => {
    const v = valueOf(s, values);
    return s.kind === "many" ? v.includes(option) : v === option;
  };
  const summary = (/** @type {FilterSection} */ s) => {
    const v = read(s);
    if (s.kind === "range") return (s.format || String)(v);
    if (s.kind === "one") return labelOf(s, v);
    const p = picksOf(s, v);
    return !p.length ? anyLabel : p.length <= 2 ? p.map((x) => x.label).join(", ") : countLabel(p.length);
  };

  const close = React.useCallback((/** @type {boolean} */ refocus) => {
    setOpen(false);
    if (refocus && triggerRef.current) triggerRef.current.focus();
  }, []);

  // The phone's first section that folds starts open; the television's rail starts on its first.
  const firstFold = shown.find((s) => s.kind !== "toggle" && !(s.kind === "one" && (s.options || []).length <= 4));
  const openFold = folded === undefined ? (firstFold ? firstFold.id : null) : folded;
  const railSection = shown.find((s) => s.id === railOn) || shown[0];

  React.useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
    close: () => close(false),
    back: () => {
      if (!open) return false;
      const active = document.activeElement;
      const pane = panelRef.current && panelRef.current.querySelector(".k-filters__pane");
      if (pane && active && pane.contains(active) && railSection) {
        const item = panelRef.current.querySelector(`[data-filter-rail="${CSS.escape(railSection.id)}"]`);
        if (item instanceof HTMLElement) { item.focus(); return true; }
      }
      close(true);
      return true;
    },
  }), [open, close, railSection]);

  // The drawer ends above the bottom of the screen and a phone's tab bar, and scrolls inside itself.
  React.useLayoutEffect(() => {
    if (!open || !rootRef.current) return;
    const field = rootRef.current.closest("form") || rootRef.current;
    const measure = () => {
      const tabbar = document.querySelector(".k-tabbar");
      const below = tabbar ? tabbar.getBoundingClientRect().height : 0;
      setRoom(Math.max(200, window.innerHeight - field.getBoundingClientRect().bottom - below - 12));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open]);

  // On a television focus goes into the rail when the drawer opens.
  React.useEffect(() => {
    if (!open || surface !== "tv" || !panelRef.current) return;
    const first = panelRef.current.querySelector("[data-filter-rail]");
    if (first instanceof HTMLElement) first.focus();
  }, [open, surface]);

  // It closes on a press outside it, on the field's search and, off a television, on Escape.
  React.useEffect(() => {
    if (!open) return undefined;
    const outside = (/** @type {PointerEvent} */ e) => {
      const t = /** @type {Node} */ (e.target);
      if (panelRef.current && panelRef.current.contains(t)) return;
      if (triggerRef.current && triggerRef.current.contains(t)) return;
      close(false);
    };
    const key = (/** @type {KeyboardEvent} */ e) => { if (e.key === "Escape" && !onTelevision()) close(true); };
    const form = rootRef.current && rootRef.current.closest("form");
    const submitted = () => close(false);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", key);
    if (form) form.addEventListener("submit", submitted);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", key);
      if (form) form.removeEventListener("submit", submitted);
    };
  }, [open, close]);

  const optionButton = (/** @type {FilterSection} */ s, /** @type {FilterOption} */ o, /** @type {string} */ cls) => (
    <button key={o.value} type="button" className={cls + (isOn(s, o.value) ? " k-is-on" : "")} aria-pressed={isOn(s, o.value)}
      onClick={() => choose(s, o.value)}>{o.label}</button>
  );

  const rangeControl = (/** @type {FilterSection} */ s) => (
    <Slider className="k-filters__range" value={read(s)} min={s.min} max={s.max} step={s.step || 1} label={s.label}
      format={s.format} showValue
      onChange={(v) => setDrafts((d) => ({ ...d, [s.id]: v }))}
      onChangeEnd={(v) => { setDrafts((d) => { const n = { ...d }; delete n[s.id]; return n; }); set(s.id, v); }} />
  );

  const tokensControl = (/** @type {FilterSection} */ s, /** @type {string} */ tagClass) => {
    const v = valueOf(s, values);
    return (
      <div className="k-filters__tokens">
        <Input wide placeholder={s.placeholder} aria-label={s.label} enterKeyHint="done"
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            e.stopPropagation();
            const input = /** @type {HTMLInputElement} */ (e.currentTarget);
            const word = input.value.trim();
            if (word && !v.includes(word)) set(s.id, [...v, word]);
            input.value = "";
          }} />
        {v.length > 0 && (
          <div className="k-filters__token-list">
            {v.map((/** @type {string} */ w) => (
              <button key={w} type="button" className={tagClass + " k-is-on"} aria-label={removeLabel(w)}
                onClick={() => set(s.id, v.filter((/** @type {string} */ x) => x !== w))}>
                {w}<Icon name="x" size={12} />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const note = (/** @type {FilterSection} */ s) => s.note && <span className="k-filters__note">{s.note}</span>;

  const desk = () => (
    <>
      <div className="k-filters__columns">
        <div className="k-filters__lines">
          {packColumns(shown).map((col) => (
            <div key={col[0].id} className="k-filters__column">
              {col.map((s) => (
                <div key={s.id} className="k-filters__section" role="group" aria-label={s.label}>
                  <span className="k-filters__heading">{s.label}</span>
                  {isList(s) && (
                    <div className="k-filters__grid" style={{ gridTemplateRows: `repeat(${rowsOf(s)}, auto)` }}>
                      {(s.options || []).map((o) => optionButton(s, o, "k-filters__option"))}
                    </div>
                  )}
                  {s.kind === "toggle" && (
                    <>
                      <button type="button" className={"k-filters__option" + (valueOf(s, values) ? " k-is-on" : "")}
                        aria-pressed={valueOf(s, values)} onClick={() => set(s.id, !valueOf(s, values))}>{s.option || s.label}</button>
                      {note(s)}
                    </>
                  )}
                  {s.kind === "range" && rangeControl(s)}
                  {s.kind === "tokens" && tokensControl(s, "k-filters__chip")}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {picks.length > 0 && (
        <div className="k-filters__foot">
          {picks.map((p, i) => (
            <button key={p.id + ":" + i} type="button" className="k-filters__chip k-is-on" aria-label={removeLabel(p.label)}
              onClick={() => set(p.id, p.without)}>{p.label}<Icon name="x" size={12} /></button>
          ))}
          <span className="k-filters__spacer" />
          <button type="button" className="k-filters__clear" onClick={clear}>{clearLabel}</button>
        </div>
      )}
    </>
  );

  const phoneView = () => (
    <>
      <div className="k-filters__body">
        {shown.filter((s) => s.kind === "one" && (s.options || []).length <= 4).map((s) => (
          <div key={s.id} className="k-filters__segments" role="group" aria-label={s.label}
            style={{ gridTemplateColumns: `repeat(${(s.options || []).length}, 1fr)` }}>
            {(s.options || []).map((o) => optionButton(s, o, "k-filters__segment"))}
          </div>
        ))}
        {shown.filter((s) => s.kind !== "toggle" && !(s.kind === "one" && (s.options || []).length <= 4)).map((s) => {
          const unfolded = openFold === s.id;
          const marked = picksOf(s, read(s)).length > 0;
          return (
            <div key={s.id} className={"k-filters__fold" + (unfolded ? " k-is-open" : "")}>
              <button type="button" className="k-filters__fold-head" aria-expanded={unfolded}
                onClick={() => setFolded(unfolded ? null : s.id)}>
                <span className="k-filters__fold-label">{s.label}</span>
                <span className={"k-filters__summary" + (marked ? " k-is-on" : "")}>{summary(s)}</span>
                <Icon name="chevron-down" size={16} className="k-filters__chevron" />
              </button>
              {unfolded && (
                <div className="k-filters__fold-body" role="group" aria-label={s.label}>
                  {isList(s) && <div className="k-filters__tags">{(s.options || []).map((o) => optionButton(s, o, "k-filters__tag"))}</div>}
                  {s.kind === "range" && rangeControl(s)}
                  {s.kind === "tokens" && tokensControl(s, "k-filters__tag")}
                </div>
              )}
            </div>
          );
        })}
        {shown.filter((s) => s.kind === "toggle").map((s) => (
          <div key={s.id} className="k-filters__switch">
            <span className="k-filters__switch-text">
              <span>{s.option || s.label}</span>
              {note(s)}
            </span>
            <Toggle on={valueOf(s, values)} label={s.option || s.label} onChange={(on) => set(s.id, on)} />
          </div>
        ))}
      </div>
      <div className="k-filters__foot">
        {picks.length > 0 && <button type="button" className="k-filters__clear" onClick={clear}>{clearLabel}</button>}
        <span className="k-filters__spacer" />
        <Button variant="primary" className="k-filters__done" onClick={() => close(true)}>{doneLabel}</Button>
      </div>
    </>
  );

  const tvView = () => (
    <div className="k-filters__tv">
      <div className="k-filters__rail">
        {shown.map((s) => (
          <button key={s.id} type="button" data-filter-rail={s.id}
            className={"k-filters__rail-item" + (railSection && railSection.id === s.id ? " k-is-current" : "")}
            aria-pressed={s.kind === "toggle" ? valueOf(s, values) : undefined}
            onFocus={() => setRailOn(s.id)}
            onClick={() => {
              if (s.kind === "toggle") { set(s.id, !valueOf(s, values)); return; }
              setRailOn(s.id);
              const target = panelRef.current && (panelRef.current.querySelector(".k-filters__pane .k-is-on")
                || panelRef.current.querySelector(".k-filters__pane button, .k-filters__pane input, .k-filters__pane [role='slider']"));
              if (target instanceof HTMLElement) target.focus();
            }}>
            <span className="k-filters__rail-label">{s.kind === "toggle" ? (s.option || s.label) : s.label}</span>
            {s.kind === "toggle"
              ? <span className={"k-filters__rail-switch" + (valueOf(s, values) ? " k-is-on" : "")} aria-hidden="true" />
              : <span className={"k-filters__summary" + (picksOf(s, read(s)).length ? " k-is-on" : "")}>{summary(s)}</span>}
          </button>
        ))}
        {picks.length > 0 && <button type="button" className="k-filters__rail-item k-filters__rail-clear" onClick={clear}>{clearLabel}</button>}
      </div>
      <div className="k-filters__pane" role="group" aria-label={railSection ? railSection.label : undefined}>
        {railSection && railSection.kind !== "toggle" && (
          <>
            <span className="k-filters__heading">{railSection.label}</span>
            {isList(railSection) && <div className="k-filters__targets">{(railSection.options || []).map((o) => optionButton(railSection, o, "k-filters__target"))}</div>}
            {railSection.kind === "range" && rangeControl(railSection)}
            {railSection.kind === "tokens" && tokensControl(railSection, "k-filters__target")}
          </>
        )}
        {railSection && railSection.kind === "toggle" && note(railSection)}
      </div>
    </div>
  );

  return (
    <div ref={rootRef} className={"k-filters k-filters--" + surface + (open ? " k-is-open" : "") + (className ? " " + className : "")}>
      <button ref={triggerRef} type="button" className={"k-filters__trigger" + (picks.length ? " k-is-on" : "")}
        aria-label={picks.length ? label + " (" + picks.length + ")" : label} aria-expanded={open} aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}>
        <Icon name="sliders-horizontal" size={surface === "desk" ? 18 : 20} />
        {picks.length > 0 && <span className="k-filters__badge" aria-hidden="true">{picks.length}</span>}
      </button>
      {open && typeof document !== "undefined" && createPortal(<div className="k-filters__scrim" aria-hidden="true" />, document.body)}
      {open && (
        <div ref={panelRef} id={panelId} className="k-filters__panel" role="group" aria-label={label}
          style={room != null ? { maxHeight: room } : undefined}>
          {surface === "desk" ? desk() : surface === "phone" ? phoneView() : tvView()}
        </div>
      )}
    </div>
  );
});

export { FilterDrawer };
