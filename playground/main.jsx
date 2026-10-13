// The krystal-ui playground: every component in its variants and states on one page, for looking
// at a change and for the visual harness to shoot. Not packaged.
// Run: npm run play -- --port 5211, then open http://127.0.0.1:5211/#controls (or #badges, #page,
// #settings, #dialogs, #lists, #frame).
import React from "react";
import { createRoot } from "react-dom/client";
import {
  AppShell, Breadcrumbs, BriefCard, Button, Checkbox, Dialog, EmptyState, Field, IconButton, Input,
  Meter, NavItem, Notice, OptionList, PageHeader, Select, SettingsRow, SettingsSection, ShowcaseCard,
  Sidebar, SidebarGroup, Skeleton, Spinner, SubTabs, Textarea, ThemePicker, Toggle, Toolbar,
  ToolbarButton, ToolbarCount, ToolbarFilters, ToolbarSearch, ToolbarSort, ToolbarSpacer,
} from "../src/index.js";
import "../styles.css";

const row = { display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 12 };
const col = { display: "grid", gap: 14, maxWidth: 420, marginBottom: 12 };

function Section({ id, title, children }) {
  return (
    <section id={id} style={{ margin: "32px 0" }}>
      <h2 style={{ margin: "0 0 14px", fontSize: 18 }}>{title}</h2>
      {children}
    </section>
  );
}

function Sub({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h3 style={{ margin: "0 0 8px", fontSize: 12, textTransform: "uppercase", opacity: 0.6 }}>{title}</h3>
      {children}
    </div>
  );
}

const OPTIONS = [
  { value: "a", label: "Alpha", detail: "first", aside: "12 MB" },
  { value: "b", label: "Beta", aside: "3 MB" },
  { value: "c", label: "Gamma", disabled: true },
  { value: "d", label: "Delta" },
];

