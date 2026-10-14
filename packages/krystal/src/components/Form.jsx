import React from "react";
import { Controller } from "react-hook-form";
import { internalsOf } from "../hooks/useForm.js";
import { Button } from "./Button.jsx";
import { Checkbox, Field, Input, PasswordInput, Textarea } from "./fields.jsx";
import { Notice } from "./Notice.jsx";
import { OptionList } from "./OptionList.jsx";
import { Select } from "./Select.jsx";
import { Toggle } from "./Toggle.jsx";

// The form layer: <Form> over a handle from useForm(), and the fields bound to it by name.
//
//   <Form form={form}>
//     <FormField name="username" label="Username" control="input" autoComplete="username" />
//     <FormField name="password" label="Password" control="password" />
//     <FormSubmit>Sign in</FormSubmit>
//   </Form>
//
// <Form> is a <form> that validates through the handle and not the browser (noValidate), submits
// through it, and draws the form-level error above its fields unless a <FormError /> places it
// elsewhere. A surface that is itself the form element, a dialog with `as="form"`, wraps itself in
// <FormScope form={form}> and passes `onSubmit={form.submit}`; the fields and <FormError /> work
// inside it the same.

const Scope = React.createContext(/** @type {{ form: import("../hooks/useForm.js").FormHandle, claim: () => () => void, claimed: boolean } | null} */ (null));

function useScope() {
  const scope = React.useContext(Scope);
  if (!scope) throw new Error("A form field belongs inside <Form> or <FormScope>.");
  return scope;
}

/**
 * @typedef {object} FormScopeProps
 * @property {import("../hooks/useForm.js").FormHandle} form The handle from useForm().
 * @property {import("react").ReactNode} [children]
 */
/** @param {FormScopeProps} props */
function FormScope({ form, children }) {
  const [claims, setClaims] = React.useState(0);
  const claim = React.useCallback(() => {
    setClaims((n) => n + 1);
    return () => setClaims((n) => n - 1);
  }, []);
  const value = React.useMemo(() => ({ form, claim, claimed: claims > 0 }), [form, claim, claims]);
  return <Scope.Provider value={value}>{children}</Scope.Provider>;
}

// The form-level error as a danger Notice; nothing while there is none.
/** @param {{ className?: string }} props */
function ErrorNotice({ className }) {
  const { form } = useScope();
  return form.formError ? <Notice tone="danger" className={className}>{form.formError}</Notice> : null;
}

// FormError — where the form-level error is drawn, when it belongs somewhere other than the top.
/**
 * @param {object} props
 * @param {string} [props.className]
 */
function FormError({ className }) {
  const { claim } = useScope();
  React.useLayoutEffect(() => claim(), [claim]);
  return <ErrorNotice className={className} />;
}

function FormBody({ children }) {
  const { claimed } = useScope();
  return <>{!claimed && <ErrorNotice />}{children}</>;
}

/**
 * @typedef {object} FormOwnProps
 * @property {import("../hooks/useForm.js").FormHandle} form The handle from useForm().
 * @property {string} [className]
 * @property {import("react").ReactNode} [children]
 * @typedef {FormOwnProps & Omit<import("react").ComponentPropsWithoutRef<"form">, keyof FormOwnProps | "onSubmit" | "noValidate">} FormProps
 */
/** @param {FormProps} props */
function Form({ form, className, children, ...rest }) {
  return (
    <FormScope form={form}>
      <form {...rest} noValidate className={"k-form" + (className ? " " + className : "")}
        onSubmit={form.submit}>
        <FormBody>{children}</FormBody>
      </form>
    </FormScope>
  );
}

// FormSubmit — the form's submit button: busy while a submission runs, and with `requireDirty`
// inert until something differs from its starting values. `busyLabel` words the button meanwhile.
/**
 * @typedef {object} FormSubmitOwnProps
 * @property {boolean} [requireDirty] Disabled while nothing has changed.
 * @property {import("react").ReactNode} [busyLabel] Shown instead of the children while submitting.
 * @typedef {FormSubmitOwnProps & Omit<import("./Button.jsx").ButtonProps, keyof FormSubmitOwnProps | "type" | "busy">} FormSubmitProps
 */
