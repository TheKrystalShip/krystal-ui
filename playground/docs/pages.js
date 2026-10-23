// The documentation's page list: one page per component (or per set of parts that are used
// together), grouped the way the README's "What is in it" table groups them.
//   id        the hash route, #/<id>
//   exports   the names whose generated API the page shows, from the packages' index.js
//   summary   what it is for; versus, when to use it instead of a neighbour
//   examples  keys into docs/examples.jsx: the live examples the page draws

export const GROUPS = [
  "Controls", "Choices and navigation", "Labels and data", "Cards and lists", "Forms and page furniture",
  "Overlays", "Page patterns", "The frame", "Telling a person", "Television", "State and helpers", "The assistant chat",
];

export const PAGES = [
  // Controls
  {
    id: "button", name: "Button", group: "Controls", exports: ["Button", "IconButton"], examples: ["button", "icon-button"],
    summary: "The one push button every site draws; its variant says how loud it is, never what it does.",
    versus: "IconButton for an icon with no words. A link that should read as prose is Button variant link; a navigation to another page is an `href`.",
  },
  {
    id: "input", name: "Input, Textarea, PasswordInput", group: "Controls", exports: ["Input", "Textarea", "PasswordInput"],
    examples: ["input", "password-input"],
    summary: "Single-line and multi-line text fields in one size ladder shared with Button, with a prefix, a suffix and a mono face.",
    versus: "Field wraps one in a label, hint and error. Select and Combobox pick from options instead of typing.",
  },
  {
    id: "field", name: "Field", group: "Controls", exports: ["Field"], examples: ["field"],
    summary: "One labelled control: the label, the control, then a hint or an error.",
    versus: "FormField binds a Field to a useForm handle by name; use Field when the value lives in the site's own state.",
  },
  {
    id: "checkbox", name: "Checkbox and Toggle", group: "Controls", exports: ["Checkbox", "Toggle"], examples: ["checkbox"],
    summary: "A checkbox for one choice that is submitted with a form, and a switch for one that takes effect when it is flipped.",
    versus: "A Toggle has no Save after it; a Checkbox waits for the form. A set of exclusive choices is RadioGroup or OptionList.",
  },
  {
    id: "select", name: "Select", group: "Controls", exports: ["Select"], examples: ["select"],
    summary: "A native select drawn the same on every browser, in field, inline and chip variants.",
    versus: "Combobox when the list is long enough to filter; OptionList or RadioGroup when the choices should be visible at once.",
  },
  {
    id: "combobox", name: "Combobox", group: "Controls", exports: ["Combobox"], examples: ["combobox"],
    summary: "A text field that filters a list of options and picks one: the editable combobox with a listbox popup.",
    versus: "Select for a short fixed list. A site that searches a server passes `inputValue` and `onInputChange`.",
  },
  {
    id: "date-time-picker", name: "DateTimePicker and DatePicker", group: "Controls", exports: ["DateTimePicker", "DatePicker"], examples: ["date-time-picker"],
    summary: "A field that shows a moment or a day and opens a picker for it: a Popover on a desktop, a bottom Drawer on a phone.",
    versus: "Calendar, TimeGrid and TimeInput are the parts, for a page that lays a picker out in the open. DatePicker picks a day in one press; DateTimePicker waits for Done.",
  },
  {
    id: "calendar", name: "Calendar", group: "Controls", exports: ["Calendar"], examples: ["calendar"],
    summary: "One month as a grid of days to pick a date from, inside a range, with marked days and today ringed.",
    versus: "DatePicker puts it behind a field; use Calendar when the month stays on the page.",
  },
  {
    id: "time-grid", name: "TimeGrid", group: "Controls", exports: ["TimeGrid"], examples: ["time-grid"],
    summary: "Times of day as a grid of buttons, one or several chosen, from the next step after now when nothing else is said.",
    versus: "TimeInput for a time typed to the minute; TimeGrid for times on a step, seen at once.",
  },
  {
    id: "time-input", name: "TimeInput", group: "Controls", exports: ["TimeInput"], examples: ["time-input"],
    summary: "A time of day typed as hours and minutes on the 24-hour clock, each a spin button.",
    versus: "TimeGrid shows times on a step to press; DateTimePicker holds a TimeInput beside its Calendar.",
  },
  {
    id: "option-list", name: "OptionList", group: "Controls", exports: ["OptionList"], examples: ["option-list"],
    summary: "Choices as full-width rows in one bordered group, the whole row the hit target; single or multiple.",
    versus: "RadioGroup is the compact single choice for a handful of short labels; OptionList is the form field with detail and asides.",
  },
  {
    id: "radio-group", name: "RadioGroup", group: "Controls", exports: ["RadioGroup", "ColorInput"], examples: ["radio-group"],
    summary: "A small single choice drawn inline or stacked, each option a button with role radio.",
    versus: "OptionList for longer labels with detail; Tabs for choices that switch panels; Select for many options.",
  },
  {
    id: "slider", name: "Slider", group: "Controls", exports: ["Slider"], examples: ["slider"],
    summary: "One number picked along a line, with marks, a formatted readout and a final-value callback for a drag.",
  },
  {
    id: "progress", name: "Meter, Spinner, Skeleton", group: "Controls", exports: ["Meter", "Spinner", "Skeleton"], examples: ["meter"],
    summary: "A bar that fills to a measured value, a spinner for work with no measure, and a placeholder block for content on its way.",
    versus: "Meter when the amount is known (it can be split into segments); Spinner when it is not; Skeleton for the shape of what will arrive.",
  },
  {
    id: "status-dot", name: "StatusDot", group: "Controls", exports: ["StatusDot"], examples: ["status-dot"],
    summary: "A lit dot that says a state by tone and, always, in words.",
    versus: "Pill for a label that stands on its own; StatusDot sits beside a name and can pulse for live.",
  },
  {
    id: "provider-button", name: "ProviderButton", group: "Controls", exports: ["ProviderButton", "ProviderMark", "providerLabel"], examples: ["provider-button"],
    summary: "A sign-in provider's mark and name, and a button carrying them.",
  },

  // Choices and navigation
  {
    id: "tabs", name: "Tabs", group: "Choices and navigation", exports: ["Tabs", "TabList", "Tab", "TabPanel"], examples: ["tabs"],
    summary: "In-page panels behind a row of tabs: the WAI-ARIA tabs pattern, underline or segmented.",
    versus: "SubTabs switches sections whose content the site renders itself and becomes a select at phone width; Tabs owns the panels and their ARIA wiring.",
  },
  {
    id: "steps", name: "Steps", group: "Choices and navigation", exports: ["Steps"], examples: ["steps"],
    summary: "Where somebody is in a sequence they can move around in: a numbered rail with each step's answer, or small dots.",
    versus: "Tabs when each step is a panel the package should wire; CarouselPager for slides that turn by themselves.",
  },
  {
    id: "sub-tabs", name: "SubTabs", group: "Choices and navigation", exports: ["SubTabs"], examples: ["sub-tabs"],
    summary: "The in-page section switcher: a button strip on a wide screen and a select on a phone.",
    versus: "Tabs when the package should render the panels.",
  },
  {
    id: "breadcrumbs", name: "Breadcrumbs", group: "Choices and navigation", exports: ["Breadcrumbs"], examples: ["breadcrumbs"],
    summary: "A one-line trail of real links above a page that ellipsizes at phone width.",
  },
  {
    id: "pagination", name: "Pagination", group: "Choices and navigation", exports: ["Pagination", "paginationWindow", "useDebouncedValue"], examples: [],
    summary: "A page navigator for server-paginated lists whose total is unbounded.",
  },
  {
    id: "disclosure", name: "Disclosure and Accordion", group: "Choices and navigation", exports: ["Disclosure", "Accordion"], examples: ["disclosure"],
    summary: "A summary that opens its content, and a group of them where arrow keys move between the summaries.",
  },
  {
    id: "rail", name: "Rail", group: "Choices and navigation", exports: ["Rail"], examples: [],
    summary: "A horizontal, scroll-snapped shelf inside a card, so one row reaches a whole collection.",
  },
  {
    id: "shelf", name: "Shelf", group: "Choices and navigation", exports: ["Shelf"], examples: ["shelf"],
    summary: "A titled section of a page laying its items out in a grid: a heading, a line under it, an action opposite and a row of controls.",
    versus: "Rail for one row that scrolls through a whole collection inside a card.",
  },
  {
    id: "carousel", name: "useCarousel and CarouselPager", group: "Choices and navigation", exports: ["useCarousel", "CarouselPager"], examples: [],
    summary: "One of several slides at a time, turning by itself on an interval, and the marks under them.",
  },

  // Labels and data
  {
    id: "pill", name: "Pill", group: "Labels and data", exports: ["Pill"], examples: ["pill"],
    summary: "A count, a state or a kind as a small non-interactive label.",
    versus: "StatusDot for a state beside a name; a Button or Tab for anything that can be pressed.",
  },
  {
    id: "kbd", name: "Kbd", group: "Labels and data", exports: ["Kbd"], examples: ["kbd"],
    summary: "A keyboard key, or a chord with `keys`, set in mono.",
  },
  {
    id: "table", name: "Table", group: "Labels and data", exports: ["Table", "sortRows"], examples: ["table"],
    summary: "A real table with sortable headers, rows that open, row actions, and a card per row at phone width.",
    versus: "List when each record is a row with a lead, pills and actions rather than aligned columns.",
  },
  {
    id: "stat-tile", name: "StatTile", group: "Labels and data", exports: ["StatTile", "StatTiles"], examples: ["stat-tile"],
    summary: "One measured figure with its label, and the grid of them; an unmeasured figure is a dash, never a zero.",
  },
  {
    id: "card", name: "Card", group: "Labels and data", exports: ["Card"], examples: ["card"],
    summary: "A framed surface with a head, a foot and an optional open target.",
    versus: "BriefCard for a card that carries a list and a count; ShowcaseCard for catalogue key art.",
  },
  {
    id: "data-state", name: "DataState", group: "Labels and data", exports: ["DataState"], examples: ["data-state"],
    summary: "Draws loading, failed, empty or loaded from what the site says it read.",
  },
  {
    id: "avatar", name: "Avatar", group: "Labels and data", exports: ["Avatar", "AccountAvatar", "AssistantFabIcon"], examples: ["avatar"],
    summary: "A person or a thing as a picture or its initials, with a status dot.",
  },
  {
    id: "icon", name: "Icon", group: "Labels and data", exports: ["Icon"], examples: [],
    summary: "Lucide icons by kebab-case name.",
  },
  {
    id: "layout", name: "Stack, Cluster, Grid, Container", group: "Labels and data", exports: ["Stack", "Cluster", "Grid", "Container"], examples: ["layout"],
    summary: "The four boxes a page's structure is built from, so a site draws no flex or grid wrapper of its own.",
    versus: "Stack is a column, Cluster a wrapping row, Grid columns of a minimum width, Container the centred page column.",
  },

  // Cards and lists
  {
    id: "list", name: "List and ListRow", group: "Cards and lists", exports: ["List", "ListRow"], examples: ["list"],
    summary: "A framed list of rows, each with a lead, pills, an aside and actions; a row can open as a whole.",
    versus: "Table for aligned columns of records.",
  },
  {
    id: "brief-card", name: "BriefCard", group: "Cards and lists", exports: ["BriefCard", "BriefList", "BriefItem", "BriefEmpty", "FactList"], examples: ["brief", "brief-card-count"],
    summary: "The briefing card shell and the furniture that goes inside it.",
    versus: "Card for a plain framed surface.",
  },
  {
    id: "showcase-card", name: "ShowcaseCard", group: "Cards and lists", exports: ["ShowcaseCard"], examples: ["showcase-card"],
    summary: "A catalogue tile: key art, three facts, a status and an action.",
  },
  {
    id: "collection-tile", name: "CollectionTile", group: "Cards and lists", exports: ["CollectionTile"], examples: [],
    summary: "A set of titles shown by its posters, as a link.",
  },
  {
    id: "hero", name: "Hero", group: "Cards and lists", exports: ["Hero", "HeroStatus", "HeroBody", "HeroHeading", "HeroName", "HeroNote", "HeroTags", "HeroTag", "HeroBar", "HeroGroup", "HeroDivider", "HeroButton"], examples: ["pages-detail"],
    summary: "The cinematic banner: art behind a scrim, and the page's own content over it.",
  },

  // Forms and page furniture
  {
    id: "form", name: "Forms", group: "Forms and page furniture", exports: ["useForm", "Form", "FormScope", "FormField", "FormError", "FormSubmit"], examples: ["forms"],
    summary: "A form's values, rules, async validation and submission state, and the fields bound to it by name.",
    versus: "Field when the value lives in the site's own state.",
  },
  {
    id: "search-field", name: "SearchField", group: "Forms and page furniture", exports: ["SearchField"], examples: ["search-field"],
    summary: "A large pill search or naming field: a leading icon, the input and a submit button in one frame.",
    versus: "ToolbarSearch for the small filter that narrows a list as it is typed.",
  },
  {
    id: "toolbar", name: "Toolbar", group: "Forms and page furniture", exports: ["Toolbar", "ToolbarSearch", "ToolbarFilters", "ToolbarSort", "ToolbarButton", "ToolbarCount", "ToolbarSpacer", "useFilters"], examples: ["toolbar"],
    summary: "The filter, search, sort and action bar that sits directly on a page.",
  },
  {
    id: "page-header", name: "PageHeader", group: "Forms and page furniture", exports: ["PageHeader"], examples: ["page-header"],
    summary: "A page's title, a line under it, and its actions.",
  },
  {
    id: "notice", name: "Notice", group: "Forms and page furniture", exports: ["Notice"], examples: ["notice"],
    summary: "Something that failed or something to know before acting, inside the content it is about.",
    versus: "Toasts for an outcome that arrives after an action; EmptyState for a place with nothing in it.",
  },
  {
    id: "empty-state", name: "EmptyState", group: "Forms and page furniture", exports: ["EmptyState"], examples: ["empty-state"],
    summary: "What a place shows when it has nothing else to: an icon, a title, a line or two and actions.",
  },
  {
    id: "error-boundary", name: "ErrorBoundary", group: "Forms and page furniture", exports: ["ErrorBoundary"], examples: [],
    summary: "Catches a render error below it and draws a failure state in its place.",
  },
  {
    id: "settings", name: "SettingsSection and SettingsRow", group: "Forms and page furniture", exports: ["SettingsSection", "SettingsRow"], examples: ["settings"],
    summary: "The settings furniture: a titled section of rows, each a title, a line and a control.",
    versus: "SettingsPage composes sections with a side nav and a save bar.",
  },
  {
    id: "theme-picker", name: "ThemePicker", group: "Forms and page furniture", exports: ["ThemePicker"], examples: [],
    summary: "The themes as swatches, grouped by light and dark. It sits at the top of every page of this documentation.",
  },

  // Overlays
  {
    id: "dialog", name: "Dialog and Modal", group: "Overlays", exports: ["Dialog", "Modal"], examples: ["dialogs", "fullscreen"],
    summary: "A framed sheet over a scrim, with focus trapped and the page behind inert; Modal is the primitive under it.",
    versus: "Drawer for a sheet from an edge, a phone's counterpart to Dialog. Popover for a non-modal panel by its trigger. Menu for a list of commands.",
  },
  {
    id: "confirm-dialog", name: "ConfirmDialog", group: "Overlays", exports: ["ConfirmDialog"], examples: ["confirm"],
    summary: "A question put to a person before a change that is hard to take back.",
  },
  {
    id: "form-dialog", name: "FormDialog", group: "Overlays", exports: ["FormDialog"], examples: ["form-dialog"],
    summary: "A dialog that is the form of a useForm handle: Enter submits, Cancel closes, and nothing dismisses it while it submits.",
  },
  {
    id: "drawer", name: "Drawer", group: "Overlays", exports: ["Drawer"], examples: ["drawer"],
    summary: "A modal sheet from the bottom, right or left edge, with Dialog's props, a drag handle and pull-to-dismiss.",
    versus: "Dialog on a desktop and Drawer on a phone is the usual pairing.",
  },
  {
    id: "popover", name: "Popover", group: "Overlays", exports: ["Popover"], examples: ["popover"],
    summary: "A non-modal floating panel anchored to a trigger, for content that is more than a list of commands.",
    versus: "Menu for commands; Tooltip for a one-line label; Dialog when the person must answer first.",
  },
  {
    id: "tooltip", name: "Tooltip", group: "Overlays", exports: ["Tooltip"], examples: ["tooltip"],
    summary: "A short label for a control that has no words, shown on hover and keyboard focus.",
  },
  {
    id: "menu", name: "Menu", group: "Overlays", exports: ["Menu", "MenuItem", "MenuCheckboxItem", "MenuRadioGroup", "MenuRadioItem", "MenuGroup", "MenuSeparator"], examples: ["menu"],
    summary: "A list of commands opened from a button: the WAI-ARIA menu button pattern.",
    versus: "Popover when the panel holds anything but commands.",
  },
  {
    id: "overlay-hooks", name: "Overlay hooks", group: "Overlays", exports: ["usePortalPopover", "useModalBehaviour", "ReversablePortal"], examples: [],
    summary: "What makes an overlay a dialog (`useModalBehaviour`), what places a floating panel (`usePortalPopover`), and a portal that moves a mounted subtree.",
  },

  // Page patterns
  {
    id: "list-page", name: "ListPage", group: "Page patterns", exports: ["ListPage"], examples: ["pages-list"],
    summary: "The page that lists records: heading, toolbar, rows, table or grid, pager, and the loading, failed and empty states.",
  },
  {
    id: "detail-page", name: "DetailPage", group: "Page patterns", exports: ["DetailPage"], examples: ["pages-detail"],
    summary: "The page about one record: crumbs, a head or a Hero, tabs, an aside column and the whole-page states.",
  },
  {
    id: "settings-page", name: "SettingsPage", group: "Page patterns", exports: ["SettingsPage"], examples: ["pages-settings"],
    summary: "Sections of rows, a side nav that becomes a select at phone width, and a save bar that follows a form's dirty state.",
  },
  {
    id: "sign-in-screen", name: "SignInScreen", group: "Page patterns", exports: ["SignInScreen"], examples: ["pages-signin"],
    summary: "The sign-in card: providers, a username and password form, a refusal and a foot. It signs nobody in.",
  },
  {
    id: "card-screen", name: "CardScreen", group: "Page patterns", exports: ["CardScreen"], examples: ["card-screen"],
    summary: "The centred card on the page background that sign-in, approval and signed-out screens stand on.",
  },
  {
    id: "copy-field", name: "CopyField", group: "Page patterns", exports: ["CopyField"], examples: ["copy-field"],
    summary: "A read-only value with a copy button in its suffix.",
  },

  // The frame
  {
    id: "app-shell", name: "AppShell and Sidebar", group: "The frame", exports: ["AppShell", "Sidebar", "SidebarGroup", "NavItem", "SidebarAccount", "MobileNavToggle", "TabBar", "useStoredFlag", "useEdgeSwipe", "usePhone"], examples: ["frame", "navitem-badge", "tabbar"],
    summary: "A sidebar beside a scrolling main column, an icon rail when collapsed, an off-canvas drawer on a phone or a bottom tab bar.",
  },
  {
    id: "dock", name: "Dock", group: "The frame", exports: ["Dock", "DockFab", "useDock"], examples: [],
    summary: "A panel docked beside the page or floating over it, with its launcher and its remembered width, pin and open state.",
  },
  {
    id: "footer", name: "Footer", group: "The frame", exports: ["Footer", "GithubMark"], examples: [],
    summary: "The footer a page ends with: a brand block, link groups and a bar.",
  },

  // Telling a person
  {
    id: "toasts", name: "Toasts and notifications", group: "Telling a person", exports: ["Toasts", "NotificationsPanel", "toast", "toastStore", "unreadCount", "unreadTone"], examples: [],
    summary: "The live stack of outcome cards, the history behind them, and the call a site makes to raise one.",
    versus: "Notice for something inside the content it is about.",
  },

  // Television
  {
    id: "tv", name: "Television parts", group: "Television", exports: ["TvBackdrop", "TvBar", "TvBarButton", "TvCard", "TvHeading", "TvRow", "TvSpotlight", "TvTile", "useSpatialFocus", "createSpatialFocus", "focusElement"], examples: ["tv-focus"],
    summary: "The parts a site is drawn from on a television, under a root marked `data-tv`, sized for the distance and driven by spatial focus.",
  },

  // State and helpers
  {
    id: "follow-tail", name: "useFollowTail", group: "State and helpers", exports: ["useFollowTail"], examples: ["followtail"],
    summary: "Keeps a scrolling feed pinned to its bottom while the reader is there, and counts what arrives while they are parked.",
  },
  {
    id: "stores", name: "Stores and themes", group: "State and helpers", exports: ["createStore", "useStore", "themeStore", "useThemePref", "useResolvedTheme", "resolveTheme", "registerThemes", "THEME_KEY", "THEME_OPTS"], examples: [],
    summary: "The reactive container every site keeps its state in, and the theme store behind the picker.",
  },
  {
    id: "helpers", name: "Helpers", group: "State and helpers", exports: ["copyText", "pushBrowser", "fmtRelative"], examples: [],
    summary: "Copy to the clipboard, the browser half of Web Push, and a relative time.",
  },

  // The assistant chat
  {
    id: "chat", name: "Chat", group: "The assistant chat", exports: ["Chat", "ChatActivity", "ChatBlock", "ChatGreeting", "ChatSuggestionChips", "useChat", "ChatMessage", "ChatThread", "ChatEvidence", "ChatCommand", "ChatDaySeparator", "ChatEvent", "ChatEventRow", "ChatFileChange", "ChatVerify", "ChatMessageAttachments", "ComposerAttachments", "ChatLightbox", "MarkdownTextarea", "VoiceComposerBar", "VoiceNoteBubble", "useVoiceRecorder", "useConversationStream", "createAssistantClient", "renderMarkdown"], examples: ["chat-frame"],
    summary: "The assistant chat, the parts it is drawn from, and the client of the assistant wire contract.",
  },
  {
    id: "chat-card", name: "ChatCard", group: "The assistant chat", exports: ["ChatCard", "ChatCardRows", "ChatCardRow", "ConfidenceBadge"], examples: ["chat-card"],
    summary: "The card a product draws under an answer.",
  },
  {
    id: "assistant-pages", name: "The assistant's pages", group: "The assistant chat", exports: ["AssistantChatsPage", "AssistantPage", "AssistantNotifications", "assistantPushStatus", "assistantPushSubscribe", "assistantPushUnsubscribe"], examples: [],
    summary: "The chats page, the notification switch and the push calls that register with an assistant.",
  },
  {
    id: "chat-conversation", name: "Conversation functions", group: "The assistant chat", exports: ["conversationTitle", "promotePendingCards", "reduceTurnFrame", "proposalMessage", "waitingProposal", "settleProposal", "questionMessage", "answersText", "scaffoldHistory", "scaffoldConversation", "scaffoldLiveTurn", "latestUsage", "adoptServerConversation", "mergeServerConversations", "prepareAttachment", "acceptFor", "textOverLimit", "sizeLabel", "chatUid", "toolLabel", "NEW_CHAT_TITLE", "CHAT_PRIVACY_NOTICE", "CHAT_DEFAULT_PROFILE", "CHAT_TOGGLE_COPY"], examples: [],
    summary: "The functions that fold the wire contract's frames into a conversation, and the attachment helpers.",
  },
];
