import React from "react";
import { BriefCard, BriefEmpty, BriefItem, BriefList, Button, FactList, Input, Pill } from "@thekrystalship/krystal";
import { Section, Sub } from "../kit.jsx";

const TONES = ["danger", "warn", "info", "success", "update"];

export default function BriefSection() {
  const [hits, setHits] = React.useState(0);
  return (
    <Section id="brief" title="Brief furniture">
      <Sub title="BriefItem: tones, button, link, static, trailing buttons">
        <BriefCard icon="bell" title="Needs a look" count={TONES.length}>
          <BriefList>
            {TONES.map((t) => (
              <BriefItem key={t} tone={t} icon="circle-alert" title={"A " + t + " row"} detail="What about it, in a muted line"
                onClick={() => setHits((n) => n + 1)} action="Look" />
            ))}
            <BriefItem icon="link" title="A link row" detail="Opens the page" href="#brief" action="Open" />
            <BriefItem icon="file" mono title="backup-2026-10-14.tar.zst" detail="1.2 GB">
              <Button size="xs" variant="outline">Restore</Button>
            </BriefItem>
          </BriefList>
        </BriefCard>
        <p style={{ color: "var(--fg-3)", fontSize: 12 }}>Presses: {hits}</p>
      </Sub>
      <Sub title="BriefItem: tags, a wrapping detail, a block below">
        <BriefCard icon="sliders-horizontal" title="Rules">
          <BriefList>
            <BriefItem icon="activity" title="CPU load" tags={<Pill tone="muted">per core</Pill>} wrapDetail
              detail="Warns above 80%, critical above 95%, once it holds for 30 s, clears after 60 s below 75%."
              below={<Input size="sm" wide type="number" aria-label="Warn at" defaultValue={80} />}>
              <Button size="xs" variant="outline">Edit</Button>
            </BriefItem>
          </BriefList>
        </BriefCard>
      </Sub>
      <Sub title="BriefEmpty: ok and neutral, and a node as the body">
        <BriefCard icon="bell" title="Alerts">
          <BriefEmpty icon="circle-check" title="No active alerts" body="Everything is running clean right now." />
        </BriefCard>
        <BriefCard icon="history" title="Activity">
          <BriefEmpty tone="neutral" title="No recent activity" body="Actions will show up here." />
        </BriefCard>
        <BriefCard icon="folder" title="Backups">
          <BriefEmpty tone="neutral" icon="archive" title="No backups yet">
            <Button size="xs" variant="outline">Back up now</Button>
          </BriefEmpty>
        </BriefCard>
      </Sub>
      <Sub title="FactList">
        <BriefCard icon="info" title="Unit">
          <FactList rows={[
            { label: "State", value: "active", tone: "ok" },
            { label: "Unit", value: "kgsm-assistant-with-a-very-long-name-that-has-to-wrap-inside-the-card.service", mono: true },
            { label: "Socket", value: "idle", hint: "An idle socket unit is waiting for its first connection." },
            { label: "Restarts", value: "3", tone: "warn" },
            false,
          ]} />
        </BriefCard>
      </Sub>
    </Section>
  );
}