function Controls() {
  const [chk, setChk] = React.useState(true);
  const [tog, setTog] = React.useState(true);
  const [one, setOne] = React.useState("a");
  const [many, setMany] = React.useState(["a", "d"]);
  const [seg, setSeg] = React.useState("a");
  return (
    <Section id="controls" title="Controls">
      <Sub title="Button variants">
        <div style={row}>
          {["primary", "secondary", "outline", "ghost", "accent", "danger", "warning", "link"].map((v) => (
            <Button key={v} variant={v}>{v}</Button>
          ))}
        </div>
      </Sub>
      <Sub title="Button sizes, icon, busy, armed, pressed, tone, href, disabled">
        <div style={row}>
          {["xs", "sm", "md", "lg", "xl"].map((s) => <Button key={s} size={s}>{s}</Button>)}
        </div>
        <div style={row}>
          <Button icon="plus">Icon</Button>
          <Button iconRight="arrow-right">Icon right</Button>
          <Button variant="primary" busy>Busy</Button>
          <Button variant="outline" armed icon="trash-2">Armed</Button>
          <Button pressed>Pressed</Button>
          <Button variant="ghost" tone="danger">Tone danger</Button>
          <Button variant="ghost" tone="warning">Tone warning</Button>
          <Button variant="ghost" tone="success">Tone success</Button>
          <Button href="#controls">Href</Button>
          <Button disabled>Disabled</Button>
          <Button wide>Wide</Button>
        </div>
      </Sub>
      <Sub title="IconButton">
        <div style={row}>
          {["outline", "ghost", "secondary"].map((v) => <IconButton key={v} variant={v} icon="settings" label={v} />)}
          {["xs", "sm", "md", "lg"].map((s) => <IconButton key={s} size={s} icon="bell" label={s} />)}
          <IconButton icon="trash-2" label="Armed" armed />
          <IconButton icon="check" label="Tone success" tone="success" />
          <IconButton icon="x" label="Tone danger" tone="danger" />
          <IconButton icon="refresh-cw" label="Busy" busy />
          <IconButton icon="pin" label="Pressed" pressed />
          <IconButton icon="lock" label="Disabled" disabled />
        </div>
      </Sub>
      <Sub title="Input">
        <div style={col}>
          {["sm", "md", "lg"].map((s) => <Input key={s} size={s} placeholder={"size " + s} />)}
          <Input mono defaultValue="/var/lib/kgsm:8097" />
          <Input prefix="https://" suffix=".thekrystalship.com" defaultValue="auth" />
          <Input prefix="Port" mono defaultValue="8097" />
          <Input invalid defaultValue="invalid value" />
          <Input disabled defaultValue="disabled" />
          <Input prefix="$" disabled defaultValue="affixed disabled" />
          <Input prefix="$" invalid defaultValue="affixed invalid" />
        </div>
      </Sub>
      <Sub title="Textarea">
        <div style={col}>
          <Textarea placeholder="Textarea" rows={3} />
          <Textarea mono invalid defaultValue="mono, invalid" rows={2} />
        </div>
      </Sub>
      <Sub title="Field">
        <div style={col}>
          <Field label="Label"><Input /></Field>
          <Field label="Label" aside="optional" hint="A hint under the control."><Input /></Field>
          <Field label="Label" error="Something is wrong."><Input invalid /></Field>
          <Field label="Group" group><Checkbox checked onChange={() => {}}>One</Checkbox><Checkbox>Two</Checkbox></Field>
        </div>
      </Sub>
      <Sub title="Checkbox, Toggle">
        <div style={row}>
          <Checkbox checked={chk} onChange={setChk}>Checked</Checkbox>
          <Checkbox checked={false} onChange={() => {}}>Unchecked</Checkbox>
          <Checkbox checked disabled>Disabled</Checkbox>
          <Toggle on={tog} onChange={setTog} label="Toggle" />
          <Toggle on={false} onChange={() => {}} label="Off" />
          <Toggle on disabled label="Disabled" />
        </div>
      </Sub>
      <Sub title="Select">
        <div style={row}>
          <Select options={[{ value: "1", label: "Field" }, { value: "2", label: "Two" }]} />
          <Select variant="inline" size="sm" options={[{ value: "1", label: "Inline sm" }]} />
          <Select variant="chip" options={[{ value: "1", label: "Chip" }]} />
          <Select disabled options={[{ value: "1", label: "Disabled" }]} />
        </div>
      </Sub>
      <Sub title="OptionList">
        <div style={{ display: "grid", gap: 14, maxWidth: 480 }}>
          <OptionList label="Single" options={OPTIONS} value={one} onChange={setOne} />
          <OptionList label="Multiple" multiple size="sm" options={OPTIONS} value={many} onChange={setMany} />
          <OptionList label="Collapsed" options={OPTIONS} value="a" onChange={() => {}} collapsedAfter={2}
            moreLabel={(n) => n + " more options"} />
          <OptionList label="Segmented" variant="segmented" options={OPTIONS.filter((o) => !o.disabled)}
            value={seg} onChange={setSeg} />
          <OptionList label="Disabled" disabled options={OPTIONS} value="b" />
        </div>
      </Sub>
      <Sub title="Meter, Spinner, Skeleton">
        <div style={{ display: "grid", gap: 14, maxWidth: 420 }}>
          <Meter value={35} label="Value" start="35%" end="of 100" />
          <Meter value={100} label="Full" />
          <Meter label="Segments" start="Used" end="40 / 100 GB" segments={[
            { value: 30, tone: "neutral", label: "Used" }, { value: 10, tone: "accent", label: "Adding" },
            { value: 5, tone: "warn", label: "Warn" }, { value: 2, tone: "danger", label: "Danger" },
            { value: 8, tone: "success", label: "Success" },
          ]} />
        </div>
        <div style={{ ...row, marginTop: 14 }}>
          <Spinner size={12} /><Spinner /><Spinner size={28} /><Spinner label="Loading" />
        </div>
        <div style={{ display: "grid", gap: 8, maxWidth: 320 }}>
          <Skeleton h={14} w="60%" /><Skeleton h={10} /><Skeleton h={40} r={10} />
        </div>
      </Sub>
    </Section>
  );
}

