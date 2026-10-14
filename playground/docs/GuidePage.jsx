// A guide: a Markdown file of docs/ drawn through the chat's renderer, so the file reads the same
// outside the playground. The file's first line is the page's title.
import React from "react";
import { renderMarkdown } from "@thekrystalship/krystal-chat";

// The renderer draws a heading one level down from its level, and the page's own title is the h1,
// so every heading goes back up two levels.
function promote(nodes) {
  return React.Children.map(nodes, (node) => {
    const match = React.isValidElement(node) && /^h([3-6])$/.exec(String(node.type));
    if (!match || node.props.className !== "k-chat-md__h") return node;
    return React.createElement("h" + (match[1] - 2), node.props);
  });
}

const BLOCK_START = /^(#{1,6}\s|[-*+]\s|\d+[.)]\s|>|\||```|~~~)/;

// A paragraph or a list item written over several lines is one line to the renderer, which would
// otherwise break the line where the source file does.
function unwrap(markdown) {
  const out = [];
  let fenced = false;
  let flowing = false;
  for (const line of markdown.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) { fenced = !fenced; flowing = false; out.push(line); continue; }
    if (fenced) { out.push(line); continue; }
    const text = line.trim();
    const continues = flowing && text && !BLOCK_START.test(text) && (!/^\s/.test(line) || /^\s{2,}\S/.test(line));
    if (continues) out[out.length - 1] += " " + text;
    else out.push(line);
    flowing = Boolean(text) && !/^(#{1,6}\s|\||>)/.test(text);
  }
  return out.join("\n");
}

export function GuidePage({ source, eyebrow }) {
  const [, title, body] = /^# (.*)\n([\s\S]*)$/.exec(source) ?? [null, "", source];
  return (
    <article>
      <header className="pg-head">
        <p className="pg-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </header>
      <div className="pg-prose">{promote(renderMarkdown(unwrap(body)))}</div>
    </article>
  );
}
