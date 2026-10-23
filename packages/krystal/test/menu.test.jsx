import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, Menu, Popover, MenuCheckboxItem, MenuItem, MenuRadioGroup, MenuRadioItem, MenuSeparator, SidebarAccount } from "@thekrystalship/krystal";

const open = async (user) => {
  const trigger = screen.getByRole("button", { name: "Actions" });
  trigger.focus();
  await user.keyboard("{ArrowDown}");
  await screen.findByRole("menu");
  await waitFor(() => expect(screen.getAllByRole("menuitem")[0]).toBe(document.activeElement));
  return trigger;
};

const Fixture = (props) => (
  <Menu trigger={<Button>Actions</Button>} {...props}>
    <MenuItem>Rename</MenuItem>
    <MenuItem disabled>Move</MenuItem>
    <MenuSeparator />
    <MenuItem>Duplicate</MenuItem>
    <MenuItem>Delete</MenuItem>
  </Menu>
);

describe("Menu", () => {
  it("opens from the trigger with ArrowDown on the first item and ArrowUp on the last", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    const trigger = screen.getByRole("button", { name: "Actions" });
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    trigger.focus();
    await user.keyboard("{ArrowUp}");
    await screen.findByRole("menu");
    await waitFor(() => expect(document.activeElement.textContent).toBe("Delete"));
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("moves with the arrows, wraps, skips a disabled item, and jumps with Home and End", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    await open(user);
    expect(document.activeElement.textContent).toBe("Rename");
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement.textContent).toBe("Duplicate");
    await user.keyboard("{End}");
    expect(document.activeElement.textContent).toBe("Delete");
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement.textContent).toBe("Rename");
    await user.keyboard("{ArrowUp}");
    expect(document.activeElement.textContent).toBe("Delete");
    await user.keyboard("{Home}");
    expect(document.activeElement.textContent).toBe("Rename");
  });

  it("moves to the next item starting with what is typed", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    await open(user);
    await user.keyboard("d");
    expect(document.activeElement.textContent).toBe("Duplicate");
    await user.keyboard("d");
    expect(document.activeElement.textContent).toBe("Delete");
  });

  it("matches a typed prefix of several letters", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    await open(user);
    await user.keyboard("del");
    expect(document.activeElement.textContent).toBe("Delete");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    const trigger = await open(user);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("selects with Enter, calls onSelect and closes", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Menu trigger={<Button>Actions</Button>}><MenuItem onSelect={onSelect}>Rename</MenuItem></Menu>);
    const trigger = await open(user);
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("keeps the menu open when onSelect prevents default, and for a checkbox item", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Menu trigger={<Button>Actions</Button>}>
        <MenuItem onSelect={(e) => e.preventDefault()}>Stay</MenuItem>
        <MenuCheckboxItem checked={false} onCheckedChange={onCheckedChange}>Grid</MenuCheckboxItem>
      </Menu>,
    );
    await open(user);
    await user.keyboard("{Enter}");
    expect(screen.getByRole("menu")).toBeTruthy();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("menu")).toBeTruthy();
  });

  it("opens on the chosen radio item and reports a change of choice only", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Menu trigger={<Button>Actions</Button>}>
        <MenuRadioGroup label="Sort" value="b" onChange={onChange}>
          <MenuRadioItem value="a">Alpha</MenuRadioItem>
          <MenuRadioItem value="b">Beta</MenuRadioItem>
        </MenuRadioGroup>
      </Menu>,
    );
    const trigger = screen.getByRole("button", { name: "Actions" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    await screen.findByRole("menu");
    await waitFor(() => expect(document.activeElement.textContent).toBe("Beta"));
    expect(screen.getByRole("menuitemradio", { name: "Beta" }).getAttribute("aria-checked")).toBe("true");
    await user.keyboard("{Enter}");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("closes on Tab and moves on from the trigger", async () => {
    const user = userEvent.setup();
    render(<><Fixture /><button>after</button></>);
    await open(user);
    await user.keyboard("{Tab}");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "after" }));
  });
});

describe("Menu container, sub and readOnly", () => {
  it("portals the menu and a popover into `container`", async () => {
    const user = userEvent.setup();
    const host = document.createElement("div");
    document.body.appendChild(host);
    render(
      <>
        <Menu container={host} trigger={<Button>Actions</Button>}><MenuItem>Rename</MenuItem></Menu>
        <Popover container={() => host} title="Pop" trigger={<Button>Info</Button>}>Body</Popover>
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect((await screen.findByRole("menu")).parentElement).toBe(host);
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Info" }));
    expect((await screen.findByRole("dialog")).parentElement).toBe(host);
    host.remove();
  });

  it("draws a sub line, and a readOnly radio item takes focus but changes nothing and stays open", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Menu trigger={<Button>Actions</Button>}>
        <MenuRadioGroup value="a" onChange={onChange}>
          <MenuRadioItem value="a" sub="The first">Alpha</MenuRadioItem>
          <MenuRadioItem value="b" readOnly>Beta</MenuRadioItem>
        </MenuRadioGroup>
      </Menu>,
    );
    screen.getByRole("button", { name: "Actions" }).focus();
    await user.keyboard("{ArrowDown}");
    await screen.findByRole("menu");
    expect(screen.getByText("The first")).toBeTruthy();
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement.textContent).toBe("Beta");
    await user.keyboard("{Enter}");
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("menu")).toBeTruthy();
  });
});

describe("SidebarAccount", () => {
  it("offers Profile, Settings, a rule and Sign out, each calling its handler", async () => {
    const user = userEvent.setup();
    const calls = [];
    render(<SidebarAccount user={{ display: "Marta" }} onProfile={() => calls.push("profile")}
      onSettings={() => calls.push("settings")} onSignOut={() => calls.push("out")} />);
    await user.click(screen.getByRole("button", { name: "Marta" }));
    await screen.findByRole("menu");
    expect(screen.getAllByRole("menuitem").map((i) => i.textContent)).toEqual(["Profile", "Settings", "Sign out"]);
    expect(screen.getByRole("separator")).toBeTruthy();
    await user.click(screen.getByRole("menuitem", { name: "Settings" }));
    expect(calls).toEqual(["settings"]);
  });

  it("puts a site's own entries after Settings and before the rule", async () => {
    const user = userEvent.setup();
    render(<SidebarAccount user={{ display: "Marta" }} onProfile={() => {}} onSettings={() => {}} onSignOut={() => {}}
      items={[{ icon: "flag", label: "Report queue", aside: 17 }]} />);
    await user.click(screen.getByRole("button", { name: "Marta" }));
    await screen.findByRole("menu");
    const items = screen.getAllByRole("menuitem").map((i) => i.textContent);
    expect(items[0]).toBe("Profile");
    expect(items[1]).toBe("Settings");
    expect(items[2]).toContain("Report queue");
    expect(items[2]).toContain("17");
    expect(items[3]).toBe("Sign out");
  });

  it("leaves out the rule and Sign out without onSignOut", async () => {
    const user = userEvent.setup();
    render(<SidebarAccount user={{ display: "Marta" }} onProfile={() => {}} onSettings={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Marta" }));
    await screen.findByRole("menu");
    expect(screen.getAllByRole("menuitem").map((i) => i.textContent)).toEqual(["Profile", "Settings"]);
    expect(screen.queryByRole("separator")).toBeNull();
  });
});
