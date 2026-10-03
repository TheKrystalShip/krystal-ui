# Changelog

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
