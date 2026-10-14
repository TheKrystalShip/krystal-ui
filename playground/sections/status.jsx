import { StatusDot } from "@thekrystalship/krystal";
import { Section, Sub, row } from "../kit.jsx";

const TONES = ["neutral", "ok", "warn", "danger", "info", "accent"];

export default function StatusSection() {
  return (
    <Section id="status" title="StatusDot">
      <Sub title="Tones">
        <div style={row}>
          {TONES.map((t) => (
            <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12 }}>
              <StatusDot tone={t} label={t} /> {t}
            </span>
          ))}
        </div>
      </Sub>
      <Sub title="Sizes and pulse">
        <div style={row}>
          <StatusDot tone="ok" size="sm" label="Small" />
          <StatusDot tone="ok" label="Medium" />
          <StatusDot tone="ok" size="lg" label="Large" />
          <StatusDot tone="ok" pulse label="Live" />
          <StatusDot tone="warn" size="lg" pulse label="Working" />
        </div>
      </Sub>
      <Sub title="With a caption">
        <div style={row}>
          <StatusDot tone="ok" label="Live" caption="live" />
          <StatusDot tone="danger" label="No signal" caption="3m ago" />
          <StatusDot tone="ok" pulse label="Online" caption="Online" captionSide="end" />
          <StatusDot tone="neutral" label="Offline" caption="Offline" captionSide="end" />
        </div>
      </Sub>
    </Section>
  );
}
