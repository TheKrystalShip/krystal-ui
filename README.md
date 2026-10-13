# krystal-ui

`@thekrystalship/krystal-ui` — the Krystal design system as React components, stores and
stylesheets. Every TheKrystalShip web surface is built from it: the KGSM Control Panel and its
companion pages (`kgsm-web`) and Krystal Cinema (`moviebot/web/site`).

## Using it

The package is published to GitHub Packages. A consuming repo maps the scope in its own `.npmrc`:

```
@thekrystalship:registry=https://npm.pkg.github.com
```

and a workstation holds the credential in `~/.npmrc` (`//npm.pkg.github.com/:_authToken=…`, a token
with `read:packages`; publishing needs `write:packages`). The registry asks for a token even to
install, so CI passes its `GITHUB_TOKEN` with `permissions: packages: read`.

```js
import "@thekrystalship/krystal-ui/styles.css";        // tokens, fonts and every component's styles
import { BriefCard, Icon, Rail, Toasts, toast } from "@thekrystalship/krystal-ui";
```

React 18, React DOM and `lucide-react` are peer dependencies: the site's own copies are used.

The modules under `lib/` (`store`, `theme`, `toasts`, `time`, `clipboard`, `pushBrowser`) are also
addressable one at a time — `@thekrystalship/krystal-ui/lib/time` — for code that runs outside a
browser and must not load React.

A site that has its own stylesheet cascade imports the sheets one at a time from
`@thekrystalship/krystal-ui/styles/` and places each where its rules have to sit; `styles.css`
lists them in the order they assume.

## What is in it

