# tks-krystal

The Krystal design system, as two npm packages in one workspace:

- `@thekrystalship/krystal` — React components, hooks, stores, stylesheets, fonts and themes.
- `@thekrystalship/krystal-chat` — the assistant chat, the assistant's settings pages and
  `createAssistantClient`, built on `@thekrystalship/krystal`.

Every TheKrystalShip web surface is built from them: the KGSM Control Panel and its companion pages
(`kgsm-web`) and Krystal Cinema (`moviebot/web/site`). The two packages share one version, one
`CHANGELOG.md` and one `v<version>` tag.

## Using it

The package is published to GitHub Packages. A consuming repo maps the scope in its own `.npmrc`:

```
@thekrystalship:registry=https://npm.pkg.github.com
```

and a workstation holds the credential in `~/.npmrc` (`//npm.pkg.github.com/:_authToken=…`, a token
with `read:packages`; publishing needs `write:packages`). The registry asks for a token even to
install, so CI passes its `GITHUB_TOKEN` with `permissions: packages: read`.

```js
import "@thekrystalship/krystal/styles.css";        // tokens, fonts and every component's styles
import { BriefCard, Icon, Rail, Toasts, toast } from "@thekrystalship/krystal";
```

A site with an assistant chat installs the chat package beside core. It takes core as a peer
dependency at its own version, so the site has one copy of core:

```js
import "@thekrystalship/krystal-chat/styles.css";      // the chat's and the assistant pages' styles
import { Chat, createAssistantClient } from "@thekrystalship/krystal-chat";
```

React (18.3 or 19), React DOM and `lucide-react` are peer dependencies of both packages: the site's own copies are used. Core
depends on `@floating-ui/react-dom`, which places its popovers; a site never imports it.

Each package ships its own type declarations (`dist/**/*.d.ts`, named by the `types` condition of the
`.` and `./lib/*` exports), so an editor completes component names and checks props in plain
JavaScript too: each component's props, each hook's arguments and each store's state type are read from
the JSDoc beside the source.

The modules under core's `lib/` (`store`, `theme`, `toasts`, `time`, `clipboard`, `pushBrowser`, `sse`) are also
addressable one at a time — `@thekrystalship/krystal/lib/time` — for code that runs outside a
browser and must not load React.

### Class names and the cascade

Every class a sheet defines carries the prefix `k-`: `k-btn`, `k-rail__track`, `k-toast--error`. The
chat's carry `k-chat-` (`k-chat-turn`), and a component's state is a `k-is-` class
(`k-toolbar-btn.k-is-on`). A site's own `.hero` or `.rail` never meets the package's, and the names are
the interface a site restyles by, so `.k-rail--catalog .k-rail__track` is how a shelf changes its density.

The sheets sit in three cascade layers, ordered by the statement each sheet opens with:

```css
@layer krystal.tokens, krystal.base, krystal.components;
```

- `krystal.tokens`: the custom properties of every palette, in `tokens.css`.
- `krystal.base`: the rules that style the document and its elements: `html`, `body`, headings, links, the
  focus ring, native control schemes, scrollbars and the keyframes.
- `krystal.components`: every component sheet, the chat's included.

A rule outside any layer beats every layered rule whatever its specificity, so a site restyles a component
with an ordinary rule and never raises specificity to win. That holds for element rules too: a site's
unlayered `a { … }` or `button { … }` beats the package's class rules, so a site keeps its resets in a
layer ordered before the package's and its restyles outside any layer:

```css
@layer site.reset, krystal.tokens, krystal.base, krystal.components;

@import "@thekrystalship/krystal/styles.css";

@layer site.reset {
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; }
}

/* unlayered: wins over every krystal layer */
.k-toolbar { gap: 4px; }
:root[data-theme="dark"] { --canvas: #0b0d10; }
```

The first `@layer` statement fixes the order, and the package's sheets imported after it join those layers. A
site that places the package's sheets one at a time imports them from
`@thekrystalship/krystal/styles/` (and `@thekrystalship/krystal-chat/styles/`) where its own rules have
to sit; `styles.css` lists them in the order they assume. Each sheet repeats the order statement and
wraps its rules in its layer, so a sheet imported alone is layered too.

## What is in it

`@thekrystalship/krystal`:

