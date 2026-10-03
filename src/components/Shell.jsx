import React from "react";
import { Icon } from "./Icon.jsx";

// The application frame: a sidebar beside a scrolling main column, with whatever floats over both
// (a dock, its launcher, the toasts) after them. On wide screens the sidebar collapses to an icon
// rail; on phones it is an off-canvas drawer, opened by the edge handle or a swipe and closed by
// the scrim behind it.
//
// `dockPush` is the width a pinned dock takes from the page, in pixels; the frame pads its right
// edge by it so the page reflows rather than sitting under the dock.
function AppShell({ sidebar, collapsed, drawerOpen, onDrawer, dockPush = 0, aside, mainRef, children }) {
  return (
    <div className="app" style={{ "--dock-push": dockPush + "px", ...(collapsed ? { "--sidebar-w": "64px" } : {}) }}>
      {sidebar}
      {drawerOpen
        ? <div className="sidebar-scrim sidebar-scrim--open" onClick={() => onDrawer(false)} />
        : <MobileNavToggle onOpen={() => onDrawer(true)} />}
      <main className="app__main" ref={mainRef}>{children}</main>
      {aside}
    </div>
  );
}

// The sidebar: the brand row with its collapse toggle, an optional `top` slot under it (a search
// field), the nav groups as children, and the `foot` pinned to the bottom. Only the nav scrolls, so
// the foot stays reachable in a short window.
function Sidebar({ mark, wordmark, open, collapsed, onToggleCollapse, top, foot, children }) {
  return (
    <aside className={"sidebar" + (open ? " sidebar--open" : "") + (collapsed ? " sidebar--rail" : "")}>
      <div className="sidebar__brand">
        <img src={mark} width="32" height="32" alt="" style={{ objectFit: "contain" }} />
        <span className="sidebar__brand-wordmark">{wordmark}</span>
        <button
          type="button"
          className="sidebar__collapse"
          onClick={onToggleCollapse}
          data-tip={collapsed ? "Expand" : "Collapse"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          <Icon name={collapsed ? "panel-left-open" : "panel-left-close"} size={16} />
        </button>
      </div>
      {top}
      <nav className="sidebar__nav">{children}</nav>
      {foot && <div className="sidebar__foot">{foot}</div>}
    </aside>
  );
}

// A run of related links. Groups are ruled off from each other by a hairline, so a group with
// nothing in it should not be rendered at all. The label is for a group whose links do not say
// what they share on their own; the collapsed rail hides it.
function SidebarGroup({ label, children }) {
  return (
    <div className="sidebar__group">
      {label && <div className="sidebar__group-label">{label}</div>}
      {children}
    </div>
  );
}

// One link. `badge` is a count drawn after the label when it is above zero, in a `tone` of info,
// warn or danger; on the collapsed rail it becomes a pip on the icon. `tip` is what the rail's
// tooltip says, defaulting to the label.
function NavItem({ icon, label, active, onClick, badge = 0, tone = "info", tip, iconSize = 16 }) {
  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick && onClick(e); }
  };
  return (
    <div
      className={"nav-item" + (active ? " nav-item--active" : "")}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role="link"
      tabIndex={0}
      aria-current={active ? "page" : undefined}
      data-tip={tip || label}
      aria-label={label}>
      <Icon name={icon} size={iconSize} />
      <span className="nav-item__label">{label}</span>
      {badge > 0 && <span className={"nav-item__badge nav-item__badge--" + tone}>{badge}</span>}
    </div>
  );
}

// The drawer's opener on phones: a slim handle on the left edge, where the swipe lives.
function MobileNavToggle({ onOpen }) {
  return (
    <button className="mnav mnav--edge" onClick={onOpen} aria-label="Open menu" title="Menu">
      <Icon name="chevron-right" size={16} />
    </button>
  );
}

export { AppShell, MobileNavToggle, NavItem, Sidebar, SidebarGroup };
