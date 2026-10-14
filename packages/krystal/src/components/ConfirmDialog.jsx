import React from "react";
import { Button } from "./Button.jsx";
import { Dialog } from "./Dialog.jsx";
import { Notice } from "./Notice.jsx";

// A question put to a person before a change that is hard to take back: a Dialog whose body is the
// consequence in plain words and whose foot is a cancel and a confirm button. `tone="danger"` draws
// the confirm as a danger Button, with the dialog's `icon` before its label.
//
// `onConfirm` is the change itself. It returns a promise: one that resolves to nothing succeeded
// and the dialog calls `onClose`; one that resolves to `{ refusal }` was declined, and the refusal
// is drawn in a Notice above the text with the dialog still open for another try; one that rejects
// draws its message the same way. While the promise is pending the confirm is busy, cancel is
// disabled, and Escape, the scrim and the close button hold (`canClose` false). `busyLabel` replaces
// the confirm label for that time.
/**
 * @typedef {object} ConfirmDialogOwnProps
 * @property {import("react").ReactNode} title
 * @property {string} [icon] A Lucide name, before the title and on a danger confirm.
 * @property {"neutral" | "danger"} [tone]
 * @property {string} confirm The confirm button's label.
 * @property {string} [busyLabel] The confirm label while the change runs.
 * @property {string} [cancel] The cancel button's label.
 * @property {() => Promise<void | { refusal: string }>} onConfirm
 * @property {() => void} onClose Called on cancel, Escape, the scrim and after a successful confirm.
 * @property {"md" | "lg"} [size]
 * @property {string} [className]
 * @property {import("react").ReactNode} [children] The consequence text.
 * @typedef {ConfirmDialogOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof ConfirmDialogOwnProps>} ConfirmDialogProps
 */
/** @param {ConfirmDialogProps} props */
function ConfirmDialog({
  title, icon, tone = "neutral", confirm, busyLabel, cancel = "Cancel", onConfirm, onClose,
  size = "md", className, children, ...rest
}) {
  const [busy, setBusy] = React.useState(false);
  const [refusal, setRefusal] = React.useState(/** @type {string | null} */ (null));
  const live = React.useRef(true);
  React.useEffect(() => () => { live.current = false; }, []);

  const run = async () => {
    if (busy) return;
    setBusy(true);
    setRefusal(null);
    let result;
    try {
      result = await onConfirm();
    } catch (e) {
      result = { refusal: (e && e.message) || "That didn't go through." };
    }
    if (!live.current) return;
    setBusy(false);
    if (result && result.refusal) setRefusal(result.refusal);
    else onClose();
  };

  return (
    <Dialog title={title} icon={icon} size={size} onClose={onClose} canClose={!busy}
      className={className}
      foot={(
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>{cancel}</Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} icon={icon} busy={busy} onClick={run}>
            {busy && busyLabel ? busyLabel : confirm}
          </Button>
        </>
      )}>
      <div className="k-confirm" {...rest}>
        {refusal && <Notice tone="danger">{refusal}</Notice>}
        <div className="k-confirm__text">{children}</div>
      </div>
    </Dialog>
  );
}

export { ConfirmDialog };
