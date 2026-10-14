import React from "react";
import {
  Button, ListPage, ListRow, Notice, Pill, ShowcaseCard, Toolbar, ToolbarCount, ToolbarSearch, ToolbarSort, ToolbarSpacer,
} from "@thekrystalship/krystal";
import { Section, Sub } from "../kit.jsx";

const PEOPLE = Array.from({ length: 47 }, (_, i) => ({
  id: i,
  name: ["Ada Lovelace", "Grace Hopper", "Linus", "Margaret Hamilton", "Alan Turing", "Barbara Liskov"][i % 6] + " " + (i + 1),
  role: ["Owner", "Operator", "Viewer"][i % 3],
  seen: i % 7 === 0 ? null : (i * 13) % 90,
}));
const PAGE = 8;

const COLUMNS = [
  { key: "name", header: "Name", sortable: true },
  { key: "role", header: "Role", hideBelow: "phone", render: (p) => <Pill size="sm" tone={p.role === "Owner" ? "accent" : "neutral"}>{p.role}</Pill> },
  { key: "seen", header: "Last seen (min)", align: "right", sortable: true },
];

function Frame({ children }) {
  return (
    <div style={{ border: "var(--edge)", borderRadius: "var(--r-md)", padding: "var(--s-4)", background: "var(--surface-0)" }}>
      {children}
    </div>
  );
}

function Rows() {
  const [page, setPage] = React.useState(0);
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState("name");
  const hits = PEOPLE.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  const shown = hits.slice(page * PAGE, (page + 1) * PAGE);
  return (
    <ListPage title="Accounts" sub="Everyone who can sign in here." label="Accounts"
      actions={<Button variant="primary" icon="user-plus">Add account</Button>}
      toolbar={(
        <Toolbar>
          <ToolbarSearch value={query} onChange={(q) => { setQuery(q); setPage(0); }} placeholder="Search accounts" />
          <ToolbarSort value={sort} onChange={setSort} options={[{ value: "name", label: "Name" }, { value: "seen", label: "Last seen" }]} />
          <ToolbarSpacer />
          <ToolbarCount shown={hits.length} total={PEOPLE.length} unit="accounts" />
        </Toolbar>
      )}
      items={shown} renderItem={(p) => (
        <ListRow key={p.id} title={p.name} sub={p.seen == null ? "Never seen" : "Seen " + p.seen + " min ago"}
          meta={<Pill size="sm">{p.role}</Pill>} onOpen={() => {}} />
      )}
      emptyTitle="No account matches" emptyBody="Clear the search to see everyone."
      emptyAction={<Button onClick={() => setQuery("")}>Clear search</Button>}
      page={page} pageCount={Math.ceil(hits.length / PAGE)} onPageChange={setPage}
      total={hits.length} pageSize={PAGE} unit="accounts" />
  );
}

function Tabular() {
  const [sort, setSort] = React.useState({ key: "name", dir: "asc" });
  const rows = [...PEOPLE.slice(0, 6)].sort((a, b) => (sort.dir === "asc" ? 1 : -1) * String(a[sort.key]).localeCompare(String(b[sort.key]), undefined, { numeric: true }));
  return (
    <ListPage title="Hosts" label="Hosts" layout="table" columns={COLUMNS} items={rows}
      table={{ sort, onSortChange: setSort, onRowOpen: () => {}, rowKey: (p) => p.id }} />
  );
}

const FILMS = Array.from({ length: 9 }, (_, i) => ({ id: i, name: "Title " + (i + 1) }));

function Cards() {
  return (
    <ListPage title="Library" sub="Everything on this server." layout="grid" gridMin={240} label="Library"
      items={FILMS} renderItem={(f) => (
        <ShowcaseCard key={f.id} name={f.name} eyebrow="Film" onPick={() => {}}
          specs={[{ icon: "star", value: "7.4", label: "Rating" }, { icon: "calendar", value: 2001 + f.id, label: "Year" }]}
          action={{ label: "Watch", onClick: () => {} }} />
      )} />
  );
}

export default function PagesList() {
  return (
    <Section id="pages-list" title="Page patterns: ListPage">
      <Sub title="List layout with toolbar, search, pager and empty state (search for zzz)"><Frame><Rows /></Frame></Sub>
      <Sub title="Table layout"><Frame><Tabular /></Frame></Sub>
      <Sub title="Grid layout"><Frame><Cards /></Frame></Sub>
      <Sub title="Loading, failed, empty">
        <Frame>
          <ListPage title="Loading" loading />
          <div style={{ height: 24 }} />
          <ListPage title="Failed" error="The node did not answer." onRetry={() => {}} />
          <div style={{ height: 24 }} />
          <ListPage title="Empty" items={[]} emptyTitle="Nothing here yet" emptyBody="Add the first one." emptyIcon="inbox"
            emptyAction={<Button variant="primary">Add</Button>} />
          <div style={{ height: 24 }} />
          <ListPage title="Custom empty" items={[]} empty={<Notice tone="info">Nobody has joined yet.</Notice>} />
        </Frame>
      </Sub>
      <Sub title="Custom body (children)">
        <Frame>
          <ListPage title="Timeline" sub="Grouped by day">
            <div style={{ display: "grid", gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 13 }}>Today</h3>
              <div style={{ border: "var(--edge)", borderRadius: "var(--r-sm)", padding: 12, background: "var(--surface-1)" }}>An event</div>
            </div>
          </ListPage>
        </Frame>
      </Sub>
    </Section>
  );
}
