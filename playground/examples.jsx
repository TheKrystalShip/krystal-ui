// The live examples of the built-in components, one export per component (or per pair that is
// shown together). A component's documentation page draws its examples; the "all" view draws them
// grouped into the sections the visual harness shoots (see docs/all.jsx).
import React from "react";
import {
  AccountAvatar, AppShell, Breadcrumbs, BriefCard, Button, CardScreen, Checkbox, CopyField, Dialog, EmptyState, Field, IconButton, Input,
  Icon, List, ListRow, Meter, NavItem, Notice, OptionList, PageHeader, PasswordInput, Pill, ProviderButton, providerLabel, Select, SettingsRow, SettingsSection, ShowcaseCard,
  Sidebar, SidebarGroup, Skeleton, Spinner, SubTabs, Textarea, Toggle, Toolbar,
  ToolbarButton, ToolbarCount, ToolbarFilters, ToolbarSearch, ToolbarSort, ToolbarSpacer, TabBar,
} from "@thekrystalship/krystal";
import { ChatCard, ChatCardRow, ChatCardRows } from "@thekrystalship/krystal-chat";
import tksMark from "../packages/krystal/assets/tks-mark.png";
import { Sub, col, row } from "./kit.jsx";

const OPTIONS = [
  { value: "a", label: "Alpha", detail: "first", aside: "12 MB" },
  { value: "b", label: "Beta", aside: "3 MB" },
  { value: "c", label: "Gamma", disabled: true },
  { value: "d", label: "Delta" },
];

// The strength rule is the site's; this one only gives the bar something to show.
const PW_WORDS = ["Empty", "Weak", "Fair", "Good", "Strong"];
const PW_TONES = ["neutral", "danger", "warn", "accent", "success"];
const PROVIDERS = ["discord", "github", "google", "microsoft"];

const PEOPLE = [
  { name: "Ada Lovelace", handle: "@ada", roles: [["Owner", "accent"], ["Operator", "info"]], status: ["Active", "ok"] },
  { name: "Grace Hopper", handle: "@grace", roles: [["Operator", "info"]], status: ["Active", "ok"] },
  { name: "Alan Turing", handle: "@alan", roles: [["Viewer", "neutral"]], status: ["Suspended", "warn"] },
];


export function ButtonExamples() {
  return (
    <>
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
    </>
  );
}

export function IconButtonExamples() {
  return (
    <>
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
    </>
  );
}

export function InputExamples() {
  return (
    <>
      <Sub title="Input">
        <div style={col}>
          {["sm", "md", "lg"].map((s) => <Input key={s} size={s} placeholder={"size " + s} />)}
          <Input mono aria-label="Path" defaultValue="/var/lib/kgsm:8097" />
          <Input prefix="https://" suffix=".thekrystalship.com" aria-label="Subdomain" defaultValue="auth" />
          <Input prefix="Port" mono aria-label="Port" defaultValue="8097" />
          <Input invalid aria-label="Invalid" defaultValue="invalid value" />
          <Input disabled aria-label="Disabled" defaultValue="disabled" />
          <Input prefix="$" disabled aria-label="Affixed disabled" defaultValue="affixed disabled" />
          <Input prefix="$" invalid aria-label="Affixed invalid" defaultValue="affixed invalid" />
        </div>
      </Sub>
      <Sub title="Textarea">
        <div style={col}>
          <Textarea placeholder="Textarea" rows={3} />
          <Textarea mono invalid aria-label="Mono, invalid" defaultValue="mono, invalid" rows={2} />
        </div>
      </Sub>
    </>
  );
}

export function FieldExamples() {
  return (
    <>
      <Sub title="Field">
        <div style={col}>
          <Field label="Label"><Input /></Field>
          <Field label="Label" aside="optional" hint="A hint under the control."><Input /></Field>
          <Field label="Label" error="Something is wrong."><Input invalid /></Field>
          <Field label="Group" group><Checkbox checked onChange={() => {}}>One</Checkbox><Checkbox>Two</Checkbox></Field>
        </div>
      </Sub>
    </>
  );
}

