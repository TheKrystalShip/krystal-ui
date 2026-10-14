import React from "react";
import { Tab, TabList, TabPanel, Tabs } from "@thekrystalship/krystal";
import { Section, Sub } from "../kit.jsx";

const LONG = ["Overview", "Activity", "Members", "Billing", "Integrations", "Webhooks", "Audit trail", "Danger zone"];

export default function TabsSection() {
  const [value, setValue] = React.useState("b");
  const [long, setLong] = React.useState("Danger zone");
  return (
    <Section id="tabs" title="Tabs">
      <Sub title="Underline, controlled">
        <Tabs value={value} onChange={setValue}>
          <TabList label="Underline">
            <Tab value="a" icon="info">Overview</Tab>
            <Tab value="b" count={3}>Alerts</Tab>
            <Tab value="c" count={12} countTone="warn">Events</Tab>
            <Tab value="d" disabled>Locked</Tab>
          </TabList>
          <TabPanel value="a">Overview panel.</TabPanel>
          <TabPanel value="b">Alerts panel, chosen: {value}.</TabPanel>
          <TabPanel value="c">Events panel.</TabPanel>
        </Tabs>
      </Sub>
      <Sub title="Segmented, manual activation (arrows move focus, Enter or Space chooses)">
        <Tabs defaultValue="a" variant="segmented" activation="manual">
          <TabList label="Segmented">
            <Tab value="a">Day</Tab>
            <Tab value="b">Week</Tab>
            <Tab value="c">Month</Tab>
          </TabList>
          <TabPanel value="a">Day.</TabPanel>
          <TabPanel value="b">Week.</TabPanel>
          <TabPanel value="c">Month.</TabPanel>
        </Tabs>
      </Sub>
      <Sub title="Size sm, keepMounted panels">
        <Tabs defaultValue="a" size="sm">
          <TabList label="Small">
            <Tab value="a">One</Tab>
            <Tab value="b">Two</Tab>
          </TabList>
          <TabPanel value="a" keepMounted><input defaultValue="kept while hidden" /></TabPanel>
          <TabPanel value="b" keepMounted>Second.</TabPanel>
        </Tabs>
      </Sub>
      <Sub title="Overflow: scrolls, chosen tab kept in view">
        <div style={{ maxWidth: 360 }}>
          <Tabs value={long} onChange={setLong}>
            <TabList label="Long">
              {LONG.map((t) => <Tab key={t} value={t}>{t}</Tab>)}
            </TabList>
            <TabPanel value={long}>{long}</TabPanel>
          </Tabs>
        </div>
        <div style={{ maxWidth: 360, marginTop: 12 }}>
          <Tabs value={long} onChange={setLong} variant="segmented">
            <TabList label="Long segmented">
              {LONG.map((t) => <Tab key={t} value={t}>{t}</Tab>)}
            </TabList>
          </Tabs>
        </div>
      </Sub>
    </Section>
  );
}
