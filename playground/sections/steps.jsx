import React from "react";
import { Steps } from "@thekrystalship/krystal";
import { Section, Sub } from "../kit.jsx";

const QUESTIONS = [
  { value: 1, label: "What wakes it?", detail: "server.crashed" },
  { value: 2, label: "Who is it about?", detail: "The server in the event" },
  { value: 3, label: "What does it check?", detail: "Nothing yet" },
  { value: 4, label: "What does it say?" },
  { value: 5, label: "Name the rule" },
];
const TOUR = [
  { value: 0, label: "Welcome" }, { value: 1, label: "Servers" }, { value: 2, label: "Console" }, { value: 3, label: "Backups" },
];

export default function StepsSection() {
  const [at, setAt] = React.useState(3);
  const [step, setStep] = React.useState(1);
  return (
    <Section id="steps" title="Steps">
      <Sub title="Rail: numbered, answered steps filled, the current one marked">
        <div style={{ maxWidth: 280 }}>
          <Steps label="Questions" variant="rail" value={at} onChange={setAt}
            steps={QUESTIONS.map((q) => ({ ...q, done: q.value < at && q.detail != null }))} />
        </div>
      </Sub>
      <Sub title={"Dots: the current one long; step " + step}>
        <Steps label="Tour steps" variant="dots" value={step} onChange={setStep} steps={TOUR} />
      </Sub>
    </Section>
  );
}
