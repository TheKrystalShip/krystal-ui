import { Kbd, Cluster } from "@thekrystalship/krystal";
import { Section, Sub } from "../kit.jsx";

export default function KbdSection() {
  return (
    <Section id="kbd" title="Kbd">
      <Sub title="A key, md and sm">
        <Cluster gap="sm">
          <Kbd>Esc</Kbd><Kbd>Enter</Kbd><Kbd>K</Kbd><Kbd size="sm">Esc</Kbd><Kbd size="sm">K</Kbd>
        </Cluster>
      </Sub>
      <Sub title="A chord, md and sm, a custom separator">
        <Cluster gap="md">
          <Kbd keys={["Ctrl", "K"]} />
          <Kbd keys={["Ctrl", "Shift", "P"]} />
          <Kbd keys={["Ctrl", "K"]} size="sm" />
          <Kbd keys={["g", "h"]} separator="then" />
        </Cluster>
      </Sub>
      <Sub title="In a sentence">
        <p style={{ margin: 0 }}>Press <Kbd keys={["Ctrl", "K"]} size="sm" /> to search, <Kbd size="sm">Esc</Kbd> to close.</p>
      </Sub>
    </Section>
  );
}