| Kind | Exports |
|---|---|
| The frame | `AppShell`, `Sidebar`, `SidebarGroup`, `NavItem`, `SidebarAccount`, `MobileNavToggle`, `TabBar`, `useStoredFlag`, `useEdgeSwipe` |
| The dock | `Dock`, `DockFab`, `useDock` |
| Banners | `Hero` |
| The footer | `Footer` (brand block, link groups, bar), `GithubMark` |
| Cards and lists | `BriefCard`, `ShowcaseCard` (key art, three facts, a status and an action, with optional round `tools` on the art, a `ribbon` hanging from its top edge for keeping the thing, an `eyebrow` above the name saying what kind of thing it is, and along its foot a `progress` bar or one short bar per part in `segments`), `CollectionTile` (a set of titles as a link: `fan` draws three posters fanned beside its mark and name, `strip` its posters in order, numbered, and with `total` and `watched` follows somebody through it; it fills its slot at a fixed shape and takes a TvCard's focus on a television), `Rail`, `Pagination`, `Breadcrumbs` (a one-line trail of real links that ellipsizes at phone width; the site computes the `items`, `onNavigate` lets a single-page site take a plain click), `SubTabs`, `Toolbar` (+ `ToolbarSearch`, `ToolbarFilters`, `ToolbarSort`, `ToolbarButton`, `ToolbarCount`, `ToolbarSpacer`, `useFilters`) |
| Slides | `useCarousel` (one of several slides at a time, turning by itself on an interval: held still under a mouse, under keyboard focus, on a hidden page and while `paused`, never turning by itself under reduced motion, its time started over by a key or a press in it, and turned by a swipe), `CarouselPager` (a mark a slide, the shown one filling over the slide's time; `indicator` for a television, where the marks are not focused) |
| Labels | `Pill` (a count, a state or a kind as a small non-interactive label), `Kbd` (a key, or a chord with `keys`, in mono) |
| Layout | `Stack` (a column), `Cluster` (a wrapping row), `Grid` (columns of a `min` width, or `cols`), `Container` (the centred page column, `size` sm to xl or full); each takes `gap` as a spacing step or `xs` to `xl`, and `as` |
| Lists | `List`, `ListRow` (a framed list of rows with a lead, pills, an aside and actions) |
| Data | `Table` (a real table with sortable headers, rows that open, row actions and a card per row at phone width), `sortRows`, `StatTile` and `StatTiles` (one measured figure, and the grid of them), `Card` (a framed surface with a head, a foot and an optional open target), `DataState` (draws loading, failed, empty or loaded from what the site says) |
| Sign-in screens | `CardScreen` (the centred card on the page background), `CopyField` (a read-only value with a copy button) |
| Sign-in | `ProviderMark`, `providerLabel`, `ProviderButton` (a provider's mark and name, and a button carrying them) |
| Forms | `useForm` (values, per-field rules and async `validate`, dirty and submitting state, server field errors from a returned or thrown `{ errors, message }`), `Form`, `FormScope`, `FormField`, `FormError`, `FormSubmit` |
| Choices | `Tabs`, `TabList`, `Tab`, `TabPanel` (in-page panels behind a row of tabs), `RadioGroup` (a small single choice, inline or stacked), `Slider` (one number along a line), `Disclosure` and `Accordion` (a summary that opens its content, and a group of them) |
| Controls | `Button`, `IconButton`, `Spinner`, `Toggle`, `Input`, `PasswordInput`, `Textarea`, `Checkbox`, `Field`, `Select`, `Combobox`, `OptionList`, `Meter` |
| Page furniture | `PageHeader`, `Notice`, `EmptyState`, `ErrorBoundary` |
| Settings furniture | `SettingsSection`, `SettingsRow`, `ThemePicker` |
| Overlays | `Dialog`, `Drawer` (a modal sheet from the `bottom`, `right` or `left` edge, with Dialog's props, a drag handle and touch pull-to-dismiss), `Modal`, `Popover`, `Tooltip`, `Menu` (+ `MenuItem`, `MenuCheckboxItem`, `MenuRadioGroup`, `MenuRadioItem`, `MenuGroup`, `MenuSeparator`), `ReversablePortal`, `usePortalPopover`, `useModalBehaviour` |
| Loading | `Skeleton` (one shimmering placeholder block, laid out by the site in the footprint its content will take; still under reduced motion) |
| Telling a person | `Toasts`, `NotificationsPanel`, `toast`, `toastStore` |
| Marks | `Icon` (Lucide, by kebab-case name), `Avatar` (an image or initials, with a status dot), `AccountAvatar`, `AssistantFabIcon` |
| State and helpers | `createStore`/`useStore`, `themeStore` + `THEME_OPTS` + `registerThemes`, `copyText`, `pushBrowser`, `fmtRelative` |

`@thekrystalship/krystal-chat`:

| Kind | Exports |
|---|---|
| The assistant chat | `Chat`, `createAssistantClient`, `useConversationStream`, `ChatCard` (the card a product draws under an answer) with `ChatCardRows`, `ChatCardRow` and `ConfidenceBadge`, the parts it is drawn from (`ChatThread`, `ChatMessage`, `ChatActivity`, `ChatCommand`, `ChatEvent`, `ChatEventRow`, `ChatDaySeparator`, `ChatFileChange`, `MarkdownTextarea`, `useVoiceRecorder`, …) and the conversation functions (`reduceTurnFrame`, `scaffoldHistory`, `mergeServerConversations`, …) |
| The assistant's pages | `AssistantChatsPage`, `AssistantMemoryPage`, `AssistantSkillsPage`, `AssistantNotifications`, `AssistantMemory`, `AssistantMemoryEditor`, and the push calls `assistantPushStatus`, `assistantPushSubscribe`, `assistantPushUnsubscribe` |

Core stylesheets: `styles/tokens.css` (every colour, type, spacing, radius and motion token, every
theme, and the Inter / JetBrains Mono faces), `styles/motion.css` (shared keyframes),
`styles/scrollbar.css` (the scrollbar every scrollable surface draws), `styles/controls.css` (the
basic controls, below), `styles/page.css` (the page furniture), `styles/dialog.css`, and one sheet
per component family. `assets/tks-mark.png` is the brand mark. The chat package's sheets are `styles/chat*.css`
and `styles/assistant-pages.css`.

## The controls

Every push button, field, switch and spinner on a site is one of these, so a control looks and
behaves the same wherever it is drawn. Buttons, fields and selects share one height ladder, so a field
and the button beside it sit on one line:

| Size | xs | sm | md | lg | xl |
|---|---|---|---|---|---|
| `Button`, `IconButton` | 26 | 30 | 34 | 38 | 46 |
| `Input`, `Select` | | 30 | 34 | 38 | |

`md` is the default, and a phone raises it to a 40px touch target.

```jsx
<Button variant="primary" icon="save" busy={saving} onClick={save}>{saving ? "Saving…" : "Save"}</Button>
<Button variant="outline" onClick={close}>Cancel</Button>
<Button href="/account" iconRight="external-link">Manage account</Button>
<IconButton icon="trash-2" label="Delete" tone="danger" armed={armed} onClick={trigger} />

<Field label="Port" aside="optional" hint="Players connect on this.">
  <Input type="number" mono wide suffix="udp" value={port} onChange={(e) => setPort(e.target.value)} />
</Field>
<Checkbox checked={agree} onChange={setAgree}>I understand</Checkbox>
<Toggle on={enabled} onChange={setEnabled} label="Enabled" />
<Spinner label="Loading" />
```

`Button` variants say how loud an action is: `primary`, `secondary` (the default), `outline`, `ghost`,
`accent`, `danger`, `warning` and `link`. `tone` (`danger`, `warning`, `success`) colours a neutral
button's hover by the consequence of pressing it; `busy` swaps its icon for a spinner and holds it;
`pressed` makes it a two-state button; `armed` marks a confirm-first button waiting for its second
press; `href` renders a link that looks like one. `IconButton` is the square form, and its `label` is
its accessible name and tooltip. `Input` takes `prefix` and `suffix` words inside its frame.

### Choosing from a list, and how full something is

```jsx
<OptionList label="Quality" value={quality} onChange={setQuality}
  options={[
    { value: "1080p", label: "1080p", aside: "1.04 GB" },
    { value: "720p", label: "720p", aside: "512 MB" },
    { value: "480p", label: "480p", aside: "236 MB" },
  ]} />

<OptionList multiple label="Subtitles" value={subs} onChange={setSubs}
  options={languages.map((l) => ({ value: l.code, label: l.name, detail: l.kind, aside: l.size }))}
  collapsedAfter={2} moreLabel={(n) => n + " more languages"} />

<OptionList variant="segmented" label="Quality" value={quality} onChange={setQuality} options={…} />

<Meter label="Storage" segments={[
  { value: used, tone: "neutral", label: "Used" },
  { value: incoming, tone: "accent", label: "This download" },
]} max={capacity} start="This device" end="23.4 GB free" />
<Meter label="Downloaded" value={34} />

<Field label="Password" hint="Eight characters or more.">
  <PasswordInput ref={passwordRef} value={pw} onChange={(e) => setPw(e.target.value)} />
  <Meter label="Password strength" max={4} valueText={words[score]}
    segments={[0, 1, 2, 3].map((i) => ({ value: 1, tone: i < score ? "accent" : "neutral" }))} />
</Field>

<ProviderButton provider="discord" brand wide>Continue with Discord</ProviderButton>
<ProviderButton provider="github">{providerLabel("github")}</ProviderButton>
<ProviderButton provider="google" busy>Signing in</ProviderButton>
```

`OptionList` is a group of full-width rows, each a real radio or checkbox inside its label, so the
whole row is the target and a radio group moves with the arrow keys. Without `multiple` it is a
single choice (`value` is the chosen value, the chosen row tinted with the accent); with it,
checkboxes (`value` and what `onChange` receives are the array of chosen values, in `options`
order). An option is `{ value, label, detail, aside, disabled }`: `detail` follows the label in a
quieter tone, `aside` ends the row in monospace. `size` is `md` (52px rows) or `sm` (44px, raised to
48px on a phone). `collapsedAfter` shows that many rows and ends the group with a row revealing the
rest, worded by `moreLabel(hiddenCount)`; a chosen option past the cut stays shown. `variant="segmented"`
lays a short single choice side by side, each label over its `aside`.

`Meter` is a 6px bar. `value` (of `max`, 100 by default) is one accent fill and a progressbar;
`segments` (`{ value, tone, label }`, `tone` one of neutral, accent, success, warn, danger) are parts
laid end to end, a meter whose spoken value names each part unless `valueText` gives one, and a part
above zero is never drawn narrower than a sliver. `start` and `end` are a monospace caption under it.

`Tabs` switches panels that share one place in a page: `Tab`s in a `TabList`, a `TabPanel` per `value`,
the chosen value held by `Tabs` (`value` and `onChange`, or `defaultValue`). It follows the WAI-ARIA
tabs pattern: roving tabindex, arrow keys that move and choose (`activation="manual"` moves focus
only), Home and End. `variant` is `underline` or `segmented`; a `Tab` takes an `icon` and a `count`
drawn as a `Pill`; a row wider than its column scrolls with the chosen tab in view. A panel is
unmounted while hidden unless it has `keepMounted`. `Tabs` never navigates: tabs that are links
between pages are `SubTabs` (a link strip, a native select on a phone) or `TabBar`.

```jsx
<Tabs defaultValue="overview">
  <TabList label="Sections">
    <Tab value="overview" icon="info">Overview</Tab>
    <Tab value="alerts" count={alerts.length}>Alerts</Tab>
  </TabList>
  <TabPanel value="overview">…</TabPanel>
  <TabPanel value="alerts">…</TabPanel>
</Tabs>
```

`RadioGroup` is the compact single choice: `options` (`{ value, label, icon, title, disabled }`), `value`
and `onChange`, `orientation` (`horizontal` or `vertical`), `size` (`sm` or `md`) and `variant`
(`radio` draws a dot before each label, `segmented` one framed strip with the chosen option filled).
It follows the WAI-ARIA radio group pattern: one tab stop on the chosen option, arrow keys that move
to the next enabled option and choose it. Use it for a few short labels beside other controls;
`OptionList` is the choice that is a field of its own, with full-width rows, a `detail` and an `aside`.

```jsx
<RadioGroup label="Quality" value={quality} onChange={setQuality}
  options={[{ value: "auto", label: "Auto" }, { value: "720", label: "720p" }]} />
<RadioGroup variant="segmented" size="sm" label="View" value={view} onChange={setView}
  options={[{ value: "list", label: "List", icon: "list" }, { value: "grid", label: "Grid", icon: "layout-grid" }]} />
```

`Slider` picks one number along a line (`min`, `max`, `step`, `value` and `onChange`, or `defaultValue`)
and follows the WAI-ARIA slider pattern: arrows move by `step`, PageUp and PageDown by a tenth of the
range, Home and End to the ends. A press or drag by mouse, pen or finger moves the thumb, and the page
still scrolls vertically under a finger. `onChangeEnd` receives the final value when a drag is let go
or a key is pressed, for a value too costly to apply on every move. `format(value)` words the value for
`aria-valuetext` and for `showValue`; `marks` draws ticks (numbers, or `{ value, label }`).

```jsx
<Slider label="Volume" value={volume} onChange={setVolume} onChangeEnd={save} format={(v) => v + "%"} showValue />
<Slider label="Memory" min={4} max={32} step={4} value={gb} onChange={setGb}
  marks={[{ value: 4, label: "4" }, { value: 32, label: "32" }]} />
```

`Disclosure` is a summary button, inside a heading of `level`, that shows or hides its content
(`open` and `onOpenChange`, or `defaultOpen`); `summary` is any node, with an `icon` before it and an
`aside` at the row's end. `Accordion` groups Disclosures named by `value`: `type="single"` keeps one
open (`collapsible={false}` keeps it from closing), `type="multiple"` any number. Both follow the
WAI-ARIA disclosure and accordion patterns, and an Accordion's summaries move with Up, Down, Home and
End. The height animates, and does not under reduced motion; closed content stays mounted but out of
the tab order. `variant` is `framed` (a bordered card, one bordered group in an Accordion) or `plain`
(a section head with a rule).

```jsx
<Disclosure summary="Advanced" icon="settings" aside={<Pill size="sm">3</Pill>}>…</Disclosure>
<Accordion type="multiple" value={open} onChange={setOpen}>
  <Disclosure value="network" summary="Network">…</Disclosure>
  <Disclosure value="storage" summary="Storage">…</Disclosure>
</Accordion>
```

`PasswordInput` is an `Input` whose suffix is a ghost `IconButton` (eye, eye-off) that shows or hides
what is typed; `revealLabel` is its accessible name in each state (`["Show password", "Hide
password"]`). Every `Input` prop reaches the input (`size`, `invalid`, `autoComplete`, …) and the ref
reaches it too. How strong a password is stays the site's rule; a `Meter` of four segments draws it.

`ProviderMark` draws a sign-in provider's logo (`discord`, `github`, `google`, `microsoft`; any other
name gets a neutral `log-in` icon) at `size` px, and `providerLabel(provider)` is its name in a
sentence (an unknown provider is its own label). `ProviderButton` is a `Button` with the mark as its
icon and the caller's words as its label; every `Button` prop applies. `brand` fills it with the
provider's colour, through the tokens `--brand-<provider>` and `--on-brand-<provider>`, the same in
every theme; without `brand` it is the neutral button, so several providers sit side by side in a
grid. `busy` swaps the mark for the spinner.

`Pill` is the label every badge is drawn with: `tone` neutral (default), accent, info, ok, warn,
danger or muted; `size` md or sm; `icon` or `dot` (`"live"` for a running thing) before the text.
`NavItem`, `SubTabs`, `TabBar`, `ShowcaseCard` and `BriefCard` draw their count or badge through it
and keep their own class names, so a site's rule on `.k-nav-item__badge--warn` still lands.

```jsx
<Pill tone="warn">3</Pill>
<Pill tone="muted" icon="lock">Locked</Pill>
<Pill tone="ok" dot="live" size="sm">Running</Pill>
```

`List` is a `ul` with the frame and a hairline between rows; a `List` with no rows draws nothing, so
an `EmptyState` stands in. `ListRow` is its `li`: `lead` (an `AccountAvatar`, an `Icon` in a tile),
`title`, `sub`, `meta` (`Pill`s), `aside` (monospace, quiet) and `actions` (`Button`s, `IconButton`s).
With `onOpen` the title is a button, with `href` a link, and its hit area covers the whole row, so
`actions` stay separate targets and a press anywhere else on the row opens it. `selected` tints the row
with the accent, `disabled` dims it and blocks opening, `tone` (accent, ok, info, warn, danger) draws a
thin leading edge. At phone width `meta` and `aside` wrap under the title. `data-*` props reach the `li`.

```jsx
<List label="People">
  <ListRow lead={<AccountAvatar user={user} size={32} />} title={user.name} sub={user.handle}
    meta={<Pill size="sm" tone="info">Operator</Pill>} onOpen={() => open(user)}
    actions={<IconButton variant="ghost" icon="trash-2" label="Remove" onClick={() => remove(user)} />} />
</List>
```

`DataState` draws a read's state and fetches nothing: `loading` draws the `skeleton` the site passes (or
a few Skeleton lines), `error` a danger Notice with a Retry button when `onRetry` is given, an empty
`data` array (or `isEmpty`) the `empty` node or an EmptyState from `emptyTitle` and `emptyBody`, and
otherwise `children`, a node or a function of `data`.

```jsx
<DataState loading={q.loading} error={q.error} onRetry={q.retry} data={q.data}
  emptyTitle="No people yet" emptyAction={<Button onClick={invite}>Invite</Button>}>
  {(people) => <List>{people.map(…)}</List>}
</DataState>
```

`Table` takes `columns` (`key`, `header`, `render`, `width`, `align`, `sortable`, `sortValue`, `mono`,
`hideBelow`, `interactive`) and `rows`. Sorting is controlled through `sort` and `onSortChange`, and
`sortRows(rows, columns, sort)` orders data a site holds whole, null values last. `onRowOpen` (or
`rowHref`) makes the first column's content the row's open control with a hit area over the whole row;
`rowActions` and `interactive` cells stay separate targets. `loading`, `error` and an empty `rows` draw
through `DataState`. At phone width each row is a card with its header as an inline label.

```jsx
<Table label="People" rows={people} rowKey={(p) => p.id} sort={sort} onSortChange={setSort}
  columns={[
    { key: "name", header: "Name", sortable: true },
    { key: "seen", header: "Last seen", sortable: true, mono: true, hideBelow: "tablet" },
    { key: "role", header: "Role", render: (p) => <Pill>{p.role}</Pill> },
  ]}
  onRowOpen={open} rowActions={(p) => <IconButton variant="ghost" icon="trash-2" label="Remove" onClick={() => remove(p)} />} />
```

`StatTile` is one figure: `label`, `value`, `unit`, `delta`, `sub`, `tone`, an optional `icon` and a
`spark` node under the figure. A `null` value draws "—", read as "unknown", never 0. `StatTiles` is the
responsive grid (`min` is the narrowest tile). `Card` frames anything: `title`, `sub`, `icon`,
`actions`, `foot`, `padding`, `tone`, and `onOpen` or `href` to make the whole card open. `Avatar`
takes `src` or the initials of `name`, a `size` (xs to xl), a `shape` and a `status` dot.

```jsx
<StatTiles>
  <StatTile icon="users" label="Online" value={count} sub="of 40 seats" tone="info" />
  <StatTile label="Backup age" value={age} unit="h" tone={age > 24 ? "danger" : "ok"} />
</StatTiles>
<Card title="Release" sub="Stable channel" actions={<Button size="sm">Publish</Button>} foot="Updated today">…</Card>
<Avatar src={user.photo} name={user.name} size="lg" status="ok" statusLabel="Online" />
```

`CardScreen` is the centred card on the page background that sign-in, the wait for approval and a
site's signed-out screens stand on: `mark` (an image URL), `wordmark` and `tagline` above the card,
`foot` under it, `width` `sm` (400px, default) or `md` (520px). It fills the viewport, pads for the
safe areas, and renders no `style` attribute, so a static document under a style-refusing policy can
use its classes (`k-cardscreen`, `k-cardscreen__card`, `__brand`, `__mark`, `__wordmark`,
`__tagline`, `__foot`). Set `--k-cardscreen-height` on an ancestor to size it to a box other than the
viewport. `CopyField` is a read-only `Input` (monospace unless `mono={false}`) whose suffix button
copies the value and shows a check for a moment; `label` names the button, `onCopied(value)` runs
after a copy that worked, every other prop is `Input`'s.

```jsx
<CardScreen mark={mark} wordmark="TheKrystalShip" tagline="Sign in to continue" foot={<a href="/register">Register</a>}>
  <Field label="Password"><PasswordInput wide /></Field>
  <Button variant="primary" size="lg" wide>Sign in</Button>
  <ProviderButton provider="discord" brand wide size="lg">Continue with Discord</ProviderButton>
</CardScreen>
<CopyField value={token} onCopied={() => toast("Copied")} />
```

## Forms

`useForm` holds a form's state and `Form` with its bound fields draws it. Fields are bound by `name`;
a control's own props (`type`, `autoComplete`, `options`, `rows`) go on the `FormField`. Errors show
on the first submit and clear as the value is fixed (`mode` moves the first showing to blur, to blur
then change, or to change). A failed submit puts focus on the first invalid field.

```jsx
function SignIn({ signIn }) {
  const form = useForm({
    defaultValues: { username: "", password: "" },
    rules: {
      username: { required: "Enter your username" },
      password: { required: "Enter your password" },
    },
    // A refusal returns { errors: { field: "text" }, message: "text" } or throws an error carrying
    // them; a thrown error without `errors` shows its message as the form error.
    onSubmit: async (values) => {
      const r = await signIn(values);
      if (!r.ok) return { message: r.error };
    },
  });
  return (
    <Form form={form}>
      <FormField name="username" label="Username" autoComplete="username" />
      <FormField name="password" label="Password" control="password" />
      <FormSubmit busyLabel="Signing in…" wide>Sign in</FormSubmit>
    </Form>
  );
}
```

`control` is `input` (the default), `password`, `textarea`, `select`, `checkbox`, `toggle` or `options`,
or a function receiving `{ value, onChange, onBlur, invalid, describedBy }` for a custom control. The
form-level error draws above the fields; `<FormError />` places it elsewhere. A dialog that is itself
the form element wraps in `<FormScope form={form}>` and passes `onSubmit={form.submit}`. `FormSubmit`
is busy while submitting, and with `requireDirty` waits for a change. `form.values`, `isDirty`,
`isSubmitting`, `errors`, `setValue` and `reset` serve what a site draws around the fields.

## Pages and dialogs

```jsx
<PageHeader title="Settings" actions={<Button icon="plus">New</Button>} />
<Notice tone="danger">{error}</Notice>

<EmptyState page tone="warn" icon="user-x" title="No access"
  actions={<Button variant="outline" icon="log-out" onClick={signOut}>Sign out</Button>}>
  <p>This account holds nothing here.</p>
</EmptyState>

<ErrorBoundary>
  <App />
</ErrorBoundary>

<Dialog title="Edit this memory" icon="brain" sub="You wrote this one." size="xl" fill
  onClose={close} canClose={!saving}
  foot={<><Button variant="outline" onClick={close}>Cancel</Button><Button variant="primary" onClick={save}>Save</Button></>}>
  <Field label="Summary"><Input wide value={summary} onChange={…} /></Field>
</Dialog>
```

`Notice` is a line a page says about itself, in a `tone` of info, ok, warn or danger. `EmptyState`
is what a place shows when it has nothing else to; with `page` it is the whole screen, on a card,
for a site with nothing else to draw. `ErrorBoundary` catches what throws while its children
render and shows `fallback` (a node, or `(reset, error) => node`), or without one a whole-screen
crash with a reload. `Modal` is the overlay primitive: a portaled scrim whose content is a dialog. Focus moves into it
(the `data-autofocus` or `autoFocus` element, else the first focusable, else the sheet) and Tab stays
inside it; focus returns to the opener on close; every other child of `<body>` is `inert` while it is
the topmost modal (a body child marked `data-inert-exempt` stays live, as the toast region does);
Escape and a press on the scrim close it unless `canClose` is false. Open modals stack, so Escape closes
only the topmost, and the chat's history sheet and picture viewer behave the same way. `Dialog` is a
framed sheet on `Modal`: `size` is md (520px), lg (720px) or xl
(960px), `fill` gives it a definite height for a body that sizes itself to its container, `as="form"`
with `onSubmit` makes the sheet a form, and `art` draws a banner above the head.

### Layout, keys and drawers

```jsx
<Container size="lg" as="main">
  <Stack gap="lg">
    <Cluster gap={2} justify="between">
      <h1>Library</h1>
      <span>Press <Kbd keys={["Ctrl", "K"]} /> to search</span>
    </Cluster>
    <Grid min={260} gap={4}>{cards}</Grid>
  </Stack>
</Container>

{narrow
  ? <Drawer title="Download" onClose={close} foot={<Button onClick={go}>Save</Button>}>{body}</Drawer>
  : <Dialog title="Download" onClose={close} foot={<Button onClick={go}>Save</Button>}>{body}</Dialog>}
```

`gap` is a step of the spacing scale (`--s-N`) or a name for one (`xs` 1, `sm` 2, `md` 4, `lg` 6, `xl` 8).
A `Drawer` takes `side="right"` or `"left"` for a panel at the screen's edge; on touch its head is
the grip a pull toward the edge closes it by.

## Panels that float

`Popover` is a non-modal panel anchored to a trigger, for content that is more than a list of
commands: a filter form, a notification list. It is the non-modal dialog pattern. `trigger` is one
element, which the Popover clones with its ref, `aria-expanded`, `aria-controls` and a toggling click;
without one the caller controls `open` and `onOpenChange` and names the element in `anchorRef`.
`title` is the heading and the accessible name (`label` names a panel with no heading), `placement` is
the preferred side, and `children` may be a function receiving `{ close }`. Focus moves into the panel
on open; Escape (marked handled, so a dialog around it stays open) closes it and returns focus to the
trigger, and so does Tab past either end of the panel. A press outside closes it. Every floating
panel is portaled to the body and placed by Floating UI.

```jsx
<Popover trigger={<Button variant="outline" icon="sliders-horizontal">Filters</Button>} title="Filters">
  {({ close }) => (<><FilterForm /><Button onClick={close}>Done</Button></>)}
</Popover>
```

`Tooltip` is a text label for a control: `<Tooltip label="Delete"><IconButton … /></Tooltip>`. It shows
when a mouse or pen rests on the child (after `delay`) and when the child takes keyboard focus, never
for a touch, and hides on leave, blur, a press and Escape (marked handled, so a dialog around it
stays open). The child is cloned with `aria-describedby` while the tip shows; the tip is text only
and never a pointer target. `IconButton` draws its `label` through it.

`Menu` is a list of commands opened from a button (the menu button pattern): `trigger` is the button,
the children are `MenuItem` (`icon`, `onSelect`, `disabled`, `tone="danger"`, `shortcut`, `aside`),
`MenuCheckboxItem` (`checked`, `onCheckedChange`), `MenuRadioGroup` (`value`, `onChange`) of
`MenuRadioItem`s (`value`), `MenuGroup` (`label`) and `MenuSeparator`. The arrows move with wrap,
Home and End jump, a typed letter moves to the next label starting with it, Enter and Space select
and close (a checkbox item stays open; `closeOnSelect` overrides; `event.preventDefault()` in
`onSelect` keeps it open), Escape closes and returns focus to the trigger. `header` draws a line of
context above the items and `matchWidth` makes the panel at least as wide as the trigger. The sidebar's
account menu and the toolbar's sort menu are Menus.

```jsx
<Menu trigger={<Button variant="outline">Actions</Button>}>
  <MenuItem icon="pencil" shortcut="R" onSelect={rename}>Rename</MenuItem>
  <MenuSeparator />
  <MenuItem icon="trash-2" tone="danger" onSelect={remove}>Delete</MenuItem>
</Menu>
```

`Combobox` is a text field that filters a list and picks one (the editable combobox with a listbox
popup). `options` are `{ value, label, detail, disabled }` (`label` is a string, shown in the field once
chosen); `value` and `onChange(value, option)` hold the choice. A site that searches a server owns the
text with `inputValue` and `onInputChange`, passes the matches back as `options`, and sets
`filter={false}`; `loading` shows a spinner, `empty` words the no-match line. The input keeps focus
and names the highlighted option with `aria-activedescendant`; ArrowDown and ArrowUp move it, Enter
picks, Escape closes then clears. It takes `Input`'s `size`, `invalid`, `wide` and `className`.

```jsx
<Field label="Game">
  <Combobox wide options={games} value={game} onChange={setGame} placeholder="Choose a game" />
</Field>
```

## The frame

A site is a sidebar beside a scrolling main column, with a dock that slides in from the right:

```jsx
const [collapsed, setCollapsed] = useStoredFlag("site:sidebar:collapsed");
const [drawerOpen, setDrawerOpen] = React.useState(false);
const dock = useDock({ storageKey: "site:dock" });
useEdgeSwipe(drawerOpen, setDrawerOpen, dock.open, dock.setOpen);

<AppShell
  collapsed={collapsed}
  drawerOpen={drawerOpen}
  onDrawer={setDrawerOpen}
  dockPush={dock.pushing ? dock.width : 0}
  sidebar={
    <Sidebar mark="/mark.png" wordmark="Site" open={drawerOpen}
      collapsed={dock.desktop && collapsed} onToggleCollapse={() => setCollapsed(c => !c)}
      top={<label className="k-sidebar__search">…</label>}
      closeNav
      foot={<>
        <NavItem icon="settings" label="Settings" onClick={…} />
        <SidebarAccount user={user} sub="@name" collapsed={dock.desktop && collapsed}
          items={[{ icon: "log-out", label: "Sign out", danger: true, onClick: … }]} />
      </>}>
      <SidebarGroup>
        <NavItem icon="home" label="Home" active onClick={…} />
      </SidebarGroup>
      <SidebarGroup label="More">
        <NavItem icon="clock" label="Leaving soon" badge={3} tone="warn" onClick={…} />
      </SidebarGroup>
    </Sidebar>
  }
  aside={<>
    <Dock dock={dock}>{dock.open && <Chat />}</Dock>
    {!dock.open && <DockFab onClick={() => dock.setOpen(true)} />}
  </>}>
  <Page />
</AppShell>
```

Wide screens collapse the sidebar to an icon rail; phones get it as a drawer, opened by the
left-edge handle or a swipe. A pinned dock pushes the page over while the page keeps
`contentFloor` pixels (1000 by default) and floats over it otherwise.

A site can give phones a row of tabs along the bottom edge instead of the drawer, by passing
`tabBar`. On a phone the sidebar, its handle and the dock's launcher are then not drawn, the main
column scrolls clear of the bar, and an open dock ends above it, so the bar stays the way out of
it; the site opens the dock from a tab of its own. Wide screens keep the sidebar and draw no bar.

```jsx
<AppShell
  …
  tabBar={
    <TabBar items={[
      { id: "home", icon: "house", label: "Home", active: page === "home" && !dock.open, onClick: … },
      { id: "assistant", icon: "bot", label: "Assistant", active: dock.open, onClick: () => dock.setOpen(true) },
      { id: "me", icon: "user", label: "Me", badge: 2, tone: "warn", onClick: … },
    ]} />
  }>
```

`styles/tabbar.css` sits after `dock.css` and `footer.css`, whose phone rules it adjusts.

## On a television

A site drawn on a television, driven by a remote, sets `data-tv` on its root element. Focus then
lifts what it is on: a card grows and rises on `--shadow-lift` with a hairline and `--glow-accent`
while the other cards in its row dim, at once rather than over a transition, and a `Button`, a place in the bar or anything marked `k-tv-pill`
turns into a light pill with dark ink. Anything else focusable takes the hairline and the light. A
primary button's ink is dark on the accent, and `Rail` draws no scroll arrows, since a row scrolls to
whatever takes focus in it.

The parts a television page is built from, in `components/Tv.jsx`:

- `TvBar` — the strip across the top: `mark`, `name`, `items` (`{id, label, active, href, onClick}`,
  the active one `aria-current`) and `actions` at its right, among them `TvBarButton`s (an icon, or
  `children` such as an avatar, and a `dot`). `hidden` slides it away.
- `TvBackdrop` — artwork behind the page, at its right, fading into the canvas; a new `src` is loaded
  before it fades in over the last. `size` is `tall`, `short` or `page`.
- `TvSpotlight` — `eyebrow`, `title`, `meta` and `children`; `size` `lg` opens a page and `md` sits
  above a row, its name on one line. `k-tv-spot__overview` and `k-tv-spot__actions` place a story and buttons.
- `TvRow` — a heading with `icon`, `title` and `count`, then its cards and `end`, running past the
  right margin; it is a `data-tv-row`, which a site's navigator can place on a line.
- `TvCard` — a picture that is a link, `poster` or `wide`, with `progress` and a `badge`; every
  other prop reaches the link. A card off the screen is skipped (`content-visibility: auto`) until it
  nears it, so a page of rows styles and paints only what shows. `TvTile` ends a row: an icon over a few words, the cards' size.

`--tv-margin-x` and `--tv-margin-y` are the margins a television may crop, and the card sizes are
tokens beside them. Moving focus with the remote's arrows is the site's. `styles/tv.css` is the last
sheet, after everything whose focus it overrides.

## The assistant chat

`@thekrystalship/krystal-chat` holds it. `Chat` is a conversation with one assistant over the assistant wire contract
(`tks-assistant/docs/wire-contract.md`): turns streamed over Server-Sent Events, proposed actions
confirmed or declined by their handle, questions the assistant asks answered as the next turn, the
conversation list kept in step with the assistant's, voice notes, pictures and text files attached to
a message, and a read-only review of somebody else's conversation. It holds no credential and knows no product:

```jsx
const client = createAssistantClient({ baseUrl: "/assistant", getToken: () => session.token() });

<Chat
  user={user}
  docked
  assistantHost={{ id: "cinema", name: "Cinema", title: "the cinema's assistant" }}
  clientFor={() => client}
  authed={signedIn}
  connection={{ tone: "online", label: "Connected", usable: true }}
  storageKey="cinema:chat:conversations"
  suggestions={["What's leaving this week?", "Find me something like Heat"]}
  primer="I can find films, put one on, and fetch what isn't here yet."
  profile={cinemaProfile}
  renderCards={(msg, api) => <FilmCards cards={msg.cards} />} />
```

The window is drawn in three shapes: text in the column, a card, and a one-line event row. Your
messages are bubbles on the right; an answer is text on the left, its name shown once per run. The
assistant's work — thinking, the tools it used, a long tool's own steps — is one Activity line above
the answer (`ChatActivity`), live while it runs and a closed summary with its duration after. The
answer's markdown covers headings, lists, tables, links, quotes and code blocks with a copy button.
A proposed action is one card that changes in place, from proposed through the confirm step to
verified, not verified or failed; a `write_file` proposal shows a line diff when the proposal carries
the file's current content. Switches, scope changes, compaction and the assistant coming and going
are event rows (`ChatEvent`), with a day row where the date changes. The composer's switches are
labelled toggle buttons, and a single options menu where the composer is narrower than 560px (a
dock, a phone).

`profile` is how the product reads what the assistant sends: `adaptCard(result)` turns a tool's
structured result into a card for `renderCards`, `proposal(msg)` names a proposed action and says
whether this surface can redeem it — with an optional `title` where its button label does not read
ahead of the target — and `verdict(msg, name, response)` words its outcome; a verdict's `tone`
(`"warn"` ran but its end state was not seen, `"danger"` failed) picks how a card that did not
succeed reads.
`renderEntry` draws transcript roles of the product's own, and `turnExtras()` adds fields to the
next turn. `clientFor` is called with the assistant's id, and must be stable across renders.

**The client.** `createAssistantClient({ baseUrl, getToken, renewToken, canRenew })` is the one browser
client of the wire contract, and is also an import-free subpath for code that runs outside a browser
(`@thekrystalship/krystal-chat/lib/assistantClient`). `baseUrl` is a string or a function asked on every
call, so a site that resolves where each assistant is throws its own error when there is none.
`getToken` answers the bearer; `renewToken()` and `canRenew()`, when given, renew it as each call
allows: a call that may be sent twice (a read, a delete, a memory write, a transcription, an
attachment read) is renewed and sent again when refused 401, and a call that must not be (a turn, a
confirmation, a command, a stop, an upload) is never sent again, its bearer renewed before it when the
JWT's `exp` has passed. A turn carries a message id and is picked up again from its last frame when the
connection drops; the event stream reopens from its last position and opens with a `hello`; the lists
the contract wraps come back as arrays; a refusal is an Error with `status`, `envCode` and
`userMessage`. `request(method, path, body, opts)` reaches a route of the product's own beside the
contract's with the same renewal. A site with several assistants makes one client per assistant and
hands the same one to the chat on every render.

A site's own client is the same shape, and the chat reads its members only where they are present:
`declines: true` gives a proposal card a Decline button, `wakeSpeech()` is called when the microphone
opens, `turns()` with `follow(turnId, { signal, onEvent })` reads the turns the person has open on any
surface, and `attach` and `streamId` serve an assistant whose event stream names itself in a `hello`.
A `question` frame is drawn as choices and a field for the person's own words, and the answers go out
as the next turn's `answers`.

**Attachments.** A client with `attachmentLimits()`, `uploadAttachment(blob, name, { onProgress, signal })`
and `attachment(conversationId, id)` (a Promise of a Blob) lets a person attach files: `+` at the
composer's left opens a menu of two pickers, *Picture* (`image/*`, which on a phone is its photos and
camera) and *File* (any file, refused on its chip when it is neither a picture nor text); where the
assistant reads no pictures, `+` opens the file picker at once. *File* is the File System Access picker
(`showOpenFilePicker`) where the browser has it and the chat is not framed by another origin, because
Chrome on Android opens that one as the phone's file browser and an `<input type=file>` as the camera
and the photos alone; elsewhere it is the file input. A file pasted or dropped on the composer is
taken the same way. A picture is shrunk to 2048 pixels on its longer side
in the browser and written as the smaller of PNG and JPEG, under about 3 MB, and is never refused for
its size; a text file is read and counted as the assistant counts it. Each is uploaded as soon as it
is attached, as a chip with its progress, and a file the assistant could not take says why on its
chip. Sent, the message carries its pictures as thumbnails that open full size and its text files as
chips. A reviewed transcript shows its attachments through the site's
`loadReviewAttachment(hostId, conversationId, attachment)`, beside `loadTranscript`, the conversation
named as the site's review listing names it; the client's own is
`reviewAttachment(person, conversationId, attachmentId)`. The rules are `wire-contract.md` §2.2, and the
functions that prepare a file are `prepareAttachment`, `acceptFor`, `textOverLimit` and `sizeLabel`.

A site whose frame has a sidebar can keep the conversation list there: `railTarget` is the element
the list is drawn into, and the chat takes the whole width. `pageClass="k-chat-page--framed"` makes the
chat fill an `AppShell`'s main column. When the site shows something other than the chat while the
list stays in view, `onShowConversation` tells it the person opened or started a conversation, and
`conversationShown` says whether the chat is what is on screen, so the sidebar lights the open one
only then. `listTarget` is a page of the site's own — a phone's tab of conversations — where the same
list is drawn full width, with New chat above it and the open conversation marked. A chat whose list
a site draws elsewhere carries no history popover in its header.

`layout` is where the chat stands. `"panel"`, the default, is a panel beside or over a page: its own
surface, framed, with a dock's window buttons. `"page"` is the chat as the whole page, as a phone's
tab opens it: it stands on the page's background with no frame, its header has a way back to the
empty conversation and the conversation list as a sheet, its opening suggestions are a row of chips
over a one-row composer, and while the person writes the site's tab bar gives its room to the
keyboard. Give a page `pageClass="k-chat-page--framed"` as well, to fill the column.

`slots` puts a site's own blocks in the chat's frame, by place: `start` is the empty conversation's
column, `aboveComposer` a row over the composer, `headerActions` buttons in the header and `history`
the head of the conversation list. A slot is a node or a function of the chat's handle, and any
block inside the chat reads the same handle with `useChat()`: the `layout`, whether the conversation
is `empty` and the assistant `usable`, the `conversations`, and `ask(text)` to send a turn,
`draft(text)` to leave words in the composer for the person to finish, `newChat()` and `open(id)`.
A place left empty draws the chat's own blocks, which are exported for a site composing its own:
`ChatGreeting`, `ChatSuggestions` (a grid, each one drafted), `ChatSuggestionChips` (a row, each one
sent), `ChatRecent` and `ChatPrivacyNote`, with `ChatBlock` to set a site's block in the column. The
chat fetches nothing for a block; the site's block brings its own data.

```jsx
<Chat
  slots={{
    start: (chat) => (
      <>
        <ChatGreeting />
        <ChatSuggestions />
        <ChatBlock><Alerts onPick={(alert) => chat.draft(alert.prompt)} /></ChatBlock>
        <ChatRecent />
        <ChatPrivacyNote />
      </>
    ),
  }} />
```

`ChatCard` is the card a product draws under an answer: an icon tile in a `tone` (neutral, accent,
ok, warn, danger, muted), a title with a `sub` line, a `confidence` mark (confirmed, likely,
possible), and `onOpen` with `openLabel` for the way to the full context, or any `action` node. Its
body is the product's, and `ChatCardRows` / `ChatCardRow` give it the one row grammar every card
shares: `label`, `value`, a `verdict` mark (ok, warn, danger, neutral) and an optional `action`;
leaving out `label` makes a full-width row.

## The assistant's pages

What a person does around the conversation — reading what the assistant remembers, seeing what it
can do, being told when it waits on them — is the same on every site that hosts an assistant, so the
pages are here. Each takes the assistant client (`createAssistantClient`, stable across renders) and
names no product:

```jsx
<AssistantChatsPage listRef={setListEl} />          // Chat's `listTarget`, as a page
<AssistantMemoryPage client={client} />
<AssistantSkillsPage client={client} onUse={(name) => seedComposer("/" + name + " ")} />
<AssistantNotifications client={client}>
  <Notice>Where everything else you are told about is switched.</Notice>
</AssistantNotifications>
```

`AssistantMemory` is the Memory page's section on its own, for a site's own settings page: the list
from `/memories` with its counts against `/memories/limits`, each memory editable in
`AssistantMemoryEditor` (a `Dialog`) and forgettable in place. With no `client` it shows
`unavailable`, the site's own words for why there is nothing to read; `whose` names the assistant in
its line where a site talks to more than one; `BodyEditor` (a component taking
`{ value, onChange, path, readOnly }`, lazy if it likes) draws a memory's body in place of the plain
text area, and `keyPlaceholder` is a new memory's example name. `AssistantSkillsPage` lists
`/commands` and `/tools`, already filtered to the caller, and offers a command through `onUse`.
`AssistantNotifications` is this browser's push subscription to the assistant, on and off, over
`lib/pushBrowser`; `offSub` is its sentence when the assistant sends nothing at all.
`assistantPushStatus`, `assistantPushSubscribe` and `assistantPushUnsubscribe` are the same calls
without the section.

The pages sit at a reading measure (`.k-assistant-page`); `styles/assistant-pages.css` draws it and
the memory editor, after `settings.css`.

## Keeping a site inside the system

Core ships an ESLint config and a Stylelint config. Both are optional peers (`eslint` 9, `stylelint`
16): a site that installs neither pulls nothing in. Findings are warnings by default; a site whose code
is clean raises them to errors.

```js
// eslint.config.js
import krystal, { configs } from "@thekrystalship/krystal/eslint";
export default [
  ...krystal,                       // warnings; ...configs.strict for errors
  // the site's own entries
];
```

The ESLint rules are core's `no-restricted-syntax` and `no-restricted-imports`; a later entry of the
site's own config for either rule replaces these. A site that sets its own restrictions merges the
entries, which the config exports as `restrictedSyntax` (an array of `{ selector, message }`) and
`restrictedImports` (`{ paths, patterns }`), so the rule carries one severity of the site's choosing:

```js
import { restrictedSyntax, restrictedImports } from "@thekrystalship/krystal/eslint";
export default [
  {
    files: ["src/**/*.{js,jsx}"],
    rules: {
      "no-restricted-syntax": ["error", ...mySelectors, ...restrictedSyntax],
      "no-restricted-imports": ["error", {
        paths: [...myPaths, ...restrictedImports.paths],
        patterns: [...myPatterns, ...restrictedImports.patterns],
      }],
    },
  },
];
```

The entries report:

- a raw `<button>`, `<input>`, `<select>`, `<textarea>` or `<dialog>`, naming the component to use
  (Button or IconButton; Input, Checkbox or Toggle; Select; Textarea; Dialog or Modal);
- a literal colour (hex, `rgb()`, `hsl()` and the other colour functions, a named colour) in the
  `color`, `background`, `backgroundColor`, `borderColor`, `fill` or `stroke` of an inline `style`;
- an import of `@floating-ui/*` or `react-hook-form`, which the package wraps.

```js
// stylelint.config.js
export default { extends: ["@thekrystalship/krystal/stylelint"] };   // defaultSeverity: "error" raises them
```

The Stylelint rules report a hex colour, a colour function or a named colour outside `transparent`,
`currentColor` and the CSS-wide keywords (neutral black and white stay allowed in `box-shadow`,
`text-shadow`, `filter` and masks, and a colour keyword inside a function such as `color-mix()`), a
`border-radius` that is not `var(--r-*)`, `0`, `50%`, `100%` or `inherit`, and a four-sided `border`
that is not `var(--edge*)`, `none`, `0` or transparent. Whether a one-sided hairline is a surface
outline is a judgement the rules cannot make, so `border-top: 1px solid var(--border-subtle)` is left
to review.

The package's own sources are where the raw elements are wrapped, so neither config applies to them.

## Adding a palette

A palette is a sheet with a `[data-theme="<id>"]` block, loaded after the package's `styles.css`. It
defines every colour token `theme-contract.json` lists as `required`, declares `color-scheme: light` or
`color-scheme: dark`, and may re-value the `optional` ink tokens (`--on-*`) and the `structural` set
(corner radius, edge, elevation, focus ring, UI font, motion). It cannot re-value anything else: the
type scale, spacing, layout metrics and sign-in brand colours are the same in every palette.

```css
[data-theme="harbour"] {
  color-scheme: dark;
  --canvas: #0f1720;
  /* … every required token … */
  --r-sm: 2px;                      /* structural, optional */
}
```

The site registers the palette with the theme store, before its first render, with an entry shaped
like those of `THEME_OPTS`:

```js
import { registerThemes } from "@thekrystalship/krystal";
registerThemes([{ id: "harbour", label: "Harbour", mode: "dark" }]);
```

The theme picker lists it, and a stored preference naming it takes effect. `mode` is the palette's own
light or dark character and matches the `color-scheme` its block declares.

`krystal-check-theme` reads the `[data-theme]` blocks of the sheets it is given and fails on a missing
required token, a token outside the permitted set, a missing `color-scheme`, and any `--on-*` ink under
4.5:1 on its fill. A token a block does not define resolves against the package's `tokens.css`, as it
does in the page.

```json
{ "scripts": { "check:theme": "krystal-check-theme src/styles/harbour.css" } }
```

## Developing

```bash
npm install          # one install at the root links both packages
npm run lint
npm run check:markdown   # the composer's highlighter emits every character exactly once
npm run check:themes     # native controls take the light scheme on exactly the light palettes
npm run check:tokens     # every var() resolves; no literal colour or radius outside tokens.css
npm run check:contrast   # every --on-* ink reads on its fill at 4.5:1 in every palette
npm run check:contract   # theme-contract.json describes tokens.css and every built-in palette
npm run check:palettes   # krystal-check-theme over the package's own tokens.css
npm run check:types      # builds core, then tsc --checkJs over both packages
npm run build        # core, then the chat → packages/*/dist, one ES module per source file
npm run play -- --port 5211   # the playground, both packages from source
```

Publishing is per package, from its directory: `npm publish -w @thekrystalship/krystal`, then
`-w @thekrystalship/krystal-chat` (each builds first through `prepack`; a published version is
permanent). `npm publish --tag dev` is a prerelease.

Iterate with prerelease versions (`0.2.0-dev.1`, `-dev.2`, …) and bump each consumer's pins to the
one it was checked against. The chat's peer on core is the same version as its own.
