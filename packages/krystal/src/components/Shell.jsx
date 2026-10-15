import React from "react";
import { AccountAvatar } from "./AccountAvatar.jsx";
import { Pill } from "./Pill.jsx";
import { Icon } from "./Icon.jsx";
import { Menu, MenuItem } from "./Menu.jsx";

// The application frame: a sidebar beside a scrolling main column, with whatever floats over both
// (a dock, its launcher, the toasts) after them. On wide screens the sidebar collapses to an icon
// rail. On phones it is an off-canvas drawer, opened by the edge handle or a swipe and closed by
// the scrim behind it, unless the site gives a `tabBar`: then the phone has the bar along its
// bottom edge instead, and neither the drawer nor its handle.
//
// The main column owns the page's side gutter, equal on left and right: 24px, 16px at 768px and
// narrower, 12px at 480px and narrower. It is the custom property `--k-page-gutter` on the column, so
// a page reads it (`calc(var(--k-page-gutter) * -1)` for a full-bleed band) without setting it. The
// page's own column needs only a max width and a vertical rhythm. A Footer spans the column edge to
// edge.
//
// `dockPush` is the width a pinned dock takes from the page, in pixels; the frame pads its right
// edge by it so the page reflows rather than sitting under the dock.
/**
 * @param {object} props
 * @param {import("react").ReactNode} [props.sidebar] The sidebar node, normally a Sidebar.
 * @param {boolean} [props.collapsed] Icon-rail sidebar.
 * @param {boolean} [props.drawerOpen] The phone drawer.
 * @param {(open: boolean) => void} [props.onDrawer] Called with true when the edge handle opens the phone drawer and with false when the scrim closes it.
 * @param {number} [props.dockPush] Pixels a pinned dock takes from the page.
 * @param {import("react").ReactNode} [props.aside] A node drawn after the main column, such as a dock.
 * @param {import("react").ReactNode} [props.tabBar] A TabBar for phones; when given, the bar replaces the drawer and its handle.
 * @param {import("react").Ref<HTMLElement>} [props.mainRef] Ref to the scrolling main column.
 * @param {import("react").ReactNode} [props.children] The page, drawn in the main column.
 */
function AppShell({ sidebar, collapsed, drawerOpen, onDrawer, dockPush = 0, aside, tabBar, mainRef, children }) {
  return (
    <div
      className={"k-app" + (tabBar ? " k-app--tabbed" : "")}
      style={/** @type {import("react").CSSProperties} */ ({ "--dock-push": dockPush + "px", ...(collapsed ? { "--sidebar-w": "64px" } : {}) })}>
      {sidebar}
      {drawerOpen
        ? <div className="k-sidebar-scrim k-sidebar-scrim--open" onClick={() => onDrawer(false)} />
        : !tabBar && <MobileNavToggle onOpen={() => onDrawer(true)} />}
      <main className="k-app__main" ref={mainRef}>{children}</main>
      {aside}
      {tabBar}
    </div>
  );
}

// The phone's way around a site: a row of tabs along the bottom edge, each an icon over its label,
// the current one in the accent. Drawn only on phones; on a wide screen the sidebar is the way
// around. Each item is `{ id, icon, label, active, onClick, badge, tone }`, where `badge` is a count
// drawn on the icon when it is above zero, in a `tone` of info, warn or danger. The bar clears the
// home indicator of a phone that has one.
/**
 * @typedef {object} TabBarItem
 * @property {string} [id] The tab's key; the label when left out.
 * @property {string} icon A Lucide name.
 * @property {string} label The words under the icon.
 * @property {boolean} [active] Marks the current tab (`aria-current`).
 * @property {() => void} [onClick] Called when the tab is pressed.
 * @property {number} [badge] Drawn on the icon when above zero.
 * @property {"info" | "warn" | "danger"} [tone] `info`, `warn` or `danger`; colours the badge.
 */
/**
 * @param {object} props
 * @param {TabBarItem[]} props.items The tabs, left to right.
 * @param {string} [props.label] The bar's accessible name.
 */
