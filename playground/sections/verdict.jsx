import { useState } from "react";
import { Verdict, Cluster } from "@thekrystalship/krystal";
import { Section, Sub } from "../kit.jsx";

function Held({ start, ...props }) {
  const [value, setValue] = useState(start);
  return <Verdict label="Your verdict" value={value} onChange={setValue} {...props} />;
}

export default function VerdictSection() {
  return (
    <Section id="verdict" title="Verdict">
      <Sub title="Unlit, liked, disliked (press to change)">
        <Cluster gap="md">
          <Held start={0} />
          <Held start={1} />
          <Held start={-1} />
        </Cluster>
      </Sub>
      <Sub title="Not known, disabled">
        <Cluster gap="md">
          <Verdict label="Not known" />
          <Verdict label="Disabled" value={1} disabled />
        </Cluster>
      </Sub>
      <Sub title="Sizes xs to xl">
        <Cluster gap="md">
          {["xs", "sm", "md", "lg", "xl"].map((size) => <Held key={size} start={1} size={size} />)}
        </Cluster>
      </Sub>
      <Sub title="grow: fills a cell, the options split it">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxWidth: 360 }}>
          <Held start={1} size="xl" grow />
          <Held start={0} size="xl" grow />
        </div>
      </Sub>
      <Sub title="onArt: over artwork">
        <div style={{ display: "flex", gap: 12, padding: 16, maxWidth: 360, background: "linear-gradient(160deg, #3a5a7a, #14202e 70%)", borderRadius: "var(--r-sm)" }}>
          <Held start={0} onArt />
          <Held start={1} onArt />
          <Held start={-1} onArt />
        </div>
      </Sub>
      <Sub title="Own words">
        <Held start={0} likeLabel="Good" likedLabel="Found good" dislikeLabel="Bad" dislikedLabel="Found bad" />
      </Sub>
    </Section>
  );
}
