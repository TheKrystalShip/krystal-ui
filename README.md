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
| The frame | `AppShell`, `Sidebar`, `SidebarGroup`, `NavItem`, `MobileNavToggle`, `useStoredFlag`, `useEdgeSwipe` |
| The dock | `Dock`, `DockFab`, `useDock` |
| Banners | `Hero` |
| Cards and lists | `BriefCard`, `Rail`, `Pagination`, `SubTabs`, `Toolbar` (+ `ToolbarSearch`, `ToolbarFilters`, `ToolbarSort`, `ToolbarButton`, `ToolbarCount`, `ToolbarSpacer`, `useFilters`) |
| Settings furniture | `SettingsSection`, `SettingsRow`, `Toggle`, `ThemePicker` |
| Overlays | `Modal`, `ReversablePortal`, `Select`, `usePortalPopover` |
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
      foot={<NavItem icon="settings" label="Settings" onClick={…} />}>
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

## Developing

```bash
npm install
npm run build        # → dist/, one ES module per source file
npm publish          # builds first (prepack); a published version is permanent
npm publish --tag dev   # a prerelease
```

Iterate with prerelease versions (`0.2.0-dev.1`, `-dev.2`, …) and bump each consumer's pin to the
one it was checked against.
