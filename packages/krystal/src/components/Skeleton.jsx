// Skeleton — one placeholder block, drawn where a piece of content will be while it is read.
//
// A page built from skeletons occupies the footprint the real content will, so it settles in place
// when the data arrives: a site lays these out in its own containers, at the sizes its real text
// and artwork take. `w` and `h` are any CSS length (a number is pixels), `r` the corner radius.
// The block shimmers, and holds still under prefers-reduced-motion (styles/skeleton.css).
/**
 * @param {object} props
 * @param {string | number} [props.w] Width: any CSS length, a number is pixels.
 * @param {string | number} [props.h] Height: any CSS length, a number is pixels.
 * @param {string | number} [props.r] Corner radius.
 * @param {import("react").CSSProperties} [props.style] Inline styles on the block, beside `w`, `h` and `r`.
 * @param {string} [props.className] Extra class names on the root element.
 */
export function Skeleton({ w = "100%", h = 12, r = 6, style, className }) {
  return (
    <span
      className={"k-skeleton" + (className ? " " + className : "")}
      aria-hidden="true"
      style={{ width: w, height: h, borderRadius: r, ...style }} />
  );
}
