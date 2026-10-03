# Changelog

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
