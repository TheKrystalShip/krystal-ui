import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PersonArea, checkPerson, definePerson, personPlaces, placesLit, activeTab, accountHref } from "@thekrystalship/krystal";

const Page = (name) => function P() { return <p>{name} page</p>; };

const table = () => ({
  account: { href: "https://auth.example/account" },
  profile: [
    { id: "history", label: "History", icon: "history", page: Page("History"), place: true },
    { id: "taste", label: "Taste", icon: "thumbs-up", page: Page("Taste") },
  ],
  settings: [
    { id: "appearance", standard: "appearance" },
    { id: "playback", label: "Playback", icon: "play", page: Page("Playback") },
    { id: "notifications", standard: "notifications", page: Page("Notifications") },
  ],
});

describe("checkPerson", () => {
  it("passes a table that keeps the rules", () => {
    expect(checkPerson(table())).toEqual([]);
  });

  it("refuses the provider's pages as tabs", () => {
    const t = table();
    t.profile.push({ id: "devices", label: "Devices", icon: "monitor", page: Page("D") });
    expect(checkPerson(t)).toEqual(["profile/devices: devices is the sign-in provider's page, reached by Account"]);
  });

  it("refuses a setting on Profile", () => {
    const t = table();
    t.profile.push({ id: "notifications", label: "Notifications", icon: "bell", page: Page("N") });
    expect(checkPerson(t)).toEqual(["profile/notifications: notifications is a setting, so it belongs to Settings"]);
  });

  it("refuses a Settings tab that is a place", () => {
    const t = table();
    t.settings[1].place = true;
    expect(checkPerson(t)).toEqual(["settings/playback: a Settings tab is never a place"]);
  });

  it("requires Appearance and Notifications in Settings", () => {
    const t = table();
    t.settings = [t.settings[1]];
    expect(checkPerson(t)).toEqual(["settings/appearance: every site has it", "settings/notifications: every site has it"]);
  });

  it("refuses a page of its own for the theme", () => {
    const t = table();
    t.settings[0].page = Page("Mine");
    expect(checkPerson(t)).toEqual(["settings/appearance: the theme picker is the design system's"]);
  });

  it("refuses a repeated id and a tab with no page", () => {
    const t = table();
    t.profile.push({ id: "taste", label: "Again", icon: "x" });
    expect(checkPerson(t)).toEqual(["profile/taste: the id is used twice", "profile/taste: it has a page"]);
  });
});

describe("definePerson", () => {
  it("throws on a broken table and fills the standard tabs of a good one", () => {
    const bad = table();
    bad.profile = [];
    expect(() => definePerson(bad)).toThrow(/profile has at least one tab/);
    const person = definePerson(table());
    expect(person.settings[0]).toMatchObject({ id: "appearance", label: "Appearance", icon: "palette" });
    expect(person.settings[2]).toMatchObject({ id: "notifications", label: "Notifications", icon: "bell" });
  });

  it("resolves an account address that is computed", () => {
    expect(accountHref(definePerson({ ...table(), account: { href: () => "https://x/account" } }))).toBe("https://x/account");
  });
});

describe("places", () => {
  const person = definePerson(table());
  const paths = { profile: (tab) => "/profile" + (tab ? "/" + tab : ""), settings: (tab) => "/settings" + (tab ? "/" + tab : "") };

  it("lists Profile, Settings and each pinned Profile tab", () => {
    expect(personPlaces(person, paths).map((p) => [p.id, p.path, p.parent])).toEqual([
      ["profile", "/profile", undefined],
      ["settings", "/settings", undefined],
      ["history", "/profile/history", "profile"],
    ]);
  });

  it("lights a pinned tab with its area, and any other tab with the area", () => {
    const places = personPlaces(person, paths);
    expect(placesLit(places, "profile", "history")).toEqual(["history", "profile"]);
    expect(placesLit(places, "profile", "taste")).toEqual(["profile"]);
    expect(placesLit(places, "settings", "playback")).toEqual(["settings"]);
  });

  it("names the first tab for an address that names none", () => {
    expect(activeTab(person.profile, "nothing")).toBe("history");
    expect(activeTab(person.profile, "taste")).toBe("taste");
  });
});

describe("PersonArea", () => {
  const person = definePerson(table());

  it("draws the page of the tab the address names and reports a press", async () => {
    const onTabChange = vi.fn();
    render(<PersonArea person={person} area="profile" tab="taste" title="Profile" onTabChange={onTabChange} />);
    expect(screen.getByText("Taste page")).toBeTruthy();
    await userEvent.setup().click(screen.getByRole("button", { name: "History" }));
    expect(onTabChange).toHaveBeenCalledWith("history");
  });

  it("draws the first tab for a tab the area does not have", () => {
    render(<PersonArea person={person} area="profile" tab="gone" title="Profile" onTabChange={() => {}} />);
    expect(screen.getByText("History page")).toBeTruthy();
  });

  it("draws the theme picker for the standard Appearance tab", () => {
    render(<PersonArea person={person} area="settings" tab="appearance" title="Settings" onTabChange={() => {}} />);
    expect(screen.getAllByRole("button", { name: /Krystal Blue Dark/ }).length).toBeGreaterThan(0);
  });

  it("leaves out a hidden tab and draws no strip for a single tab", () => {
    render(<PersonArea person={person} area="profile" tab="history" hidden={["taste"]} title="Profile" onTabChange={() => {}} />);
    expect(screen.queryByRole("button", { name: "Taste" })).toBeNull();
    expect(screen.queryByRole("button", { name: "History" })).toBeNull();
    expect(screen.getByText("History page")).toBeTruthy();
  });

  it("hands pageProps to the page", () => {
    const Needs = ({ online }) => <p>{online ? "online" : "offline"}</p>;
    const p = definePerson({ ...table(), profile: [{ id: "a", label: "A", icon: "x", page: Needs }] });
    render(<PersonArea person={p} area="profile" title="Profile" pageProps={{ online: true }} onTabChange={() => {}} />);
    expect(screen.getByText("online")).toBeTruthy();
  });
});
