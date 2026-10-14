import React from "react";
import { Icon } from "./Icon.jsx";
import { IconButton } from "./Button.jsx";
import { Modal } from "./Modal.jsx";
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
// The frame is a head with the title, an optional `icon` before it and the close button after it; an
// optional `sub` line; the body, which scrolls; and an optional `foot` for the actions, ruled off
// from the body. Edges respect the device's safe areas. While a drawer is open `body` carries
// `k-has-drawer` and the toasts sit at the top of the screen, clear of it.
/**
 * @typedef {object} DrawerOwnProps
 * @property {import("react").ReactNode} title
 * @property {import("react").ReactNode} [sub]
 * @property {string} [icon] A Lucide name.
 * @property {string} [label] Accessible name when `title` is not a string.
 * @property {() => void} [onClose]
 * @property {boolean} [canClose] False blocks Escape, scrim, close button and pull.
 * @property {"bottom" | "right" | "left"} [side]
 * @property {"md" | "lg" | "xl"} [size] The sheet's widest, as Dialog's: md 520, lg 720, xl 960.
 * @property {boolean} [fill] A definite, tall sheet, for a body that sizes itself to its container.
 * @property {"div" | "form"} [as]
 * @property {import("react").FormEventHandler<HTMLElement>} [onSubmit]
 * @property {import("react").ReactNode} [foot]
 * @property {string} [className]
 * @property {import("react").ReactNode} [children]
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

/** @param {DrawerProps} props */
function Drawer({
  title, sub, icon, label, onClose, canClose = true, side = "bottom", size = "md", fill = false,
  as = "div", onSubmit, foot, className, children, ...rest
}) {
  const Sheet = /** @type {import("react").ElementType} */ (as);
  useOpenMark();
  const pull = useSheetPull(side, () => { if (canClose && onClose) onClose(); }, canClose && !!onClose);
  const cls = "k-drawer k-drawer--" + side + " k-drawer--" + size + (fill ? " k-drawer--fill" : "") + (className ? " " + className : "");
  return (
    <Modal onClose={onClose} canClose={canClose} scrimClassName={"k-drawer-scrim k-drawer-scrim--" + side}>
      <Sheet {...rest} ref={pull.panel} className={cls} role="dialog" aria-modal="true"
        aria-label={label || (typeof title === "string" ? title : undefined)}
        onSubmit={onSubmit}>
        <div className="k-drawer__top" {...pull.head}>
          {side === "bottom" && <div className="k-drawer__grabber" aria-hidden="true" />}
          <div className="k-drawer__head">
            {icon && <span className="k-drawer__icon"><Icon name={icon} size={16} /></span>}
            <span className="k-drawer__title">{title}</span>
            {onClose && (
              <IconButton variant="ghost" icon="x" label="Close" className="k-drawer__close"
                onClick={onClose} disabled={!canClose} />
            )}
          </div>
        </div>
        {sub && <div className="k-drawer__sub">{sub}</div>}
        <div className="k-drawer__body">{children}</div>
        {foot && <div className="k-drawer__foot">{foot}</div>}
      </Sheet>
    </Modal>
  );
}

export { Drawer };
