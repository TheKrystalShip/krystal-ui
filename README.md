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

```js
import "@thekrystalship/krystal/styles.css";
import { Button } from "@thekrystalship/krystal";
```

`npm run play` serves the documentation: a page per component with its live examples, props, keys and
screen-reader behaviour, the token reference, and the guides. The guides are `docs/getting-started.md`
(install, imports, the cascade layers, the lint configs, adding a palette) and
`docs/migrating-to-tks-krystal.md`.

## What is in it

`@thekrystalship/krystal`:

| Kind | Exports |
|---|---|
| The frame | `AppShell`, `Sidebar`, `SidebarGroup`, `NavItem` (`badge`, `tone`, and `compact` with an `aside` node for the sub-rows under a group: the icon on a tile, a smaller label, the tile alone on the rail), `SidebarAccount` (the person's avatar and name, opening the account menu every site shares: Profile, Settings, the site's own `items`, a rule and Sign out), `MobileNavToggle`, `TabBar`, `useStoredFlag`, `useEdgeSwipe` |
| The dock | `Dock`, `DockFab`, `useDock` |
| Banners | `Hero` (`cinematic`, or `variant="card"`: the bordered veil card), and the parts its content is drawn from: `HeroStatus`, `HeroBody`, `HeroHeading`, `HeroName`, `HeroTags`, `HeroTag` (`glass`, `verbatim`, `icon`), `HeroBar`, `HeroGroup`, `HeroDivider`, `HeroNote` (a line on the art), `HeroButton` |
| The footer | `Footer` (brand block, link groups, bar), `GithubMark` |
| Cards and lists | `BriefCard` (with `BriefList`, `BriefItem` (a row: `tone`, `icon`, `title`, `escalated` for a row that needs a person, `controls` at its end, `detail`, `action`, a button with `onClick` or a link with `href`), `BriefEmpty` and `FactList` for its body), `ShowcaseCard` (key art, three facts, a status and an action, with optional round `tools` on the art, a `ribbon` hanging from its top edge for keeping the thing, an `eyebrow` above the name saying what kind of thing it is, and along its foot a `progress` bar or one short bar per part in `segments`), `CollectionTile` (a set of titles as a link: `fan` draws three posters fanned beside its mark and name, `strip` its posters in order, numbered, and with `total` and `watched` follows somebody through it; it fills its slot at a fixed shape and takes a TvCard's focus on a television), `Rail`, `Shelf` (a titled section laying its items out in a grid on the page: a heading, a `sub` line, an `action` opposite such as View all, a `controls` row, `columns` across and `narrowColumns` once the shelf is narrow, an `empty` node), `Pagination`, `Breadcrumbs` (a one-line trail of real links that ellipsizes at phone width; the site computes the `items`, `onNavigate` lets a single-page site take a plain click), `SubTabs`, `Steps` (where somebody is in a sequence they can move around in: a numbered `rail` with each step's label and detail, or `dots`), `SearchField` (a large pill: icon, input and a submit button in one frame, a `form` that calls `onSubmit(value)`), `Toolbar` (+ `ToolbarSearch`, `ToolbarFilters`, `ToolbarSort`, `ToolbarButton`, `ToolbarCount`, `ToolbarSpacer`, `useFilters`) |
| Slides | `useCarousel` (one of several slides at a time, turning by itself on an interval: held still under a mouse, under keyboard focus, on a hidden page and while `paused`, never turning by itself under reduced motion, its time started over by a key or a press in it, and turned by a swipe), `CarouselPager` (a mark a slide, the shown one filling over the slide's time; `indicator` for a television, where the marks are not focused) |
| Labels | `Pill` (a count, a state or a kind as a small non-interactive label), `Kbd` (a key, or a chord with `keys`, in mono) |
| Layout | `Stack` (a column), `Cluster` (a wrapping row), `Grid` (columns of a `min` width, or `cols`), `Container` (the centred page column, `size` sm to xl or full); each takes `gap` as a spacing step or `xs` to `xl`, and `as` |
| Lists | `List`, `ListRow` (a framed list of rows with a lead, pills, an aside and actions) |
| Data | `Table` (a real table with sortable headers, rows that open, row actions and a card per row at phone width), `sortRows`, `StatTile` and `StatTiles` (one measured figure, and the grid of them), `Card` (a framed surface with a head, a foot and an optional open target), `DataState` (draws loading, failed, empty or loaded from what the site says) |
| Sign-in screens | `CardScreen` (the centred card on the page background), `CopyField` (a read-only value with a copy button) |
| Sign-in | `ProviderMark`, `providerLabel`, `ProviderButton` (a provider's mark and name, and a button carrying them) |
| Forms | `useForm` (values, per-field rules and async `validate`, dirty and submitting state, server field errors from a returned or thrown `{ errors, message }`), `Form`, `FormScope`, `FormField`, `FormError`, `FormSubmit` |
| Choices | `Tabs`, `TabList`, `Tab`, `TabPanel` (in-page panels behind a row of tabs), `RadioGroup` (a small single choice, inline or stacked, or a palette of swatches), `ColorInput` (the native colour picker as a round swatch), `Slider` (one number along a line), `Disclosure` and `Accordion` (a summary that opens its content, and a group of them) |
| Controls | `Button` (`variant="bare"` draws no fill, border, padding or height, only a button's behaviour and focus ring, for a control the site's own class shapes), `IconButton`, `Spinner`, `Toggle`, `Input`, `PasswordInput`, `Textarea`, `Checkbox`, `Field`, `Select`, `Combobox`, `OptionList`, `DateTimePicker` and `DatePicker` (a field that opens a picker: a Popover on a desktop, a bottom Drawer on a phone), `Calendar` (a month to pick a day from), `TimeGrid` (times of day as buttons, from the next step after now), `TimeInput` (a 24-hour time typed as two spin buttons), `Meter`, `StatusDot` (a lit dot in a tone, always named by `label`; `pulse` for live, `caption` for the age or state beside it) |
| Page furniture | `PageHeader`, `Notice` (`title` a strong first line in the tone's colour over the message in the body's; `block` stacks its children in a full-width text column), `EmptyState`, `ErrorBoundary` |
| Settings furniture | `SettingsSection`, `SettingsRow` (`value` and `mono` draw a read-only figure in the control's place), `ThemePicker` |
| Overlays | `Dialog`, `ConfirmDialog`, `FormDialog` (a dialog that is a `useForm` handle's form), `Drawer` (a modal sheet from the `bottom`, `right` or `left` edge, with Dialog's props, a drag handle, touch pull-to-dismiss, and `back`, `action`, `contained`, `role` and `theme` for a menu over a frame), `Modal`, `Popover`, `Tooltip`, `Menu` (+ `MenuItem`, `MenuCheckboxItem`, `MenuRadioGroup`, `MenuRadioItem`, `MenuGroup`, `MenuSeparator`), `ReversablePortal`, `usePortalPopover`, `useModalBehaviour` |
| Page patterns | `ListPage` (heading, toolbar, rows, table or grid, pager and the loading, failed and empty states, from the site's data and flags), `DetailPage` (crumbs, a head or a Hero, tabs, an aside column and the whole-page loading, failed and not-found states), `SettingsPage` (sections of rows, a side nav that becomes a select at phone width, and a save bar that follows a form's dirty state), `SignInScreen` (the sign-in card: providers, a username and password form on the form layer, a refusal and a foot) |
| Loading | `Skeleton` (one shimmering placeholder block, laid out by the site in the footprint its content will take; still under reduced motion) |
| Feeds | `useFollowTail` (keeps a scrolling feed pinned to its bottom while the reader is there, counts what arrives while they are parked) |
| Telling a person | `Toasts` and `toast` (the outcome of what a person just did: a live stack, no history), `NotificationTray`, `NotificationList`, `NotificationSettings`, `createNotificationsClient`, `createNotificationInbox` (what a person is told, kept by the product's server) |
| The splash | `holdSplash` (keeps the splash up until the function it hands back is called), `settleSplash` (lets it go a frame after a commit nothing holds it through), `SPLASH_CAP_MS` |
| Marks | `Icon` (Lucide, by kebab-case name), `Avatar` (an image or initials, with a status dot), `AccountAvatar`, `AssistantFabIcon` |
| State and helpers | `createStore`/`useStore`, `themeStore` + `THEME_OPTS` + `registerThemes` + `themeConfig`, `copyText`, `pushBrowser`, `fmtRelative`, and `lib/datetime` (the local date, time and moment keys the date controls read and write, and `nextStep`) |

`@thekrystalship/krystal-chat`:

| Kind | Exports |
|---|---|
| The assistant chat | `Chat`, `createAssistantClient`, `useConversationStream`, `ChatCard` (the card a product draws under an answer) with `ChatCardRows`, `ChatCardRow` and `ConfidenceBadge`, the parts it is drawn from (`ChatThread`, `ChatMessage`, `ChatEvidence` (the column of evidence cards under an answer), `ChatActivity`, `ChatCommand` (a proposal's card; the profile's `proposal` may give its `body`, `sub` and `declineLabel`), `ChatEvent`, `ChatEventRow`, `ChatDaySeparator`, `ChatFileChange`, `MarkdownTextarea`, `useVoiceRecorder`, …), hands-free listening (`useHandsFree`, `createTriggerListener`, `matchTrigger`, `openMicrophone`, …) and the conversation functions (`reduceTurnFrame`, `scaffoldHistory`, `mergeServerConversations`, …) |
| The assistant's pages | `AssistantPage` (the reading-measure column a page about the assistant stands in), `AssistantChatsPage` |

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
| `Input`, `Select`, `TimeInput`, `DateTimePicker`, `DatePicker` | | 30 | 34 | 38 | |

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
(`radio` draws a dot before each label, `segmented` one framed strip with the chosen option filled,
`swatch` a round disc of each option's `color`, named by its `label`, with `picker` adding a `ColorInput`
after them for a colour outside the palette). `ColorInput` is the browser's colour picker as a round swatch.
It follows the WAI-ARIA radio group pattern: one tab stop on the chosen option, arrow keys that move
to the next enabled option and choose it. Use it for a few short labels beside other controls;
`OptionList` is the choice that is a field of its own, with full-width rows, a `detail` and an `aside`.

```jsx
<RadioGroup label="Quality" value={quality} onChange={setQuality}
  options={[{ value: "auto", label: "Auto" }, { value: "720", label: "720p" }]} />
<RadioGroup variant="segmented" size="sm" label="View" value={view} onChange={setView}
  options={[{ value: "list", label: "List", icon: "list" }, { value: "grid", label: "Grid", icon: "layout-grid" }]} />
```

`SearchField` is the field a page opens with, whose answer waits for a press (`ToolbarSearch` is the small
live filter): `value`, `onChange(value)`, `onSubmit(value)`, `placeholder`, `icon`, `submitLabel`, `actions`
before the submit, `inputProps` (spread onto the inner `<input>`: `data-*`, `inputMode`), and `size` `lg` or `xl`.

```jsx
<SearchField value={draft} onChange={setDraft} onSubmit={run} placeholder="Any movie or show" size="xl" />
```

`Slider` picks one number along a line (`min`, `max`, `step`, `value` and `onChange`, or `defaultValue`)
and follows the WAI-ARIA slider pattern: arrows move by `step`, PageUp and PageDown by a tenth of the
range, Home and End to the ends; on a page marked `data-tv` only Left and Right move the thumb, and
Up and Down are left to spatial focus. A press or drag by mouse, pen or finger moves the thumb, and the page
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
thin leading edge. `wrapTitle` lets the title wrap over several lines instead of ellipsizing, with the
`aside` at the top right (an event line); `actionsBelow` puts the actions on their own line at phone width, a field among them taking the width the buttons leave; `as="div"` makes the row stand outside a `List`. At phone width `meta` and `aside` wrap under the title. `data-*` props reach the `li`.

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

`ListPage` lays out a page of records and fetches nothing: `title`, `sub` and `actions` make the heading
(or `header` is a node of the site's own), `toolbar` is usually a `Toolbar`, and `items` are drawn by
`layout`: `list` (each `renderItem` result inside a `List`, so a `ListRow`), `grid` (a `Grid` with `gridMin`
wide columns) or `table` (`columns`, and `table` for the rest of Table's props). `children` replace the
body for a shape of the site's own. `loading`, `error` with `onRetry`, and an empty list draw through
`DataState` (`emptyTitle`, `emptyBody`, `emptyIcon`, `emptyAction`) under a heading and toolbar that stay.
`page` (zero-based), `pageCount` and `onPageChange` draw the pager, with `total` and `pageSize` for its summary.

```jsx
<ListPage title="Accounts" sub="Everyone who can sign in." actions={<Button variant="primary">Add</Button>}
  toolbar={<Toolbar><ToolbarSearch value={q} onChange={setQ} /></Toolbar>}
  items={accounts} renderItem={(a) => <ListRow key={a.id} title={a.name} onOpen={() => open(a)} />}
  loading={!data} error={error} onRetry={reload} emptyTitle="No accounts"
  page={page} pageCount={pages} onPageChange={setPage} total={total} pageSize={50} unit="accounts" />
```

`DetailPage` is the page about one record. `crumbs` are Breadcrumbs items; the header is a `hero` node or a
plain head from `title`, `sub`, `meta` (pills) and `actions`. `tabs` (`value`, `label`, `icon`, `count`)
with `value` and `onChange` choose a section, and `tabsKind` says what they are: `sections` (the default)
are in-page panels drawn as `Tabs`, with `renderTab(value)` or `TabPanel` children for the bodies;
`routes` are pages of their own, drawn as `SubTabs` (a select at phone width), for a site whose router
owns the choice. `tabsExtra` sits at the end of the tab row, `aside` is a second column that stacks under
the body at phone width, and `loading`, `error` and `isEmpty` replace the page under the crumbs.

```jsx
<DetailPage crumbs={crumbs} onNavigate={go} title={host.name} sub="Running" meta={<Pill tone="ok">Up</Pill>}
  actions={<Button variant="primary">Restart</Button>}
  tabs={[{ value: "overview", label: "Overview" }, { value: "alerts", label: "Alerts", count: 3 }]}
  value={tab} onChange={setTab} renderTab={(t) => <Panel name={t} />} aside={<Card title="Connect">…</Card>}
  loading={!host} error={error} onRetry={reload} />
```

`SettingsPage` is a column of sections. `sections` are `{ id, title, icon, description, action, rows, content }`
(`rows` are SettingsRow props with the controls in `control`; `content` replaces them), and `children` take
sections of the site's own composition. With more than `navFrom` sections (four) a nav is drawn: sticky at
wide widths, a select at phone width, scrolling to the section and moving focus into it. Pass `form`, a
`useForm` handle, and the page is a `Form` over it, with a save bar that appears while `form.isDirty`:
Save submits, Revert resets. Without a form, `dirty`, `saving`, `onSave` and `onRevert` drive the same bar.

```jsx
<SettingsPage title="Settings" form={form}
  sections={[
    { id: "profile", title: "Profile", icon: "user", content: <FormField name="display" label="Name" /> },
    { id: "theme", title: "Appearance", icon: "palette", rows: [{ icon: "palette", title: "Theme", control: <ThemePicker /> }] },
  ]} />
```

`SignInScreen` is the sign-in card on `CardScreen` and signs nobody in: `onProvider(provider)` and
`onSubmit(values)` are the site's. `providers` are ids (one is a full-width button in the provider's colour,
several an even grid named for their provider), `busyProvider` marks the one being left for, and `password`
draws a `username` and `password` form over the form layer whose `onSubmit` may return `{ message }` or
`{ errors }` for a refusal. `tabs` with `tab` and `onTab` switch sign in and register, `extraFields` and
`passwordAside` add to the form, `error` is a refusal about the whole card, and `children` follow under a
rule for what is a site's own (a device code).

```jsx
<SignInScreen mark={mark} wordmark="The Krystal Ship" tagline="Sign in."
  providers={context.providers} onProvider={(p) => leaveFor(p)} busyProvider={leaving}
  password passwordAside={<Button variant="link" size="xs" onClick={forgot}>Forgot?</Button>}
  onSubmit={async (v) => { const r = await post(v); if (!r.ok) return { message: r.error }; }}
  error={unreachable} foot={<>Signing in to <b>{client}</b></>} />
```

`StatTile` is one figure: `label`, `value`, `unit`, `delta`, `sub`, `tone`, an optional `icon` and a
`spark` node under the figure. A `null` value draws "—", read as "unknown", never 0. `StatTiles` is the
responsive grid (`min` is the narrowest tile). `Card` frames anything: `title`, `sub`, `icon`,
`actions`, `foot`, `padding`, `tone`, and `onOpen` or `href` to make the whole card open. `Avatar`
takes `src` or the initials of `name` (letters only: "Claude (agent)" draws "CA"), a `size` (xs to xl), a `shape` and a `status` dot.

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

<ConfirmDialog title="Remove this client?" icon="trash-2" tone="danger" confirm="Remove client"
  busyLabel="Removing…" onClose={close}
  onConfirm={async () => { const r = await remove(); if (!r.ok) return { refusal: r.message }; }}>
  <p>Anything signed in through it stops working.</p>
</ConfirmDialog>
```

```jsx
<BriefCard icon="bell" title="Needs a look" count={alerts.length}>
  {alerts.length === 0
    ? <BriefEmpty icon="circle-check" title="No active alerts" body="Everything is running clean." />
    : <BriefList>{alerts.map((a) => <BriefItem key={a.id} tone="warn" icon="alert-triangle" title={a.title} detail={a.detail} action="Look" onClick={() => open(a)} />)}</BriefList>}
</BriefCard>
<BriefCard><BriefList>{/* no title: no header */}</BriefList></BriefCard>
<BriefCard icon="info" title="Unit"><FactList rows={[{ label: "State", value: "active", tone: "ok" }, { label: "Unit", value: name, mono: true }]} /></BriefCard>
```

```jsx
const feed = useRef(null);
const tail = useFollowTail(feed, { threshold: 80, deps: [messages] });
// on arrival while parked: tail.onContentChange(1)
<div ref={feed} onScroll={tail.onScroll}>{rows}</div>
{!tail.atBottom && <Button onClick={tail.scrollToBottom}>{tail.unread} new</Button>}
```

```jsx
<StatusDot tone="ok" pulse label="Live" caption="live" />
<StatusDot tone="danger" label="No signal" caption="3m ago" />
<StatusDot tone="neutral" label="Offline" caption="Offline" captionSide="end" />
```

`ConfirmDialog` asks before a change that is hard to take back: a `Dialog` with the consequence as
its children and a cancel and a confirm button (`tone="danger"` draws the confirm as a danger
Button). `onConfirm` returns a promise: resolving to nothing closes the dialog through `onClose`,
resolving to `{ refusal }` or rejecting draws that text in a `Notice` and keeps it open. While it
is pending the confirm is busy and the dialog cannot be dismissed.

`FormDialog` is a `Dialog` that is the form of a `useForm` handle: its children are `FormField`s,
Enter submits, the foot is Cancel and a `FormSubmit` (`submit` words it, `busyLabel` words the busy
state, or `submit` is a node of the site's own), and nothing dismisses it while a submission runs.
The form's refusal stands at the top of the body, or `notice` draws a node of the site's own there.

```jsx
<FormDialog form={form} title="Add an account" icon="user-plus" onClose={close} submit="Create" busyLabel="Creating…">
  <FormField name="username" label="Username" control="input" />
</FormDialog>
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
with `onSubmit` makes the sheet a form, and `art` draws a banner above the head. `fullscreen` is
the pop-out: the sheet fills the viewport inside a safe-area inset (edge to edge on a phone) and keeps
its head and close button; the body scrolls, or with `fill` too it clips so a feed, chart or editor
inside it takes the room and scrolls itself.

### Variants, states and tokens

A site places and shapes a component through its props and tokens, never through the package's `.k-`
classes (the Stylelint config reports them). What the components offer beyond their basics:

- **`BriefCard`**: `value` (a figure in the head), `wrapHead`, `fill` (the card fills its row's height),
  `revealPin` (the pin shows while the card is hovered or focused), and the tokens `--k-brief-head-padding`
  and `--k-brief-head-gap`. **`BriefItem`**: `disabled`, `controls` with `controlsBelow`. **`SettingsRow`**:
  `controlsBelow`. At phone width the controls take a line of their own, indented to the label; a `wide`
  `Input`, a `Select` or a `fill` `RadioGroup` takes the line and everything else keeps its size.
- **`Input`**: `narrow` (a number's width) and `align="end"`. **`Button`**: `grow`. **`RadioGroup`**: `fill`.
  **`Disclosure`**: `flush`, and a summary that lays its children out in a row. **`EmptyState`**: `spin`.
  **`StatusDot`**: `size` as a number. **`Avatar`**: `imagePosition`. **`ChatCardRows`**: `flush`.
- **`StatTile`**: `emphasis` (the hairline on every tone), `stale`, `tone="off"`, `wrapSub`, `deltaEnd`.
  **`Meter`**: `stale`.
- **`Rail`**: `perView` (a count, or stops keyed by the rail's own width), `className`, `style`; `--rail-per-view`
  set on the rail or an ancestor is the default.
- **`Shelf`**: `columns` and `narrowColumns`, or `--k-shelf-columns` and `--k-shelf-narrow-columns` set on the
  shelf or an ancestor; the narrow count applies once the shelf itself is under 560px wide.
- **`Dialog`**, **`ConfirmDialog`**, **`FormDialog`**: `sheet` (full screen at phone width), `artOverlap`, `footLayout` (`row`, `stack`, `pair`),
  and a function as `children` that receives `{ fullscreen }`. **`Drawer`**: `footLayout`; no children draws
  no body.
- **`HeroButton`**: `iconTone`, `armed`. **`ShowcaseCard`**: `corner.tone` and `corner.mono`, `compactFacts` (under 210px wide the facts drop their icons), the token
  `--k-showcase-progress-track`. **`SubTabs`** and **`TabBar`**: a `disabled` item; `SubTabs` `fill`.
  **`ToolbarFilters`**: `framed`, `compact` (`true` or `"phone"`), `className`.
- **`AppShell`**: `mainClassName`; `--k-app-bottom-inset` (room above the phone tab bar that the page, the
  dock and the toasts leave), `--k-toasts-bottom` and `--k-toasts-top`; `body[data-chat-typing]` while
  somebody writes in a chat that is the page. **`Sidebar`**: `data-collapsed` on its root when collapsed,
  and `useSidebarCollapsed()`.
- **`TvSpotlight`**: `titleSize`, `overviewLines`; **`TvCard`**: `dimmed`, and `data-tv-dim` on any ancestor
  dims every card under it. A `fieldset:disabled` dims radios and a card's controls as it dims buttons.

### Layout, keys and drawers

`AppShell`'s main column owns the page's side gutter, equal on both sides: 24px, 16px at 768px and
narrower, 12px at 480px and narrower. A page column inside it sets a max width and no inline padding, and
reads the gutter as `var(--k-page-gutter)`; a `Container` there adds none of its own, and outside the
frame a `Container` pads by 32px, 16px and 12px at the same widths.

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
the grip a pull toward the edge closes it by. `back` (`{label, onClick}`) puts a back button before the
title for a menu nested in another, `action` sits after the title, and `head` replaces the whole title
row. `contained` draws the sheet and its scrim inside the nearest positioned ancestor instead of over
the viewport, for menus that belong to a frame such as a video player; it still holds focus and closes
on Escape or a press on the scrim, and the rest of the page stays live. `role="menu"` is for a sheet
whose body is a list of items. `theme="dark"` (any palette name) draws the sheet in that palette
whatever the page's, by setting `data-theme` on it; the document's `color-scheme` stays the page's.

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

## Telling a person

A **toast** is the outcome of what the person just did: `toast.success`, `toast.info`, `toast.error`
and `toast.fromError(err, title)`, drawn by one `<Toasts />` per surface. An error stays until it is
dismissed, a repeat folds into a count, and nothing is kept once a card is gone.

A **notification** is something the person is told, kept by the product's server for a year and pushed
to their devices. Every product serves one route shape (`/notifications`, `/push/...`) and the
design system draws it:

- `createNotificationsClient({ request })` is the calls of those routes over the site's own signed-in
  `request(method, path, body)` with its route prefix applied: `list({ before })`, `markRead(ids?)`,
  `kinds()`, `preferences()`, `setPreferences(map)`, `pushKey()`, `subscribe(subscription)`,
  `unsubscribe(endpoint)` and `devices()`. Each answers the route's reply.
- `createNotificationInbox(client, { everyMs })` answers `{ useInbox(), watch(), refresh(), markRead(ids?),
  loadMore(), store }`. `useInbox()` is `{ unread, items, more, kinds, error }`, read on an interval (a
  minute by default) and whenever the page is shown again, and a mark shows at once.
- `NotificationTray` is the opener and the list it opens, beside the sidebar on a wide screen and in a
  `Drawer` on a phone, or at any width with `drawer`, with *Mark all read* in its head. `trigger` draws the opener from
  `{ open, toggle, unread }`; `onOpen(item)` is called after the tray closes, and `footer` (a node, or a
  function of `{ close }`) is drawn under the rows.
- `NotificationList` is the rows alone: an icon in a square toned by the row's kind, the line, a second
  line, how long ago, the words of its link and a mark while unread, under a heading for each day.
  A kind's icon and tone come from the product (`kinds`); `kindStyles` overrides them by kind id.
  `items` null is a list being read, `error` draws a failed read, an empty list says "Nothing yet.", and
  `footer` is a slot under the rows. A row opens when `canOpen(item)` allows (one with a `url` by
  default) and calls `onOpen(item)`.
- `NotificationSettings` is a section of a switch for each kind the product lets the person switch off,
  this browser's push on or off over `lib/pushBrowser`, and how many devices receive pushes. Push is on
  for a server when the browser has a subscription whose endpoint the server lists. Switching it on
  registers the browser's existing subscription when its key is the server's, and replaces it only when
  the key differs; switching it off removes only that server's registration and leaves the subscription,
  which the site's other servers may use.

```jsx
const client = createNotificationsClient({ request: (method, path, body) => api(method, "/api" + path, body) });
const inbox = createNotificationInbox(client);

<NotificationTray inbox={inbox} onOpen={(n) => navigate(n.url)}
  footer={({ close }) => <Button variant="ghost" size="sm" icon="settings-2"
    onClick={() => { close(); navigate("/settings/notifications"); }}>Notification settings</Button>}
  trigger={({ open, toggle, unread }) => (
    <NavItem icon="bell" label="Notifications" badge={unread} active={open} onClick={toggle} role="button"
      aria-haspopup="dialog" aria-expanded={open} />
  )} />

<NotificationSettings client={client} />
```

The service-worker half is a classic worker script, `sw/notifications.js`, which defines
`self.krystalNotifications`. The `notificationsWorker()` Vite plugin (`@thekrystalship/krystal/vite`, Node
only) serves it at `/krystal-notifications.js` in development and emits it at the build root, and the
site's classic `sw.js` loads it:

```js
// vite.config.js: plugins: [react(), notificationsWorker()]
importScripts("/krystal-notifications.js");
self.addEventListener("push", (event) => self.krystalNotifications.handleNotificationPush(event, { icon: "/icons/icon-192.png" }));
self.addEventListener("notificationclick", (event) => self.krystalNotifications.handleNotificationClick(event));
```

A push payload is `{ title, body, url?, tag, actions?, data? }`. A tap opens or focuses `url` in a window
of the site; a button (`actions: [{ id, title, url }]`) posts to its `url`, the product's anonymous
`POST /push/actions/{handle}`, and the worker shows the `message` it answers as a follow-up under the
same `tag`. `styles/notifications.css` draws the list and the tray.

## A site's identity

A site has a name and a mark: a Lucide glyph, given as the paths of its 24-unit viewBox in the site's
`identity.js`. The mark is always the same tile, the glyph stroked in the palette's accent
(`--krystal-teal`) on the accent's tint (`--krystal-teal-dim`) over the canvas, so it is drawn in
every palette with nothing copied out of a stylesheet.

```js
// identity.js
import "./src/themes.js";   // the registration and configuration the bundle runs, when the site has any
export default {
  mark: ["M17 21a1 1 0 0 0 1-1v-5.35…", "M6 17h12", { d: "M16 7.5a.5.5 0 1 0 1 0…", fill: true }],
  palettes: ["src/themes.css"],   // the site's own [data-theme] sheets
  android: "../android/res",      // the app on the TKS shell, when there is one
};
```

`siteIdentity(identity)`, the Vite plugin beside `notificationsWorker()`, gives every page of the site:

- **`krystal-boot.js`**, the first element of the head. It puts the stored theme, or the site's default,
  on `<html>`, and from then on keeps the tab's icon, `theme-color` and the splash in whichever palette
  `data-theme` names, a theme picked included. A browser that follows a changed icon redraws the tab.
- **The splash**: `krystal-splash.css` and the tile on the canvas as the body's first child, drawn only
  when the boot script has run, so a page read without script shows what it carries. It stays until
  the site lets it go: the site calls `settleSplash()` from an effect at its root, and a screen still
  waiting for what it shows calls `holdSplash()` (a data hook holding it while the first answer is
  out covers most pages). It goes at `SPLASH_CAP_MS` whatever holds it.
- **The artwork links**: the favicon, the home-screen icons and a launch image per iPhone and iPad.

All of it is files under the site's `base`, so a page under a policy with no inline script or style
runs it. The fixed artwork comes from `krystal-icons` (needs `rsvg-convert`), run by hand, its output
committed: the icons, maskable icon and launch images under `public/`, and with `android` the launcher
icon (glyph, ground and the themed-icon layer), all in the site's default palette.

```json
{ "scripts": { "icons": "krystal-icons" } }
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
        <SidebarAccount user={user} collapsed={dock.desktop && collapsed}
          onProfile={…} onSettings={…} onSignOut={…} />
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
- `TvSpotlight` — `eyebrow`, `title`, `meta`, `overview` (clamped), `credit` (a quiet line, a `b` inside it the name), `actions` and `children`; `size`
  `lg` opens a page and `md` sits above a row, its name on one line.
- `TvHeading` — `eyebrow`, `title`, `count`, `icon` and a `lead` (an avatar); `size` `sm` is a row's label and `lg` names a page of cards.
- `TvRow` — a `TvHeading` with `icon`, `title` and `count` (none without a title), a `lead` node under it, then its cards (`trackClassName` styles the track) and `end`, running past the
  right margin; it is a `data-tv-row`, which a site's navigator can place on a line.
- `TvCard` — a picture that is a link, `poster` or `wide`, with `progress` and a `badge`; every
  other prop reaches the link. A card off the screen is skipped (`content-visibility: auto`) until it
  nears it, so a page of rows styles and paints only what shows. `TvTile` ends a row: an icon over a few words, the cards' size.

`--tv-margin-x` and `--tv-margin-y` are the margins a television may crop, and the card sizes are
tokens beside them. `styles/tv.css` is the last sheet, after everything whose focus it overrides.

Moving focus with the remote's arrows is `lib/spatialFocus` (`createSpatialFocus`, or `useSpatialFocus`
while a component is mounted): it takes the arrow keys, Enter and Escape for the document and moves
focus to the drawn, focusable element that scores best in the arrow's direction, by geometry alone.
It traps focus in the topmost `role="dialog"`, `role="menu"` or `aria-modal` element and hands it back
when that goes, remembers the last element of each sideways-scrolling row and the control each page was
left on, keeps a slider's Left and Right and a text field's caret, and picks up the nearest element
when the focused one is removed. A page marks `data-tv-initial` on the control focus starts on,
`data-tv-column` on a column that clips instead of scrolling, `data-tv-line` and `data-tv-row` to hold
the focused row on one line of a column, `data-tv-top` on what takes the column back to its top, and
`data-tv-preparing` on `main` while the next page is built out of sight. The site gives it the keys the
remote has that never reach a page: `onBack` and `onMenu` answer whether the page used the key.

```jsx
const spatial = useSpatialFocus({ onBack: () => history.back() || true });
// or, outside React: const spatial = createSpatialFocus({ pageKey: () => location.href }); spatial.start();
// spatial.follow(() => spatial.recall(main) || spatial.initialIn(main)) puts focus on a page that was shown.
```

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
are event rows (`ChatEvent`), with a day row where the date changes. The conversation's switches
(Thinking, Read aloud, Auto-run), how full its context window is and Compact stand behind the
composer's one options button, at every width.

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

**Hands-free.** Where the assistant's speech can scan (`speech()` answers `scan`), the chat's options
offer *Hands-free*: the microphone stays open, and a request that opens with one of `triggers` (default
`"hey assistant, hay assistant"`, a list because the trigger is matched in what the recogniser wrote) is
sent as the person's message and answered aloud. Listening holds while an answer is being written. A
voice note is still a draft the person looks at; a hands-free request is sent as heard, because the
trigger is the person addressing the assistant. The pieces are exports for a surface of its own:
`useHandsFree({ client, triggers, enabled, paused, onCommand })` hands each request to `onCommand` as
text; `createTriggerListener` is the scanning and capturing, fed 16 kHz PCM and told the time (windows
of three seconds every half second of speech, a command captured from the end of the word before the
trigger until 600 ms of quiet, eight seconds at most); `matchTrigger`, `triggerInScan` and
`recoverRequest` find the trigger in a transcript and in a scan's timed words; `openMicrophone` is the
microphone as 16 kHz PCM. The client's `scan(pcm)` and `say(text, { format })` are `/speech/scan` and
`/speech/say`, and `createSpokenReply`, `armAudio` play what is said.

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
the list is drawn into, and the chat takes the whole width. `framed` makes the
chat fill an `AppShell`'s main column. When the site shows something other than the chat while the
list stays in view, `onShowConversation` tells it the person opened a conversation, and
`conversationShown` says whether the chat is what is on screen, so the sidebar lights the open one
only then. `listTarget` is a page of the site's own — a phone's tab of conversations — where the same
list is drawn full width, with the open conversation marked. A chat whose list
a site draws elsewhere carries no history popover in its header.

Every chat is drawn one way: on the page's background, the greeting alone in the middle of the empty
conversation, its opening suggestions as a row of chips over a one-row composer, the privacy note
under it, and the send button only once there is something to send. `layout` is where it stands.
`"panel"`, the default, is a panel beside or over a page, with a dock's window buttons and the
conversation list as a popover. `"page"` is the chat as the whole page, as a phone's tab opens it: its
conversation list is a sheet, and while the person writes the site's tab bar gives its room to the
keyboard and the composer rises above it. Give a page `framed` as well, to fill the column edge to
edge.

The header's back arrow, in every layout, leaves a conversation for the empty one, and that is how a
new conversation starts; there is no New chat button. A `docked` chat, panel or page, also carries a
hide button that collapses it into its side of the screen and calls `onClose`; a chat that is the page
itself has none.

**Memory, skills, tools and notifications.** The header's options menu (`⋯`), in every layout, holds *Memory*,
*Skills*, *Tools* and *Notifications* (*Skills* and *Tools* where the client has `skills()` or `tools()`, *Notifications* as described below) and, with a
conversation open, *Delete conversation*, which asks twice. Each of the first four stands in the
conversation's place, which is kept as it was left; the
header names what is open and its back arrow leads out.

- *Memory* shows what the assistant has written down about the person, from `/memories` with its count
  against `/memories/limits`: each memory opens in an editor in the list's place, and Forget, in the
  list or the editor, asks twice. It is the one place a person reads, corrects and forgets what the
  assistant remembers. `MemoryBodyEditor` (a component taking `{ value, onChange, path, readOnly }`,
  lazy if it likes) draws a memory's notes in place of the plain text area, and
  `memoryKeyPlaceholder` is a new memory's example name.
- *Skills* lists what the assistant knows how to do, from `/skills`: each skill by its name made
  readable and the description the assistant reads for it. A skill is used by asking for what it
  describes, so the list offers nothing to press.
- *Tools* lists what the assistant can use on the person's behalf, from `/tools`: each tool by its name
  made readable and the first sentence of its description (the rest is written for the model), with
  "Asks you to confirm first" on a tool that proposes rather than acts.
- *Notifications* lists what the assistant has told the person, with `NotificationList`, from the
  plugin's `/notifications` routes through the client's `request`. It is offered when
  `GET /notifications/kinds` answers with at least one kind; the menu entry carries the unread count and
  the `⋯` button a dot while any is unread. *Mark all read* and *Settings* head the view; a row that
  carries `data.conversationId` opens that conversation, and *Settings* turns the view to
  `NotificationSettings` (the per-kind switches and this browser's push), whose back arrow returns to
  the list.

What the assistant writes down or forgets during a turn follows that turn's answer as an event line,
"Remembered: …" or "Forgot: …", read from the memory card its `remember` or `forget` carries (wire
contract §5) live and from history alike. A memory written offers *Edit*, which opens it in the
memory view; `ChatEventRow` takes that one control as its `action`.

`slots` puts a site's own blocks in the chat's frame, by place: `start` is the empty conversation's
column, `aboveComposer` a row over the composer, `headerActions` buttons in the header and `history`
the head of the conversation list. A slot is a node or a function of the chat's handle, and any
block inside the chat reads the same handle with `useChat()`: the `layout`, whether the conversation
is `empty` and the assistant `usable`, the `conversations`, and `ask(text)` to send a turn,
`draft(text)` to leave words in the composer for the person to finish, `newChat()` and `open(id)`.
A place left empty draws the chat's own blocks, which are exported for a site composing its own:
`ChatGreeting` and `ChatSuggestionChips` (a row, each one sent), with `ChatBlock` to set a site's
block in the column. The chat fetches nothing for a block; the site's block brings its own data.

```jsx
<Chat
  slots={{
    start: (chat) => (
      <>
        <ChatGreeting />
        <ChatBlock><Alerts onPick={(alert) => chat.draft(alert.prompt)} /></ChatBlock>
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

What a person does around the conversation — finding a conversation — is the same on every site that
hosts an assistant, so the page is here. It names no product:

```jsx
<AssistantChatsPage listRef={setListEl} />          // Chat's `listTarget`, as a page
```

The pages sit at a reading measure (`.k-assistant-page`); `styles/assistant-pages.css` draws it and
what the chat shows in the conversation's place (`.k-assistant-panel`), after `settings.css`.

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
npm test             # behaviour tests (Vitest, Testing Library, jsdom) in packages/*/test
npm run test:a11y    # axe over every playground section in dark and light (`npx playwright install chromium` once)
npm run test:visual -- --update   # write this machine's baselines (git-ignored), before a change to how something looks
npm run test:visual  # every section at 1280 and 390 in dark, light and a tribute, against those baselines
npm run build        # core, then the chat → packages/*/dist, one ES module per source file
npm run play -- --port 5211   # the documentation: the playground with both packages from source
npm run docs:data    # regenerate the props and token data the documentation reads
npm run build:docs   # build the documentation as a static site, to check that it compiles
```

The documentation's props tables are generated from the JSDoc beside each component, by
`scripts/docs-props.mjs` through the TypeScript compiler (`node scripts/docs-props.mjs --missing` lists
the props that have no description), and its token reference from `tokens.css` and
`theme-contract.json`. `playground/docs/pages.js` lists the pages, `playground/docs/behaviour.js`
holds each page's keyboard and screen-reader table, and `docs/*.md` are the guides.

Publishing is per package, from its directory: `npm publish -w @thekrystalship/krystal`, then
`-w @thekrystalship/krystal-chat` (each builds first through `prepack`; a published version is
permanent). `npm publish --tag dev` is a prerelease.

Iterate with prerelease versions (`0.2.0-dev.1`, `-dev.2`, …) and bump each consumer's pins to the
one it was checked against. The chat's peer on core is the same version as its own.
