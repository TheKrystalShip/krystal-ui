import React from "react";
import {
  Button, IconButton, Menu, MenuCheckboxItem, MenuGroup, MenuItem, MenuRadioGroup, MenuRadioItem, MenuSeparator, Popover, SidebarAccount,
} from "@thekrystalship/krystal";
import { Section, Sub, row } from "../kit.jsx";

function FrameMenu() {
  const [frame, setFrame] = React.useState(null);
  return (
    <div ref={setFrame} data-testid="menu-frame" style={{ position: "relative", ...row, padding: 12, border: "var(--edge)", borderRadius: "var(--r-md)" }}>
      <Menu container={frame} trigger={<Button variant="secondary">Menu in the frame</Button>}>
        <MenuItem>Inside</MenuItem>
        <MenuItem>The frame</MenuItem>
      </Menu>
      <Popover container={frame} title="Popover" trigger={<Button variant="secondary">Popover in the frame</Button>}>
        Drawn inside the same element.
      </Popover>
    </div>
  );
}

export default function MenuSection() {
  const [grid, setGrid] = React.useState(true);
  const [dense, setDense] = React.useState(false);
  const [order, setOrder] = React.useState("name");
  const [last, setLast] = React.useState("none");
  const [open, setOpen] = React.useState(false);
  const anchor = React.useRef(null);
  return (
    <Section id="menu" title="Menu">
      <Sub title="Items, shortcuts, separator, disabled, danger (last selected below)">
        <div style={row}>
          <Menu trigger={<Button variant="outline" iconRight="chevron-down">Actions</Button>}>
            <MenuItem icon="pencil" shortcut="R" onSelect={() => setLast("rename")}>Rename</MenuItem>
            <MenuItem icon="copy" shortcut="Ctrl+D" onSelect={() => setLast("duplicate")}>Duplicate</MenuItem>
            <MenuItem icon="download" disabled>Export (disabled)</MenuItem>
            <MenuItem icon="archive" aside="3" onSelect={() => setLast("archive")}>Archive</MenuItem>
            <MenuSeparator />
            <MenuItem icon="trash-2" tone="danger" onSelect={() => setLast("delete")}>Delete</MenuItem>
          </Menu>
          <Menu trigger={<IconButton icon="ellipsis" label="More actions" variant="ghost" />}>
            <MenuItem icon="share-2">Share</MenuItem>
            <MenuItem icon="flag">Report</MenuItem>
          </Menu>
          <span>last: <code>{last}</code></span>
        </div>
      </Sub>
      <Sub title="Groups, checkbox items (stay open) and radio items (close)">
        <div style={row}>
          <Menu label="View" trigger={<Button variant="secondary" icon="layout-grid">View</Button>}>
            <MenuGroup label="Layout">
              <MenuCheckboxItem checked={grid} onCheckedChange={setGrid}>Grid</MenuCheckboxItem>
              <MenuCheckboxItem checked={dense} onCheckedChange={setDense}>Dense rows</MenuCheckboxItem>
            </MenuGroup>
            <MenuSeparator />
            <MenuRadioGroup label="Order by" value={order} onChange={setOrder}>
              <MenuRadioItem value="name">Name</MenuRadioItem>
              <MenuRadioItem value="added">Date added</MenuRadioItem>
              <MenuRadioItem value="size" sub="Largest first">Size</MenuRadioItem>
              <MenuRadioItem value="fixed" readOnly>Pinned by the room</MenuRadioItem>
            </MenuRadioGroup>
          </Menu>
          <span>grid {String(grid)}, dense {String(dense)}, order {order}</span>
        </div>
      </Sub>
      <Sub title="container: the panel drawn inside a frame of the site's own (a fullscreen element)">
        <FrameMenu />
      </Sub>
      <Sub title="Header and matchWidth, opening upward (the account menu's shape)">
        <div style={{ ...row, paddingTop: 140 }}>
          <Menu placement="top-start" matchWidth header="Signed in as claude"
            trigger={<Button variant="outline" wide style={{ width: 260 }}>Account</Button>}>
            <MenuItem icon="user">Profile</MenuItem>
            <MenuItem icon="log-out" tone="danger">Sign out</MenuItem>
          </Menu>
        </div>
      </Sub>
      <Sub title="The sidebar's account menu, expanded and collapsed to the rail">
        <div style={{ ...row, paddingTop: 150, alignItems: "flex-end" }}>
          {[false, true].map((collapsed) => (
            <div key={String(collapsed)} style={{ width: collapsed ? 56 : 260 }}>
              <SidebarAccount user={{ display: "Claude", name: "claude" }} sub="Owner" detail="Signed in with a password"
                collapsed={collapsed}
                items={[{ icon: "settings", label: "Settings" }, { icon: "log-out", label: "Sign out", danger: true }]} />
            </div>
          ))}
        </div>
      </Sub>
      <Sub title="Controlled, anchored to another element">
        <div style={row}>
          <span ref={anchor} style={{ padding: "6px 10px", border: "1px dashed currentColor", borderRadius: 4 }}>anchor</span>
          <Button size="sm" onClick={() => setOpen((o) => !o)}>{open ? "Close" : "Open"}</Button>
          <Menu open={open} onOpenChange={setOpen} anchorRef={anchor} label="Controlled">
            <MenuItem>One</MenuItem>
            <MenuItem>Two</MenuItem>
          </Menu>
        </div>
      </Sub>
    </Section>
  );
}
