import { Icon } from "./Icon.jsx";
import { IconButton } from "./Button.jsx";
import { Modal } from "./Modal.jsx";

// A dialog: a framed sheet over a blurred scrim, built on Modal: focus is trapped in it and
// returned on close, the page behind is inert, and Escape (the topmost dialog's only) and a press
// outside close it, both held off by `canClose`. A dialog opened from a dialog stacks over it. The frame is a head with the title, an optional
// `icon` before it and the close button after it; an optional `sub` line under the head; the body,
// which scrolls; and an optional `foot` for the dialog's actions, ruled off from the body.
//
// `art` is a background image drawn as a banner above the head. `size` is the sheet's width — md
// (520px), lg (720px) or xl (960px). `fill` gives the sheet a definite height, for a body that
// sizes itself to its container (a code editor) and would otherwise collapse to nothing. On a phone
// a `fill` sheet takes the whole screen. `fullscreen` is a pop-out: the sheet fills the viewport
// inside a safe-area inset (edge to edge on a phone), keeping its head and close button; the body
// scrolls, or with `fill` as well it clips so a child that sizes itself takes the room.
//
// `sheet` makes the dialog a full-screen sheet at phone width (edge to edge, no frame of scrim). `foot`
// lays its actions out by `footLayout`: `row` (the default, a wrapping row), `stack` (a column, each
// action the full width) or `pair` (two equal columns). `artOverlap` draws the banner taller with the
// head lifted over its fade, the title standing on the picture. `children` may be a function, which
// receives `{ fullscreen }` for a body that fills a pop-out and drops its own frame there.
//
// `as="form"` makes the sheet a form (`noValidate`: a form's own rules judge), `onSubmit` its handler,
// so Enter in a field submits it.
// `label` names the dialog for a screen reader when `title` is not a string.
/**
 * @param {object} props
 * @param {import("react").ReactNode} props.title The head's title.
 * @param {import("react").ReactNode} [props.sub] A line under the head.
 * @param {string} [props.icon] A Lucide name.
 * @param {string} [props.art] A CSS background-image value for the banner.
 * @param {string} [props.label] Accessible name when `title` is not a string.
 * @param {() => void} [props.onClose] Called on the close button, Escape and a press outside, unless `canClose` is false.
 * @param {boolean} [props.canClose] False holds Escape, the scrim and the close button.
 * @param {"md" | "lg" | "xl"} [props.size] The sheet's width: `md`, `lg` or `xl`.
 * @param {boolean} [props.fill] A definite height, for a body that sizes itself to its container.
 * @param {boolean} [props.fullscreen] Fills the viewport inside a safe-area inset.
 * @param {boolean} [props.sheet] A full-screen sheet at phone width.
 * @param {"row" | "stack" | "pair"} [props.footLayout] How the foot lays out its actions: a `row` (default), a `stack` or a `pair` of equal columns.
 * @param {boolean} [props.artOverlap] A taller banner with the head lifted over it.
 * @param {"div" | "form"} [props.as] `form` makes the sheet a form, so Enter in a field submits it.
 * @param {import("react").FormEventHandler<HTMLElement>} [props.onSubmit] The form's submit handler when `as` is `form`.
 * @param {import("react").ReactNode} [props.foot] The dialog's actions, ruled off from the body.
 * @param {string} [props.className] Extra classes on the sheet.
 * @param {import("react").ReactNode | ((state: { fullscreen: boolean }) => import("react").ReactNode)} [props.children] The body, which scrolls; a function receives `{ fullscreen }`.
 */
function Dialog({
  title, sub, icon, art, label, onClose, canClose = true, size = "md", fill = false, fullscreen = false, sheet = false, footLayout = "row", artOverlap = false,
  as = "div", onSubmit, foot, className, children,
}) {
  const Sheet = as;
  const cls = "k-modal k-modal--" + size + (fill ? " k-modal--fill" : "") + (fullscreen ? " k-modal--fullscreen" : "") + (sheet ? " k-modal--sheet" : "")
    + (artOverlap && art ? " k-modal--overlap" : "") + (className ? " " + className : "");
  return (
    <Modal onClose={onClose} canClose={canClose} scrimClassName="k-backdrop">
      <Sheet className={cls} role="dialog" aria-modal="true"
        aria-label={label || (typeof title === "string" ? title : undefined)}
        onSubmit={onSubmit} noValidate={as === "form" || undefined}>
        {art && <div className="k-modal__art" style={{ backgroundImage: art }} />}
        <div className="k-modal__head">
          {icon && <span className="k-modal__icon"><Icon name={icon} size={16} /></span>}
          <span className="k-modal__title">{title}</span>
          {onClose && (
            <IconButton variant="ghost" icon="x" label="Close" className="k-modal__close"
              onClick={onClose} disabled={!canClose} />
          )}
        </div>
        {sub && <div className="k-modal__sub">{sub}</div>}
        <div className="k-modal__body">{typeof children === "function" ? children({ fullscreen }) : children}</div>
        {foot && <div className={"k-modal__foot" + (footLayout !== "row" ? " k-foot--" + footLayout : "")}>{foot}</div>}
      </Sheet>
    </Modal>
  );
}

export { Dialog };