// Each badge-carrying component with its badge in every tone it takes. A later increment compares
// these against the Pill drawn beside them.
function Badges() {
  const [tab, setTab] = React.useState("a");
  const art = "linear-gradient(135deg, var(--surface-3), var(--surface-1))";
  return (
    <Section id="badges" title="Badges">
      <Sub title="NavItem badge (info, warn, danger)">
        <div style={{ width: 240, display: "grid", gap: 2 }}>
          {["info", "warn", "danger"].map((t, i) => (
            <NavItem key={t} icon="bell" label={"Nav " + t} badge={i + 2} tone={t} />
          ))}
          <NavItem icon="server" label="Active, many" active badge={128} tone="warn" />
        </div>
      </Sub>
      <Sub title="SubTabs badge (info, warn, danger)">
        <SubTabs active={tab} onChange={setTab} tabs={[
          { id: "a", icon: "server", label: "Info", badge: 3, badgeTone: "info" },
          { id: "b", icon: "bell", label: "Warn", badge: 12, badgeTone: "warn" },
          { id: "c", icon: "shield", label: "Danger", badge: 1, badgeTone: "danger" },
          { id: "d", icon: "settings", label: "None" },
        ]} />
      </Sub>
      <Sub title="ShowcaseCard badge (accent, info, dot idle, dot live)">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
          {[
            { label: "Accent", tone: "accent" },
            { label: "Info", tone: "info" },
            { label: "Idle", tone: "info", dot: "idle" },
            { label: "Live", tone: "accent", dot: "live" },
          ].map((b) => (
            <ShowcaseCard key={b.label} name={"Card " + b.label} art={art} badge={b}
              specs={[{ icon: "users", value: 4, label: "players" }, { icon: "cpu", value: null, label: "cpu" }]}
              status={{ label: "Running", tone: "success" }} action={{ label: "Open" }} />
          ))}
        </div>
      </Sub>
      <Sub title="BriefCard count (default accent, neutral)">
        <div style={{ display: "grid", gap: 14, maxWidth: 420 }}>
          <BriefCard icon="bell" title="Accent count" count={5}><div style={{ padding: 14 }}>Body</div></BriefCard>
          <BriefCard icon="bell" title="Neutral count" count={12} countTone="neutral" countTitle="Last 24 hours">
            <div style={{ padding: 14 }}>Body</div>
          </BriefCard>
        </div>
      </Sub>
    </Section>
  );
}

function Page() {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [sort, setSort] = React.useState("name");
  const [dir, setDir] = React.useState("asc");
  return (
    <Section id="page" title="Page">
      <Sub title="PageHeader">
        <PageHeader title="Page title" sub="A line under the title."
          actions={<><Button variant="outline" icon="refresh-cw">Refresh</Button><Button variant="primary" icon="plus">New</Button></>} />
      </Sub>
      <Sub title="Notice">
        <div style={{ display: "grid", gap: 10, maxWidth: 560 }}>
          {["info", "ok", "warn", "danger"].map((t) => <Notice key={t} tone={t}>A {t} notice.</Notice>)}
        </div>
      </Sub>
      <Sub title="EmptyState">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          <EmptyState icon="inbox" title="Nothing here">Nothing to show yet.</EmptyState>
          <EmptyState icon="alert-triangle" tone="danger" title="Failed" detail="Error: example"
            actions={<Button size="sm">Retry</Button>}>It did not work.</EmptyState>
        </div>
      </Sub>
      <Sub title="Breadcrumbs">
        <Breadcrumbs items={[{ label: "Home", href: "#page" }, { label: "Servers", href: "#page" }, { label: "Factorio" }]} />
      </Sub>
      <Sub title="Toolbar">
        <Toolbar>
          <ToolbarSearch value={q} onChange={setQ} placeholder="Search…" />
          <ToolbarFilters onReset={() => setStatus("all")} fields={[{
            id: "status", label: "Status", value: status, onChange: setStatus, default: "all",
            options: [{ value: "all", label: "All", count: 6 }, { value: "online", label: "Online", count: 3 }],
          }]} />
          <ToolbarSort value={sort} dir={dir} onChange={(k, d) => { setSort(k); setDir(d); }}
            options={[{ value: "name", label: "Name", defaultDir: "asc" }, { value: "players", label: "Players" }]} />
          <ToolbarSpacer />
          <ToolbarCount shown={3} total={6} unit="servers" />
          <ToolbarButton icon="refresh-cw">Refresh</ToolbarButton>
        </Toolbar>
      </Sub>
    </Section>
  );
}

