# Changelog

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
