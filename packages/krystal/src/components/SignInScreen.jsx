import { useForm } from "../hooks/useForm.js";
import { CardScreen } from "./CardScreen.jsx";
import { Form, FormField, FormSubmit } from "./Form.jsx";
import { Notice } from "./Notice.jsx";
import { OptionList } from "./OptionList.jsx";
import { ProviderButton, providerLabel } from "./ProviderMark.jsx";

// SignInScreen — the sign-in card: the brand above it, the identity providers, an optional username
// and password form, a refusal, and a foot link, on CardScreen. It does not sign anybody in: a press
// on a provider calls `onProvider(provider)` and a submission calls `onSubmit(values)`, and the site
// does what those mean.
//
//   <SignInScreen mark={mark} wordmark="The Krystal Ship" tagline="Sign in."
//     providers={["discord", "github"]} onProvider={(p) => leaveFor(p)} busyProvider={leaving}
//     password onSubmit={async ({ username, password }) => { const r = await post(…); if (!r.ok) return { message: r.error }; }}
//     error={unreachable} foot={<a href="/help">Need help?</a>} />
//
// `providers` are ids in the order the site wants them. One is a full-width button in the provider's
// own colour ("Continue with Discord"); several are an even grid of neutral buttons named for their
// provider, because stacked brand fills imply a recommendation nobody made. `providerText` and
// `busyProviderText` word either. `busyProvider` is the one being left for: its button is busy and the
// rest of the card is inert. `busy` makes the whole card inert (a submission whose page is already
// navigating away).
//
// `password` draws the form: `username` and `password` fields over the form layer, a submit button,
// and the form-level refusal `onSubmit` returns (`{ message }` or `{ errors }`, as useForm reads it).
// `extraFields` are more FormFields between the password and the button (a confirmation), with
// `defaultValues`, `rules` and `validate` for them; `usernameExtra` is a node (a display name field)
// between the username and the password; `passwordAside` sits beside the password's label (a
// "Forgot?" link) and `passwordHint` under the password field, inside its frame (a strength meter). A site that owns its form passes `form`, a useForm handle,
// and the card draws its fields in that.
//
// `tabs` (`{ value, label }`) with `tab` and `onTab` draw a segmented switch above the providers, for
// sign in and register. `error` is a refusal about the card as a whole (the service not answering) and
// `notice` any other line above the providers; `children` follow the form, under a divider, for what
// is specific to a site (a device code).
/**
 * @typedef {object} SignInScreenOwnProps
 * @property {string} [mark] An image URL.
 * @property {import("react").ReactNode} [wordmark] The site's name beside the mark.
 * @property {import("react").ReactNode} [tagline] A line under the wordmark.
 * @property {import("react").ReactNode} [foot] Under the card.
 * @property {"sm" | "md"} [width] `sm` or `md`; the card's width.
 * @property {string[]} [providers] Provider ids.
 * @property {(provider: string) => void} [onProvider] Receives the provider id pressed.
 * @property {string | null} [busyProvider] The provider being left for.
 * @property {(provider: string) => import("react").ReactNode} [providerText] The words on a provider's button; the provider's name in a grid, "Continue with <name>" alone.
 * @property {(provider: string) => import("react").ReactNode} [busyProviderText] The words while it is the busy one.
 * @property {boolean} [password] Draws the username and password form.
 * @property {(values: import("../hooks/useForm.js").FormValues) => void | import("../hooks/useForm.js").SubmitOutcome | Promise<void | import("../hooks/useForm.js").SubmitOutcome>} [onSubmit] Receives the form's values; a returned `{ message }` or `{ errors }` is the form's refusal.
 * @property {import("../hooks/useForm.js").FormHandle} [form] A handle the card draws its fields in, in place of its own.
 * @property {import("../hooks/useForm.js").FormValues} [defaultValues] Starting values of `extraFields`.
 * @property {Record<string, import("../hooks/useForm.js").FieldRules>} [rules] Validation rules by field name, for the extra fields.
 * @property {import("../hooks/useForm.js").UseFormOptions["validate"]} [validate] A form-wide check that runs after the rules.
 * @property {import("react").ReactNode} [extraFields] FormFields after the password.
 * @property {import("react").ReactNode} [usernameExtra] FormFields between the username and the password.
 * @property {import("react").ReactNode} [passwordHint] Under the password field, inside its frame, until the field has an error.
 * @property {import("react").ReactNode} [passwordAside] Beside the password's label.
 * @property {string} [usernameLabel] The username field's label.
 * @property {string} [passwordLabel] The password field's label.
 * @property {string} [passwordAutoComplete] current-password (the default) or new-password.
 * @property {import("react").ReactNode} [submitLabel] The submit button's words.
 * @property {import("react").ReactNode} [busyLabel] The submit button's words while submitting.
 * @property {import("react").ReactNode} [divider] Between the providers and the form; "or" by default.
 * @property {{ value: string, label: import("react").ReactNode }[]} [tabs] Tabs over the card's body, each a value and its label.
 * @property {string} [tab] The chosen tab's value.
 * @property {(tab: string) => void} [onTab] Receives the value of the tab chosen.
 * @property {string} [tabsLabel] The tab row's accessible name.
 * @property {import("react").ReactNode} [error] A refusal about the whole card.
 * @property {import("react").ReactNode} [notice] A line above the providers.
 * @property {boolean} [busy] Makes the card inert.
 * @property {string} [className] Class name added to the root element.
 * @property {import("react").ReactNode} [children] Content in the card, after the form.
 * @typedef {SignInScreenOwnProps} SignInScreenProps
 */