function Settings() {
  const [on, setOn] = React.useState(true);
  return (
    <Section id="settings" title="Settings">
      <div style={{ maxWidth: 640 }}>
        <SettingsSection icon="settings" title="Section" meta="A meta line.">
          <SettingsRow icon="bell" title="Toggle row" sub="A sub line under the title."><Toggle on={on} onChange={setOn} label="On" /></SettingsRow>
          <SettingsRow icon="globe" title="Select row"><Select variant="inline" options={[{ value: "1", label: "English" }]} /></SettingsRow>
          <SettingsRow icon="check-circle-2" title="Success row" tone="success"><Button size="sm">Action</Button></SettingsRow>
          <SettingsRow icon="alert-triangle" title="Warn row" tone="warn"><Button size="sm" variant="outline">Action</Button></SettingsRow>
          <SettingsRow icon="x-circle" title="Danger row" tone="danger"><Button size="sm" variant="danger">Remove</Button></SettingsRow>
          <SettingsRow icon="info" title="Info row" tone="info" />
        </SettingsSection>
      </div>
    </Section>
  );
}

function Dialogs() {
  const [open, setOpen] = React.useState(null);
  const close = () => setOpen(null);
  const foot = <><Button variant="outline" onClick={close}>Cancel</Button><Button variant="primary" onClick={close}>Save</Button></>;
  return (
    <Section id="dialogs" title="Dialogs">
      <div style={row}>
        <Button onClick={() => setOpen("md")}>Dialog md</Button>
        <Button onClick={() => setOpen("lg")}>Dialog lg with foot</Button>
      </div>
      {open === "md" && (
        <Dialog title="Medium dialog" sub="A sub line." icon="info" onClose={close}>
          <p style={{ margin: 0 }}>The body of a medium dialog.</p>
        </Dialog>
      )}
      {open === "lg" && (
        <Dialog title="Large dialog" size="lg" icon="settings" onClose={close} foot={foot}>
          <Field label="Name"><Input /></Field>
        </Dialog>
      )}
    </Section>
  );
}

function Lists() {
  return (
    <Section id="lists" title="Lists">
      <Sub title="ListRow / List"><p style={{ margin: 0, opacity: 0.6 }}>Placeholder.</p></Sub>
    </Section>
  );
}

// The frame renders inside a transformed box, so its fixed-position parts are contained by it.
function Frame() {
  const [collapsed, setCollapsed] = React.useState(false);
  return (
    <Section id="frame" title="Frame">
      <div style={{ height: 360, overflow: "hidden", position: "relative", transform: "translateZ(0)",
        border: "1px solid var(--edge, currentColor)", borderRadius: 12 }}>
        <AppShell collapsed={collapsed} drawerOpen={false} onDrawer={() => {}}
          sidebar={(
            <Sidebar mark="" wordmark="Playground" collapsed={collapsed} open
              onToggleCollapse={() => setCollapsed((c) => !c)}>
              <SidebarGroup label="Group">
                <NavItem icon="server" label="Servers" active />
                <NavItem icon="bell" label="Alerts" badge={3} tone="warn" />
              </SidebarGroup>
            </Sidebar>
          )}>
          <PageHeader title="Main column" sub="Inside the frame." />
        </AppShell>
      </div>
    </Section>
  );
}

const LATER = ["Pill", "PasswordInput", "ProviderButton", "ListRow / List", "CardScreen", "CopyField"];

function App() {
  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "24px 16px 80px" }}>
      <h1 style={{ margin: "0 0 12px", fontSize: 22 }}>krystal-ui playground</h1>
      <ThemePicker />
      <nav style={{ ...row, marginTop: 16 }}>
        {["controls", "badges", "page", "settings", "dialogs", "lists", "frame", "later"].map((id) => (
          <a key={id} href={"#" + id}>#{id}</a>
        ))}
      </nav>
      <Controls />
      <Badges />
      <Page />
      <Settings />
      <Dialogs />
      <Lists />
      <Frame />
      <Section id="later" title="Not yet built">
        {LATER.map((name) => <Sub key={name} title={name}><p style={{ margin: 0, opacity: 0.6 }}>Placeholder.</p></Sub>)}
      </Section>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
