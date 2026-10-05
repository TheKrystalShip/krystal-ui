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
| The assistant chat | `Chat`, `createAssistantClient`, `useConversationStream`, the parts it is drawn from (`ChatThread`, `ChatMessage`, `ChatCommand`, `MarkdownTextarea`, `useVoiceRecorder`, …) and the conversation functions (`reduceTurnFrame`, `scaffoldHistory`, `mergeServerConversations`, …) |
| Cards and lists | `BriefCard`, `ShowcaseCard` (key art, three facts, a status and an action, with optional round `tools` on the art and a `progress` bar along its foot), `Rail`, `Pagination`, `Breadcrumbs` (a one-line trail of real links that ellipsizes at phone width; the site computes the `items`, `onNavigate` lets a single-page site take a plain click), `SubTabs`, `Toolbar` (+ `ToolbarSearch`, `ToolbarFilters`, `ToolbarSort`, `ToolbarButton`, `ToolbarCount`, `ToolbarSpacer`, `useFilters`) |
| Settings furniture | `SettingsSection`, `SettingsRow`, `Toggle`, `ThemePicker` |
| Overlays | `Modal`, `ReversablePortal`, `Select`, `usePortalPopover` |
| Loading | `Skeleton` (one shimmering placeholder block, laid out by the site in the footprint its content will take; still under reduced motion) |
| Telling a person | `Toasts`, `NotificationsPanel`, `toast`, `toastStore` |
| Marks | `Icon` (Lucide, by kebab-case name), `AccountAvatar`, `AssistantFabIcon` |
| State and helpers | `createStore`/`useStore`, `themeStore` + `THEME_OPTS`, `copyText`, `pushBrowser`, `fmtRelative` |

Stylesheets: `styles/tokens.css` (every colour, type, spacing, radius and motion token, every
theme, and the Inter / JetBrains Mono faces), `styles/motion.css` (shared keyframes), and one sheet
per component family. `assets/tks-mark.png` is the brand mark.

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

## The assistant chat

`Chat` is a conversation with one assistant over the assistant wire contract
(`kgsm-llm/docs/wire-contract.md`): turns streamed over Server-Sent Events, proposed actions
confirmed by their token, the conversation list kept in step with the assistant's, voice notes, and
a read-only review of somebody else's conversation. It holds no credential and knows no product:

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

`profile` is how the product reads what the assistant sends: `adaptCard(result)` turns a tool's
structured result into a card for `renderCards`, `proposal(msg)` names a proposed action and says
whether this surface can redeem it, and `verdict(msg, name, response)` words its outcome.
`renderEntry` draws transcript roles of the product's own, and `turnExtras()` adds fields to the
next turn. `clientFor` is called with the assistant's id, and must be stable across renders.

## Developing

```bash
npm install
npm run build        # → dist/, one ES module per source file
npm publish          # builds first (prepack); a published version is permanent
npm publish --tag dev   # a prerelease
```

Iterate with prerelease versions (`0.2.0-dev.1`, `-dev.2`, …) and bump each consumer's pin to the
one it was checked against.
