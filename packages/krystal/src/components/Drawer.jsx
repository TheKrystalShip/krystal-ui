import React from "react";
import { Icon } from "./Icon.jsx";
import { IconButton } from "./Button.jsx";
import { Modal } from "./Modal.jsx";
import { useModalBehaviour } from "../hooks/useModalBehaviour.js";
import { useSheetPull } from "../hooks/useSheetPull.js";

// A drawer: a modal sheet that slides in from an edge over a scrim, built on Modal like Dialog and
// taking Dialog's props where they overlap (`title`, `sub`, `icon`, `label`, `onClose`, `canClose`,
// `size`, `fill`, `as`, `onSubmit`, `foot`), so a site switches between the two by width: a Dialog
// on a desktop, a Drawer on a phone. Focus is trapped in it and returned on close, the page behind
// is inert, and Escape (the topmost overlay's only) and a press on the scrim close it, both held off
// by `canClose`.
//
// `side` is the edge it comes from: bottom (the default; the full width of the screen, to `size`),
// right or left (full height, `size` wide, to the screen's width). A bottom sheet shows a drag handle
// on its head. On touch the head is the grip for all three sides: pulled toward the edge the sheet
// follows the finger and, let go far enough or fast enough, closes through `onClose`.
//
// The frame is a head with the title, an optional `icon` before it, a `back` button before that for a
// menu nested in another, an `action` after the title and the close button after it; an optional
// `sub` line; the body, which scrolls; and an optional `foot` for the actions, ruled off from the
// body. `head` replaces the whole title row (close button included) with the site's own. Edges
// respect the device's safe areas. While a drawer is open `body` carries `k-has-drawer` and the
// toasts sit at the top of the screen, clear of it.
//
// `contained` draws the sheet and its scrim inside the nearest positioned ancestor instead of over
// the viewport, for a sheet that belongs to a frame, such as the menus over a video player. It is
// still modal within its frame: focus is held in the sheet and returned on close, and Escape and a
// press on the scrim close it; the rest of the page stays live.
//
// `foot` lays its actions out by `footLayout`, as Dialog's does: `row` (the default), `stack` or `pair`.
// A drawer with no children draws no body.
//
// `role` is "dialog" (the default), "alertdialog", or "menu" for a sheet whose body is a list of
// items; `aria-modal` is set for the dialogs only.
//
// `theme` draws the sheet in a palette of its own whatever the page's is: it sets `data-theme` on the
// sheet, and every palette is a set of custom properties under that attribute, so the sheet and what
// it holds read the named palette's tokens (a player's menus are dark over any site theme). The
// document's `color-scheme`, which draws scrollbars and native pickers, stays the page's.
/**
 * @typedef {object} DrawerOwnProps
 * @property {import("react").ReactNode} [title] Absent when `head` or `label` stands in for it.
 * @property {import("react").ReactNode} [sub] A line under the head.
 * @property {string} [icon] A Lucide name.
 * @property {string} [label] Accessible name when `title` is not a string.
 * @property {() => void} [onClose] Called on the close button, Escape, the scrim and a pull-to-close, unless `canClose` is false.
 * @property {boolean} [canClose] False blocks Escape, scrim, close button and pull.
 * @property {"bottom" | "right" | "left"} [side] The edge it slides in from: `bottom`, `right` or `left`.
 * @property {"md" | "lg" | "xl"} [size] The sheet's widest, as Dialog's: md 520, lg 720, xl 960.
 * @property {boolean} [fill] A definite, tall sheet, for a body that sizes itself to its container.
 * @property {{ label: string, onClick: () => void }} [back] A back button before the title, named `label`.
 * @property {import("react").ReactNode} [action] Sits after the title, before the close button.
 * @property {import("react").ReactNode} [head] Replaces the title row: icon, back, title, action and close button.
 * @property {boolean} [contained] Draws inside the nearest positioned ancestor rather than over the viewport.
 * @property {"dialog" | "alertdialog" | "menu"} [role] `dialog`, `alertdialog`, or `menu` for a body that is a list of items.
 * @property {string} [theme] A palette name (`data-theme`) the sheet is drawn in, whatever the page's.
 * @property {"div" | "form"} [as] `form` makes the sheet a form, so Enter in a field submits it.
 * @property {import("react").FormEventHandler<HTMLElement>} [onSubmit] The form's submit handler when `as` is `form`.
 * @property {import("react").ReactNode} [foot] The sheet's actions, ruled off from the body.
 * @property {"row" | "stack" | "pair"} [footLayout] How the foot lays out its actions: a `row` (default), a `stack` or a `pair` of equal columns.
 * @property {string} [className] Extra classes on the sheet.
 * @property {import("react").ReactNode} [children] The body, which scrolls.
 * @typedef {DrawerOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof DrawerOwnProps | "onSubmit">} DrawerProps
 */

