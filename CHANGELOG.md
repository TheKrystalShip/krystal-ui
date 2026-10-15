# Changelog

## [0.42.0]

### Added
- **`NavItem compact` and `aside`**: the row for what sits under a group's entries, with the icon on a
  tile, a smaller label and a raised active state; `aside` is a node at the row's end (a `StatusDot`),
  which rides the tile's corner on the collapsed rail. `badge` works in both forms.

## [0.41.1]

### Fixed
- **`ListRow actionsBelow` sizes by kind**: a Select, Input, Combobox or SearchField takes the width the
  buttons leave, and a button keeps its natural size.
- **`PageHeader` is as tall as a control** (34px at least), so a heading without actions and one with a
  button start the page below at the same height.

## [0.41.0]

### Added
- **`Notice` `block`**: the text is a column that fills the notice, its children stacked.
- **`ListRow` `actionsBelow`**: at phone width the actions take their own line, and their children share it.
- **`BriefItem` `controls`**: controls at the row's end in the settings arrangement, wrapping under the
  words when they do not fit.
- **`HeroNote`**: a line set directly on the art, with an optional icon, in the warning tone.

### Fixed
- **`HeroButton` text sits where a ghost `Button`'s does**: both lines are one em high.

## [0.40.0]

### Added
- **`NavItem` takes `role`, `className` and any other prop on its root**, so a row that opens something
  is `role="button"` with `aria-haspopup`, `aria-expanded` and an `aria-label` that carries its count.
- **`TvSpotlight` `overview` and `actions`**: the clamped story and the row of buttons under the facts.
- **`TvHeading`**: a heading with an `eyebrow`, a `title`, a `count`, an `icon` and a `lead`; `size`
  `sm` is a row's label and `lg` names a page of cards. `TvRow` draws its head through it.
- **`TvRow` `lead` and `trackClassName`**: a node between the heading and the cards, and a class on the
  scrolling track. A row with no `title` draws no heading.
- **`ChatModal`, `ChatEvidence`, `AssistantPage` and `Chat` `framed`** (krystal-chat): the full-window
  pop-out frame (edge to edge at phone width), the column of evidence cards under an answer, the
  reading-measure column a page about the assistant stands in, and the flag that makes a chat fill a
  shell's main column.
- **The parts of a Hero's content**: `HeroStatus`, `HeroBody`, `HeroHeading`, `HeroName`, `HeroTags`,
  `HeroTag` (`glass`, `verbatim`, `icon`), `HeroBar`, `HeroGroup`, `HeroDivider` and `HeroButton`.

## [0.39.0]

### Added
- **`BriefCard` without a `title`** draws no header; the card is its body.
- **`BriefItem` `escalated`**: the danger tint on the row and the "Needs you" mark after the title.
- **`SettingsRow` `value` and `mono`**: a read-only figure drawn where a control sits (also as `value`
  and `mono` on a `SettingsPage` row).
- **`Hero variant="card"`**: the bordered card with the art behind a veil, its children in a column
  over the left of it.

### Fixed
- **The footer lines up with the page.** Its text is inset by the page gutter at every width, and on a
  wide screen its column is as wide as the page's content. Its collapse points are measured against the
  column's content box, so it collapses at the same column widths as before the frame owned the gutter.

## [0.38.0]

### Added
- **The page gutter is the frame's.** `AppShell`'s main column pads the page's sides equally, 24px, 16px
  at 768px and narrower and 12px at 480px and narrower, and exposes the value as `--k-page-gutter`. A
  `Container` inside the frame adds no gutter of its own; outside it, it pads by 32px, 16px and 12px at
  the same widths. A Footer spans the column edge to edge.
- **`ListRow` `wrapTitle`**: the title wraps over several lines instead of ellipsizing, and the aside sits
  at the top right.
- **`SearchField` `inputProps`**: props spread onto the inner `<input>` (`data-*`, `inputMode`).

### Fixed
- **`Avatar` initials are letters only**: "Claude (agent)" draws "CA". A word with no letter is skipped, and
  digits stand in only for a name that has no letters at all.
- **A `Slider` on a television (`data-tv`) takes only Left and Right**, so Up and Down reach spatial focus.

## [0.37.1]

### Fixed
- **A radio group takes only the arrows along its own line**, left and right in a row and up and down in
  a stack, and leaves the others to the page.
- **On a television (`data-tv`), `RadioGroup` and `Tabs` take no arrow at all**: spatial focus reaches
  each option and tab without choosing it, and OK chooses. A group no longer holds the remote's arrows,
  so focus leaves it, and moving through it changes nothing.

## [0.37.0]

### Added
- **`SearchField`**: the large pill search, a `<form role="search">` with a leading icon, the field and a
  submit button in one frame; `onChange` and `onSubmit` receive the value, `busy`, `actions` and `size`
  `lg` or `xl`.
- **`ColorInput`**, the native colour picker drawn as a swatch, and **`RadioGroup variant="swatch"`**,
  each option a disc of its `color` named by its `label`, with `picker` adding a `ColorInput` after them.
- **`Button variant="bare"`**: a button with no look of its own (no fill, border, padding or height in any
  state) that keeps the focus ring, `disabled`, `busy` and `aria-pressed`, for a control a site's own class
  shapes.