function TabBar({ items, label = "Main" }) {
  return (
    <nav className="k-tabbar" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.id || item.label}
          type="button"
          className={"k-tabbar__tab" + (item.active ? " k-tabbar__tab--active" : "")}
          aria-current={item.active ? "page" : undefined}
          onClick={item.onClick}>
          <span className="k-tabbar__icon">
            <Icon name={item.icon} size={22} />
            {item.badge > 0 && <Pill size="sm" tone={item.tone || "warn"} className={"k-tabbar__badge k-tabbar__badge--" + (item.tone || "warn")}>{item.badge}</Pill>}
          </span>
          <span className="k-tabbar__label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

// The sidebar: the brand row with its collapse toggle, an optional `top` slot under it (a search
// field), the nav groups as children, and the `foot` pinned to the bottom. Only the nav scrolls, so
// the foot stays reachable in a short window. The hairline under the brand moves under `top` when
// there is one, so the header reads as one block. `closeNav` rules off the last group too, for a
// site whose nav and foot are far apart.
/**
 * @param {object} props
 * @param {string} [props.mark] An image URL.
 * @param {import("react").ReactNode} [props.wordmark] The brand name drawn beside the mark.
 * @param {boolean} [props.open] The phone drawer is open.
 * @param {boolean} [props.collapsed] Draws the icon rail.
 * @param {() => void} [props.onToggleCollapse] Called when the collapse button is pressed.
 * @param {import("react").ReactNode} [props.top] A node under the brand row, such as a search field.
 * @param {boolean} [props.closeNav] Rules off the last group too.
 * @param {import("react").ReactNode} [props.foot] A node pinned to the bottom, such as a SidebarAccount.
 * @param {import("react").ReactNode} [props.children] Nav groups.
 */
function Sidebar({ mark, wordmark, open, collapsed, onToggleCollapse, top, closeNav, foot, children }) {
  return (
    <aside className={"k-sidebar" + (open ? " k-sidebar--open" : "") + (collapsed ? " k-sidebar--rail" : "")}>
      <div className="k-sidebar__brand">
        <img src={mark} width="32" height="32" alt="" style={{ objectFit: "contain" }} />
        <span className="k-sidebar__brand-wordmark">{wordmark}</span>
        <button
          type="button"
          className="k-sidebar__collapse"
          onClick={onToggleCollapse}
          data-tip={collapsed ? "Expand" : "Collapse"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          <Icon name={collapsed ? "panel-left-open" : "panel-left-close"} size={16} />
        </button>
      </div>
      {top && <div className="k-sidebar__top">{top}</div>}
      <nav className={"k-sidebar__nav" + (closeNav ? " k-sidebar__nav--closed" : "")}>{children}</nav>
      {foot && <div className="k-sidebar__foot">{foot}</div>}
    </aside>
  );
}

// The signed-in person, at the bottom of the sidebar's foot: their avatar, their name and a `sub`
// line under it, opening a menu upward of `items` — `{ icon, label, onClick, danger }`. `detail` is
// what the menu's head says under the name. On the collapsed rail the row is the avatar alone.
/**
 * @param {object} props
 * @param {{ display?: string, name?: string }} props.user The signed-in person: `display` is the name shown, `name` the fallback.
 * @param {import("react").ReactNode} [props.sub] A line under the name.
 * @param {import("react").ReactNode} [props.detail] What the menu's head says under the name.
 * @param {{ icon: string, label: string, onClick?: () => void, danger?: boolean }[]} [props.items] The menu's entries, each `{ icon, label, onClick, danger }`.
 * @param {boolean} [props.collapsed] Draws the avatar alone, as on the collapsed rail.
 */
function SidebarAccount({ user, sub, detail, items = [], collapsed }) {
  const [open, setOpen] = React.useState(false);
  const name = user.display || user.name;
  return (
    <div className="k-sidebar__account-wrap">
      <Menu open={open} onOpenChange={setOpen} placement="top-start" matchWidth label={name}
        className="k-sidebar__account-menu"
        header={(
          <>
            <div className="k-sidebar__account-menu__name">{name}</div>
            {detail && <div className="k-sidebar__account-menu__detail">{detail}</div>}
          </>
        )}
        trigger={(
          <button
            type="button"
            className={"k-sidebar__account" + (open ? " k-sidebar__account--open" : "")}
            aria-label={name}
            data-tip={collapsed && !open ? name : undefined}>
            <AccountAvatar user={user} size={28} />
            {!collapsed && (
              <>
                <span className="k-sidebar__account__text">
                  <span className="k-sidebar__account__name">{name}</span>
                  {sub && <span className="k-sidebar__account__sub">{sub}</span>}
                </span>
                <Icon name="chevrons-up-down" size={14} className="k-sidebar__account__caret" />
              </>
            )}
          </button>
        )}>
        {items.map((item) => (
          <MenuItem key={item.label} icon={item.icon} tone={item.danger ? "danger" : undefined}
            onSelect={() => item.onClick && item.onClick()}>
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
}

// A run of related links. Groups are ruled off from each other by a hairline, so a group with
// nothing in it should not be rendered at all. The label is for a group whose links do not say
// what they share on their own; the collapsed rail hides it.
/**
 * @param {object} props
 * @param {import("react").ReactNode} [props.label] The group's heading.
 * @param {import("react").ReactNode} [props.children] The group's NavItems.
 */
function SidebarGroup({ label, children }) {
  return (
    <div className="k-sidebar__group">
      {label && <div className="k-sidebar__group-label">{label}</div>}
      {children}
    </div>
  );
}

// One link. `badge` is a count drawn after the label when it is above zero, in a `tone` of info,
// warn or danger; on the collapsed rail it becomes a pip on the icon. `tip` is what the rail's
// tooltip says, defaulting to the label.
//
// `compact` draws the row for what sits under a group's own entries (a node, a favourite): the icon on
// a small tile, a smaller label, a quieter active state; on the collapsed rail the tile is the row.
// `aside` is a node at the row's end (a StatusDot), which rides the tile's corner on the rail. `badge`
// works in both forms.
//
// A row that opens something (a popover, a panel) passes `role="button"` with `aria-haspopup` and
// `aria-expanded`, and an `aria-label` that carries what the badge says; every other prop reaches the
// root.
/**
 * @param {object} props
 * @param {string} props.icon A Lucide name.
 * @param {string} props.label The link's words; also its accessible name and the rail's tooltip.
 * @param {boolean} [props.active] Marks the current page.
 * @param {(event: import("react").SyntheticEvent<HTMLElement>) => void} [props.onClick] Called on a press, Enter or Space.
 * @param {number} [props.badge] A count drawn after the label when above zero.
 * @param {"info" | "warn" | "danger"} [props.tone] `info`, `warn` or `danger`; colours the badge.
 * @param {string} [props.tip] The rail tooltip; the label by default.
 * @param {number} [props.iconSize] The icon's size in pixels; 13 when `compact`, 16 otherwise.
 * @param {boolean} [props.compact] The sub-row form: the icon on a tile, a smaller label, a quieter active state.
 * @param {import("react").ReactNode} [props.aside] A node at the row's end, such as a StatusDot.
 * @param {"link" | "button"} [props.role] The row's role: `link` (the default) for a page, `button` for a row that acts.
 * @param {string} [props.className] Extra class names on the root element.
 * @param {Record<string, any>} [props.rest] Any other prop (`aria-*`, `data-*`, `id`) reaches the root element.
 */
function NavItem({ icon, label, active, onClick, badge = 0, tone = "info", tip, iconSize, compact = false, aside, role = "link", className, ...rest }) {
  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick && onClick(e); }
  };
  return (
    <div
      data-tip={tip || label}
      aria-label={label}
      {...rest}
      className={"k-nav-item" + (active ? " k-nav-item--active" : "") + (compact ? " k-nav-item--compact" : "") + (className ? " " + className : "")}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role={role}
      tabIndex={0}
      aria-current={active && role === "link" ? "page" : undefined}>
      {compact
        ? <span className="k-nav-item__tile"><Icon name={icon} size={iconSize || 13} /></span>
        : <Icon name={icon} size={iconSize || 16} />}
      <span className="k-nav-item__label">{label}</span>
      {aside != null && <span className="k-nav-item__aside">{aside}</span>}
      {badge > 0 && <Pill tone={tone === "info" ? "neutral" : tone} className={"k-nav-item__badge k-nav-item__badge--" + tone}>{badge}</Pill>}
    </div>
  );
}

// The drawer's opener on phones: a slim handle on the left edge, where the swipe lives.
/**
 * @param {object} props
 * @param {() => void} [props.onOpen] Called when the handle is pressed.
 */
function MobileNavToggle({ onOpen }) {
  return (
    <button className="k-mobile-nav k-mobile-nav--edge" onClick={onOpen} aria-label="Open menu" title="Menu">
      <Icon name="chevron-right" size={16} />
    </button>
  );
}

export { AppShell, MobileNavToggle, NavItem, Sidebar, SidebarAccount, SidebarGroup, TabBar };
