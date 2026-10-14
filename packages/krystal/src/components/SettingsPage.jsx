import React from "react";
import { Button } from "./Button.jsx";
import { Form, FormSubmit } from "./Form.jsx";
import { PageHeader } from "./PageHeader.jsx";
import { Select } from "./Select.jsx";
import { SettingsRow, SettingsSection } from "./settings-primitives.jsx";

// SettingsPage — a column of settings sections, with a side nav to move between them when there are
// more than a few, and a save bar for a form. It fetches nothing and owns no routing.
//
// `sections` are `{ id, title, icon?, description?, meta?, action?, rows?, content? }`: `rows` are
// SettingsRow props (`icon`, `title`, `sub`, `tone`) with the row's controls in `control`, and
// `content` is any node drawn in place of rows. Sections of the site's own composition may instead be
// `children`, a column of SettingsSection, though a side nav is made only from `sections`.
//
// The nav is a sticky list at wide widths and a Select at phone width, and a press scrolls to the
// section and moves focus to it. It is drawn when there are more than `navFrom` sections (four by
// default); `nav` forces it on or off. The section in view is marked.
//
// The save bar is drawn at the bottom of the page while the form has unsaved changes. Pass `form`, a
// handle from `useForm`, and the page is a `Form` over it: the fields in the sections are bound
// fields, Save submits, Revert resets the form to its starting values, and the bar's busy state follows
// the submission. Without a form, `dirty`, `saving`, `onSave` and `onRevert` drive the same bar.
// Inside AppShell's tabbed layout the bar sits above the tab bar.
/**
 * @typedef {object} SettingsPageSection
 * @property {string} id Anchors the section and names it in the nav.
 * @property {import("react").ReactNode} title
 * @property {string} [icon] A Lucide name.
 * @property {import("react").ReactNode} [description] A muted line under the section's header.
 * @property {import("react").ReactNode} [meta] Used as the description when there is none.
 * @property {import("react").ReactNode} [action] Header-right node.
 * @property {{ id?: string | number, icon: string, title: import("react").ReactNode, sub?: import("react").ReactNode, tone?: "success" | "warn" | "danger" | "info", control?: import("react").ReactNode }[]} [rows]
 * @property {import("react").ReactNode} [content] Drawn in place of `rows`.
 */
/**
 * @typedef {object} SettingsPageOwnProps
 * @property {import("react").ReactNode} [title]
 * @property {import("react").ReactNode} [sub]
 * @property {import("react").ReactNode} [actions]
 * @property {SettingsPageSection[]} [sections]
 * @property {boolean} [nav] Forces the side nav on or off; by default it follows `navFrom`.
 * @property {number} [navFrom] The nav is drawn above this many sections.
 * @property {string} [navLabel] The nav's accessible name.
 * @property {import("../hooks/useForm.js").FormHandle} [form] A useForm handle the page is a form over.
 * @property {boolean} [dirty] Shows the save bar, without a form.
 * @property {boolean} [saving] The bar's busy state, without a form.
 * @property {() => void} [onSave] Save, without a form.
 * @property {() => void} [onRevert] Revert, without a form.
 * @property {import("react").ReactNode} [dirtyLabel] The bar's words.
 * @property {import("react").ReactNode} [saveLabel]
 * @property {import("react").ReactNode} [savingLabel]
 * @property {import("react").ReactNode} [revertLabel]
 * @property {string} [className]
 * @property {import("react").ReactNode} [children]
 * @typedef {SettingsPageOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof SettingsPageOwnProps | "title">} SettingsPageProps
 */

function SaveBar({ form, dirty, saving, onSave, onRevert, dirtyLabel, saveLabel, savingLabel, revertLabel }) {
  const isDirty = form ? form.isDirty : dirty;
  const busy = form ? form.isSubmitting : saving;
  if (!isDirty) return null;
  const revert = form ? () => form.reset() : onRevert;
  return (
    <div className="k-settingspage__savebar" role="group" aria-label="Unsaved changes">
      <span className="k-settingspage__savebar-label" role="status">{dirtyLabel}</span>
      <div className="k-settingspage__savebar-actions">
        {revert && <Button variant="outline" disabled={busy} onClick={revert}>{revertLabel}</Button>}
        {form
          ? <FormSubmit busyLabel={savingLabel}>{saveLabel}</FormSubmit>
          : <Button variant="primary" busy={busy} disabled={busy} onClick={onSave}>{busy ? savingLabel : saveLabel}</Button>}
      </div>
    </div>
  );
}

