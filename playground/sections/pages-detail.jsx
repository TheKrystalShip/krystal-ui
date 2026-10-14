import React from "react";
import { Button, Card, DetailPage, Hero, Pill, StatTile, StatTiles } from "@thekrystalship/krystal";
import { Section, Sub } from "../kit.jsx";

const TABS = [
  { value: "overview", label: "Overview", icon: "layout-dashboard" },
  { value: "alerts", label: "Alerts", icon: "bell", count: 3, countTone: "warn" },
  { value: "files", label: "Files", icon: "folder" },
  { value: "settings", label: "Settings", icon: "settings" },
];
const CRUMBS = [{ label: "Hosts", href: "#pages-detail" }, { label: "walter", href: "#pages-detail" }, { label: "Terraria" }];

function Frame({ children }) {
  return (
    <div style={{ border: "var(--edge)", borderRadius: "var(--r-md)", padding: "var(--s-4)", background: "var(--surface-0)" }}>
      {children}
    </div>
  );
}

const Panel = ({ name }) => (
  <>
    <StatTiles>
      <StatTile icon="users" label="Online" value={4} sub="of 16 seats" tone="info" />
      <StatTile label="Backup age" value={7} unit="h" tone="ok" />
    </StatTiles>
    <Card title={name} sub="Body of the chosen tab.">Content of the {name} tab.</Card>
  </>
);

function Sections() {
  const [tab, setTab] = React.useState("overview");
  return (
    <DetailPage crumbs={CRUMBS} onNavigate={(h, e) => e.preventDefault()}
      title="Terraria" sub="Running on walter" meta={<><Pill tone="ok">Running</Pill><Pill>v1.4.4</Pill></>}
      actions={<><Button icon="square">Stop</Button><Button variant="primary" icon="rotate-cw">Restart</Button></>}
      tabs={TABS} value={tab} onChange={setTab} tabsExtra={<Button size="sm" icon="layout-dashboard">Customize</Button>}
      renderTab={(v) => <Panel name={v} />}
      aside={(
        <>
          <Card title="Connect">terraria.example.com:7777</Card>
          <Card title="Note">Whitelist is on.</Card>
        </>
      )} />
  );
}

function Routes() {
  const [tab, setTab] = React.useState("overview");
  return (
    <DetailPage tabsKind="routes" crumbs={CRUMBS}
      hero={(
        <Hero art="linear-gradient(135deg, var(--krystal-teal), var(--surface-3))">
          <div className="k-hero__body">
            <div className="k-hero__heading"><h1 className="k-hero__name">Factorio</h1></div>
          </div>
        </Hero>
      )}
      tabs={TABS} value={tab} onChange={setTab}>
      <Panel name={tab} />
    </DetailPage>
  );
}

export default function PagesDetail() {
  return (
    <Section id="pages-detail" title="Page patterns: DetailPage">
      <Sub title="Head, meta pills, crumbs, in-page Tabs, extra control, aside"><Frame><Sections /></Frame></Sub>
      <Sub title="Hero header and route tabs (SubTabs)"><Frame><Routes /></Frame></Sub>
      <Sub title="Plain head, no tabs">
        <Frame>
          <DetailPage title="Account" sub="ada" meta={<Pill>Owner</Pill>} actions={<Button>Edit</Button>}>
            <Card title="Details">Body as children.</Card>
          </DetailPage>
        </Frame>
      </Sub>
      <Sub title="Loading, failed, not found">
        <Frame>
          <div style={{ display: "grid", gap: 24 }}>
            <DetailPage crumbs={CRUMBS} loading />
            <DetailPage crumbs={CRUMBS} error="The host did not answer." onRetry={() => {}} />
            <DetailPage crumbs={CRUMBS.slice(0, 2)} isEmpty emptyIcon="search-x" emptyTitle="Not found" emptyBody="That record does not exist."
              emptyAction={<Button>Back to hosts</Button>} />
          </div>
        </Frame>
      </Sub>
    </Section>
  );
}
