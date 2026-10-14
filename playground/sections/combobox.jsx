import React from "react";
import { Combobox, Field } from "@thekrystalship/krystal";
import { Section, Sub, col } from "../kit.jsx";

const GAMES = [
  { value: "factorio", label: "Factorio", detail: "native" },
  { value: "terraria", label: "Terraria", detail: "native" },
  { value: "minecraft", label: "Minecraft", detail: "java" },
  { value: "palworld", label: "Palworld", detail: "steam" },
  { value: "valheim", label: "Valheim", detail: "steam" },
  { value: "necesse", label: "Necesse", detail: "disabled", disabled: true },
  { value: "satisfactory", label: "Satisfactory", detail: "steam" },
  { value: "zomboid", label: "Project Zomboid", detail: "steam" },
];

const REMOTE = ["Alder", "Aspen", "Beech", "Birch", "Cedar", "Cypress", "Elm", "Fir", "Hazel", "Larch", "Maple", "Oak", "Pine", "Rowan", "Spruce", "Willow", "Yew"];

export default function ComboboxSection() {
  const [game, setGame] = React.useState("terraria");
  const [none, setNone] = React.useState(null);
  const [q, setQ] = React.useState("");
  const [remote, setRemote] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [hits, setHits] = React.useState([]);
  React.useEffect(() => {
    if (!q) { setHits([]); setBusy(false); return undefined; }
    setBusy(true);
    const t = setTimeout(() => {
      setHits(REMOTE.filter((n) => n.toLowerCase().includes(q.toLowerCase())).map((n) => ({ value: n, label: n })));
      setBusy(false);
    }, 450);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <Section id="combobox" title="Combobox">
      <Sub title="Chosen value (controlled), detail, a disabled option">
        <div style={col}>
          <Field label="Game"><Combobox wide options={GAMES} value={game} onChange={setGame} placeholder="Choose a game" /></Field>
          <span>value: <code>{String(game)}</code></span>
        </div>
      </Sub>
      <Sub title="Empty, with a placeholder; sizes sm md lg; invalid; disabled">
        <div style={col}>
          <Combobox wide options={GAMES} value={none} onChange={setNone} placeholder="Nothing chosen" empty="No game by that name" />
          {["sm", "md", "lg"].map((s) => <Combobox key={s} wide size={s} options={GAMES} placeholder={"size " + s} />)}
          <Combobox wide invalid options={GAMES} placeholder="invalid" />
          <Combobox wide disabled aria-label="Disabled game" options={GAMES} defaultValue="factorio" />
        </div>
      </Sub>
      <Sub title="A server search: the caller owns the text, filter is false, loading shows">
        <div style={col}>
          <Combobox wide options={hits} value={remote} onChange={setRemote} inputValue={q} onInputChange={setQ}
            filter={false} loading={busy} placeholder="Search trees" empty={q ? "No trees match" : "Type to search"} />
          <span>value: <code>{String(remote)}</code></span>
        </div>
      </Sub>
    </Section>
  );
}
