import { Button } from "./Button.jsx";
import { EmptyState } from "./EmptyState.jsx";
import { Notice } from "./Notice.jsx";
import { Skeleton } from "./Skeleton.jsx";

// DataState — draws the state of a read the site made: loading, failed, empty or loaded. It fetches
// nothing and decides nothing; each state is exactly what the site says it is, so a placeholder is
// never a status the data did not earn.
//
// The first state that applies wins:
//   loading   draws `skeleton` (a node shaped like the real content, so the page settles in place),
//             or a few Skeleton lines when none is given
//   error     an Error or a string: a danger Notice with its message, and a Retry button when
//             `onRetry` is given
//   empty     `isEmpty`, or `data` an empty array: draws `empty`, or an EmptyState from
//             `emptyTitle`, `emptyBody`, `emptyIcon` and `emptyAction`
//   otherwise `children`: a node, or a function of `data`
// The loading state is announced politely as busy; the error is announced as an alert.
/**
 * @typedef {object} DataStateOwnProps
 * @property {boolean} [loading] Draws the skeleton in place of everything else.
 * @property {Error | string | null | false} [error] What failed.
 * @property {() => void} [onRetry] Draws a Retry button under the error.
 * @property {string} [retryLabel] The Retry button's label.
 * @property {unknown} [data] Handed to a function child; an empty array is empty.
 * @property {boolean} [isEmpty] Overrides the emptiness read from `data`.
 * @property {import("react").ReactNode} [skeleton] Drawn while loading.
 * @property {number} [skeletonLines] Lines of the default skeleton.
 * @property {import("react").ReactNode} [empty] Drawn when empty, in place of the EmptyState.
 * @property {import("react").ReactNode} [emptyTitle] The empty state's title.
 * @property {import("react").ReactNode} [emptyBody] The empty state's explanation.
 * @property {string} [emptyIcon] A Lucide name.
 * @property {import("react").ReactNode} [emptyAction] An action under the empty state's text.
 * @property {import("react").ReactNode | ((data: any) => import("react").ReactNode)} [children] The loaded content: a node, or a function of `data`.
 * @property {string} [className] Extra classes on the root.
 * @typedef {DataStateOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof DataStateOwnProps>} DataStateProps
 */
/** @param {DataStateProps} props */
function DataState({
  loading = false, error, onRetry, retryLabel = "Retry", data, isEmpty, skeleton, skeletonLines = 3,
  empty, emptyTitle = "Nothing to show", emptyBody, emptyIcon, emptyAction, children, className, ...rest
}) {
  const cls = "k-datastate" + (className ? " " + className : "");
  if (loading) {
    return (
      <div {...rest} className={cls + " k-datastate--loading"} aria-busy="true" aria-live="polite">
        {skeleton != null ? skeleton : (
          <div className="k-datastate__lines">
            {Array.from({ length: skeletonLines }, (_, i) => (
              <Skeleton key={i} h={14} w={i === skeletonLines - 1 ? "60%" : "100%"} />
            ))}
          </div>
        )}
      </div>
    );
  }
  if (error) {
    const message = typeof error === "string" ? error : error.message || String(error);
    return (
      <div {...rest} className={cls + " k-datastate--error"}>
        <Notice tone="danger">{message}</Notice>
        {onRetry && <div className="k-datastate__retry"><Button size="sm" icon="refresh-cw" onClick={onRetry}>{retryLabel}</Button></div>}
      </div>
    );
  }
  const none = isEmpty != null ? isEmpty : Array.isArray(data) && data.length === 0;
  if (none) {
    return (
      <div {...rest} className={cls + " k-datastate--empty"}>
        {empty != null ? empty : (
          <EmptyState icon={emptyIcon} title={emptyTitle} actions={emptyAction}>{emptyBody}</EmptyState>
        )}
      </div>
    );
  }
  return <>{typeof children === "function" ? children(data) : children}</>;
}

export { DataState };
