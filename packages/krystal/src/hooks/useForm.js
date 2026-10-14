import React from "react";
import { useForm as useHookForm } from "react-hook-form";

// useForm — a form's state: its values, what is wrong with them, whether it has been touched, and
// what becomes of a submission. The handle it returns goes to <Form>, whose bound fields read and
// write it by name; a site reads `values`, `isDirty`, `isSubmitting` and `errors` off it to draw
// whatever sits around the fields. The form layer is the only place the library underneath shows.
//
//   defaultValues  the starting values, and what `reset()` returns to.
//   values         a baseline that follows a source: whenever it changes, the form takes it as its
//                  new starting point, so a form over a record re-seeds when the record moves.
//   rules          per field: `required` (true, or the message), `minLength`, `maxLength`, `min`,
//                  `max` (a number, or { value, message }) and `pattern` (a RegExp, or { value,
//                  message }). A message left out is a plain English one.
//   validate       per field: (value, values) => an error string, or nothing. May be async. It runs
//                  after the field's rules pass.
//   mode           when a field first shows its error. "submit" (the default): on a submit. "blur":
//                  when it is left. "touched": when it is left, then as it changes. "change": as it
//                  changes. After a submit has failed, every field is checked as it changes, so the
//                  error goes the moment the value is right.
//   onSubmit       (values) => void | { errors?, message? }, called with the values once every field
//                  passes. May be async. A server that refuses answers either by returning
//                  { errors: { field: "text" }, message: "text" } or by throwing an error that
//                  carries `errors` and/or `message`; the field errors land under their fields and the
//                  message in the form-level error. A thrown error with no `errors` shows its message.
//   resetOnSuccess  after a successful submit, return every field to `defaultValues`.
//
// The first field in the page with an error takes focus after a failed submit.
/** @type {Record<string, "onSubmit" | "onBlur" | "onTouched" | "onChange">} */
const MODES = { submit: "onSubmit", blur: "onBlur", touched: "onTouched", change: "onChange" };

/**
 * @typedef {object} RuleLimit
 * @property {number} value
 * @property {string} [message]
 */
/**
 * @typedef {object} PatternRule
 * @property {RegExp} value
 * @property {string} [message]
 */
/**
 * @typedef {object} FieldRules
 * @property {boolean | string} [required] True, or the message to show.
 * @property {number | RuleLimit} [minLength]
 * @property {number | RuleLimit} [maxLength]
 * @property {number | RuleLimit} [min]
 * @property {number | RuleLimit} [max]
 * @property {RegExp | PatternRule} [pattern]
 */
/**
 * @typedef {Record<string, any>} FormValues
 */
/**
 * @typedef {object} SubmitOutcome
 * @property {Record<string, string>} [errors] Error text by field name.
 * @property {string} [message] The form-level error.
 */
/**
 * @typedef {object} UseFormOptions
 * @property {FormValues} [defaultValues]
 * @property {FormValues} [values] A baseline the form re-seeds from whenever it changes.
 * @property {Record<string, FieldRules>} [rules]
 * @property {Record<string, (value: any, values: FormValues) => string | void | undefined | null | false | Promise<string | void | undefined | null | false>>} [validate]
 * @property {"submit" | "blur" | "touched" | "change"} [mode]
 * @property {(values: FormValues) => void | SubmitOutcome | Promise<void | SubmitOutcome>} [onSubmit]
 * @property {boolean} [resetOnSuccess]
 */
/**
 * @typedef {object} FormHandle
 * @property {FormValues} values Every field's current value.
 * @property {Record<string, string>} errors The error text of each field that has one, by name.
 * @property {string | null} formError The form-level error.
 * @property {boolean} isDirty Some field differs from its starting value.
 * @property {boolean} isSubmitting A submission is in flight.
 * @property {(name: string, value: any) => void} setValue Sets a field and marks it changed.
 * @property {(values?: FormValues) => void} reset Back to `defaultValues`, or to `values` as the new starting point.
 * @property {(errors: Record<string, string>) => void} setErrors Puts error text under fields.
 * @property {(message: string | null) => void} setFormError
 * @property {(name: string) => void} focus Moves focus into a field.
 * @property {(event?: import("react").SyntheticEvent) => Promise<void>} submit Validates, then calls `onSubmit`.
 */

// What <Form> and the bound fields need of a handle and a site never sees: the library's control and
// the rules to hang on each field.
/** @type {WeakMap<object, { control: any, id: string, rulesFor: (name: string) => any, register: (name: string) => () => void }>} */
const internals = new WeakMap();

/** @param {FormHandle} handle */
function internalsOf(handle) {
  const inner = internals.get(handle);
  if (!inner) throw new Error("A form field was given something that is not a form from useForm().");
  return inner;
}

// A limit is a number or { value, message }; the library takes { value, message } with the message
// always present, so a bare number gains a plain one.
function limit(spec, words) {
  if (spec == null) return undefined;
  if (typeof spec === "number") return { value: spec, message: words(spec) };
  return { value: spec.value, message: spec.message || words(spec.value) };
}

