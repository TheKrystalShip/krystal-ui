# Changelog

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
