import { Button, IconButton, Tooltip } from "@thekrystalship/krystal";
import { Section, Sub, row } from "../kit.jsx";

export default function TooltipSection() {
  return (
    <Section id="tooltip" title="Tooltip">
      <Sub title="IconButton labels (hover or focus)">
        <div style={row}>
          <IconButton icon="settings" label="Settings" />
          <IconButton variant="ghost" icon="trash-2" label="Delete" tone="danger" />
          <IconButton variant="secondary" icon="refresh-cw" label="Refresh" size="sm" />
          <IconButton icon="info" label="Suppressed" title="" />
        </div>
      </Sub>
      <Sub title="Around any element, with a placement">
        <div style={{ ...row, padding: "40px 80px", gap: 24 }}>
          {["top", "bottom", "left", "right"].map((p) => (
            <Tooltip key={p} label={"Placed " + p} placement={p}>
              <Button variant="outline" size="sm">{p}</Button>
            </Tooltip>
          ))}
          <Tooltip label="A longer line of help that wraps once it passes the tooltip's maximum width, and stays text only." delay={150}>
            <Button variant="secondary" size="sm">Long, short delay</Button>
          </Tooltip>
        </div>
      </Sub>
      <Sub title="Escape hides it; a press hides it; touch never shows it">
        <div style={row}>
          <Tooltip label="Press Escape"><Button variant="link">Focus me with Tab</Button></Tooltip>
        </div>
      </Sub>
    </Section>
  );
}
