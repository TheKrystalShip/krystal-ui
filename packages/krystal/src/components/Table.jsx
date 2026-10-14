import { forwardRef } from "react";
import { DataState } from "./DataState.jsx";
import { Icon } from "./Icon.jsx";

// Table — rows of records under column headers, in a framed surface. A real `<table>`: each
// sortable header holds a button and carries `aria-sort`, the row's cells are `td`s, and the roles
// are stated outright so the semantics hold when the phone layout lays the rows out as blocks.
//
// A column is `{ key, header, render?, width?, align?, sortable?, sortValue?, mono?, hideBelow?, interactive? }`:
//   render       the cell node from the row; without it the cell shows `row[key]`. A null or undefined
//                value is drawn as an explicit "—" (read aloud as "unknown"), never a 0 or an empty cell
//   width        any CSS length, on the header cell
//   align        left (default) | right | center; right and center use tabular numerals
//   sortable     the header becomes a button. `sortValue(row)` is what the column orders by (default
//                `row[key]`); a null value sinks to the bottom in both directions
//   mono         monospace text
//   hideBelow    "phone" or "tablet": the column is left out at that width and narrower
//   interactive  the cell holds its own controls; they sit above the row's open target
//
// Sorting is controlled: `sort` is `{ key, dir }` ("asc" | "desc") and `onSortChange` receives the
// next one. The site sorts `rows`, or passes them through `sortRows(rows, columns, sort)` for data
// it holds whole.
//
// A row opens as a whole through the first column's content: `onRowOpen(row)` makes it a button,
// `rowHref(row)` a link, and a press anywhere on the row but a control in an `interactive` cell or
// in `rowActions(row)` opens it. `rowActions` draws the row's own buttons in a trailing cell.
// `selected` is a row key or an array of them. `loading`, `error` and the empty state draw through
// DataState in the frame's place. At phone width a row becomes a card: its first column is the
// title, the other cells follow with their header as an inline label, and the headers that sort
// stay as a strip of buttons above the cards.
const PHONE_HIDDEN = { phone: " k-table__col--hide-phone", tablet: " k-table__col--hide-tablet" };

/**
 * @typedef {object} TableColumn
 * @property {string} key
 * @property {import("react").ReactNode} header
 * @property {(row: any) => import("react").ReactNode} [render]
 * @property {string | number} [width]
 * @property {"left" | "right" | "center"} [align]
 * @property {boolean} [sortable]
 * @property {(row: any) => unknown} [sortValue]
 * @property {boolean} [mono]
 * @property {"phone" | "tablet"} [hideBelow]
 * @property {boolean} [interactive]
 */
/** @typedef {{ key: string, dir: "asc" | "desc" }} TableSort */

/**
 * Orders rows by a sort over `columns`. A null, undefined or NaN value sorts last in both directions.
 * @param {any[]} rows
 * @param {TableColumn[]} columns
 * @param {TableSort | null | undefined} sort
 * @returns {any[]}
 */
function sortRows(rows, columns, sort) {
  const col = sort && columns.find((c) => c.key === sort.key);
  if (!col) return rows;
  const read = col.sortValue || ((row) => row[col.key]);
  const known = (v) => v != null && !(typeof v === "number" && Number.isNaN(v));
  const sign = sort.dir === "desc" ? -1 : 1;
  return rows.map((row, i) => ({ row, i, v: read(row) })).sort((a, b) => {
    const ka = known(a.v), kb = known(b.v);
    if (!ka || !kb) return ka === kb ? a.i - b.i : ka ? -1 : 1;
    const x = a.v instanceof Date ? a.v.getTime() : a.v;
    const y = b.v instanceof Date ? b.v.getTime() : b.v;
    const c = typeof x === "string" && typeof y === "string"
      ? x.localeCompare(y, undefined, { numeric: true, sensitivity: "base" })
      : x < y ? -1 : x > y ? 1 : 0;
    return c === 0 ? a.i - b.i : c * sign;
  }).map((e) => e.row);
}

/**
 * @typedef {object} TableOwnProps
 * @property {TableColumn[]} columns
 * @property {any[]} [rows]
 * @property {(row: any, index: number) => string | number} [rowKey] Defaults to `row.id`, then the index.
 * @property {TableSort | null} [sort]
 * @property {(sort: TableSort) => void} [onSortChange]
 * @property {(row: any) => void} [onRowOpen] Makes the first column's content a button.
 * @property {(row: any) => string | undefined} [rowHref] Makes it a link.
 * @property {string | number | Array<string | number>} [selected] The key, or keys, of the selected rows.
 * @property {(row: any) => import("react").ReactNode} [rowActions] The row's own buttons, in a trailing cell.
 * @property {string} [actionsLabel] The trailing column's accessible header.
 * @property {(row: any) => "ok" | "info" | "warn" | "danger" | "accent" | undefined} [rowTone] A thin edge on the row's leading side.
 * @property {boolean} [dense]
 * @property {string} [label] The table's accessible name.
 * @property {boolean} [loading]
 * @property {Error | string | null | false} [error]
 * @property {() => void} [onRetry]
 * @property {import("react").ReactNode} [skeleton]
 * @property {import("react").ReactNode} [empty]
 * @property {import("react").ReactNode} [emptyTitle]
 * @property {import("react").ReactNode} [emptyBody]
 * @property {import("react").ReactNode} [emptyAction]
 * @property {string} [className]
 * @typedef {TableOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof TableOwnProps>} TableProps
 */