export function PasswordInputExamples() {
  const [pw, setPw] = React.useState("hunter2");
  const pwRef = React.useRef(null);
  const pwScore = pw ? Math.min(4, 1 + (pw.length >= 8) + (/\d/.test(pw) && /[a-z]/i.test(pw)) + (pw.length >= 14)) : 0;
  return (
    <>
      <Sub title="PasswordInput, strength bar">
        <div style={{ ...col, maxWidth: 360 }}>
          <Field label="Password" hint="Eight characters or more.">
            <PasswordInput ref={pwRef} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password"
              autoComplete="new-password" />
            <Meter label="Password strength" max={4} valueText={PW_WORDS[pwScore]}
              segments={[0, 1, 2, 3].map((i) => ({ value: 1, tone: i < pwScore ? PW_TONES[pwScore] : "neutral" }))} />
          </Field>
          <Button size="sm" variant="outline" onClick={() => pwRef.current && pwRef.current.focus()}>Focus the field</Button>
          <PasswordInput size="sm" aria-label="Small password" defaultValue="small" />
          <PasswordInput size="lg" aria-label="Large password" defaultValue="large" invalid />
          <PasswordInput disabled aria-label="Disabled password" defaultValue="disabled" />
        </div>
      </Sub>
    </>
  );
}

export function ProviderButtonExamples() {
  return (
    <>
      <Sub title="ProviderButton">
        <div style={{ display: "grid", gap: 14, maxWidth: 360 }}>
          {PROVIDERS.map((p) => (
            <ProviderButton key={p} provider={p} brand wide size="lg">Continue with {providerLabel(p)}</ProviderButton>
          ))}
          <ProviderButton provider="oidc-acme" wide size="lg">Continue with oidc-acme</ProviderButton>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
            {PROVIDERS.map((p) => <ProviderButton key={p} provider={p} wide>{providerLabel(p)}</ProviderButton>)}
          </div>
          <ProviderButton provider="discord" brand busy wide size="lg">Signing in</ProviderButton>
          <ProviderButton provider="google" brand busy wide size="lg">Signing in</ProviderButton>
          <ProviderButton provider="github" disabled wide>Disabled</ProviderButton>
        </div>
      </Sub>
    </>
  );
}

export function CheckboxExamples() {
  const [chk, setChk] = React.useState(true);
  const [tog, setTog] = React.useState(true);
  return (
    <>
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
    </>
  );
}

export function SelectExamples() {
  return (
    <>
      <Sub title="Select">
        <div style={row}>
          <Select aria-label="Field select" options={[{ value: "1", label: "Field" }, { value: "2", label: "Two" }]} />
          <Select variant="inline" size="sm" aria-label="Inline small select" options={[{ value: "1", label: "Inline sm" }]} />
          <Select variant="chip" aria-label="Chip select" options={[{ value: "1", label: "Chip" }]} />
          <Select disabled aria-label="Disabled select" options={[{ value: "1", label: "Disabled" }]} />
        </div>
      </Sub>
    </>
  );
}

export function OptionListExamples() {
  const [one, setOne] = React.useState("a");
  const [many, setMany] = React.useState(["a", "d"]);
  const [seg, setSeg] = React.useState("a");
  return (
    <>
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
    </>
  );
}

export function MeterExamples() {
  return (
    <>
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
    </>
  );
}

export function PillExamples() {
  return (
    <>
      <Sub title="Pill tones (md, sm), with icon, with dot">
        {["md", "sm"].map((size) => (
          <div key={size} style={row}>
            {["neutral", "accent", "info", "ok", "warn", "danger", "muted"].map((t) => (
              <Pill key={t} tone={t} size={size}>{t}</Pill>
            ))}
            {["neutral", "accent", "info", "ok", "warn", "danger", "muted"].map((t) => (
              <Pill key={"i" + t} tone={t} size={size} icon="lock">{t}</Pill>
            ))}
            {["neutral", "ok", "warn"].map((t) => (
              <Pill key={"d" + t} tone={t} size={size} dot>{t}</Pill>
            ))}
            <Pill tone="ok" size={size} dot="live">live</Pill>
            <Pill size={size}>7</Pill>
          </div>
        ))}
      </Sub>
    </>
  );
}

