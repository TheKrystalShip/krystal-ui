import React from "react";
import { Icon } from "./Icon.jsx";

// Pagination — presentational page navigator for unbounded, server-paginated
// lists. Pages are 0-indexed in props; the labels render 1-indexed.
//
// It does NOT own data — the parent decides the page size, computes pageCount
// from the server's total, and slices or re-requests on onPage. This keeps the
// component pure and the "which rows" decision next to the request that
// produced them. Without `total` and `pageSize` there is no summary, only the controls.

// Build a windowed list of page numbers with "…" gaps so the control stays a
// fixed width no matter how many pages exist: always first + last, plus a
// window around the current page.
/**
 * @param {number} page Zero-based current page.
 * @param {number} pageCount
 * @param {number} [span] Pages shown each side of the current one.
 * @returns {{ gap?: boolean, page?: number, key: string }[]}
 */
function paginationWindow(page, pageCount, span = 1) {
  const shown = new Set([0, pageCount - 1]);
  for (let p = page - span; p <= page + span; p++) {
    if (p >= 0 && p < pageCount) shown.add(p);
  }
  const sorted = Array.from(shown).sort((a, b) => a - b);
  const seq = [];
  let prev = -1;
  for (const p of sorted) {
    if (prev >= 0 && p - prev > 1) seq.push({ gap: true, key: "gap-" + prev });
    seq.push({ page: p, key: "p-" + p });
    prev = p;
  }
  return seq;
}

/**
 * @param {object} props
 * @param {number} props.page Zero-based.
 * @param {number} props.pageCount
 * @param {number} [props.total] The count across every page; with `pageSize`, it words the summary.
 * @param {number} [props.pageSize]
 * @param {(page: number) => void} props.onPage
 * @param {string} [props.unit]
 */
function Pagination({ page, pageCount, total, pageSize, onPage, unit = "results" }) {
  if (!pageCount || pageCount <= 1) return null;
  const clamp = (p) => Math.max(0, Math.min(pageCount - 1, p));
  const go = (p) => { const n = clamp(p); if (n !== page) onPage(n); };
  const summarised = total != null && pageSize != null;
  const from = summarised ? page * pageSize + 1 : 0;
  const to = summarised ? Math.min(total, (page + 1) * pageSize) : 0;
  const seq = paginationWindow(page, pageCount, 1);

  return (
    <nav className="k-pagination" aria-label="Pagination">
      {summarised && (
        <span className="k-pagination__summary">
          Showing <b>{from.toLocaleString()}–{to.toLocaleString()}</b> of {total.toLocaleString()} {unit}
        </span>
      )}
      <div className="k-pagination__controls">
        <button
          className="k-pagination__btn k-pagination__btn--nav"
          onClick={() => go(page - 1)}
          disabled={page === 0}
          aria-label="Previous page"
        >
          <Icon name="chevron-left" size={15} strokeWidth={2.2} />
        </button>
        {seq.map(item =>
          item.gap ? (
            <span key={item.key} className="k-pagination__gap" aria-hidden="true">…</span>
          ) : (
            <button
              key={item.key}
              className={"k-pagination__btn" + (item.page === page ? " k-is-current" : "")}
              onClick={() => go(item.page)}
              aria-current={item.page === page ? "page" : undefined}
            >
              {(item.page + 1).toLocaleString()}
            </button>
          )
        )}
        <button
          className="k-pagination__btn k-pagination__btn--nav"
          onClick={() => go(page + 1)}
          disabled={page === pageCount - 1}
          aria-label="Next page"
        >
          <Icon name="chevron-right" size={15} strokeWidth={2.2} />
        </button>
      </div>
    </nav>
  );
}

// Debounce any fast-changing value (a search box) so dependent work — filtering
// + re-paginating a list — only fires after a quiet window. Returns the settled
// value; callers compare it to the live value to know a query is still "pending"
// and show a spinner. Every searchable list shares it, so search behaves the
// same everywhere.
/**
 * @template T
 * @param {T} value
 * @param {number} [delay] Milliseconds of quiet before the value settles.
 * @returns {T}
 */
function useDebouncedValue(value, delay = 250) {
  const [settled, setSettled] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return settled;
}

export { Pagination, paginationWindow, useDebouncedValue };