/** @type {import("react").ForwardRefExoticComponent<TableProps & import("react").RefAttributes<HTMLDivElement>>} */
const Table = forwardRef(function Table({
  columns, rows = [], rowKey, sort, onSortChange, onRowOpen, rowHref, selected, rowActions, actionsLabel = "Actions",
  rowTone, dense = false, label, loading, error, onRetry, skeleton, empty, emptyTitle, emptyBody, emptyAction, className, ...rest
}, ref) {
  const cls = "k-table" + (dense ? " k-table--dense" : "") + (className ? " " + className : "");
  const keyOf = (row, i) => (rowKey ? rowKey(row, i) : row.id != null ? row.id : i);
  const chosen = selected == null ? [] : Array.isArray(selected) ? selected : [selected];
  const openable = onRowOpen != null || rowHref != null;
  const anySort = columns.some((c) => c.sortable);

  if (loading || error || rows.length === 0) {
    return (
      <div {...rest} ref={ref} className={cls + " k-table--state"}>
        <DataState loading={loading} error={error} onRetry={onRetry} skeleton={skeleton} isEmpty empty={empty}
          emptyTitle={emptyTitle} emptyBody={emptyBody} emptyAction={emptyAction} />
      </div>
    );
  }

  const toggle = (c) => {
    if (!onSortChange) return;
    onSortChange(sort && sort.key === c.key ? { key: c.key, dir: sort.dir === "asc" ? "desc" : "asc" } : { key: c.key, dir: "asc" });
  };
  const colCls = (c) => "k-table__cell" + (c.align && c.align !== "left" ? " k-table__cell--" + c.align : "")
    + (c.mono ? " k-table__cell--mono" : "") + (c.hideBelow ? PHONE_HIDDEN[c.hideBelow] : "");

  return (
    <div {...rest} ref={ref} className={cls}>
      <table className={"k-table__grid" + (anySort ? " k-table__grid--sortable" : "")} role="table" aria-label={label}>
        <thead role="rowgroup">
          <tr role="row">
            {columns.map((c) => {
              const active = sort && sort.key === c.key;
              const dir = active ? sort.dir : null;
              return (
                <th key={c.key} role="columnheader" scope="col" style={c.width != null ? { width: c.width } : undefined}
                  className={colCls(c).replace("k-table__cell", "k-table__th") + (c.sortable ? "" : " k-table__th--static")}
                  aria-sort={c.sortable ? (dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none") : undefined}>
                  {c.sortable ? (
                    <button type="button" className={"k-table__sort" + (active ? " k-is-active" : "")} onClick={() => toggle(c)}>
                      <span className="k-table__sort-label">{c.header}</span>
                      <Icon name={!active ? "chevrons-up-down" : dir === "asc" ? "chevron-up" : "chevron-down"} size={12} strokeWidth={2.4}
                        className="k-table__sort-icon" />
                    </button>
                  ) : c.header}
                </th>
              );
            })}
            {rowActions && <th role="columnheader" scope="col" className="k-table__th k-table__th--static k-table__th--actions"><span className="k-table__sr">{actionsLabel}</span></th>}
          </tr>
        </thead>
        <tbody role="rowgroup">
          {rows.map((row, i) => {
            const key = keyOf(row, i);
            const isSel = chosen.includes(key);
            const tone = rowTone ? rowTone(row) : undefined;
            const href = rowHref ? rowHref(row) : undefined;
            return (
              <tr key={key} role="row"
                className={"k-table__row" + (openable ? " k-table__row--open" : "") + (isSel ? " k-is-selected" : "") + (tone ? " k-table__row--" + tone : "")}>
                {columns.map((c, ci) => {
                  const raw = c.render ? c.render(row) : row[c.key];
                  const unknown = raw == null;
                  const content = unknown ? <><span aria-hidden="true">—</span><span className="k-table__sr">unknown</span></> : raw;
                  let inner = content;
                  if (ci === 0 && openable) {
                    const props = { className: "k-table__open", "aria-current": isSel || undefined };
                    inner = href != null
                      ? <a {...props} href={href} onClick={onRowOpen ? () => onRowOpen(row) : undefined}>{content}</a>
                      : <button type="button" {...props} onClick={() => onRowOpen(row)}>{content}</button>;
                  }
                  return (
                    <td key={c.key} role="cell" data-label={ci === 0 ? undefined : typeof c.header === "string" ? c.header : undefined}
                      className={colCls(c) + (c.interactive ? " k-table__cell--interactive" : "") + (unknown ? " k-table__cell--unknown" : "")}>
                      {inner}
                    </td>
                  );
                })}
                {rowActions && <td role="cell" className="k-table__cell k-table__cell--actions"><div className="k-table__actions">{rowActions(row)}</div></td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

export { Table, sortRows };