export function NavItemBadgeExamples() {
  return (
    <>
      <Sub title="NavItem badge (info, warn, danger)">
        <div style={{ width: 240, display: "grid", gap: 2 }}>
          {["info", "warn", "danger"].map((t, i) => (
            <NavItem key={t} icon="bell" label={"Nav " + t} badge={i + 2} tone={t} />
          ))}
          <NavItem icon="server" label="Active, many" active badge={128} tone="warn" />
        </div>
      </Sub>
    </>
  );
}

export function SubTabsExamples() {
  const [tab, setTab] = React.useState("a");
  return (
    <>
      <Sub title="SubTabs badge (info, warn, danger)">
        <SubTabs active={tab} onChange={setTab} tabs={[
          { id: "a", icon: "server", label: "Info", badge: 3, badgeTone: "info" },
          { id: "b", icon: "bell", label: "Warn", badge: 12, badgeTone: "warn" },
          { id: "c", icon: "shield", label: "Danger", badge: 1, badgeTone: "danger" },
          { id: "d", icon: "settings", label: "None" },
        ]} />
      </Sub>
    </>
  );
}

export function ShowcaseCardExamples() {
  const art = "linear-gradient(135deg, var(--surface-3), var(--surface-1))";
  return (
    <>
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
    </>
  );
}

export function TabBarExamples() {
  return (
    <>
      <Sub title="TabBar badge (phone width only; info, warn, danger)">
        <TabBar items={[
          { id: "a", icon: "server", label: "Info", badge: 3, tone: "info" },
          { id: "b", icon: "bell", label: "Warn", badge: 12, tone: "warn", active: true },
          { id: "c", icon: "shield", label: "Danger", badge: 1, tone: "danger" },
        ]} />
      </Sub>
    </>
  );
}

export function BriefCardCountExamples() {
  return (
    <>
      <Sub title="BriefCard count (default warn, neutral)">
        <div style={{ display: "grid", gap: 14, maxWidth: 420 }}>
          <BriefCard icon="bell" title="Accent count" count={5}><div style={{ padding: 14 }}>Body</div></BriefCard>
          <BriefCard icon="bell" title="Neutral count" count={12} countTone="neutral" countTitle="Last 24 hours">
            <div style={{ padding: 14 }}>Body</div>
          </BriefCard>
        </div>
      </Sub>
    </>
  );
}

export function PageHeaderExamples() {
  return (
    <>
      <Sub title="PageHeader">
        <PageHeader title="Page title" sub="A line under the title."
          actions={<><Button variant="outline" icon="refresh-cw">Refresh</Button><Button variant="primary" icon="plus">New</Button></>} />
      </Sub>
    </>
  );
}

export function NoticeExamples() {
  return (
    <>
      <Sub title="Notice">
        <div style={{ display: "grid", gap: 10, maxWidth: 560 }}>
          {["info", "ok", "warn", "danger"].map((t) => <Notice key={t} tone={t}>A {t} notice.</Notice>)}
          <Notice tone="danger" icon="circle-x" action={<Button variant="outline" size="xs" icon="rotate-cw">Retry</Button>}>
            <b>Couldn't refresh.</b> Showing the last known state.
          </Notice>
        </div>
      </Sub>
    </>
  );
}

export function EmptyStateExamples() {
  return (
    <>
      <Sub title="EmptyState">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          <EmptyState icon="inbox" title="Nothing here">Nothing to show yet.</EmptyState>
          <EmptyState icon="alert-triangle" tone="danger" title="Failed" detail="Error: example"
            actions={<Button size="sm">Retry</Button>}>It did not work.</EmptyState>
        </div>
      </Sub>
    </>
  );
}

export function BreadcrumbsExamples() {
  return (
    <>
      <Sub title="Breadcrumbs">
        <Breadcrumbs items={[{ label: "Home", href: "#page" }, { label: "Servers", href: "#page" }, { label: "Factorio" }]} />
      </Sub>
    </>
  );
}