function toRules(rules = {}, validate) {
  const out = {};
  if (rules.required) out.required = typeof rules.required === "string" ? rules.required : "Required";
  const minLength = limit(rules.minLength, (n) => "At least " + n + " characters");
  const maxLength = limit(rules.maxLength, (n) => "At most " + n + " characters");
  const min = limit(rules.min, (n) => "At least " + n);
  const max = limit(rules.max, (n) => "At most " + n);
  if (minLength) out.minLength = minLength;
  if (maxLength) out.maxLength = maxLength;
  if (min) out.min = min;
  if (max) out.max = max;
  if (rules.pattern) {
    out.pattern = rules.pattern instanceof RegExp
      ? { value: rules.pattern, message: "Not in the expected form" }
      : { value: rules.pattern.value, message: rules.pattern.message || "Not in the expected form" };
  }
  if (validate) {
    out.validate = async (value, all) => {
      const problem = await validate(value, all);
      return problem ? String(problem) : true;
    };
  }
  return out;
}

// The library nests an error under a dotted name's parts; a site reads them flat, by the name it wrote.
function flatten(errors, prefix = "", out = {}) {
  for (const [key, e] of Object.entries(errors || {})) {
    if (!e) continue;
    const name = prefix + key;
    if (typeof e.message === "string" && e.message) out[name] = e.message;
    else if (typeof e === "object" && !e.type) flatten(e, name + ".", out);
    else if (e.type) out[name] = e.message || "Not valid";
  }
  return out;
}

/** @param {UseFormOptions} [options] @returns {FormHandle} */
function useForm(options = {}) {
  const latest = React.useRef(options);
  latest.current = options;
  const id = React.useId();
  const [formError, setFormError] = React.useState(/** @type {string | null} */ (null));
  const fields = React.useRef(/** @type {Map<string, number>} */ (new Map()));
  const submitting = React.useRef(false);

  const rhf = useHookForm({
    defaultValues: options.defaultValues,
    values: options.values,
    mode: MODES[options.mode || "submit"],
    reValidateMode: "onChange",
    shouldFocusError: false,
  });
  const { control } = rhf;
  const { errors, isDirty, isSubmitting } = rhf.formState;
  const flat = flatten(errors);

  // Any edit takes the form-level error away: it spoke of the values as they were.
  React.useEffect(() => {
    const sub = rhf.watch((_, info) => { if (info.type === "change") setFormError(null); });
    return () => sub.unsubscribe();
  }, [rhf]);

  const focus = React.useCallback((name) => {
    const frames = document.querySelectorAll('[data-k-form="' + id + '"][data-k-field="' + name + '"]');
    for (const frame of frames) {
      const hit = /** @type {HTMLInputElement[]} */ (Array.from(frame.querySelectorAll("input:not([type=hidden]), select, textarea, button")))
        .find((el) => !el.disabled && !el.closest(".k-field__label"));
      if (hit) { hit.focus(); return; }
    }
  }, [id]);

  // The first of the named fields in page order.
  const focusFirst = React.useCallback((names) => {
    const frames = Array.from(document.querySelectorAll('[data-k-form="' + id + '"][data-k-field]'));
    const hit = frames.find((f) => names.includes(f.getAttribute("data-k-field")));
    if (hit) focus(hit.getAttribute("data-k-field"));
  }, [id, focus]);

  const setErrors = React.useCallback((byName) => {
    for (const [name, message] of Object.entries(byName || {})) {
      rhf.setError(name, { type: "server", message: String(message) });
    }
  }, [rhf]);

  const submit = React.useCallback(async (event) => {
    if (submitting.current) { event?.preventDefault?.(); return; }
    await rhf.handleSubmit(
      async (values) => {
        submitting.current = true;
        setFormError(null);
        let outcome;
        try {
          outcome = await latest.current.onSubmit?.(values);
        } catch (e) {
          outcome = {
            errors: e && typeof e.errors === "object" ? e.errors : undefined,
            message: (e && e.message) || "Something went wrong.",
          };
          if (outcome.errors) outcome.message = e.message || undefined;
        } finally {
          submitting.current = false;
        }
        if (!outcome || (!outcome.errors && !outcome.message)) {
          if (latest.current.resetOnSuccess) rhf.reset(latest.current.defaultValues);
          return;
        }
        const named = Object.entries(outcome.errors || {});
        // A refusal about a field this form does not draw would otherwise vanish.
        const unplaced = named.filter(([name]) => !fields.current.has(name)).map(([, m]) => m);
        setErrors(Object.fromEntries(named.filter(([name]) => fields.current.has(name))));
        const message = outcome.message || (unplaced.length ? unplaced.join(" ") : null);
        if (message) setFormError(message);
        focusFirst(named.map(([name]) => name));
      },
      (invalid) => focusFirst(Object.keys(flatten(invalid))),
    )(event);
  }, [rhf, setErrors, focusFirst]);

  const register = React.useCallback((name) => {
    fields.current.set(name, (fields.current.get(name) || 0) + 1);
    return () => {
      const n = (fields.current.get(name) || 1) - 1;
      if (n) fields.current.set(name, n); else fields.current.delete(name);
    };
  }, []);

  const rulesFor = React.useCallback(
    (name) => toRules(latest.current.rules?.[name], latest.current.validate?.[name]),
    [],
  );

  const handle = {
    values: rhf.watch(),
    errors: flat,
    formError,
    isDirty,
    isSubmitting,
    setValue: (name, value) => rhf.setValue(name, value, { shouldDirty: true }),
    reset: (values) => { setFormError(null); rhf.reset(values); },
    setErrors,
    setFormError,
    focus,
    submit,
  };
  internals.set(handle, { control, id, rulesFor, register });
  return handle;
}

export { internalsOf, useForm };
