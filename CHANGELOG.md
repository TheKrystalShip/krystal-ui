# Changelog

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