/** @param {SettingsPageProps} props */
function SettingsPage({
  title, sub, actions, sections, nav, navFrom = 4, navLabel = "Sections", form, dirty = false, saving = false,
  onSave, onRevert, dirtyLabel = "Unsaved changes", saveLabel = "Save", savingLabel = "Saving…", revertLabel = "Revert",
  className, children, ...rest
}) {
  const base = React.useId();
  const anchor = (id) => base + "-" + id;
  const showNav = !!sections && (nav != null ? nav : sections.length > navFrom);
  const [current, setCurrent] = React.useState(sections && sections[0] ? sections[0].id : null);
  // A press names its section until the scroll it started has settled, including a section too low
  // on the page to reach the top.
  const pressedAt = React.useRef(0);

  // The section nearest the top of the viewport is the one in view.
  const ids = sections ? sections.map((s) => s.id).join("\n") : "";
  React.useEffect(() => {
    if (!showNav || typeof IntersectionObserver === "undefined") return undefined;
    const seen = new Set();
    const order = ids.split("\n");
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const id = e.target.getAttribute("data-section");
        if (e.isIntersecting) seen.add(id); else seen.delete(id);
      }
      const first = order.find((id) => seen.has(id));
      if (first && Date.now() - pressedAt.current > 1000) setCurrent(first);
    }, { rootMargin: "0px 0px -60% 0px" });
    for (const id of order) {
      const el = document.getElementById(anchor(id));
      if (el) io.observe(el);
    }
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `anchor` derives from `base`, which never changes
  }, [showNav, ids, base]);

  const go = (id) => {
    const el = document.getElementById(anchor(id));
    if (!el) return;
    setCurrent(id);
    pressedAt.current = Date.now();
    const calm = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
    el.focus({ preventScroll: true });
  };

  const column = (
    <div className="k-settingspage__column">
      {sections && sections.map((s) => (
        <div key={s.id} id={anchor(s.id)} data-section={s.id} tabIndex={-1} className="k-settingspage__section">
          <SettingsSection icon={s.icon} title={s.title} meta={s.description != null ? s.description : s.meta} action={s.action}>
            {s.content != null ? s.content : (s.rows || []).map((r, i) => (
              <SettingsRow key={r.id != null ? r.id : i} icon={r.icon} title={r.title} sub={r.sub} tone={r.tone}>{r.control}</SettingsRow>
            ))}
          </SettingsSection>
        </div>
      ))}
      {children}
    </div>
  );
  const bar = (
    <SaveBar form={form} dirty={dirty} saving={saving} onSave={onSave} onRevert={onRevert}
      dirtyLabel={dirtyLabel} saveLabel={saveLabel} savingLabel={savingLabel} revertLabel={revertLabel} />
  );
  const body = form
    ? <Form form={form} className="k-settingspage__form">{column}{bar}</Form>
    : <>{column}{bar}</>;

  return (
    <div {...rest} className={"k-settingspage" + (className ? " " + className : "")}>
      {(title != null || actions != null) && <PageHeader title={title} sub={sub} actions={actions} />}
      <div className={"k-settingspage__layout" + (showNav ? " k-settingspage__layout--nav" : "")}>
        {showNav && (
          <nav className="k-settingspage__nav" aria-label={navLabel}>
            <ul className="k-settingspage__navlist">
              {sections.map((s) => (
                <li key={s.id}>
                  <button type="button" className={"k-settingspage__navitem" + (s.id === current ? " k-is-on" : "")}
                    aria-current={s.id === current ? "true" : undefined} onClick={() => go(s.id)}>
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
            <Select className="k-settingspage__navselect" aria-label={navLabel} value={current || ""}
              onChange={(e) => go(e.target.value)}
              options={sections.map((s) => ({ value: s.id, label: typeof s.title === "string" ? s.title : s.id }))} />
          </nav>
        )}
        <div className="k-settingspage__content">{body}</div>
      </div>
    </div>
  );
}

export { SettingsPage };
