import React from "react";
import {
  AccountAvatar, Avatar, Button, Card, DataState, IconButton, List, ListRow, Pill, StatTile, StatusDot, StatTiles, Table, sortRows,
} from "@thekrystalship/krystal";
import { Section, Sub, col, row } from "../kit.jsx";

const PEOPLE = [
  { id: "a", name: "Ada Lovelace", role: "Owner", seen: 3, host: "walter.nodes", load: 0.42 },
  { id: "b", name: "Grace Hopper", role: "Operator", seen: 41, host: "jessie.nodes", load: 0.91 },
  { id: "c", name: "Linus", role: "Viewer", seen: null, host: "swiss", load: null },
  { id: "d", name: "Margaret Hamilton", role: "Operator", seen: 12, host: "walter.nodes", load: 0.08 },
];

const COLUMNS = [
  { key: "name", header: "Name", sortable: true },
  { key: "role", header: "Role", render: (p) => <Pill size="sm" tone={p.role === "Owner" ? "accent" : "neutral"}>{p.role}</Pill>, sortValue: (p) => p.role, sortable: true, hideBelow: "phone" },
  { key: "host", header: "Host", mono: true, hideBelow: "tablet" },
  { key: "seen", header: "Last seen (min)", align: "right", sortable: true },
  { key: "load", header: "Load", align: "right", sortable: true, render: (p) => (p.load == null ? null : Math.round(p.load * 100) + "%") },
];

export function TableExamples() {
  const [sort, setSort] = React.useState({ key: "name", dir: "asc" });
  const [open, setOpen] = React.useState(null);
  const [sort2, setSort2] = React.useState(null);
  const rows = sortRows(PEOPLE, COLUMNS, sort);
  const rows2 = sortRows(PEOPLE, COLUMNS, sort2);
  return (
    <>
      <Sub title="Table: sortable, rows open, row actions, selection">
        <p style={{ margin: "0 0 8px", fontSize: 12, color: "var(--fg-3)" }}>Opened: {open || "none"}</p>
        <Table label="People" rows={rows} rowKey={(p) => p.id} columns={COLUMNS} sort={sort} onSortChange={setSort}
          selected={open} onRowOpen={(p) => setOpen(p.id)}
          rowTone={(p) => (p.load > 0.9 ? "danger" : undefined)}
          rowActions={(p) => <IconButton variant="ghost" size="sm" icon="trash-2" label={"Remove " + p.name} />} />
      </Sub>
      <Sub title="Table: dense, interactive cell, no open, unsorted start">
        <Table dense label="Hosts" rows={rows2} rowKey={(p) => p.id} sort={sort2} onSortChange={setSort2}
          columns={[
            ...COLUMNS.slice(0, 1),
            { key: "act", header: "Action", interactive: true, render: (p) => <Button size="xs" variant="outline">Ping {p.id}</Button> },
            COLUMNS[3],
          ]} />
      </Sub>
      <Sub title="Table: link rows, loading, error, empty">
        <div style={{ display: "grid", gap: 12 }}>
          <Table label="Linked" rows={PEOPLE} columns={COLUMNS.slice(0, 2)} rowHref={(p) => "#data-" + p.id} />
          <Table label="Loading" loading columns={COLUMNS} />
          <Table label="Failed" error="Could not reach the host." onRetry={() => {}} columns={COLUMNS} />
          <Table label="Empty" rows={[]} columns={COLUMNS} emptyTitle="No people yet" emptyBody="Invite somebody to begin." />
        </div>
      </Sub>
    </>
  );
}

