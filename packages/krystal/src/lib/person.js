// The person's own pages, declared once per site and drawn the same way on every site.
//
// A site's `person` table says three things: where Account lives (the sign-in provider's own site, never
// a page here), which tabs Profile holds (what the site knows about the person) and which tabs Settings
// holds (how the person wants the site to behave). The sidebar's menu, the router's places, the phone
// dock's sheet and `PersonArea` all read that one table, so none of them can disagree about which page
// a thing is on.
//
// A tab is `{ id, label, icon, page }`. `page` is the component the tab draws. A Profile tab may carry
// `place: true`, which makes it a place of its own in the router table (a person can pin it to the dock
// and the sidebar lists it) as well as a tab of Profile. A Settings tab is never a place: it is not a
// page a person comes back to. A tab with `standard` takes its id, label and icon from the design
// system and, for `appearance`, its page too, so the theme is chosen the same way on every site.

/** The Settings tabs every site has, with the words and icon the design system gives them. */
export const STANDARD_TABS = {
  appearance: { id: "appearance", label: "Appearance", icon: "palette" },
  notifications: { id: "notifications", label: "Notifications", icon: "bell" },
};

// What the sign-in provider keeps. A tab with one of these ids is a copy of the provider's page.
const PROVIDER_IDS = ["account", "sign-in", "signin", "password", "devices", "sessions", "security"];

// What only Settings holds: a tab with one of these ids on Profile is a setting out of place.
const SETTINGS_IDS = ["appearance", "notifications", "theme"];

const AREAS = ["profile", "settings"];

const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/**
 * @typedef {object} PersonTab
 * @property {string} id The tab's address segment, in kebab case.
 * @property {string} [standard] `appearance` or `notifications`: the id, label and icon come from the design system.
 * @property {import("react").ReactNode} [label] The tab's name.
 * @property {string} [icon] A Lucide name.
 * @property {import("react").ComponentType<any>} [page] What the tab draws; `appearance` draws the theme picker without one.
 * @property {boolean} [place] A Profile tab that is also a place of its own in the router table.
 */

/**
 * @typedef {object} Person
 * @property {{ href: string | (() => string) }} account Where the provider's account site is; opened in a new tab.
 * @property {PersonTab[]} profile Profile's tabs, in order.
 * @property {PersonTab[]} settings Settings' tabs, in order.
 */

const normalise = (tab) => {
  const standard = tab.standard && STANDARD_TABS[tab.standard];
  return standard ? { ...standard, ...tab, id: standard.id } : tab;
};

/**
 * Every way a table breaks the rules, as sentences; none when it keeps them.
 * @param {Person} person
 * @returns {string[]}
 */
export function checkPerson(person) {
  const out = [];
  const href = person && person.account && person.account.href;
  if (!href || (typeof href !== "string" && typeof href !== "function")) out.push("account.href is a string or a function that returns one");
  for (const area of AREAS) {
    const tabs = person && person[area];
    if (!Array.isArray(tabs) || !tabs.length) { out.push(area + " has at least one tab"); continue; }
    const seen = new Set();
    for (const raw of tabs) {
      if (raw.standard && !STANDARD_TABS[raw.standard]) { out.push(area + ": standard tab " + raw.standard + " does not exist"); continue; }
      const tab = normalise(raw);
      const at = area + "/" + tab.id;
      if (!KEBAB.test(tab.id || "")) out.push(at + ": the id is kebab case");
      if (seen.has(tab.id)) out.push(at + ": the id is used twice");
      seen.add(tab.id);
      if (!tab.label) out.push(at + ": it has a label");
      if (!tab.icon) out.push(at + ": it has an icon");
      if (typeof tab.page !== "function" && tab.standard !== "appearance") out.push(at + ": it has a page");
      if (PROVIDER_IDS.includes(tab.id)) out.push(at + ": " + tab.id + " is the sign-in provider's page, reached by Account");
      if (area === "profile" && SETTINGS_IDS.includes(tab.id)) out.push(at + ": " + tab.id + " is a setting, so it belongs to Settings");
      if (area === "settings" && tab.place) out.push(at + ": a Settings tab is never a place");
      if (area === "settings" && tab.standard === "appearance" && typeof tab.page === "function") out.push(at + ": the theme picker is the design system's");
    }
  }
  const settings = (person && Array.isArray(person.settings) ? person.settings : []).map((t) => normalise(t).id);
  for (const id of Object.keys(STANDARD_TABS)) {
    if (!settings.includes(id)) out.push("settings/" + id + ": every site has it");
  }
  return out;
}

/**
 * A site's table, checked and with its standard tabs filled in. A table that breaks a rule throws, so a
 * site cannot start with one.
 * @param {Person} person
 * @returns {Person}
 */
export function definePerson(person) {
  const problems = checkPerson(person);
  if (problems.length) throw new Error("person table: " + problems.join("; "));
  return {
    account: person.account,
    profile: person.profile.map(normalise),
    settings: person.settings.map(normalise),
  };
}

/** The address Account opens, resolved. */
export function accountHref(person) {
  const { href } = person.account;
  return typeof href === "function" ? href() : href;
}

/**
 * The tab an address names, or the first tab when it names none the area has.
 * @param {PersonTab[]} tabs
 * @param {string} [id]
 */
export function activeTab(tabs, id) {
  return (tabs.find((t) => t.id === id) || tabs[0]).id;
}

/**
 * @typedef {object} PersonPlace
 * @property {string} id The place's id in the router table: `profile`, `settings` or the pinned tab's id.
 * @property {"profile" | "settings"} area
 * @property {string} [tab] The tab a pinned place opens.
 * @property {string} [parent] The place a pinned tab belongs to.
 * @property {string} icon
 * @property {import("react").ReactNode} label
 * @property {string} [short] The name the dock's bar gives the place where that is shorter.
 * @property {string} path
 */

/**
 * The places the table adds to the router's: Profile, Settings, and each Profile tab marked `place`. A
 * site maps them into its own table's shape, so the sidebar and the dock list them with no code of
 * their own.
 * @param {Person} person
 * @param {{ profile: (tab?: string) => string, settings: (tab?: string) => string }} paths A site's path builders; the first tab's path is the area's own.
 * @returns {PersonPlace[]}
 */
export function personPlaces(person, paths) {
  /** @type {PersonPlace[]} */
  const places = [
    { id: "profile", area: "profile", icon: "user", label: "Profile", short: "Me", path: paths.profile() },
    { id: "settings", area: "settings", icon: "settings", label: "Settings", path: paths.settings() },
    ...person.profile.filter((t) => t.place).map((t) => /** @type {PersonPlace} */ ({
      id: t.id, area: "profile", tab: t.id, parent: "profile", icon: t.icon, label: t.label, path: paths.profile(t.id),
    })),
  ];
  return places;
}

/**
 * The places a route on the person's pages lights: the pinned tab's own place, if it has one, then the
 * area's. Empty for a route that is not on them.
 * @param {PersonPlace[]} places What `personPlaces` returned.
 * @param {"profile" | "settings"} area
 * @param {string} [tab] The tab the route names; none is the area's first.
 */
export function placesLit(places, area, tab) {
  const own = places.find((p) => p.area === area && p.parent && p.tab === tab);
  return own ? [own.id, own.parent] : [area];
}