- **`Avatar`** takes `tone` (a soft tint in place of the gradient), `letters={1}` and `size="css"` (the
  site's sheet sets the diameter).
- **`Menu` and `Popover`** take `container`, the element they portal into in place of the document body,
  so they draw inside a fullscreen frame; menu items take `sub`, a second line, and `MenuRadioItem`
  `readOnly`.

### Changed
- **Spatial focus reaches the unchosen radios of a radiogroup**, which sit at `tabindex=-1`.
- **A button with no children is `k-btn--icon`**; `k-btn--bare` is the `bare` variant.

## [0.36.1]

### Fixed
- **`Rail`'s count and `NotificationsPanel`'s unread count are pills**, drawn through `Pill` as
  `BriefCard`'s count and `NavItem`'s badge are; `k-brief__count` and `k-nav-item__badge` place a pill and
  give it no look of their own.

## [0.36.0]

### Added
- **`FormDialog`**: a dialog that is a form, its fields under `FormScope`, Cancel and a `FormSubmit` in
  its foot; Escape, the scrim and Cancel hold while it submits, and `notice` places the form's error.
- **`Steps`**: where somebody is in a sequence they can move around in, its dots 24px targets.
- **`SignInScreen`** takes `usernameExtra` (fields between the username and the password) and
  `passwordHint` (a hint inside the password field).
- **`ListPage` and `DetailPage`** take `empty`, and `DetailPage` `emptyIcon`, for their not-found and empty
  states.
- **`Notice`** takes `action`, a control at its end.
- **`BriefItem`** draws a block below its detail, tags beside its title and a detail that wraps;
  **`BriefEmpty`** draws its `children` after its body.
- **`ListRow`** stands outside a `List` through `as`, and draws a line of chips.
- **`useFollowTail`** takes `keys` and `anchorAttribute`: a parked reader keeps the row they were reading
  in place while lines are trimmed off the top, and `unread` counts the rows after the newest one they
  saw.

### Changed
- **`StatTile` draws the briefing card's head**: its icon and label as the title, an `aside` on the head's
  right (a status dot, a pin) and `onView` drawing a "View" button there (the arrow alone at size `sm`,
  named by `viewLabel` and the label), a divider, then the figure, its sub and its spark.
- **`ConfirmDialog`'s refusal may be a node**, drawn as given; a string is drawn in a danger `Notice`.
- **Readable text and a control's resting glyph draw in `--fg-3`**, which reads at 4.5:1 or better on
  every surface of the default dark and light palettes; `--fg-4` is for placeholders and decorative marks.

## [0.35.0]

### Added
- **The documentation**: `npm run play` opens a page per component, grouped by family with a search, each
  with its use against its neighbours, live examples, a props table generated from the JSDoc (every prop
  described), and its keys and roles; a token reference that reads `tokens.css` live in the chosen
  palette; and the guides, `docs/getting-started.md` and `docs/migrating-to-tks-krystal.md`. `#/all`
  draws every example on one page.
- **The test suite**: `npm test` (Vitest, Testing Library and jsdom over the components' behaviour, the
  chat's conversation functions and the assistant client), `npm run test:a11y` (axe over every section in
  a dark and a light palette) and `npm run test:visual` (screenshots against this machine's baselines).
  CI runs the first two.

### Changed
- **The Krystal Blue palettes read at 4.5:1**: dark `--fg-3` is lighter; light `--fg-3`, `--success-fg`,
  `--warning-fg` and the teal accent (with its hover, press, dim, ring and accent-edge steps) are darker.
- **Quiet text that a person reads uses `--fg-3`**: a field's aside, a sidebar group's label and the
  account line, a fact's hint and a key chord's separator. `--fg-4` is for placeholders and disabled text.
- **Small targets reach 24px**: a checkbox row and a showcase card's action.
- **The card screen's foot link is underlined.**

### Fixed
- **An armed `Button` reads in a light palette**: its ink is `--canvas` on its `--fg-1` fill.
- **A `Menu`'s typeahead steps through the items that start with a letter struck again.**
- **Revealing an `OptionList`'s collapsed rows focuses one that can take focus.**
- **A `FormField`'s text control is named by its label alone**, not its label, hint and error.
- **A `Tab` whose value has a space** names its panel with one id.

## [0.34.0]

### Added
- **Page patterns**, layouts built from the package's own components that take a site's data, words and
  flags and fetch nothing: `ListPage` (heading, toolbar, a list, table or grid body, pager, and the
  loading, failed and empty states), `DetailPage` (crumbs, a head or a `Hero`, in-page `Tabs` or
  route `SubTabs` by `tabsKind`, an aside that stacks under the body on a phone, whole-page states),
  `SettingsPage` (sections of rows or content, a side nav that is a Select on a phone, a save bar while a
  form is dirty) and `SignInScreen` (providers, a username and password form on the form layer, tabs,
  extra fields, a refusal and a foot on `CardScreen`).
- **`ConfirmDialog`**: the question before a change that is hard to undo. `onConfirm` returns a promise;
  nothing closes it, `{ refusal }` or a rejection shows the reason and keeps it open, and it is busy and
  held open while pending.
- **`BriefList`, `BriefItem`, `BriefEmpty` and `FactList`**, the bodies a `BriefCard` holds, drawing the
  `k-brief__*` markup.
- **`useFollowTail`**: a feed that stays at its end while the reader is there and stops following when
  they scroll up, with an unread count for "N new below". The chat's thread scrolls through it.
- **`Dialog fullscreen`**, the pop-out frame over the whole window.
- **`StatusDot`**: a lit dot in a tone, always named by its `label`, with `pulse` and a `caption`.
- **Spatial focus** for television pages: `createSpatialFocus` (also at
  `@thekrystalship/krystal/lib/spatialFocus`) and `useSpatialFocus` move focus by arrow key across the
  page's geometry, remember each row's and page's place, trap focus in an open overlay and give it back,
  and read the `data-tv-*` attributes the `Tv*` components carry.
- **`Drawer`** takes `back`, `action`, `head`, `role`, `contained` (the sheet inside its positioned
  ancestor, over a frame such as a player, with the rest of the page inert) and `theme` (a palette for
  the sheet alone).

### Changed
- **A `SettingsRow`'s control wraps under its words when it does not fit**; a toggle, a button or a short
  select stays beside them.
- **`Pagination`'s `total` and `pageSize` are optional**; without them it draws only the controls.

### Fixed
- **One Escape closes a dialog whose focused control shows a tooltip.** A tooltip hides on Escape and
  leaves the key to the layer around it.

## [0.33.0]

### Added
- **Layout**: `Stack`, `Cluster`, `Grid` and `Container`, each polymorphic through `as`, their `gap` a
  spacing step or a name (`xs` to `xl`). `Grid` fits columns of at least `min` (one column on a phone)
  or takes `cols`; `Container` is the centred page column at `size` sm to xl or full, with the gutter.
- **Overlays**: `Popover` (a non-modal panel on a trigger or an anchor), `Tooltip` (on hover after a delay
  and on keyboard focus, never interactive), `Menu` with `MenuItem`, `MenuCheckboxItem`,
  `MenuRadioGroup`/`MenuRadioItem`, `MenuGroup` and `MenuSeparator` (the menu button pattern: arrows,
  Home/End, typeahead), `Combobox` (a field that filters a list and picks one, `inputValue` for a site
  that searches a server) and `Drawer` (a modal sheet from the bottom, right or left, `Dialog`'s props,
  a grab handle and a touch pull that closes it). Every panel is placed by Floating UI, closes on Escape
  one layer at a time and on an outside press.
- **Choice**: `Tabs` with `TabList`, `Tab` and `TabPanel` (panels within a page, `underline` or
  `segmented`, automatic or manual activation), `RadioGroup` (a few short choices inline or stacked),
  `Slider` (marks, a formatted value, `onChangeEnd` on release, pointer, touch and keys), `Disclosure`
  and `Accordion` (single or multiple open).
- **Data**: `Table` (columns with `render`, `sortable`, `align`, `mono` and `hideBelow`; controlled
  `sort` with a `sortRows` helper; rows that open as a whole while their actions stay separate; on a phone
  each row is a card), `DataState` (draws loading, an error with retry, empty, or its children from what
  it is handed), `StatTile` and `StatTiles` (a figure with label, unit, delta, tone and a spark slot;
  `value={null}` draws an unknown "—", never 0), `Card` (head, body, foot, `tone`, opening as a whole)
  and `Avatar` (an image with initials to fall back on, sizes, shape, a status dot). `AccountAvatar`
  draws through `Avatar`.
- **Forms**: `useForm`, `Form`, `FormScope`, `FormField`, `FormError` and `FormSubmit`, over
  react-hook-form (a dependency of core that a site never imports). Rules and sync or async `validate`
  per field, errors shown from the first submit, an `onSubmit` that returns or throws `{ errors,
  message }` to put a server's answer under its fields, focus on the first invalid field.
  `FormField` binds an input, password, textarea, select, checkbox, toggle or option list, or a
  render function; `FormScope` is the form for a `Dialog as="form"`.
- **`Kbd`**: a key, or a chord of keys with a visible separator. A `MenuItem`'s `shortcut` draws
  through it.
- **`restrictedSyntax` and `restrictedImports`** from `@thekrystalship/krystal/eslint`, the config's
  entries for a site that merges them into its own `no-restricted-syntax` and `no-restricted-imports` at
  the severity it chooses.

### Changed
- **`IconButton`'s `label` draws through `Tooltip`**; `title` sets other text and `title=""` none.
- **`ToolbarSort` is a `Menu`** (its keys and its direction as radio groups) and **`ToolbarFilters` a
  `Popover`**; **`SidebarAccount`'s menu is a `Menu`**. Their old item classes
  (`k-toolbar-sort__dir`, `k-toolbar-sort__dir-btn`, `k-toolbar-filter__opt-dir`,
  `k-sidebar__account-menu__head`, `k-sidebar__account-menu__item` and its `--danger`) are not drawn;
  the menus draw `k-menu` rows.
- **`Field`** takes `hintId` and `errorId`, passes other props to its frame, and is a `group` only when it
  has a label.
- **The codemod** rewrites a site's own modifiers and elements of a package block (`.rail--posters` to
  `.k-rail--posters`), counted apart.

### Fixed
- **An icon named glyph-first resolves**: `Icon` tries a name that does not resolve shape-first
  (`x-circle` as `circle-x`, `check-circle-2` as `circle-check`), so `Notice`'s success and error icons
  draw.

## [0.32.1]

### Fixed
- **`@thekrystalship/krystal/lib/sse` is in the package.** Every `lib/` module is a build entry of its own,
  so each one `./lib/*` exports is emitted whether or not the index reaches it, and the chat's client,
  which reads its event stream through it, resolves. `npm run check:exports` fails when a module the
  exports map promises is missing from a build, and CI runs it after the build.

## [0.32.0]

### Added
- **Shared lint configs**, from core as subpath exports with `eslint` and `stylelint` as optional peer
  dependencies. `@thekrystalship/krystal/eslint` is a flat-config array (`import krystal from …; export
  default [...krystal]`; `configs.strict` reports errors) that reports a raw `<button>`, `<input>`,
  `<select>`, `<textarea>` or `<dialog>`, a literal colour in an inline `style`, and an import of
  `@floating-ui/*` or `react-hook-form`. `@thekrystalship/krystal/stylelint` (`extends`) reports literal
  colours and any `border-radius` outside `var(--r-*)`, `0`, `50%`, `100%` and `inherit`, and a four-sided
  `border` that is not `var(--edge*)`. Findings are warnings; `defaultSeverity: "error"` raises the
  Stylelint ones.
- **The theme contract**: `@thekrystalship/krystal/theme-contract.json` lists the colour tokens every
  palette defines, the optional `--on-*` inks, the structural tokens a palette may re-value and the
  invariant rest. The `krystal-check-theme <file.css>...` bin checks a site's `[data-theme="…"]` blocks
  against it (missing or disallowed tokens, no `color-scheme`, `--on-*` ink under 4.5:1). `npm run
  check:contract` and `npm run check:palettes` keep the contract and the built-in palettes in step.
- **`registerThemes(options)`**, exported from core, adds a site's own palettes to `THEME_OPTS` and to the
  ids the theme store accepts.

### Changed
- **The repository is `tks-krystal` and publishes two packages**, in lockstep (one version, one changelog,
  one `v<version>` tag). `@thekrystalship/krystal` holds the tokens, themes, fonts, components, hooks,
  stores and lib modules; `@thekrystalship/krystal-chat` holds the assistant chat, the assistant's pages
  (`AssistantChatsPage`, `AssistantMemoryPage`, `AssistantSkillsPage`, `AssistantNotifications`,
  `AssistantMemory`, `AssistantMemoryEditor`), the `assistantPush*` calls and `createAssistantClient`
  (also at `@thekrystalship/krystal-chat/lib/assistantClient`). A site imports each by name and its
  stylesheet beside it: `import "@thekrystalship/krystal/styles.css"` and, with a chat,
  `import "@thekrystalship/krystal-chat/styles.css"`. The chat takes core as a peer dependency at its own
  version. `AssistantFabIcon`, `pushBrowser` and `lib/sse` stay in core.
- **Core exports `useModalBehaviour`**, which the chat's overlays use.
- **Every class carries the `k-` prefix**, the chat's `k-chat-`, with no alias sheet: `hero` is `k-hero`,
  `rail__track` is `k-rail__track`, `chat-turn` is `k-chat-turn`, and the short names read in full
  (`kfoot` is `k-footer`, `gbtn` is `k-hero-btn`, `mnav` is `k-mobile-nav`, `skel` is `k-skeleton`,
  `notif` is `k-notifications`, `crumbs` is `k-breadcrumbs`, `ev-card` is `k-chat-card`, `mem-editor` is
  `k-assistant-memory-editor`, `chat-brief` is `k-brief`, `dash-section__more` is `k-view-all`). State
  classes are `k-is-*` (`is-on` is `k-is-on`). `scripts/class-map.json` is the full list and
  `scripts/codemod-k-prefix.mjs` rewrites a site: `node scripts/codemod-k-prefix.mjs <dir> [--write]`
  covers CSS selectors, `className` strings, `classList` and selector-method arguments, and reports as
  ambiguous each class the site both styles and emits itself, to be settled with `--assume-package`.
  The display heading is `.k-display`, on any element.
- **The sheets sit in the cascade layers `krystal.tokens`, `krystal.base` and `krystal.components`**,
  ordered by the `@layer` statement each sheet opens with. A site's unlayered rules beat every layered
  rule whatever their specificity, so a restyle needs no raised specificity, and a site's own element
  rules (`a`, `button`, `*`) beat the package's class rules unless they sit in a layer ordered before it.

## [0.31.0]

### Added
- **Type declarations.** Every module ships a `.d.ts` beside it, emitted from JSDoc in the sources, and
  `package.json` names them (`types`, and a `types` condition on `.` and `./lib/*`), so an editor completes
  and checks a site's props. The chat's wire-contract frames, `profile`, slots and `createAssistantClient`
  are typed in `src/chat/types.js`.
- **`npm run check:tokens`** fails on a `var()` naming a property no sheet defines and on a literal colour
  or radius outside `tokens.css`; **`npm run check:contrast`** fails on any `--on-*` ink under 4.5:1 on its
  fill in any palette; **`npm run check:types`** runs `tsc` over the sources. CI runs lint, every check and
  the build on each push.
- **`--art-*` tokens** for type, lines and scrims drawn over cover art, the same in every theme.

### Changed
- **The fonts are WOFF2**, subset to Latin, Latin Extended-A, punctuation, currency, arrows, mathematical
  operators, box drawing, geometric shapes and dingbats, with their variable axes and layout features
  kept and a `unicode-range` on each face.
- **React 19** is accepted beside 18.3 as a peer.
- **Popovers are placed by Floating UI** (`@floating-ui/react-dom`, a regular dependency): they flip to the
  side with room, stay 8px inside the window and follow their anchor. `usePortalPopover` keeps its
  signature and takes an optional `{ placement }`.
- **Small radii follow the theme**: the 2px and 3px corners in the carousel, composer, chat, collection
  tile, shell, theme picker and television sheets draw `--r-sm`. The hero's veil and the showcase's
  warning border mix from theme tokens.

### Fixed
- **A dialog is a dialog.** `Modal` (and so `Dialog`), the chat's history sheet and its picture lightbox
  move focus in on open, keep Tab inside, hand focus back on close and make the rest of the page inert
  (the toasts excepted). Escape closes only the topmost, and a popover open inside a dialog takes Escape
  first, so one press closes one layer.

## [0.30.0]

### Added
- **`Pill`**, the one small non-interactive label: a `tone` of neutral, accent, info, ok, warn, danger or
  muted, a `size` of md or sm, and an `icon` or a leading `dot` before its text.
- **`PasswordInput`**: an `Input` with a reveal button in its suffix (eye, eye-off), `revealLabel` naming the
  button in each state; every `Input` prop and the ref reach the input.
- **`ProviderMark`, `providerLabel` and `ProviderButton`**: the discord, github, google and microsoft marks
  (any other provider draws a `log-in` icon), their names, and a `Button` carrying a mark with the caller's
  label. `brand` fills it with the provider's colour through the new tokens `--brand-<provider>` and
  `--on-brand-<provider>`, the same in every theme; `busy` swaps the mark for the spinner.
- **`List` and `ListRow`**: a framed list of rows with a `lead`, a title and `sub`, `Pill`s in `meta`, a
  monospace `aside` and `actions`. `onOpen` or `href` stretches the title's hit area over the row while the
  actions stay separate targets; `selected`, `disabled` and `tone` (a thin leading edge) mark a row; at phone
  width `meta` and `aside` wrap under the title.
- **`CardScreen`**: the centred card on the page background with a brand block above and a `foot` under it,
  `width` `sm` or `md`, safe-area padding, and no `style` attribute so a static document can reuse its classes.
- **`CopyField`**: a read-only `Input` with a copy button in its suffix that shows a check after the text is on
  the clipboard.

### Changed
- **The badges draw through `Pill`**: `NavItem`'s and `SubTabs`'s counts, `TabBar`'s pip, `ShowcaseCard`'s
  badge and `BriefCard`'s count keep their class names and share one height, weight, case and tint
  per tone. The showcase badge is no longer uppercase or taller than the others, and the family
  sheets keep only placement and the fills their surroundings need.
- **`CardScreen`'s wordmark is the screen's heading** (`h1`), so a signed-out screen has one.

### Fixed
- **A field with a prefix or suffix draws one focus ring**, its frame's; the bare input inside it no longer
  takes the universal focus ring as well.
- **Native controls follow the palette's mode.** `tokens.css` sets `color-scheme` on the root, dark unless
  the palette is light, so a checkbox, a scrollbar or a picker the browser draws is not a white box on a
  dark palette. `npm run check:themes` fails when the light list disagrees with `THEME_OPTS`.
- **A closed dock casts no shadow.** The dock slides off-screen when closed, and its shadow stayed, a dark
  band down the window's right edge on a light palette (both edges on a phone). The shadow is the open
  dock's alone, and a pushing dock still draws none.

## [0.29.4]

### Changed
- **A file that is neither a picture nor text, and none of the kinds named in 0.29.3, says the assistant
  cannot read it**, without advice about converting a picture, which the chat does itself.

## [0.29.3]

### Changed
- **A file the assistant cannot read says what to send instead**, on its chip as it is attached: a PDF
  (paste the text, or a screenshot of the page), an office document (paste the text, or save it as plain
  text or CSV), a recording (use the microphone), a video (a screenshot of the moment), an archive (the
  files inside it). They are told apart by name and type before anything is read.

## [0.29.2]

### Fixed
- **On an Android phone, *File* opens the phone's file browser.** Chrome on Android answers any
  `<input type=file>` with a chooser of the camera and the photo picker, whatever its `accept`, and offers
  the file browser only for the File System Access picker. *File* is that picker
  (`showOpenFilePicker({ multiple: true })`) where the browser has it and the chat is not in another
  origin's frame, which may not show one; a cancelled picker attaches nothing. Everywhere else, framed
  included (a Discord Activity), *File* is the file input as before.

## [0.29.1]

### Fixed
- **A phone can attach a text file.** `+` opens a menu (the chat's own `ChatMenu`, as the options use)
  with two pickers: *Picture*, taking `image/*`, which a phone offers as its photos and camera; and
  *File*, taking any file, which a phone offers as its file browser. One picker for both made Chrome on
  Android offer its photo and camera chooser alone, and a list of text extensions greyed out a file
  whose extension a phone does not map. A file that is neither a picture nor text is refused on its chip
  as before. Where the assistant reads no pictures, `+` opens the file picker at once.

## [0.29.0]

### Changed
- **`createAssistantClient` is the one client of the wire contract**, carrying what the Control Panel's
  own client did, and lives at the import-free subpath `@thekrystalship/krystal-ui/lib/assistantClient`
  (the barrel still exports it).
  - `baseUrl` may be a function, asked on every call; where the assistant is is asked before the
    bearer, so an assistant with no address fails with the site's own error.
  - `renewToken()` and `canRenew()` (optional): a call that may be sent twice is renewed and sent again
    when refused 401; a turn, a confirmation, a command, a stop and an upload are never sent twice, their
    bearer renewed first when its JWT `exp` has passed. Without `renewToken` a 401 is reported.
  - A turn carries a message id and is picked up again from its last frame after a dropped connection
    (`GET /turns/{id}/events?after=`), each frame delivered once; a turn the assistant no longer holds
    ends with a network error, and a cancelled one surfaces as an AbortError. `turns()` and
    `follow(turnId, { after, onEvent, signal })` read the turns open on any surface.
  - The event stream opens with a `hello`, reopens from its last position, and takes a `log.gap`'s
    position; `attach` calls nothing unless the assistant's own `hello` names its stream.
  - `confirm({ token, decision })` sends the contract's `{ handle, decision }`, and the client says
    `declines: true`.
  - Conversations, commands, tools, memories and turns come back as arrays.
  - A refusal carries `envCode`, the refusal's own `code`.
  - Added: `request(method, path, body, opts)` for a product's own routes; the review routes
    (`reviewUsers`, `reviewStats`, `reviewConversations`, `reviewConversation(person, id)`,
    `reviewAttachment(person, id, attachmentId)`).
- **A reviewed transcript's attachments come from the site's `loadReviewAttachment(hostId,
  conversationId, attachment)`**, beside `loadTranscript`, which names the conversation as the site's
  review listing does; the chat no longer asks the client for them.

## [0.28.0]

### Added
- **Attachments to a message.** `+` at the composer's left (a page's one-row composer and a panel's
  bar alike) opens the file picker, offering pictures only where the assistant reads them, and a file
  pasted into or dropped on the composer is taken the same way. A picture is decoded with its
  orientation applied, resized to 2048 pixels on its longer side with the browser's high-quality
  resampling, and written as the smaller of PNG and JPEG, its quality and then its size stepped down
  until it is under about 3 MB, which also drops the camera's location and device data; a PNG already
  within that is sent as it is. A text file is read as UTF-8 and counted at three characters a token,
  as the assistant counts it. Each is uploaded as it is attached, as a chip over the field with its
  thumbnail or file icon, its progress and a remove button. A refusal stands on its chip (not a
  picture or text, a picture over the message's count, a text file longer than a message carries) and
  the text files of a message together over the limit stop the send with the reason. A message may be
  its attachments alone.
- **Sent attachments in the transcript.** A message's pictures are thumbnails over its bubble, one
  alone shown in its own proportions, and open full size in `ChatLightbox`; its text files are chips
  that open the file. History reads them back through the client, since reading one takes the
  person's credential, once per attachment for the life of the page; a message this page sent shows
  its own copy until a reload.
- `createAssistantClient` gains `attachmentLimits()`, `uploadAttachment(blob, name, { onProgress,
  signal })` (with upload progress) and `attachment(conversationId, id)`. `Chat` offers attachments
  only to a client that has them, and shows a reviewed transcript's through `reviewAttachment`.
- Exports: `ChatMessageAttachments`, `ComposerAttachments`, `ChatLightbox`, and from
  `src/chat/attachments.js` `prepareAttachment`, `acceptFor`, `textOverLimit`, `sizeLabel`.

## [0.27.0]

### Added
- **`Chat`'s `layout="page"`: the chat as the whole page a phone's tab opens.** It stands on the
  page's background with no frame, so a black theme is black edge to edge; its header draws its rule
  once the thread scrolls under it. The header carries the conversation's title, a way back to the
  empty conversation (reopening one already waiting empty rather than starting a second) and the
  conversation list as a sheet from the left edge; no close or window buttons and no rail at any
  width. The empty conversation is the greeting in the middle of the screen, with the opening
  suggestions as a row of chips over the composer, each one sent as it is picked, until the person
  writes. The composer is one row: the field growing as it fills, the options (Thinking, Read aloud)
  and the microphone or send, at the tight `--r-sm` radius. An answer carries no name above it. While
  the person writes, `body.chat-typing` gives the tab bar's room to the keyboard, which the chat lays
  over the page with the VirtualKeyboard API where the browser has it; a press elsewhere ends typing
  once it has landed. `layout="panel"` is the default and draws the chat as before.
- **`slots`: a site's own blocks in the chat's frame.** `start` (the empty conversation's column),
  `aboveComposer`, `headerActions` and `history` (the head of the conversation list) each take a node
  or a function of the chat's handle; a place left empty draws the chat's own blocks. Every block in
  the chat reads the handle with `useChat()`: `layout`, `empty`, `usable`, `assistant`, `input`, the
  `conversations`, `ask(text)`, `draft(text)`, `newChat()`, `open(id)` and `client()`. The chat's own
  blocks are exported for a site composing its own: `ChatGreeting`, `ChatSuggestions`,
  `ChatSuggestionChips`, `ChatRecent`, `ChatPrivacyNote`, and `ChatBlock` to set a site's block in the
  column.
- **`usePhone()`**: whether the window is 768px wide or narrower, following it as it changes.

### Changed
- **`BriefingPanel` is replaced by the `start` slot.** A site's block in the empty conversation is
  composed there with the chat's own (`ChatGreeting`, `ChatSuggestions`, `ChatBlock`, `ChatRecent`,
  `ChatPrivacyNote`), and takes `useChat().draft` where it was handed `onPick`. Its wrapper is
  `.chat-start__block`, in place of `.chat-start__brief`.
- **A popover follows its button.** One that a layout change moves while the popover is open (a bar
  coming back, a panel growing) has the popover placed against it again, each frame it is open,
  where it was placed only on a resize or a scroll.

## [0.26.6]

### Fixed
- **A chat in the dock draws no frame of its own.** The dock draws the panel's edges and the bar or
  strip under it draws the bottom one, so `.chat-main` inside `.assistant-dock .chat-page--docked`
  has no border: on a phone its bottom edge stood as a second line on the tab bar's, or on a site's
  strip above the bar, and on a wide screen its left edge beside the dock's.

## [0.26.5]

### Changed
- **On a television a `CollectionTile`'s posters are square-cornered.** An image drawn with rounded
  corners at the panel's resolution costs a television's GPU far more than a square one, and a tile
  draws three or four. On the reference Fire TV, moving down through Cinema's Discover misses a frame
  budget by more than 50 ms 16 to 23 times over 19 moves rather than 33 to 41, and its worst stall is
  103 to 137 ms rather than 203 to 237.

## [0.26.4]

### Changed
- **A `TvCard` asks for its picture once it is a quarter of a screen from being seen.** Every card is
  rendered, so it no longer leaves its picture to the browser's lazy loading, whose reach on a
  television covers a whole page: it shows its surface until it is within a quarter of its scrollers
  of the screen, down the page and along a row. `useNear` (the hook a `CollectionTile` already used)
  takes how far ahead to look, and a tile still looks half a screen ahead. A page loads the pictures
  it did before every card was rendered: on Cinema's Home in the television lab, 40 requests and
  2.6 MB.

## [0.26.3]

### Changed
- **Every `TvCard` is rendered, those past the screen's edge too.** A card skipped until it nears the
  screen was styled and laid out again each time a moving row or page carried it across that edge.
  On the reference Fire TV, with the site's dimming drawn as an overlay, moving through Home's and
  Movies' rows and in and out of the bar misses a frame budget 23 to 28 times over 26 moves rather
  than 33 to 38, and the worst stall crossing into the bar is 120 to 140 ms rather than 220.

## [0.26.2]

### Changed
- **On a television, focus is lit by the glow alone, drawn at once.** A focused card, collection
  tile, button, place in the bar or pill keeps its lift and its glow, without the drop shadow under
  it, and the glow no longer eases in: either one is painted again at the panel's resolution on every
  frame of the lift, which a television's GPU does not keep up with. On the reference Fire TV, moving
  through Home's and Movies' rows misses a frame budget 32 times over the sweep's 28 moves rather than
  99 to 103.

## [0.26.1]

### Changed
- **A `CollectionTile` asks for its posters within half a screen of being seen.** One
  `IntersectionObserver` shared by every tile watches with half a screen of margin, counted past the
  clipped edge of a rail the tile scrolls in (`scrollMargin`), and a tile draws its posters' images once
  it is that near. The browser's own lazy loading reaches much further, which on a page a few screens
  tall is all of it. An engine without `scrollMargin` draws them at once and leaves them to that lazy
  loading.

## [0.26.0]

### Changed
- **`CollectionTile`'s posters load lazily.** Each poster is an image (`.collection-tile__art`) filling
  its slot, `.collection-tile__poster` in a fan and `.collection-tile__cell` in a strip, loaded lazily
  and decoded off the main thread, so a tile far down a page or along a rail fetches nothing until it
  nears the screen. A slot shows `--surface-3` until its poster arrives.

## [0.25.1]

### Fixed
- **The dock has no resize handle on phones.** At 768px and narrower the dock takes the whole width,
  so `.assistant-dock__resize` is not shown there; wider, it keeps the tab.

## [0.25.0]

### Changed
- **The dock's resize handle is a tab inside the dock's left edge.** `.assistant-dock__resize` is a
  14px strip along the inside of the edge, and its `::before` is the tab: 6px wide and 40px long, its
  long side along the edge, its ends cut at 45 degrees, nothing of it outside the panel. It is
  `--border-strong` at rest and `--krystal-teal` under a pointer or while held
  (`.assistant-dock__resize--active`). A site's drawer from the bottom edge draws the same tab lying
  along its top edge.

## [0.24.0]

### Added
- **`ShowcaseCard`'s `eyebrow`**: `{ label, icon?, tone?: "accent" }`, a short line set on the art
  above the name saying what kind of thing the card is. It is light on the dark art in every theme,
  and `"accent"` mixes the theme's accent toward white so it reads there too. Styles:
  `.showcase-card__eyebrow`, `.showcase-card__eyebrow--accent`.
- **`ShowcaseCard`'s `segments`**: an array of fractions from 0 to 1, the thing's parts in order,
  drawn along the art's foot as one short bar per part, each filled as far as its fraction. It takes
  the foot in place of `progress`. Styles: `.showcase-card__segments`.

### Changed
- The name and the eyebrow sit in `.showcase-card__caption`, which is placed at the art's foot;
  `.showcase-card__name` is no longer positioned itself.

## [0.23.0]

### Added
- **`ShowcaseCard`'s `ribbon`**: a switch hanging from the art's top edge on the left, for keeping the
  thing without opening it. While `on` it is filled, draws `iconOn`, and is always shown; while off it
  is shown on the card a fine pointer hovers or that holds focus, and always on a touch screen. Its
  button is a finger's size around a smaller tab, `onClick` gets the press's event, and a `corner`
  moves over to make room. Styles: `.showcase-card__ribbon`, `.showcase-card__ribbon-tab`.

## [0.22.0]

### Added
- **`useCarousel`**: one of `count` slides at a time, turning to the next every `interval` and back to
  the first after the last. It holds still while a mouse is over the slides, while keyboard focus is in
  them (`pauseOnFocus`), while the page is hidden and while `paused` is set, keeps what was left of a
  slide's time across a pause, and never turns by itself under reduced motion. A key or a press in the
  slides starts the slide's time over, and a touch swiped across them turns them. `rootProps` go on
  what holds the slides.
- **`CarouselPager`**: a mark a slide under a `useCarousel`, the shown one long and filling over the
  slide's time, held while the slides are held. Choosing a mark shows its slide; `indicator` draws the
  marks unfocusable, for a television. Styles: `styles/carousel.css`.

## [0.21.2]

### Fixed
- A `CollectionTile` of `size="sm"` draws its fan above its name's line rather than beside it, so a
  name as long as the tile is wide never runs under the posters.

## [0.21.1]

### Fixed
- A `CollectionTile` of `size="sm"` keeps its fan clear of its name: the fan is narrower and the name
  has more of the tile.

## [0.21.0]

### Added
- **`CollectionTile`**: a set of titles as a link, drawn from its posters. `variant="fan"` sets a mark
  and a name at the left with three posters fanned inside the right edge, for a set whose order means
  nothing; `variant="strip"` lays its posters along the top in order, numbered, with the rest counted,
  and with `total` and `watched` follows somebody through it: the titles ahead dim, a segment per title
  fills, `next` is named, and `doneLabel` once all are watched. It fills the width it is given at 16:9
  (`size="sm"`: 25:16 and one poster fewer in a strip) and sizes everything inside from that width. On
  a television it is a flat wide card focused as a `TvCard` is. Styles: `styles/collection-tile.css`.

## [0.20.2]

### Fixed
- Speech endpoints use the correct harness routes: `POST /speech/transcribe` for transcription and `POST /speech/wake`
  to signal an opening microphone or voice channel.

## [0.20.1]

### Changed
- The assistant has no name: the composer placeholder, the "isn't answering" hint, the stopped-answering
  row and the command verdicts say "the assistant" whatever the host is called.
- Bursts of `conversation.activity` and `conversation.updated` events read the conversation listing
  once, after the burst has been quiet for 500 ms.

## [0.20.0]

### Added
- **A turn running on another surface is seen and followed.** `turn.started` and `turn.ended` on the
  event stream keep a list of the person's open turns (read whole through the client's optional
  `turns()` on arrival, on a reconnect and on returning to the foreground). A running turn on the open
  conversation that this surface did not start is read through the client's optional `follow(turnId,
  { signal, onEvent })`, so its prompt and the reply so far appear and the rest is drawn as it is
  written; when it ends the conversation is read again. The composer is busy for it, Stop reaches it,
  and a prompt waiting behind it shows as a chip with its place and a discard.
- A turn this surface sent that waits behind another says so on its answer ("Waiting for the turn ahead",
  with how many are ahead) until its first frame.

## [0.19.0]

### Added
- **The chat reads the assistant wire contract's own frames.** A `proposal` frame draws the same
  action card a stored turn's `confirmation` restates, with the proposal's sentence, an `expiresAt`
  that turns the card to Expired when it passes, and a Decline button for a client that sets
  `declines: true` (the confirm channel then takes `{ token, decision: "decline" }`). A stored turn's
  proposal is rebuilt with what became of it, and `proposal.staged`, `proposal.running` and
  `proposal.resolved` on the event stream move the card on every surface. `turn.started` addresses
  the turn Stop reaches; `context.compacting` shows as the wait it is; `conversation.updated` and
  `log.gap` re-read the list; a `progress` frame with no `key` is keyed by its call and words.
- **Questions.** A `question` frame is drawn as `ChatQuestions`: each question with its options as
  choices (a single pick, or toggles for `multiple`), a field for the person's own words when
  `custom` is true, and one press to send. The answers go out as the next turn with an empty prompt;
  a question the person has moved past, and one in a stored conversation, is plain text.
- `Chat` calls `wakeSpeech()` on a client that has it when the microphone opens.
- A stored turn's `card` and `recordId` are read beside the older `result` and `turnId`; memory
  rows tagged `plugin`, `source: "person"` and `maxPerPerson` are read beside `you` and `maxPerOwner`.

### Changed
- `useConversationStream` works with a client that has no `attach` or `streamId`.

### Fixed
- The composer no longer passes React an `onCompositionCancel`, which is not an event it has (a
  cancelled composition ends with `compositionend`), so mounting the chat stops logging a warning.

## [0.18.1]

### Fixed
- **A `Button` with `href` keeps its label on hover.** The link hover colour no longer reaches a
  button or icon button drawn as a link, so a primary one's words and icon stop turning the colour
  of its own hover fill, and no variant grows an underline.

## [0.18.0]

### Added
- **`OptionList`**: a choice drawn as full-width rows in one bordered group, each row a real radio or
  checkbox inside its label (`multiple`), with a `detail` after the label and a monospace `aside` at
  its end. The chosen row of a single choice is tinted with the accent; `size` is `md` (52px rows) or
  `sm` (44px, 48px on a phone); `collapsedAfter` with `moreLabel` ends a long list with a row that
  reveals the rest; `variant="segmented"` lays a short single choice side by side, label over aside.
- **`Meter`**: a 6px bar holding one `value` (a progressbar) or several `segments` in tones laid end
  to end (a meter), with a monospace caption from `start` and `end`.
- Both are drawn by `styles/controls.css` (`.k-optlist*`, `.k-meter*`).

## [0.17.2]

### Fixed
- **A television page whose cards all step back at once no longer stalls.** A `TvCard` changes
  opacity without a transition, and one off the screen is skipped until it nears it: entering Home's
  rows on a Fire TV restyled every card on every frame of 73 transitions.

## [0.17.1]

### Fixed
- `TvBackdrop` decodes a new picture before fading it in, and no longer animates its height between
  sizes: on a Fire TV both stalled the frame the artwork changed in.

## [0.17.0]

### Added
- **The parts a television page is built from**: `TvBar` and `TvBarButton`, `TvBackdrop`,
  `TvSpotlight`, `TvRow`, `TvCard` and `TvTile`, drawn by `styles/tv.css`, with the margins and card
  sizes as `--tv-*` tokens on `:root[data-tv]`.
- `--shadow-lift` and `--glow-accent` tokens.

### Changed
- **Focus on a television lifts what it is on** instead of drawing an outline and a halo: a card grows
  and rises with a hairline and the accent's light while the rest of its row dims, a button or a place
  in the bar turns into a light pill, and anything else takes the hairline and the light. A primary
  button's ink is dark there.

## [0.16.0]

### Added
- **A site on a television**: with `data-tv` on the root element, the focused element carries a ring
  that reads from across a room (an opaque outline with a gap, and the accent outside it), and
  `Rail` draws no scroll arrows, since a row scrolls to whatever takes focus in it. `styles/tv.css`,
  last in `styles.css`; a site importing sheets one by one adds it after everything else.

### Fixed
- A key pressed on one of `ShowcaseCard`'s `tools` goes on to the document, so a site's own keys
  (Escape, the arrows) answer while a tool has focus. The card's Enter still opens the card only from
  the card itself.
- `styles.css` imports `styles/assistant-pages.css` once.

## [0.15.0]

### Added
- **The assistant's pages**, each over the assistant client and naming no product:
  `AssistantChatsPage` (the chat's `listTarget` as a page), `AssistantMemoryPage` and its section
  `AssistantMemory` with `AssistantMemoryEditor` (the list, the counts against the assistant's
  limits, writing, correcting and forgetting; `unavailable`, `whose`, `BodyEditor` and
  `keyPlaceholder` are the site's), `AssistantSkillsPage` (commands offered through `onUse`, tools
  listed) and `AssistantNotifications` (this browser's push subscription, on and off; `offSub` and
  `children` are the site's). `assistantPushStatus`, `assistantPushSubscribe` and
  `assistantPushUnsubscribe` are its calls on their own.
- `createAssistantClient` gains `tools`, `memories`, `memoryLimits`, `writeMemory`, `deleteMemory`,
  `pushKey`, `pushDevices`, `pushSubscribe` and `pushUnsubscribe`, on the routes the assistant
  wire contract names.
- `styles/assistant-pages.css`, after `settings.css` in `styles.css`: the pages' reading measure
  (`.assistant-page`) and the memory editor (`.mem-editor__*`). A site importing sheets one by one
  adds it. `settings.css` gains `.settings-value` and `.settings-value--mono`.

## [0.14.0]

### Changed
- **The chat window is redrawn in the design system's language**, on every surface that renders
  `Chat`. Three shapes only: text in the column, a card, a one-line event row. The look moves into
  four new sheets after `chat.css` in `styles.css`: `chat-chrome.css` (header, review bar, empty
  conversation, history), `chat-turns.css` (messages, markdown, feedback, the Activity line),
  `chat-actions.css` (the action card, diff, events, command cards, card rows) and
  `chat-composer.css` (the composer, its switches and menus, the slash menu, voice). A site that
  imports sheets one by one adds the four.
- Your message is a bubble with its time on hover; an answer is text, its mark and name only on the
  first answer of a run (`ChatMessage` `lead`), with copy, the thumbs and the time under it on hover.
  Classes `.chat-turn*`; the `user` prop is no longer read.
- `renderMarkdown` draws headings, lists (one level of nesting), tables, links (http and https only),
  italic, quotes, rules and fenced code in a card with a language bar and a copy button. `.chat-md__*`.
- The assistant's work is one Activity line (`ChatActivity`, `.chat-activity*`): working with the
  current step, then "Thought and used 3 tools · 6s", opening to the list of steps. An answer
  carries `startedAt` and `endedAt`, live and from history.
- A failed or interrupted turn is `error: true` with `errorText`, drawn as a quiet warning line under
  what the answer did say.
- A proposed action is one card (`ChatCommand`, `.chat-actcard`) that changes in place: proposed, the
  confirm step, running, then verified, not verified or failed; a `verify` entry carrying the
  command's `cmdId` folds into it. A `write_file` proposal with `file.currentContent` shows a line
  diff (`ChatFileChange`, `.chat-diff*`). `profile.proposal` may return `title`; a verdict may carry
  `tone` ("warn", "danger").
- Toggles, scope changes, compaction and the assistant going and coming back are event rows
  (`ChatEvent`, `ChatEventRow`, `.chat-event*`), worded from what they record and timed by their
  entry's `at`. A day row (`ChatDaySeparator`) marks a change of date.
- `/help` and `/tools` are `ChatCard`s (`.chat-cmds*`); a command row's Use puts it in the composer
  (`ChatThread` `onUseCommand`).
- `ChatCard`: tones neutral, accent, ok, warn, danger, muted; confidence as a dot and a word; the open
  action a ghost button; the head wraps in a narrow column. `ChatCardRows` / `ChatCardRow` (label,
  value, verdict ok/warn/danger/neutral, action; no label = full width) are the row every card body
  uses.
- The header names the conversation, carries a Conversation options menu (Compact, Delete) on a full
  page and the host picker and window buttons in a dock, and shows the connection only when it is
  not online. The review bar is one line.
- The empty conversation is a greeting, suggestion cards (`suggestions` items may be
  `{ text, icon }`), recent conversations and the privacy line (`.chat-start*`, `.chat-recent*`).
- The composer's switches are labelled toggle buttons, and one options menu of switches below 560px
  of composer width; the context meter is a ring that opens its numbers and Compact; queued
  messages and the unavailable line sit above the box; recording takes the box over. The keyboard
  hint is gone; the placeholder mentions `/` when the assistant offers commands.

### Removed
- `ChatThinking`, `ChatContextPill`, `ChatSteps` and `ChatPending` (the Activity line draws all four),
  and the rules of the old chat parts in `chat.css`: `.chat-msg*`, `.chat-code*`, `.chat-disc*`,
  `.chat-context*`, `.chat-steps*`, `.chat-actions*`, `.chat-action*`, `.chat-verify*`,
  `.chat-scope-notice`, `.chat-toggle-notice*`, `.chat-cmdcard*`, `.chat-id*`, `.chat-headbtn*`,
  `.chat-act-toggle*`, `.chat-ctx*`, `.chat-send*`, `.chat-empty*`, `.chat-suggestion*`, `.voice-bar*`,
  `.voice-note*`, `.chat-railbar*`, `.chat-page--solo` and their companions.

## [0.13.1]

### Added
- `Chat` `listTarget`: a page of the site's own where the conversation list is drawn full width —
  New chat as a primary button, a row per conversation with its delete, the open one marked, and an
  `EmptyState` when there are none. `.chat-list`, `.chat-list__rows`, `.chat-list__item`,
  `.chat-list__item--active`, `.chat-list__open`, `.chat-list__title`.

### Changed
- A chat whose conversation list a site draws itself (`railTarget` or `listTarget`) carries no
  history popover in its header.

## [0.13.0]

### Added
- The page furniture, in `styles/page.css` (after `controls.css` in `styles.css`):
  - `PageHeader`: a page's title, an optional `sub` line and its `actions`. `.k-pagehead`,
    `.k-pagehead__titles`, `__title`, `__sub`, `__actions`.
  - `Notice`: a line a page says about itself, in a `tone` of `info` (default), `ok`, `warn` or
    `danger`, with an icon; a danger notice is an alert. `.k-notice`, `.k-notice--<tone>`.
  - `EmptyState`: an icon in a disc, a title, a line or two, a monospace `detail` and `actions`;
    `tone` `neutral`, `accent`, `warn` or `danger`; `page` for the whole screen on a card.
    `.k-empty`, `.k-empty--<tone>`, `.k-empty--card`, `.k-empty-page`, `.k-empty__*`.
  - `ErrorBoundary`: catches what throws while its children render; `fallback` (a node or
    `(reset, error) => node`), `resetKey`, `onError`; without a fallback, a whole-screen crash with
    the error and a reload.
- `Dialog`, in `styles/dialog.css` (after `portal.css`): a framed sheet on `Modal` with a head
  (`icon`, `title`, close), `sub`, a scrolling body and a `foot`; `size` `md` (520px), `lg` (720px),
  `xl` (960px); `fill` for a definite height, full screen on a phone; `art` for a banner; `as="form"`
  with `onSubmit`. `.k-backdrop`, `.k-modal`, `.k-modal--<size>`, `.k-modal--fill`, `.k-modal__art`,
  `__head`, `__icon`, `__title`, `__sub`, `__close`, `__body`, `__foot`.
- `ChatCard` and `ConfidenceBadge`: the card a product draws under an answer, drawing the `.ev-card`
  family chat.css already styled. `tone` `neutral`, `ok`, `danger` or `muted` (`.ev-card--<tone>`);
  `confidence` `confirmed`, `likely` or `possible`; `onOpen` with `openLabel`, or an `action` node. Its
  way to the full context is an outline `Button`.
- `Chat` `railTarget`: the element a site's sidebar gives the conversation list, which is drawn
  there as nav items (`.chat-convos`, `.chat-convos__item`, `.chat-convos__del`) while the chat takes
  the whole width (`.chat-page--railless`). `onShowConversation` and `conversationShown` for a site
  that shows other pages beside the list. `.chat-page--framed` fills an `AppShell`'s main column.
- `k-rise`, the keyframe a sheet arrives with, in `styles/motion.css`. The chat's pop-out already
  named it.

### Fixed
- On a phone with a tab bar, the main column ends above the bar. Its padding was added to a full
  screen's height, so the last of every page sat under the bar.
- A `ChatCard` whose sub line is longer than the card wraps instead of being cut off.

### Added
- The basic controls, in `styles/controls.css` (after `scrollbar.css` in `styles.css`), extracted
  from the Control Panel's button and field families and made one set:
  - `Button`: variants `primary`, `secondary` (default), `outline`, `ghost`, `accent`, `danger`,
    `warning`, `link`; sizes `xs` 26, `sm` 30, `md` 34 (default), `lg` 38, `xl` 46; `icon` and
    `iconRight` (a Lucide name or a node), `tone` (`danger`, `warning`, `success` on hover), `busy`,
    `pressed`, `armed`, `wide`, and `href` for a link drawn as a button. Forwards its ref.
    `.k-btn`, `.k-btn--<variant>`, `.k-btn--<size>`, `.k-btn--tone-<tone>`, `.k-btn--wide`,
    `.k-btn--bare`, `.is-armed`.
  - `IconButton`: the square form, `label` as its accessible name and tooltip; variants `outline`
    (default), `ghost`, `secondary`; sizes `xs`–`lg` on Button's heights; `tone`, `busy`, `pressed`,
    `armed`. `.k-iconbtn`.
  - `Spinner`: a ring in the current colour, `size` in pixels, announced as a status when given a
    `label`. `.k-spinner`.
  - `Input` and `Textarea`: sizes `sm`, `md`, `lg`; `mono`, `wide`, `invalid`; `prefix` and `suffix`
    words inside the frame (`.k-input--affixed`, `.k-input__el`, `.k-input__affix`). Forward their
    refs. `.k-input`, `.k-textarea`.
  - `Checkbox`: a native checkbox in the accent colour with its words beside it; `onChange` receives
    the checked state. `.k-check`, `.k-check__box`, `.k-check__label`.
  - `Field`: a label, its control, and a hint or an error; `aside` beside the label; `group` for a
    frame holding several controls. `.k-field`, `.k-field__label`, `.k-field__aside`,
    `.k-field__hint`, `.k-field__error`.
- `Select` `size` (`sm`, `md`, `lg`) and an `inline` variant sized to its options.
- `k-armed`, the keyframe an armed control breathes with, in `styles/motion.css`.

### Changed
- `Toggle` is drawn by `.k-toggle` and `.k-toggle__knob` and is a `role="switch"` with
  `aria-checked`; its knob takes `--on-accent` when on.
- The chat's verifying, history-loading and compacting states draw `Spinner`, which is styled by
  the package.

## [0.11.0]

### Added
- `styles/scrollbar.css`: every scrollable surface's scrollbar, a thin track-less thumb inset from
  its edge in the theme's `--scrollbar-thumb` and `--scrollbar-thumb-hover`, with `scrollbar-width`
  and `scrollbar-color` for the browsers that draw the standard properties. It sits after
  `motion.css` in `styles.css`.

## [0.10.0]

### Added
- `ShowcaseCard` `tools`: `[{ icon, label, onClick, on?, tone?: "danger" }]`, small round buttons on
  the art's top-right (under the badge when there is one) for what is done to the thing besides
  opening it; `on` marks a switch that is on. A pointer that hovers finds them on the card it is over,
  and a touch screen shows them always. `.showcase-card__tools`, `.showcase-card__tool`.
- `ShowcaseCard` `progress`: a number from 0 to 1 drawn as a bar along the art's foot, the success
  colour at 1. `.showcase-card__progress`.

## [0.9.0]

### Added
- `Skeleton`: one placeholder block, `w` and `h` any CSS length (a number is pixels) and `r` its
  corner radius, shimmering while a surface loads and holding still under
  `prefers-reduced-motion`. Styles are `styles/skeleton.css`, last in `styles.css`: `.skel` the
  block, and `.skel-card`, `.skel-card__art`, `.skel-row` and `.skel-toolbar` the frames a site
  arranges blocks in.

## [0.8.0]

### Added
- `Breadcrumbs`: a view-only trail, `items` of `{ label, href? }` with the current page last. Ancestors
  with an `href` are links, the current page carries `aria-current="page"`, and separators are drawn
  in CSS so a screen reader skips them. `onNavigate(href, event)` takes a plain left click; modified
  clicks and other buttons stay with the browser. It stays on one line at every width, each crumb
  ellipsizing, ancestors before the current page. Styles are `styles/breadcrumbs.css`, after
  `pagination.css` in `styles.css`.

## [0.7.0]

### Added
- `SidebarAccount`: the signed-in person at the foot of the sidebar, an avatar with their name and a
  `sub` line, opening a menu upward of `items` (`{ icon, label, onClick, danger }`) under a head with
  the name and an optional `detail`. On the collapsed rail it is the avatar alone. Its styles, the
  `sidebar__account*` classes, are in `styles/shell.css`; the menu head's second line is
  `.sidebar__account-menu__detail`.
- `Sidebar` takes `closeNav`, which rules off the last group as the groups are ruled off from each
  other.

### Changed
- `Sidebar`'s `top` slot is wrapped in `.sidebar__top`, and the hairline under the brand moves under
  it, so the brand and a search field under it read as one header.

## [0.6.0]

### Added
- `TabBar`: the phone's row of tabs along the bottom edge, each an icon over its label with the
  current one in the accent and an optional count on the icon, clearing the home indicator.
- `AppShell` takes `tabBar`. Given one, a phone (768px and narrower) draws the bar instead of the
  sidebar's drawer and its edge handle, scrolls the main column clear of it, ends an open dock above
  it and hides the dock's floating launcher, which a tab stands in for. Wide screens are unchanged.
- `styles/tabbar.css`, after `footer.css` in `styles.css`.

## [0.5.1]

### Fixed
- A toolbar's Filters and Sort popovers on a phone (600px and narrower) hang from the toolbar and span
  it, instead of hanging their 300px off their button and past the screen's right edge.

### Added
- `ShowcaseCard` is a container named `showcase`, and a fact's icon sits in `.showcase-spec__ico`, so
  a site can fit the facts to the card's own width — letting the icons go on a narrow card, say. The
  icon's own inline display could not be overridden by a sheet.

## [0.5.0]

### Added
- `ShowcaseCard`: a catalogue tile — key art with the name set on it, an optional caution chip and
  badge on the art, a row of facts (an unstated one reads as a muted em-dash), and a foot with one
  status line and the card's action, a button when it does something other than open the card. The
  whole card opens the thing. Its status line is kept when empty, so cards in a row stay level.
- `styles/showcase.css`. Its live dot animates with `kr-pulse`, which a site defines if it wants one.

## [0.4.0]

### Added
- `Footer`: the footer a page ends with, pinned to the bottom of the main column when the page is
  short — the site's mark, wordmark, tagline and an optional note (with a pulsing dot when `live`),
  link groups beside it laid out in their own number of columns, and a bar carrying `copy` and `end`.
  A link the site handles itself takes `onClick` and keeps a modified click the browser's; any other
  opens in a new tab. It collapses on the main column's width.
- `GithubMark`, GitHub's mark for a link to github.com.
- `styles/footer.css`.

## [0.3.1]

### Fixed
- `Chat`'s header names the assistant by `assistantName`, as the transcript does.

## [0.3.0]

### Added
- `Chat`: a conversation with one assistant over the assistant wire contract — turns streamed over
  Server-Sent Events and mirrored to the caller's other open surfaces, proposed actions confirmed by
  their token, the conversation list kept in step with the assistant's, slash commands, thinking and
  auto-run switches, answers read aloud, voice notes, answer feedback, and a read-only review of
  somebody else's conversation. It is given its client (`clientFor`), whether the site is signed in
  (`authed`), and a `profile` saying how the product reads tool results and proposed actions.
- `createAssistantClient({ baseUrl, getToken })`, a client of that contract for a site that holds its
  own bearer; `useConversationStream`; and the parts the chat is drawn from (`ChatThread`,
  `ChatMessage`, `ChatCommand`, `MarkdownTextarea`, `VoiceComposerBar`, `useVoiceRecorder`, …) with the
  conversation functions beneath it (`reduceTurnFrame`, `scaffoldHistory`, `mergeServerConversations`, …).
- `styles/chat.css`, including the card shell under an answer (`.chat-evidence`, `.ev-card`) and the
  chat's layout inside the dock.
- `lib/sse`, the Server-Sent Events reader, addressable on its own.
- `npm run lint` and `npm run check:markdown` (the composer's highlighter emits every character once).

## [0.2.0]

### Added
- The application frame: `AppShell` (a sidebar beside a scrolling main column, room reserved for a
  pinned dock), `Sidebar` with its collapsed icon rail and its phone drawer, `SidebarGroup` (with an
  optional label), `NavItem` (keyboard-reachable, with a count badge), `MobileNavToggle`, and the
  `useStoredFlag` and `useEdgeSwipe` hooks. The sidebar's search field styles (`.sidebar__search`)
  come with it.
- The dock: `Dock`, `DockFab` and `useDock` — open, resizable, pinned beside the page or floating
  over it, each kept in the browser under a key the site chooses.
- `Hero`, the cinematic banner: key art behind a scrim, a heading on the art, a frosted control bar,
  and the `.gbtn` glass button. `.hero__on-art` gives anything else set on the art the same
  theme-invariant palette.

## [0.1.0]

### Added
- The package: tokens and themes with the Inter and JetBrains Mono faces, the shared keyframes, and
  the components every Krystal site starts from — `BriefCard`, `Rail`, `SubTabs`, `Toolbar`,
  `Pagination`, `Select`, `Modal`, `ReversablePortal`, `SettingsSection`/`SettingsRow`/`Toggle`,
  `ThemePicker`, `Toasts`, `NotificationsPanel`, `Icon`, `AccountAvatar` and `AssistantFabIcon` —
  with their stylesheets, the store they read (`createStore`/`useStore`), the theme preference, the
  toast store, `copyText`, the Web Push browser mechanics and `fmtRelative`.
- A toast carries an opaque `subject`, handed back through `NotificationsPanel`'s `onOpen`.
- The modules under `lib/` are addressable one at a time (`@thekrystalship/krystal-ui/lib/store`),
  for code that runs outside a browser and must not load React DOM.