export function ToolbarExamples() {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [sort, setSort] = React.useState("name");
  const [dir, setDir] = React.useState("asc");
  return (
    <>
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
    </>
  );
}

export function CardScreenExamples() {
  const [pw, setPw] = React.useState("");
  return (
    <>
      <Sub title="CardScreen, contained">
        <div style={{ ["--k-cardscreen-height"]: "100%", height: 720, overflow: "auto", border: "1px solid var(--border-subtle)", borderRadius: 12 }}
          data-cardscreen-box>
          <CardScreen mark={tksMark} wordmark="TheKrystalShip" tagline="Sign in to continue"
            foot={<>No account? <a href="#cardscreen">Register</a></>}>
            <Field label="Username"><Input wide autoComplete="username" placeholder="ada" /></Field>
            <Field label="Password" aside="8+ characters">
              <PasswordInput wide value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
            </Field>
            <Button variant="primary" size="lg" wide>Sign in</Button>
            <div style={{ textAlign: "center", fontSize: 12, color: "var(--fg-3)" }}>or</div>
            {PROVIDERS.map((p) => <ProviderButton key={p} provider={p} brand wide size="lg">Continue with {providerLabel(p)}</ProviderButton>)}
          </CardScreen>
        </div>
      </Sub>
      <Sub title="CardScreen md, no brand">
        <div style={{ ["--k-cardscreen-height"]: "100%", height: 260, overflow: "auto", border: "1px solid var(--border-subtle)", borderRadius: 12 }}>
          <CardScreen width="md"><EmptyState icon="shield-check" title="Approve this device">Confirm the code shown on your TV.</EmptyState></CardScreen>
        </div>
      </Sub>
    </>
  );
}

export function CopyFieldExamples() {
  return (
    <>
      <Sub title="CopyField">
        <div style={col}>
          <CopyField value="kgsm_pat_7f3a91c2d8e04b5a" aria-label="Token" data-copyfield />
          <CopyField value="https://kgsm.thekrystalship.com" aria-label="Address" label="Copy address" mono={false} size="sm" />
        </div>
      </Sub>
    </>
  );
}

export function SettingsExamples() {
  const [on, setOn] = React.useState(true);
  return (
    <>
      <div style={{ maxWidth: 640 }}>
        <SettingsSection icon="settings" title="Section" meta="A meta line.">
          <SettingsRow icon="bell" title="Toggle row" sub="A sub line under the title."><Toggle on={on} onChange={setOn} label="On" /></SettingsRow>
          <SettingsRow icon="globe" title="Select row"><Select variant="inline" aria-label="Select row" options={[{ value: "1", label: "English" }]} /></SettingsRow>
          <SettingsRow icon="check-circle-2" title="Success row" tone="success"><Button size="sm">Action</Button></SettingsRow>
          <SettingsRow icon="alert-triangle" title="Warn row" tone="warn"><Button size="sm" variant="outline">Action</Button></SettingsRow>
          <SettingsRow icon="x-circle" title="Danger row" tone="danger"><Button size="sm" variant="danger">Remove</Button></SettingsRow>
          <SettingsRow icon="info" title="Info row" tone="info" />
        </SettingsSection>
      </div>
    </>
  );
}

export function DialogExamples() {
  const [open, setOpen] = React.useState(null);
  const close = () => setOpen(null);
  const foot = <><Button variant="outline" onClick={close}>Cancel</Button><Button variant="primary" onClick={close}>Save</Button></>;
  return (
    <>
      <div style={row}>
        <Button onClick={() => setOpen("md")}>Dialog md</Button>
        <Button onClick={() => setOpen("lg")}>Dialog lg with foot</Button>
        <Button onClick={() => setOpen("outer")}>Nested dialogs</Button>
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
      {(open === "outer" || open === "inner") && (
        <Dialog title="Outer dialog" sub="Escape closes the inner dialog first." icon="layers" onClose={close}
          foot={<Button variant="primary" onClick={() => setOpen("inner")}>Open inner</Button>}>
          <Field label="Outer field"><Input /></Field>
        </Dialog>
      )}
      {open === "inner" && (
        <Dialog title="Inner dialog" icon="info" onClose={() => setOpen("outer")}
          foot={<Button variant="outline" onClick={() => setOpen("outer")}>Close inner</Button>}>
          <Field label="Inner field"><Input data-autofocus /></Field>
        </Dialog>
      )}
    </>
  );
}