export function StatTileExamples() {
  return (
    <>
      <Sub title="StatTile: tones, unknown, spark, delta, small, open">
        <StatTiles>
          <StatTile icon="users" label="Online" value={12} unit="players" sub="of 40 seats" tone="info" delta="+3" deltaTone="ok" />
          <StatTile icon="database-backup" label="Last backup" value="7h" sub="1.2 GB" tone="ok" />
          <StatTile icon="cpu" label="CPU" value="86" unit="%" tone="warn" sub="Above 80%" />
          <StatTile icon="hard-drive" label="Disk" value="97" unit="%" tone="danger" delta="+2%" deltaTone="danger" />
          <StatTile icon="activity" label="Latency" value={null} sub="Not measured" />
          <StatTile label="With spark" value="1.4" unit="GB" spark={<svg viewBox="0 0 100 24" width="100%" height="24" preserveAspectRatio="none" aria-hidden="true"><polyline fill="none" stroke="var(--krystal-teal)" strokeWidth="2" points="0,20 20,14 40,16 60,6 80,10 100,3" /></svg>} />
          <StatTile label="Opens" value={5} onOpen={() => {}} sub="Whole tile is a button" />
          <StatTile icon="cpu" label="With aside" value="42" unit="%" onOpen={() => {}} sub="A pin stays pressable"
            aside={<><StatusDot size="sm" tone="ok" label="Live" /><IconButton variant="ghost" size="sm" icon="pin" label="Pin" /></>} />
        </StatTiles>
        <div style={{ ...row, marginTop: 12 }}>
          <div style={{ width: 150 }}><StatTile size="sm" icon="users" label="Players" value={4} sub="2 offline" tone="info" /></div>
          <div style={{ width: 150 }}><StatTile size="sm" label="Uptime" value={null} /></div>
        </div>
      </Sub>
    </>
  );
}

export function CardExamples() {
  return (
    <>
      <Sub title="Card">
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          <Card title="Plain" sub="A title, a sub and a body" icon="package" actions={<Button size="sm">Act</Button>} foot="Updated today">Body text sits here.</Card>
          <Card>No head: only a body.</Card>
          <Card title="Open as a whole" sub="Press anywhere" onOpen={() => {}} actions={<IconButton variant="ghost" size="sm" icon="settings" label="Settings" />} tone="accent">Actions stay separate.</Card>
          <Card title="A link" href="#data" tone="ok" foot={<Pill size="sm" tone="ok" dot>Healthy</Pill>}>Link card.</Card>
          <Card title="Warning" tone="warn" padding="sm">Small padding.</Card>
          <Card title="Danger" tone="danger" padding="lg">Large padding.</Card>
          <Card title="Selected" selected onOpen={() => {}}>Selected state.</Card>
          <Card title="Flush list" padding="none">
            <List><ListRow title="Row one" sub="inside a flush card" /><ListRow title="Row two" /></List>
          </Card>
          <Card padding="none" onOpen={() => {}} label="Bare open card"><div style={{ padding: 16 }}>No title; labelled open.</div></Card>
        </div>
      </Sub>
    </>
  );
}

export function AvatarExamples() {
  return (
    <>
      <Sub title="Avatar">
        <div style={row}>
          {["xs", "sm", "md", "lg", "xl"].map((s) => <Avatar key={s} size={s} name="Ada Lovelace" />)}
          <Avatar size={72} name="Big" />
          <Avatar name="Solo" />
          <Avatar />
        </div>
        <div style={row}>
          <Avatar shape="rounded" size="lg" name="Grace Hopper" />
          <Avatar size="lg" src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23c06040'/%3E%3C/svg%3E" name="Image" label="Image avatar" />
          <Avatar size="lg" src="/missing.png" name="Broken Image" />
          <Avatar size="lg" shape="rounded" name="Ada" status="ok" statusLabel="Online" />
          <Avatar size="lg" name="Bo" status="warn" />
          <Avatar size="lg" name="Cy" status="danger" />
          <Avatar size="lg" name="Di" status="muted" />
          <AccountAvatar user={{ display: "Margaret" }} size={32} />
          <AccountAvatar user={null} />
        </div>
      </Sub>
    </>
  );
}

export function DataStateExamples() {
  return (
    <>
      <Sub title="DataState">
        <div style={{ ...col, maxWidth: 520 }}>
          <DataState loading>never</DataState>
          <DataState loading skeletonLines={5}>never</DataState>
          <DataState error={new Error("Network unreachable")} onRetry={() => {}}>never</DataState>
          <DataState data={[]} emptyTitle="No servers" emptyBody="Install one to begin." emptyIcon="server" emptyAction={<Button size="sm">Install</Button>}>never</DataState>
          <DataState data={[1, 2, 3]}>{(d) => <Pill>{d.length} loaded</Pill>}</DataState>
        </div>
      </Sub>
    </>
  );
}

function DataDemo() {
  return (
    <Section id="data" title="Data: Table, StatTile, Card, Avatar, DataState">
      <TableExamples />
      <StatTileExamples />
      <CardExamples />
      <AvatarExamples />
      <DataStateExamples />
    </Section>
  );
}

export default DataDemo;
