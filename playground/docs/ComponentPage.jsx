// One component's page: what it is for, its live examples, its generated props, and how it is used
// from the keyboard and a screen reader.
import React from "react";
import api from "../generated/api.json";
import { OnPage } from "../kit.jsx";
import { ApiBlock } from "./ApiBlock.jsx";
import { Behaviour } from "./Behaviour.jsx";
import { EXAMPLES } from "./examples.jsx";

export function ComponentPage({ page }) {
  const entries = page.exports.filter((n) => api[n]).map((n) => [n, api[n]]);
  const packages = [...new Set(entries.map(([, e]) => e.package))];
  const files = [...new Map(entries.filter(([, e]) => e.header).map(([, e]) => [e.file, e.header])).entries()]
    .map(([file, text]) => ({ file, text }));
  return (
    <article>
      <header className="pg-head">
        <p className="pg-eyebrow">{page.group}</p>
        <h1>{page.name}</h1>
        <p className="pg-summary">{page.summary}</p>
        {page.versus && <p className="pg-versus"><strong>Versus its neighbours.</strong> {page.versus}</p>}
        <p className="pg-dim">From {packages.map((p, i) => <React.Fragment key={p}>{i > 0 && ", "}<code className="pg-code">{p}</code></React.Fragment>)}.</p>
      </header>
      {page.examples.length > 0 && (
        <section className="pg-section" aria-labelledby="pg-examples">
          <h2 id="pg-examples">Examples</h2>
          <OnPage.Provider value>
            {page.examples.map((key) => {
              const Example = EXAMPLES[key];
              return <div key={key} className="pg-examples" data-example={key}><Example /></div>;
            })}
          </OnPage.Provider>
        </section>
      )}
      <section className="pg-section" aria-labelledby="pg-props">
        <h2 id="pg-props">API</h2>
        {entries.map(([name, entry]) => <ApiBlock key={name} name={name} entry={entry} />)}
      </section>
      <Behaviour id={page.id} headers={files} />
    </article>
  );
}
