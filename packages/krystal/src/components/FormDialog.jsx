import { Button } from "./Button.jsx";
import { Dialog } from "./Dialog.jsx";
import { FormError, FormScope, FormSubmit } from "./Form.jsx";

// FormDialog — a dialog that is itself the form of a `useForm` handle: Enter in a field submits,
// Cancel closes, and `submit` is the foot's primary button. The body takes FormFields.
//
//   <FormDialog form={form} title="Add an account" icon="user-plus" onClose={close}
//     submit="Create" busyLabel="Creating…">
//     <FormField name="username" label="Username" control="input" />
//   </FormDialog>
//
// `submit` is the words of the submit button (a FormSubmit, busy while the form submits), or a node
// of the site's own for another kind of button. The dialog cannot be dismissed while a submission
// runs: Escape, the scrim, the close button and Cancel all hold. A refusal from the form's `onSubmit`
// stands at the top of the body as the form's error; `notice` replaces it with a node of the site's
// own (a RefusalNote), or with nothing when it is `null`.
/**
 * @typedef {object} FormDialogOwnProps
 * @property {import("../hooks/useForm.js").FormHandle} form The handle from useForm().
 * @property {import("react").ReactNode} title The head's title.
 * @property {import("react").ReactNode} [sub] A line under the head.
 * @property {string} [icon] A Lucide name, before the title.
 * @property {"md" | "lg" | "xl"} [size] The sheet's width: `md`, `lg` or `xl`.
 * @property {() => void} onClose Called on cancel, Escape, the scrim and the close button, unless a submission is running.
 * @property {import("react").ReactNode} [submit] The submit button's words, or a node drawn as the foot's primary control.
 * @property {import("react").ReactNode} [busyLabel] The submit button's words while the form submits, when `submit` is words.
 * @property {import("react").ReactNode} [cancel] The cancel button's words.
 * @property {import("react").ReactNode} [notice] Drawn at the top of the body in place of the form's own error; `null` draws nothing there.
 * @property {boolean} [sheet] A full-screen sheet at phone width, as Dialog's.
 * @property {"row" | "stack" | "pair"} [footLayout] How the foot lays out cancel and submit, as Dialog's.
 * @property {string} [className] Extra classes on the sheet.
 * @property {import("react").ReactNode} [children] The fields.
 * @typedef {FormDialogOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof FormDialogOwnProps | "title">} FormDialogProps
 */
/** @param {FormDialogProps} props */
function FormDialog({
  form, title, sub, icon, size, onClose, submit = "Save", busyLabel, cancel = "Cancel", notice, sheet, footLayout, className, children, ...rest
}) {
  const words = typeof submit === "string" || typeof submit === "number";
  return (
    <FormScope form={form}>
      <Dialog title={title} icon={icon} sub={sub} size={size} as="form" onSubmit={form.submit}
        onClose={onClose} canClose={!form.isSubmitting} sheet={sheet} footLayout={footLayout} className={className}
        foot={(
          <>
            <Button variant="outline" onClick={onClose} disabled={form.isSubmitting}>{cancel}</Button>
            {words ? <FormSubmit busyLabel={busyLabel}>{submit}</FormSubmit> : submit}
          </>
        )}>
        <div {...rest} className="k-form">
          {notice === undefined ? <FormError /> : notice}
          {children}
        </div>
      </Dialog>
    </FormScope>
  );
}

export { FormDialog };
