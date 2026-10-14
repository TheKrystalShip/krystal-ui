import React from "react";
import { Button, SearchField } from "@thekrystalship/krystal";
import { Section, Sub } from "../kit.jsx";

export default function SearchFieldSection() {
  const [q, setQ] = React.useState("");
  const [last, setLast] = React.useState("none yet");
  const [name, setName] = React.useState("");
  return (
    <Section id="search-field" title="SearchField">
      <Sub title={"lg and xl; submitted: " + last}>
        <div style={{ display: "grid", gap: 12, maxWidth: 640 }}>
          <SearchField value={q} onChange={setQ} onSubmit={setLast} placeholder="A film that is not out yet" submitLabel="Find it" />
          <SearchField size="xl" value={q} onChange={setQ} onSubmit={setLast} placeholder="Any movie or show" />
        </div>
      </Sub>
      <Sub title="A naming field: another icon, a Cancel before the submit, held while empty">
        <div style={{ maxWidth: 640 }}>
          <SearchField icon="list" value={name} onChange={setName} onSubmit={setLast} placeholder="List name" submitLabel="Create"
            submitDisabled={!name.trim()} actions={<Button variant="outline" size="lg" onClick={() => setName("")}>Cancel</Button>} />
        </div>
      </Sub>
      <Sub title="Busy and disabled">
        <div style={{ display: "grid", gap: 12, maxWidth: 640 }}>
          <SearchField value="dune" busy placeholder="Search" />
          <SearchField disabled placeholder="Offline" />
        </div>
      </Sub>
    </Section>
  );
}
