import React from "react";
import {
  Avatar, BriefCard, BriefItem, BriefList, Button, Dialog, Disclosure, Drawer, EmptyState, HeroBar, HeroBody, HeroButton, HeroGroup,
  Hero, Input, Meter, Rail, RadioGroup, SettingsRow, SettingsSection, ShowcaseCard, StatTile, StatTiles, StatusDot,
  SubTabs, TabBar, ToolbarFilters, TvCard, TvSpotlight, Toggle, Select,
} from "@thekrystalship/krystal";
import { ChatCardRow, ChatCardRows, ChatCard } from "@thekrystalship/krystal-chat";
import { Section, Sub, row } from "../kit.jsx";

const ART = "linear-gradient(135deg, var(--krystal-teal), var(--surface-3))";

export default function VariantsSection() {
  const [pinned, setPinned] = React.useState(false);
  const [tab, setTab] = React.useState("a");
  const [heights, setHeights] = React.useState("a");
  const [dlg, setDlg] = React.useState(null);
  const [filter, setFilter] = React.useState("all");
  const filters = [{ id: "s", label: "Status", value: filter, onChange: setFilter, default: "all",
    options: [{ value: "all", label: "All" }, { value: "on", label: "Online" }] }];
  return (
    <Section id="variants" title="Variants and states">
      <Sub title="BriefCard: value in the head, wrapHead, fill + revealPin (hover the card), head tokens">
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          <BriefCard icon="activity" title="CPU load over the last day" value="42%" wrapHead>
            <div style={{ padding: 14 }}>Body</div>
          </BriefCard>
          <BriefCard fill revealPin icon="gauge" title="Pinned on hover"
            pin={<Button size="xs" variant="ghost" icon="pin" pressed={pinned} onClick={() => setPinned(!pinned)}>Pin</Button>}>
            <BriefList>
              <BriefItem icon="bell" title="Disabled row" disabled action="Unavailable" detail="no hover, quiet action" />
            </BriefList>
          </BriefCard>
          <BriefCard icon="settings" title="Roomier head" style={{ "--k-brief-head-padding": "14px 18px", "--k-brief-head-gap": "8px" }}>
            <div style={{ padding: 14 }}>Body</div>
          </BriefCard>
        </div>
      </Sub>
      <Sub title="controlsBelow on BriefItem and SettingsRow (resize to a phone); Input narrow and align end">
        <div style={{ maxWidth: 560 }}>
          <SettingsSection icon="settings" title="Rows">
            <SettingsRow icon="user" title="Account" sub="A long label that wraps on a phone" controlsBelow>
              <Input wide placeholder="name" />
              <Button size="sm">Look up</Button>
            </SettingsRow>
            <SettingsRow icon="hash" title="Port" controlsBelow>
              <Input narrow align="end" type="number" suffix="udp" defaultValue={27015} />
            </SettingsRow>
            <SettingsRow icon="ruler" title="Heights" controlsBelow>
              <RadioGroup fill variant="segmented" label="Heights" value={heights} onChange={setHeights}
                options={[{ value: "a", label: "Low" }, { value: "b", label: "Mid" }, { value: "c", label: "High" }]} />
            </SettingsRow>
            <BriefItem icon="gauge" title="Watch CPU" controlsBelow controls={<><Select variant="inline" aria-label="Level" options={[{ value: "1", label: "Warn" }]} /><Toggle on label="Watch CPU" onChange={() => {}} /></>} />
          </SettingsSection>
        </div>
      </Sub>
      <Sub title="StatTile: emphasis, stale, off, wrapSub, deltaEnd; Meter stale">
        <StatTiles min={200}>
          <StatTile emphasis tone="ok" label="Online" value={3} sub="a long sub line that wraps over lines" wrapSub />
          <StatTile emphasis tone="info" label="Disk" value="62" unit="%" deltaEnd delta={<StatusDot tone="ok" label="Healthy" />} />
          <StatTile stale tone="off" label="CPU" value="12" unit="%" sub="Last reading" />
          <StatTile label="Memory" value="8" unit="GB" spark={<Meter stale value={60} />} />
        </StatTiles>
      </Sub>
      <Sub title="Rail perView: stops keyed by the rail's own width">
        <Rail title="Shelf" items={Array.from({ length: 10 }, (_, i) => ({ id: i }))} perView={{ 0: 1.25, 430: 2.35, 640: 3.4, 1000: 5.4 }}
          renderItem={(it) => <div style={{ height: 80, background: "var(--surface-3)", borderRadius: 8, padding: 8 }}>{it.id}</div>} />
      </Sub>
      <Sub title="Dialog: sheet, footLayout pair, artOverlap; Drawer: footLayout stack, no body">
        <div style={row}>
          <Button onClick={() => setDlg("dialog")}>Dialog</Button>
          <Button onClick={() => setDlg("drawer")}>Drawer</Button>
        </div>
        {dlg === "dialog" && (
          <Dialog title="Remove download?" icon="trash-2" sheet art={ART} artOverlap footLayout="pair" onClose={() => setDlg(null)}
            foot={<><Button onClick={() => setDlg(null)}>Cancel</Button><Button variant="danger" onClick={() => setDlg(null)}>Remove</Button></>}>
            {({ fullscreen }) => <p>fullscreen: {String(fullscreen)}</p>}
          </Dialog>
        )}
        {dlg === "drawer" && (
          <Drawer title="Underway" footLayout="stack" onClose={() => setDlg(null)}
            foot={<><Button variant="primary" onClick={() => setDlg(null)}>Keep</Button><Button onClick={() => setDlg(null)}>Stop</Button></>} />
        )}
      </Sub>
      <Sub title="HeroButton iconTone and armed; Disclosure flush; SubTabs / TabBar disabled and fill; ToolbarFilters framed and compact">
        <Hero art={ART}>
          <HeroBody>
            <HeroBar><HeroGroup>
              <HeroButton icon="play" iconTone="ok">Start</HeroButton>
              <HeroButton icon="download" iconTone="warn">Update</HeroButton>
              <HeroButton icon="square" iconTone="danger">Stop</HeroButton>
              <HeroButton icon="rotate-cw" iconTone="update" armed>Confirm?</HeroButton>
            </HeroGroup></HeroBar>
          </HeroBody>
        </Hero>
        <div style={{ display: "grid", gap: 12, maxWidth: 520, marginTop: 12 }}>
          <Disclosure flush defaultOpen summary={<><Avatar name="G" size="xs" />Group with a tile and a name</>}><div style={{ paddingTop: 12 }}>Flush body</div></Disclosure>
          <SubTabs fill active={tab} onChange={setTab} tabs={[{ id: "a", label: "Profile", icon: "user" }, { id: "b", label: "Locked", icon: "lock", disabled: true }]} />
          <TabBar items={[{ id: "a", label: "Home", icon: "home", active: true }, { id: "b", label: "Off", icon: "lock", disabled: true }]} />
          <div style={{ display: "flex", alignItems: "stretch", gap: 10 }}>
            <Input wide placeholder="Search" size="lg" />
            <ToolbarFilters framed compact="phone" fields={filters} />
          </div>
        </div>
      </Sub>
      <Sub title="ShowcaseCard corner tone and mono, progress track token; EmptyState spin; ChatCardRows flush; Avatar imagePosition; TvSpotlight titleSize; TvCard dimmed">
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", maxWidth: 640 }}>
          <ShowcaseCard name="Underway" art={ART} corner={{ label: "42%", tone: "neutral", mono: true }} progress={0.42}
            status={{ label: "A long cast line that ends in an ellipsis as a block" }} specs={[{ icon: "star", value: "7.9", label: "Rating" }, { icon: "clock", value: "1h 28m", label: "Length" }]}
            action={{ label: "Open" }} />
          <div style={{ width: 180 }}>
            <ShowcaseCard name="Narrow" art={ART} compactFacts specs={[{ icon: "star", value: "7.9", label: "Rating" }, { icon: "clock", value: "1h 28m", label: "Length" }]} action={{ label: "Open" }} />
          </div>
          <div style={{ width: 180 }}>
            <ShowcaseCard name="Narrow, icons kept" art={ART} specs={[{ icon: "star", value: "7.9", label: "Rating" }, { icon: "clock", value: "1h 28m", label: "Length" }]} action={{ label: "Open" }} />
          </div>
          <ShowcaseCard name="Downloaded" art={ART} corner={{ label: "Saved", tone: "accent", icon: "check" }} progress={1} action={{ label: "Open" }} />
        </div>
        <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
          <EmptyState spin icon="loader-2" title="Waiting" />
          <ChatCard icon="server" title="Flush rows"><ChatCardRows flush><ChatCardRow label="State" value="Running" /></ChatCardRows></ChatCard>
          <Avatar size={72} shape="rounded" name="A" src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='200'%3E%3Crect width='72' height='80' fill='%23c06040'/%3E%3Crect y='80' width='72' height='120' fill='%2340a0c0'/%3E%3C/svg%3E" imagePosition="center 10%" />
        </div>
        <div style={{ display: "grid", gap: 12, maxWidth: 520, "--tv-poster-w": "90px", "--tv-poster-h": "135px", "--tv-dim": 0.55 }}>
          <TvSpotlight titleSize="lg" overviewLines={2} title="Large name" overview="Two lines of an overview and then the rest is cut off by the clamp so a long story never pushes the page." />
          <div style={{ display: "flex", gap: 12 }}>
            <TvCard href="#" label="Card" onClick={(e) => e.preventDefault()} />
            <TvCard href="#" dimmed label="Dimmed card" onClick={(e) => e.preventDefault()} />
          </div>
        </div>
      </Sub>
    </Section>
  );
}