export function ListExamples() {
  const [opened, setOpened] = React.useState("none");
  const [picked, setPicked] = React.useState("b");
  const tile = (name) => (
    <span style={{ width: 32, height: 32, borderRadius: 8, background: "var(--surface-3)", color: "var(--fg-2)",
      display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name={name} size={16} /></span>
  );
  return (
    <>
      <Sub title="People: lead, sub, role pills, status pill, an action">
        <List label="People">
          {PEOPLE.map((p) => (
            <ListRow key={p.handle} data-person={p.handle}
              lead={<AccountAvatar user={{ name: p.name }} size={32} />}
              title={p.name} sub={p.handle}
              meta={<>{p.roles.map(([r, t]) => <Pill key={r} tone={t} size="sm">{r}</Pill>)}<Pill tone={p.status[1]} size="sm" dot>{p.status[0]}</Pill></>}
              actions={<Button size="sm" variant="outline">Manage</Button>} />
          ))}
        </List>
      </Sub>
      <Sub title={"Navigable (onOpen): opened " + opened}>
        <List label="Applications">
          {["Control Panel", "Cinema", "Assistant"].map((n, i) => (
            <ListRow key={n} data-row={n} lead={tile(["server", "film", "bot"][i])} title={n}
              sub="3 clients, 2 roles" aside={"app-" + (i + 1)} onOpen={() => setOpened(n)} />
          ))}
          <ListRow title="A link row" sub="href renders an anchor" href="#lists" />
        </List>
      </Sub>
      <Sub title="Two actions, openable">
        <List label="Grants">
          <ListRow data-row="grants" lead={tile("key")} title="servers.restart" sub="Scope: instance factorio-1"
            meta={<Pill size="sm" tone="info">effect allow</Pill>}
            aside="2026-10-12 09:14" onOpen={() => setOpened("grant")}
            actions={<><Button size="sm" variant="outline">Edit</Button><IconButton size="sm" variant="ghost" tone="danger" icon="trash-2" label="Remove" /></>} />
        </List>
      </Sub>
      <Sub title="Selected, tone, disabled">
        <List label="States">
          {["a", "b", "c"].map((k) => (
            <ListRow key={k} title={"Selectable row " + k} sub="aria-current marks the chosen one"
              selected={picked === k} onOpen={() => setPicked(k)} />
          ))}
          <ListRow tone="warn" lead={tile("alert-triangle")} title="Needs approval" sub="tone warn" meta={<Pill size="sm" tone="warn">Pending</Pill>} onOpen={() => {}} />
          <ListRow tone="danger" lead={tile("circle-x")} title="Failed" sub="tone danger" aside="exit 1" />
          <ListRow disabled title="Disabled row" sub="onOpen is blocked" onOpen={() => setOpened("DISABLED FIRED")}
            actions={<Button size="sm" variant="outline" disabled>Manage</Button>} />
        </List>
      </Sub>
      <Sub title="Empty: the List draws nothing, an EmptyState stands in">
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          <div data-empty-list><List label="Nobody">{[]}</List><p style={{ margin: 0, color: "var(--fg-3)", fontSize: 12 }}>(an empty List)</p></div>
          <EmptyState icon="users" title="Nobody here yet">Accounts you invite show up in this list.</EmptyState>
        </div>
      </Sub>
    </>
  );
}

export function FrameExamples() {
  const [collapsed, setCollapsed] = React.useState(false);
  return (
    <>
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
    </>
  );
}

export function ChatCardExamples() {
  return (
    <>
      <ChatCard icon="server" title="Factorio" sub="factorio-1" confidence="confirmed">
        <ChatCardRows>
          <ChatCardRow label="State" value="Running" verdict="ok" verdictLabel="Healthy" />
          <ChatCardRow label="Players" value="3" />
        </ChatCardRows>
      </ChatCard>
    </>
  );
}