| Kind | Exports |
|---|---|
| The frame | `AppShell`, `Sidebar`, `SidebarGroup`, `NavItem`, `SidebarAccount`, `MobileNavToggle`, `TabBar`, `useStoredFlag`, `useEdgeSwipe` |
| The dock | `Dock`, `DockFab`, `useDock` |
| Banners | `Hero` |
| The footer | `Footer` (brand block, link groups, bar), `GithubMark` |
| The assistant chat | `Chat`, `createAssistantClient`, `useConversationStream`, `ChatCard` (the card a product draws under an answer) with `ChatCardRows`, `ChatCardRow` and `ConfidenceBadge`, the parts it is drawn from (`ChatThread`, `ChatMessage`, `ChatActivity`, `ChatCommand`, `ChatEvent`, `ChatEventRow`, `ChatDaySeparator`, `ChatFileChange`, `MarkdownTextarea`, `useVoiceRecorder`, …) and the conversation functions (`reduceTurnFrame`, `scaffoldHistory`, `mergeServerConversations`, …) |
| Cards and lists | `BriefCard`, `ShowcaseCard` (key art, three facts, a status and an action, with optional round `tools` on the art, a `ribbon` hanging from its top edge for keeping the thing, an `eyebrow` above the name saying what kind of thing it is, and along its foot a `progress` bar or one short bar per part in `segments`), `CollectionTile` (a set of titles as a link: `fan` draws three posters fanned beside its mark and name, `strip` its posters in order, numbered, and with `total` and `watched` follows somebody through it; it fills its slot at a fixed shape and takes a TvCard's focus on a television), `Rail`, `Pagination`, `Breadcrumbs` (a one-line trail of real links that ellipsizes at phone width; the site computes the `items`, `onNavigate` lets a single-page site take a plain click), `SubTabs`, `Toolbar` (+ `ToolbarSearch`, `ToolbarFilters`, `ToolbarSort`, `ToolbarButton`, `ToolbarCount`, `ToolbarSpacer`, `useFilters`) |
| Slides | `useCarousel` (one of several slides at a time, turning by itself on an interval: held still under a mouse, under keyboard focus, on a hidden page and while `paused`, never turning by itself under reduced motion, its time started over by a key or a press in it, and turned by a swipe), `CarouselPager` (a mark a slide, the shown one filling over the slide's time; `indicator` for a television, where the marks are not focused) |
| Controls | `Button`, `IconButton`, `Spinner`, `Toggle`, `Input`, `Textarea`, `Checkbox`, `Field`, `Select`, `OptionList`, `Meter` |
| Page furniture | `PageHeader`, `Notice`, `EmptyState`, `ErrorBoundary` |
| Settings furniture | `SettingsSection`, `SettingsRow`, `ThemePicker` |
| Overlays | `Dialog`, `Modal`, `ReversablePortal`, `usePortalPopover` |
| Loading | `Skeleton` (one shimmering placeholder block, laid out by the site in the footprint its content will take; still under reduced motion) |
| Telling a person | `Toasts`, `NotificationsPanel`, `toast`, `toastStore` |
| The assistant's pages | `AssistantChatsPage`, `AssistantMemoryPage`, `AssistantSkillsPage`, `AssistantNotifications`, `AssistantMemory`, `AssistantMemoryEditor`, and the push calls `assistantPushStatus`, `assistantPushSubscribe`, `assistantPushUnsubscribe` |
| Marks | `Icon` (Lucide, by kebab-case name), `AccountAvatar`, `AssistantFabIcon` |
| State and helpers | `createStore`/`useStore`, `themeStore` + `THEME_OPTS`, `copyText`, `pushBrowser`, `fmtRelative` |

Stylesheets: `styles/tokens.css` (every colour, type, spacing, radius and motion token, every
theme, and the Inter / JetBrains Mono faces), `styles/motion.css` (shared keyframes),
`styles/scrollbar.css` (the scrollbar every scrollable surface draws), `styles/controls.css` (the
basic controls, below), `styles/page.css` (the page furniture), `styles/dialog.css`, and one sheet
per component family. `assets/tks-mark.png` is the brand mark.

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
crash with a reload. `Dialog` is a framed sheet on `Modal`: `size` is md (520px), lg (720px) or xl
(960px), `fill` gives it a definite height for a body that sizes itself to its container, `as="form"`
with `onSubmit` makes the sheet a form, and `art` draws a banner above the head.

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
      top={<label className="sidebar__search">…</label>}
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
while the other cards in its row dim, at once rather than over a transition, and a `Button`, a place in the bar or anything marked `tv-pill`
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
  above a row, its name on one line. `tv-spot__overview` and `tv-spot__actions` place a story and buttons.
- `TvRow` — a heading with `icon`, `title` and `count`, then its cards and `end`, running past the
  right margin; it is a `data-tv-row`, which a site's navigator can place on a line.
- `TvCard` — a picture that is a link, `poster` or `wide`, with `progress` and a `badge`; every
  other prop reaches the link. A card off the screen is skipped (`content-visibility: auto`) until it
  nears it, so a page of rows styles and paints only what shows. `TvTile` ends a row: an icon over a few words, the cards' size.

`--tv-margin-x` and `--tv-margin-y` are the margins a television may crop, and the card sizes are
tokens beside them. Moving focus with the remote's arrows is the site's. `styles/tv.css` is the last
sheet, after everything whose focus it overrides.

## The assistant chat

`Chat` is a conversation with one assistant over the assistant wire contract
(`tks-assistant/docs/wire-contract.md`): turns streamed over Server-Sent Events, proposed actions
confirmed or declined by their handle, questions the assistant asks answered as the next turn, the
conversation list kept in step with the assistant's, voice notes, and a read-only review of
somebody else's conversation. It holds no credential and knows no product:

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

A client is `createAssistantClient`'s shape, and these members are optional: `attach` and `streamId`
(an assistant whose event stream sends one conversation's turn frames), `declines: true` (the confirm
channel takes `{ token, decision: "decline" }`, which gives a proposal card a Decline button), and
`wakeSpeech()` (called when the microphone opens), and `turns()` with `follow(turnId, { signal, onEvent })`
(the turns the person has open on any surface, and reading one of them frame by frame). A `question` frame is drawn as choices and a
field for the person's own words, and the answers go out as the next turn's `answers`.

A site whose frame has a sidebar can keep the conversation list there: `railTarget` is the element
the list is drawn into, and the chat takes the whole width. `pageClass="chat-page--framed"` makes the
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
keyboard. Give a page `pageClass="chat-page--framed"` as well, to fill the column.

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

The pages sit at a reading measure (`.assistant-page`); `styles/assistant-pages.css` draws it and
the memory editor, after `settings.css`.

## Developing

```bash
npm install
npm run build        # → dist/, one ES module per source file
npm publish          # builds first (prepack); a published version is permanent
npm publish --tag dev   # a prerelease
```

Iterate with prerelease versions (`0.2.0-dev.1`, `-dev.2`, …) and bump each consumer's pin to the
one it was checked against.