/** @param {FormSubmitProps} props */
function FormSubmit({ requireDirty = false, busyLabel, variant = "primary", disabled, children, ...rest }) {
  const { form } = useScope();
  return (
    <Button {...rest} type="submit" variant={variant} busy={form.isSubmitting}
      disabled={disabled || (requireDirty && !form.isDirty)}>
      {form.isSubmitting && busyLabel != null ? busyLabel : children}
    </Button>
  );
}

const CONTROLS = {
  input: Input,
  password: PasswordInput,
  textarea: Textarea,
  select: Select,
};

/**
 * @typedef {object} FieldBinding What a render-function control receives.
 * @property {string} name
 * @property {any} value
 * @property {(next: any) => void} onChange Takes the next value, not an event.
 * @property {() => void} onBlur
 * @property {boolean} invalid
 * @property {boolean} disabled True while the form submits.
 * @property {string | undefined} describedBy The id of the hint or error line, for aria-describedby.
 */
/**
 * @typedef {object} FormFieldOwnProps
 * @property {string} name The field's key in the form's values.
 * @property {import("react").ReactNode} [label] Over the control; for a checkbox, its words beside the box.
 * @property {import("react").ReactNode} [aside] After the label, quieter.
 * @property {import("react").ReactNode} [hint] Under the control while it has no error.
 * @property {"input" | "password" | "textarea" | "select" | "checkbox" | "toggle" | "options" | ((binding: FieldBinding) => import("react").ReactNode)} [control]
 *   The control drawn, with every other prop passed through to it; a function draws a custom one.
 * @property {string} [className] On the field's frame.
 */
/** @param {FormFieldOwnProps & Record<string, any>} props */
function FormField({ name, label, aside, hint, control = "input", className, ...controlProps }) {
  const { form } = useScope();
  const { control: rhfControl, id: formId, rulesFor, register } = internalsOf(form);
  const hintId = React.useId();
  const errorId = React.useId();
  React.useEffect(() => register(name), [register, name]);

  return (
    <Controller name={name} control={rhfControl} rules={rulesFor(name)}
      render={({ field, fieldState }) => {
        const error = fieldState.error?.message;
        const describedBy = error ? errorId : hint != null ? hintId : undefined;
        const disabled = form.isSubmitting || !!controlProps.disabled;
        const frame = {
          error, hint, hintId, errorId, className,
          "data-k-form": formId, "data-k-field": name,
        };
        /** @type {any} */
        const common = { ...controlProps, name, disabled, onBlur: field.onBlur, "aria-describedby": describedBy };
        const value = field.value;

        if (typeof control === "function") {
          return (
            <Field {...frame} label={label} aside={aside}>
              {control({
                name, value, onChange: field.onChange, onBlur: field.onBlur,
                invalid: !!error, disabled, describedBy,
              })}
            </Field>
          );
        }
        if (control === "checkbox") {
          return (
            <Field {...frame} group aside={aside}>
              <Checkbox {...common} aria-invalid={!!error || undefined} checked={!!value}
                onChange={field.onChange}>{label}</Checkbox>
            </Field>
          );
        }
        if (control === "toggle") {
          return (
            <Field {...frame} label={label} aside={aside}>
              <Toggle {...common} on={!!value} onChange={field.onChange} />
            </Field>
          );
        }
        if (control === "options") {
          return (
            <Field {...frame} group label={label} aside={aside}>
              <OptionList {...common} aria-invalid={!!error || undefined}
                label={typeof label === "string" ? label : undefined}
                value={value} onChange={field.onChange} />
            </Field>
          );
        }
        const Control = CONTROLS[control];
        if (!Control) throw new Error("FormField: unknown control \"" + control + "\".");
        const wide = control === "input" || control === "password" ? { wide: true } : null;
        return (
          <Field {...frame} label={label} aside={aside}>
            <Control {...wide} {...common} invalid={control === "select" ? undefined : !!error}
              aria-invalid={!!error || undefined}
              value={value ?? ""}
              onChange={(e) => field.onChange(e.target.value)} />
          </Field>
        );
      }} />
  );
}

export { Form, FormError, FormField, FormScope, FormSubmit };