let open = 0;

/** Marks `body` while a drawer is open. */
function useOpenMark() {
  React.useEffect(() => {
    open += 1;
    document.body.classList.add("k-has-drawer");
    return () => {
      open -= 1;
      if (open === 0) document.body.classList.remove("k-has-drawer");
    };
  }, []);
}

/**
 * The scrim of a contained drawer: the shared overlay behaviour of Modal, without the portal, so the
 * sheet stays inside its frame.
 * @param {{ onClose?: () => void, canClose: boolean, className: string, children: import("react").ReactNode }} props
 */
function ContainedScrim({ onClose, canClose, className, children }) {
  const scrim = React.useRef(null);
  useModalBehaviour(scrim, { onClose, canClose });
  const onDown = (/** @type {import("react").MouseEvent} */ e) => {
    if (e.target === e.currentTarget && canClose && onClose) onClose();
  };
  return <div ref={scrim} className={className} onMouseDown={onDown}>{children}</div>;
}

/** @param {DrawerProps} props */
function Drawer({
  title, sub, icon, label, onClose, canClose = true, side = "bottom", size = "md", fill = false,
  back, action, head, contained = false, role = "dialog", theme,
  as = "div", onSubmit, foot, footLayout = "row", className, children, ...rest
}) {
  const Sheet = /** @type {import("react").ElementType} */ (as);
  useOpenMark();
  const pull = useSheetPull(side, () => { if (canClose && onClose) onClose(); }, canClose && !!onClose);
  const cls = "k-drawer k-drawer--" + side + " k-drawer--" + size + (fill ? " k-drawer--fill" : "")
    + (contained ? " k-drawer--contained" : "") + (className ? " " + className : "");
  const scrimClass = "k-drawer-scrim k-drawer-scrim--" + side + (contained ? " k-drawer-scrim--contained" : "");
  const sheet = (
    <Sheet {...rest} ref={pull.panel} className={cls} role={role} data-theme={theme}
      aria-modal={role === "menu" ? undefined : "true"}
      aria-label={label || (typeof title === "string" ? title : undefined)}
      onSubmit={onSubmit}>
      <div className="k-drawer__top" {...pull.head}>
        {side === "bottom" && <div className="k-drawer__grabber" aria-hidden="true" />}
        {head || (
          <div className="k-drawer__head">
            {back && <IconButton variant="ghost" icon="arrow-left" label={back.label} className="k-drawer__back" onClick={back.onClick} />}
            {icon && <span className="k-drawer__icon"><Icon name={icon} size={16} /></span>}
            {title && <span className="k-drawer__title">{title}</span>}
            {action && <span className="k-drawer__action">{action}</span>}
            {onClose && (
              <IconButton variant="ghost" icon="x" label="Close" className="k-drawer__close"
                onClick={onClose} disabled={!canClose} />
            )}
          </div>
        )}
      </div>
      {sub && <div className="k-drawer__sub">{sub}</div>}
      {children != null && children !== false && <div className="k-drawer__body">{children}</div>}
      {foot && <div className={"k-drawer__foot" + (footLayout !== "row" ? " k-foot--" + footLayout : "")}>{foot}</div>}
    </Sheet>
  );
  if (contained) {
    return <ContainedScrim onClose={onClose} canClose={canClose} className={scrimClass}>{sheet}</ContainedScrim>;
  }
  return <Modal onClose={onClose} canClose={canClose} scrimClassName={scrimClass}>{sheet}</Modal>;
}

export { Drawer };
