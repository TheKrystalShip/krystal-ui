import { DataState } from "./DataState.jsx";
import { Grid } from "./Layout.jsx";
import { List } from "./ListRow.jsx";
import { PageHeader } from "./PageHeader.jsx";
import { Pagination } from "./Pagination.jsx";
import { Table } from "./Table.jsx";

// ListPage — the page that lists records: a heading, an optional toolbar, the records as rows, a
// table or a grid of cards, a pager, and the loading, failed and empty states, laid out the same on
// every site and usable at phone width without any CSS of the site's own. It fetches nothing and
// owns no routing: the site hands it the records, the flags and the callbacks.
//
//   <ListPage title="Accounts" sub="Everyone who can sign in." actions={<Button>Add</Button>}
//     toolbar={<Toolbar>…</Toolbar>}
//     items={accounts} renderItem={(a) => <ListRow key={a.id} title={a.name} />}
//     loading={!data} error={error} onRetry={reload}
//     emptyTitle="No accounts" page={page} pageCount={pages} onPageChange={setPage} />
//
// From top to bottom: the heading (`title`, `sub`, `actions`, or a `header` node of the site's own),
// `toolbar`, `notice` (a line about the whole list), the body, and the pager.
//
// The body is chosen by `layout`:
//   list    `items` through `renderItem(item, index)`, inside a List, so `renderItem` returns a ListRow
//   grid    `items` through `renderItem`, in a Grid whose columns are `gridMin` wide at the least
//   table   `items` as the rows of a Table over `columns`; `table` carries the rest of Table's props
//           (`sort`, `onSortChange`, `onRowOpen`, `rowHref`, `rowActions`, `label`, …)
// A `children` node replaces the body for a list of the site's own shape (grouped sections, a
// timeline); `isEmpty` then says when it is empty.
//
// The body draws through DataState: `loading` shows `skeleton` (or lines), `error` a Notice with Retry
// when `onRetry` is given, and no items the empty state from `emptyTitle`, `emptyBody`, `emptyIcon` and
// `emptyAction`. The heading and toolbar stay drawn through all three, so a search box is still there
// when its results are not. The pager is drawn when `pageCount` is above one and `onPageChange` is
// given; pages are zero-based, and `total` with `pageSize` words its summary.
/**
 * @typedef {object} ListPageOwnProps
 * @property {import("react").ReactNode} [title] The page's heading.
 * @property {import("react").ReactNode} [sub] A line under the title.
 * @property {import("react").ReactNode} [actions] Page-level controls opposite the title.
 * @property {import("react").ReactNode} [header] Replaces the heading built from `title`, `sub` and `actions`.
 * @property {import("react").ReactNode} [toolbar] Drawn under the heading, usually a Toolbar.
 * @property {import("react").ReactNode} [notice] A line about the whole list, between the toolbar and the body.
 * @property {"list" | "grid" | "table"} [layout] How `items` are drawn; list by default.
 * @property {any[]} [items] The records to draw.
 * @property {(item: any, index: number) => import("react").ReactNode} [renderItem] Draws an item in the list and grid layouts.
 * @property {import("./Table.jsx").TableColumn[]} [columns] The table layout's columns.
 * @property {Record<string, any>} [table] More props for the Table.
 * @property {number | string} [gridMin] The grid layout's narrowest column.
 * @property {string} [label] The list's accessible name.
 * @property {boolean} [loading] Draws the skeleton in place of the body.
 * @property {Error | string | null | false} [error] What went wrong; draws the failure state in place of the body.
 * @property {() => void} [onRetry] Runs from the failure state's retry button.
 * @property {import("react").ReactNode} [skeleton] Drawn while loading, shaped like the body.
 * @property {boolean} [isEmpty] Says the body is empty when it is `children`, or overrides what `items` says.
 * @property {import("react").ReactNode} [emptyTitle] The empty state's heading.
 * @property {import("react").ReactNode} [emptyBody] The empty state's copy.
 * @property {string} [emptyIcon] A Lucide name.
 * @property {import("react").ReactNode} [emptyAction] The empty state's control.
 * @property {number} [page] The current page, zero-based.
 * @property {number} [pageCount] How many pages there are.
 * @property {(page: number) => void} [onPageChange] Receives the zero-based page chosen.
 * @property {number} [total] Records across every page.
 * @property {number} [pageSize] Records on a page.
 * @property {string} [unit] What the pager counts.
 * @property {import("react").ReactNode} [foot] Under the pager.
 * @property {string} [className] Class name added to the root element.
 * @property {import("react").ReactNode} [children] The body, in place of `items`.
 * @typedef {ListPageOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof ListPageOwnProps | "title">} ListPageProps
 */
/** @param {ListPageProps} props */
function ListPage({
  title, sub, actions, header, toolbar, notice, layout = "list", items, renderItem, columns, table, gridMin = 280,
  label, loading = false, error, onRetry, skeleton, isEmpty, emptyTitle, emptyBody, emptyIcon, emptyAction,
  page = 0, pageCount, onPageChange, total, pageSize, unit, foot, className, children, ...rest
}) {
  const none = isEmpty != null ? isEmpty : children == null && (!items || items.length === 0);
  const drawn = (items || []).map((item, i) => renderItem && renderItem(item, i));
  const body = children != null ? children
    : layout === "table" ? <Table label={label} {...table} columns={columns || []} rows={items || []} />
      : layout === "grid" ? <Grid min={gridMin} aria-label={label}>{drawn}</Grid>
        : <List label={label}>{drawn}</List>;
  const head = header != null ? header : (title != null || actions != null) && (
    <PageHeader title={title} sub={sub} actions={actions} />
  );
  const paged = onPageChange && pageCount > 1;
  return (
    <div {...rest} className={"k-listpage" + (className ? " " + className : "")}>
      {head}
      {toolbar}
      {notice}
      <DataState loading={loading} error={error} onRetry={onRetry} skeleton={skeleton} isEmpty={none}
        emptyTitle={emptyTitle} emptyBody={emptyBody} emptyIcon={emptyIcon} emptyAction={emptyAction}>
        <div className={"k-listpage__body k-listpage__body--" + (children != null ? "custom" : layout)}>{body}</div>
        {paged && (
          <div className="k-listpage__pager">
            <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} unit={unit} onPage={onPageChange} />
          </div>
        )}
      </DataState>
      {foot}
    </div>
  );
}

export { ListPage };
