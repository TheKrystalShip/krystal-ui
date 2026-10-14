// The documentation shell: hash routing, the navigation grouped by family with a search over the
// names, and the theme picker at the top of every page.
//   #/<component>      a component's page         #/tokens       the token reference
//   #/getting-started  the guides                 #/migrating
//   #/all              every example on one page  #<section id>  that section of #/all
import React from "react";
import { Button, Popover, THEME_OPTS, ThemePicker, useThemePref } from "@thekrystalship/krystal";
import api from "../generated/api.json";
import gettingStarted from "../../docs/getting-started.md?raw";
import migrating from "../../docs/migrating-to-tks-krystal.md?raw";
import { AllView } from "./AllView.jsx";
import { ComponentPage } from "./ComponentPage.jsx";
import { GuidePage } from "./GuidePage.jsx";
import { GROUPS, PAGES } from "./pages.js";
import { TokensPage } from "./TokensPage.jsx";

const GUIDES = [
  { id: "getting-started", name: "Getting started", source: gettingStarted },
  { id: "migrating", name: "Migrating a site", source: migrating },
];

// Every export no page lists lands on one page of its own, so nothing the packages export goes undocumented.
const listed = new Set(PAGES.flatMap((p) => p.exports));
const unlisted = Object.keys(api).filter((n) => !listed.has(n));
const ALL_PAGES = unlisted.length
  ? [...PAGES, { id: "other", name: "Other exports", group: "State and helpers", exports: unlisted, examples: [], summary: "Exports no other page lists." }]
  : PAGES;

function useHash() {
  const [hash, setHash] = React.useState(window.location.hash);
  React.useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return hash;
}

/** The route a hash names. A hash that is not a route is a section id of the "all" view. */
function route(hash) {
  if (hash === "" || hash === "#") return { view: "guide", id: "getting-started" };
  if (!hash.startsWith("#/")) return { view: "all", section: decodeURIComponent(hash.slice(1)) };
  const id = hash.slice(2);
  if (id === "all") return { view: "all" };
  if (id === "tokens") return { view: "tokens" };
  if (GUIDES.some((g) => g.id === id)) return { view: "guide", id };
  if (ALL_PAGES.some((p) => p.id === id)) return { view: "component", id };
  return { view: "missing", id };
}

function Nav({ current, query, onQuery, onNavigate }) {
  const q = query.trim().toLowerCase();
  const matches = (p) => !q || p.name.toLowerCase().includes(q) || p.exports.some((n) => n.toLowerCase().includes(q));
  const link = (id, label) => (
    <a key={id} href={"#/" + id} className="pg-nav__link" aria-current={current === id ? "page" : undefined} onClick={onNavigate}>{label}</a>
  );
  return (
    <nav className="pg-nav" aria-label="Documentation">
      <input className="pg-search" type="search" placeholder="Search components" aria-label="Search components" value={query}
        onChange={(e) => onQuery(e.target.value)} />
      {!q && (
        <div className="pg-nav__group">
          <h2 className="pg-nav__title">Guides</h2>
          {GUIDES.map((g) => link(g.id, g.name))}
          {link("tokens", "Tokens")}
          {link("all", "Every example")}
        </div>
      )}
      {GROUPS.map((group) => {
        const pages = ALL_PAGES.filter((p) => p.group === group && matches(p));
        return pages.length === 0 ? null : (
          <div key={group} className="pg-nav__group">
            <h2 className="pg-nav__title">{group}</h2>
            {pages.map((p) => link(p.id, p.name))}
          </div>
        );
      })}
    </nav>
  );
}

// The theme picker, open from the top bar of every page: a reader sees any page in any palette.
function ThemeMenu() {
  const pref = useThemePref();
  const label = THEME_OPTS.find((o) => o.id === pref)?.label ?? pref;
  return (
    <Popover label="Theme" placement="bottom-end" className="pg-theme"
      trigger={<Button size="sm" variant="outline" icon="palette">Theme: {label}</Button>}>
      <ThemePicker />
    </Popover>
  );
}

export function App() {
  const hash = useHash();
  const r = route(hash);
  const [query, setQuery] = React.useState("");
  const [navOpen, setNavOpen] = React.useState(false);
  const current = r.view === "component" || r.view === "guide" ? r.id : r.view === "tokens" ? "tokens" : r.view === "all" ? "all" : "";

  React.useEffect(() => {
    if (r.view === "all" && r.section) document.getElementById(r.section)?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [hash]); // eslint-disable-line react-hooks/exhaustive-deps

  let body;
  if (r.view === "all") body = <AllView />;
  else if (r.view === "tokens") body = <TokensPage />;
  else if (r.view === "guide") {
    const g = GUIDES.find((x) => x.id === r.id);
    body = <GuidePage key={g.id} source={g.source} eyebrow="Guide" />;
  } else if (r.view === "component") body = <ComponentPage key={r.id} page={ALL_PAGES.find((p) => p.id === r.id)} />;
  else body = <article><h1>No such page</h1><p>Pick a component from the navigation.</p></article>;

  return (
    <div className={"pg-app" + (navOpen ? " pg-app--nav" : "")}>
      <header className="pg-top">
        <button type="button" className="pg-menu" aria-expanded={navOpen} aria-controls="pg-sidebar" onClick={() => setNavOpen((o) => !o)}>
          {navOpen ? "Close" : "Menu"}
        </button>
        <a className="pg-brand" href="#/getting-started">Krystal</a>
        <ThemeMenu />
      </header>
      <aside className="pg-side" id="pg-sidebar">
        <Nav current={current} query={query} onQuery={setQuery} onNavigate={() => setNavOpen(false)} />
      </aside>
      <main className="pg-main">{body}</main>
    </div>
  );
}
