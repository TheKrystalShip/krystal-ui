import { Icon } from "./Icon.jsx";
import { IconButton } from "./Button.jsx";
import { Modal } from "./Modal.jsx";

// A dialog: a framed sheet over a blurred scrim, built on Modal's behaviour (Escape and a press
// outside close it, both held off by `canClose`). The frame is a head with the title, an optional
// `icon` before it and the close button after it; an optional `sub` line under the head; the body,
// which scrolls; and an optional `foot` for the dialog's actions, ruled off from the body.
//
// `art` is a background image drawn as a banner above the head. `size` is the sheet's width — md
// (520px), lg (720px) or xl (960px). `fill` gives the sheet a definite height, for a body that
// sizes itself to its container (a code editor) and would otherwise collapse to nothing. On a phone
// a `fill` sheet takes the whole screen.
//
// `as="form"` makes the sheet a form, `onSubmit` its handler, so Enter in a field submits it.
// `label` names the dialog for a screen reader when `title` is not a string.
function Dialog({
  title, sub, icon, art, label, onClose, canClose = true, size = "md", fill = false,
  as = "div", onSubmit, foot, className, children,
}) {
  const Sheet = as;
  const cls = "k-modal k-modal--" + size + (fill ? " k-modal--fill" : "") + (className ? " " + className : "");
  return (
    <Modal onClose={onClose} canClose={canClose} scrimClassName="k-backdrop">
      <Sheet className={cls} role="dialog" aria-modal="true"
        aria-label={label || (typeof title === "string" ? title : undefined)}
        onSubmit={onSubmit}>
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
        <div className="k-modal__body">{children}</div>
        {foot && <div className="k-modal__foot">{foot}</div>}
      </Sheet>
    </Modal>
  );
}

export { Dialog };