function Providers({ providers, busyProvider, inert, onProvider, text, busyText }) {
  if (!providers.length) return null;
  const label = (p) => (busyProvider === p ? busyText(p) : text(p));
  if (providers.length === 1) {
    const p = providers[0];
    return (
      <ProviderButton provider={p} brand wide size="lg" busy={busyProvider === p} disabled={inert}
        onClick={() => onProvider && onProvider(p)}>
        {label(p)}
      </ProviderButton>
    );
  }
  return (
    <div className="k-signin__providers">
      {providers.map((p) => (
        <ProviderButton key={p} provider={p} wide busy={busyProvider === p} disabled={inert}
          onClick={() => onProvider && onProvider(p)}>
          {label(p)}
        </ProviderButton>
      ))}
    </div>
  );
}

/** @param {SignInScreenProps} props */
function SignInScreen({
  mark, wordmark, tagline, foot, width, providers = [], onProvider, busyProvider = null,
  providerText, busyProviderText,
  password = false, onSubmit, form, defaultValues, rules, validate, extraFields, usernameExtra, passwordAside, passwordHint,
  usernameLabel = "Username", passwordLabel = "Password", passwordAutoComplete = "current-password",
  submitLabel = "Sign in", busyLabel, divider = "or", tabs, tab, onTab, tabsLabel = "Sign in or register",
  error, notice, busy = false, className, children,
}) {
  const own = useForm({
    defaultValues: { username: "", password: "", ...defaultValues },
    rules: { username: { required: true }, password: { required: true }, ...rules },
    validate,
    onSubmit,
  });
  const handle = form || own;
  const inert = busy || busyProvider != null;
  const hasProviders = providers.length > 0;
  const below = children != null && children !== false;
  return (
    <CardScreen mark={mark} wordmark={wordmark} tagline={tagline} foot={foot} width={width}
      className={"k-signin" + (className ? " " + className : "")}>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {tabs && (
        <OptionList variant="segmented" label={tabsLabel} value={tab} onChange={onTab} disabled={inert} options={tabs} />
      )}
      {notice}
      <Providers providers={providers} busyProvider={busyProvider} inert={inert} onProvider={onProvider}
        text={providerText || (providers.length === 1 ? (p) => "Continue with " + providerLabel(p) : providerLabel)}
        busyText={busyProviderText || (providers.length === 1 ? (p) => "Redirecting to " + providerLabel(p) + "…" : (p) => providerLabel(p) + "…")} />
      {password && (
        <>
          {hasProviders && <div className="k-signin__divider"><span>{divider}</span></div>}
          <Form form={handle} className="k-signin__form">
            <FormField name="username" label={usernameLabel} control="input" disabled={inert}
              autoComplete="username" autoCapitalize="off" spellCheck="false" />
            {usernameExtra}
            <FormField name="password" label={passwordLabel} aside={passwordAside} hint={passwordHint} control="password" disabled={inert}
              autoComplete={passwordAutoComplete} />
            {extraFields}
            <FormSubmit size="lg" wide busyLabel={busyLabel} disabled={inert}>{submitLabel}</FormSubmit>
          </Form>
        </>
      )}
      {below && (
        <>
          {(hasProviders || password) && <div className="k-signin__divider" role="separator" />}
          {children}
        </>
      )}
    </CardScreen>
  );
}

export { SignInScreen };
