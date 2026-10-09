// The conversation, as data: what each frame of the assistant's turn stream does to the transcript,
// how a stored conversation is rebuilt into one, and how this browser's list of conversations is
// reconciled with the assistant's. Pure functions, no React.
//
// The vocabulary is the assistant wire contract's (`tks-assistant/docs/wire-contract.md`): `text.delta`,
// `tool.start`, `tool.result`, `proposal`, `question`, `done` and the rest. An assistant that
// proposes through `command.proposed` is read as well. What a product shows for a tool's result or
// names a proposed action is the product's, passed in as a `profile`:
//
//   adaptCard(result)    → a card to show under the answer, or null. `tool.result` frames and stored
//                          turns carry a structured `result`; a product that renders none returns null.
//   proposalLabel(verb)  → the words a proposed action is offered with, when the frame carries no
//                          `confirm` sentence of its own.

const NO_PROFILE = {
  adaptCard: () => null,
  proposalLabel: (verb) => (verb || "Run").replace(/_/g, " "),
  proposal: (msg) => ({
    meta: { label: (msg.verb || "Run").replace(/_/g, " ") },
    targetName: msg.target || msg.subject || msg.subjectId || "",
  }),
  verdict: (msg, targetName, resp) => ({
    ok: !!(resp && resp.success), headline: (resp && resp.text) || "", lines: [],
  }),
};

// What a conversation with nothing said in it is called.
//
// The assistant names every conversation it holds, including this one — `title` on a listing row is
// never null. This covers the one conversation the assistant has no opinion on yet: the row this
// browser mints between pressing New chat and the assistant answering. It has to be the assistant's
// word, which is why the wire contract states the string rather than leaving each side to pick one.
const NEW_CHAT_TITLE = "New chat";

// What to put on a conversation row. One helper rather than a fallback repeated at each render, so
// there is one answer to "what is this chat called".
function conversationTitle(convo) {
  return (convo && convo.title) || NEW_CHAT_TITLE;
}

// ---------- persistence ----------
// This browser's copy of the conversation list, under a key the site chooses. It is a cache of what
// the assistant holds, which is the record.
function loadConversations(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch { /* storage refused or unreadable */ }
  return [];
}
function saveConversations(key, convos) {
  try { localStorage.setItem(key, JSON.stringify(convos)); } catch { /* storage refused */ }
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// The label a tool shows while it runs arrives ON the frame, from the tool's own catalog entry — the
// assistant owns its tools, so it owns what they are called. A frame with no label gets the raw name
// made readable.
function toolLabel(tool, label) {
  if (label) return label;
  if (!tool) return "Working";
  return tool.charAt(0).toUpperCase() + tool.slice(1).replace(/_/g, " ");
}

// Cards gathered from tool.result frames ride on `bubble.pendingCards` while the assistant is still
// streaming its answer, then move to `bubble.cards` when the turn ends (done/error/dropped). The card
// stays hidden until the streamed text is complete, so the thread reads top-to-bottom (answer, then
// evidence) instead of the card popping in above the growing text.
function promotePendingCards(bubble) {
  if (!bubble || !bubble.pendingCards || !bubble.pendingCards.length) return bubble;
  const { pendingCards, ...rest } = bubble;
  return { ...rest, cards: (bubble.cards || []).concat(pendingCards) };
}

// The wait the context's compaction puts the answer in ends with the next frame of any other kind.
function withoutCompacting(bubble) {
  if (!bubble.compacting) return bubble;
  const { compacting, ...rest } = bubble;
  return rest;
}

// ---------- proposals ----------
// An action a tool proposed and left waiting on the person: the `proposal` frame of a live turn, and
// the `confirmation` a stored turn's tool carries. Both name the action the same way — `verb`,
// `subject`, `target`, `summary`, `expiresAt` — and the `handle` that redeems it, held as `token`.
function waitingProposal(ev) {
  return {
    role: "command",
    cmdId: uid(),
    verb: ev.verb,
    subject: ev.subject || "",
    target: ev.target || "",
    summary: ev.summary || "",
    confirm: ev.summary || null,
    token: ev.handle || null,
    expiresAt: ev.expiresAt || null,
    state: "proposed",
  };
}

// Where a proposal stands once it has ended, as the transcript shows it: declined and expired are
// states of the card itself, and an action that ran (or tried to) is the card plus its outcome. The
// outcome is the product's `verdict` over `{ success, status, text }`.
function settleProposal(messages, handle, resolution, profile = NO_PROFILE) {
  const at = messages.findIndex(m => m.role === "command" && m.token === handle);
  if (at < 0 || !resolution) return messages;
  const card = messages[at];
  const status = resolution.status;
  const out = messages.slice();
  if (status === "declined" || status === "expired") {
    out[at] = { ...card, state: status };
    return out;
  }
  out[at] = { ...card, state: "confirmed" };
  if (messages.some(m => m.role === "verify" && m.cmdId === card.cmdId)) return out;
  const p = profile.proposal(card);
  out.splice(at + 1, 0, {
    role: "verify",
    id: uid(),
    cmdId: card.cmdId,
    action: { label: p.meta.label, verb: card.verb, serverName: p.targetName },
    state: "done",
    result: profile.verdict(card, p.targetName, {
      success: status === "confirmed", status, text: resolution.result || "",
    }),
    at: resolution.at,
  });
  return out;
}

// ---------- questions ----------
// The assistant's own tool for asking, by the name its turns record it under.
const ASK_QUESTION = "ask_question";

// Questions the assistant put to the person. `state` is `open` while the person may still answer, and
// `answered` once they have; the thread draws one that is no longer the last word as plain text.
function questionMessage(ev, state = "open") {
  return {
    role: "question",
    id: ev.id != null ? ev.id : uid(),
    state,
    questions: (Array.isArray(ev.questions) ? ev.questions : []).map(q => ({
      question: q.question || "",
      header: q.header || null,
      options: (Array.isArray(q.options) ? q.options : []).map(o => ({
        label: o.label || "", description: o.description || null,
      })),
      multiple: q.multiple === true,
      custom: q.custom !== false,
    })),
  };
}

// The answers as the assistant reads them in the person's message: one line, the question's header
// (else its text), then what was picked and what was written.
function answersText(answers) {
  const parts = (answers || []).map(a => {
    const said = [...(a.labels || []), a.text].filter(s => s && String(s).trim()).map(s => String(s).replace(/\s+/g, " ").trim());
    return (a.header || a.question) + ": " + said.join(", ");
  });
  return parts.length ? "Answers: " + parts.join("; ") : "";
}

// ---------- the turn stream ----------
function reduceTurnFrame(messages, ev, profile = NO_PROFILE) {
  const msgs = messages.slice();
  const lastIdx = msgs.length - 1;
  const bubble = msgs[lastIdx];
  if (!bubble || bubble.role !== "assistant") return messages;
  switch (ev.type) {
    case "text.delta":
      msgs[lastIdx] = { ...withoutCompacting(bubble), content: (bubble.content || "") + (ev.text || "") };
      break;
    case "thinking.delta":
      msgs[lastIdx] = { ...withoutCompacting(bubble), thinking: (bubble.thinking || "") + (ev.text || "") };
      break;
    case "context.compacting":
      // The context is being reduced to fit the window; `summarizing` is the stage that can take
      // seconds. The next frame of any other kind ends the wait.
      msgs[lastIdx] = { ...bubble, compacting: ev.stage === "summarizing" ? "summarizing" : "clearing" };
      break;
    case "tool.start": {
      const startTools = (bubble.tools || []).concat({ id: ev.id, label: toolLabel(ev.tool, ev.label), state: "pending" });
      msgs[lastIdx] = { ...withoutCompacting(bubble), tools: startTools };
      break;
    }
    case "progress": {
      // A long-running tool narrates its own sub-steps before its tool.result lands. A step is keyed by
      // `key` when the frame carries one, else by the call and the words, since a frame names no step
      // otherwise. A fresh key is appended as "active" after every OTHER active step is checked off
      // "done", which is what gives the live check-them-off effect. A repeat of the same key (a repair
      // loop re-entering a step) re-activates it in place rather than duplicating the row.
      const key = ev.key != null ? ev.key : (ev.id != null ? ev.id + ":" : "") + (ev.label || "");
      const prevSteps = bubble.steps || [];
      const steps = prevSteps.map(s => s.status === "active" ? { ...s, status: "done" } : s);
      const idx = steps.findIndex(s => s.key === key);
      const entry = { key, label: ev.label || "", status: "active" };
      if (idx >= 0) steps[idx] = entry; else steps.push(entry);
      msgs[lastIdx] = { ...bubble, steps };
      break;
    }
    case "tool.result": {
      const resTools = (bubble.tools || []).slice();
      for (let k = resTools.length - 1; k >= 0; k--) {
        if (resTools[k].id === ev.id && resTools[k].state === "pending") {
          resTools[k] = { ...resTools[k], state: "done", summary: ev.summary || "" };
          break;
        }
      }
      let next = { ...bubble, tools: resTools };
      // Progress steps carry no id to match against ev.id, so the stepping tool's own result is what
      // checks off whatever is still active (normally just the last step).
      if (bubble.steps && bubble.steps.length && ev.result && ev.result.tool === "create_blueprint") {
        next = { ...next, steps: bubble.steps.map(s => s.status === "active" ? { ...s, status: "done" } : s) };
      }
      if (ev.result) {
        const card = profile.adaptCard(ev.result);
        // Hold the card back until the turn finishes streaming (see promotePendingCards).
        if (card) next = { ...next, pendingCards: (bubble.pendingCards || []).concat(card) };
      }
      msgs[lastIdx] = next;
      break;
    }
    case "error": {
      // A turn-ending error strands any still-active progress steps — check them off so the stepper
      // doesn't sit spinning forever. Whatever the answer had already said stays; the reason is
      // carried beside it, for the answer to state under that text.
      let base = withoutCompacting(bubble);
      if (bubble.steps && bubble.steps.some(s => s.status === "active")) {
        base = { ...base, steps: bubble.steps.map(s => s.status === "active" ? { ...s, status: "done" } : s) };
      }
      const errored = {
        ...base, error: true, errorText: ev.message || "The assistant failed.", endedAt: Date.now(),
      };
      msgs[lastIdx] = promotePendingCards(errored);
      break;
    }
    case "command.proposed":
      // A new draft (an initial one or a refinement) supersedes any earlier draft still open for
      // review — that older card's token and content are stale, so it is retired to a read-only
      // "superseded" state rather than left as a second live editor that could also be saved. Only
      // editable ("proposed") drafts are retired; one mid-finalize ("verifying") is left alone.
      if (ev.verb === "blueprint") {
        for (let k = 0; k < msgs.length; k++) {
          if (msgs[k].role === "command" && msgs[k].verb === "blueprint" && msgs[k].bpState === "proposed")
            msgs[k] = { ...msgs[k], bpState: "superseded" };
        }
      }
      msgs.splice(lastIdx, 0, proposalMessage(ev, profile));
      break;
    case "proposal":
      // An action a tool proposed and left waiting on the person. Held with the same shape a stored
      // conversation restates it in, so the card reads the same live and after a reload.
      msgs.splice(lastIdx, 0, waitingProposal(ev));
      break;
    case "question":
      msgs.splice(lastIdx, 0, questionMessage(ev));
      break;
    case "done": {
      let done = { ...withoutCompacting(bubble), endedAt: Date.now() };
      // The turn ended without every progress step's owning tool.result arriving in band (a dropped
      // frame) — check off whatever is still active.
      if (bubble.steps && bubble.steps.some(s => s.status === "active")) {
        done = { ...done, steps: bubble.steps.map(s => s.status === "active" ? { ...s, status: "done" } : s) };
      }
      if (ev.text) done = { ...done, content: ev.text };
      if (ev.usage) done = { ...done, usage: ev.usage };
      // The id the assistant recorded this turn under, so the answer can be rated the moment it lands
      // rather than only after a reload. 0/absent means the turn was not persisted and is not
      // addressable.
      if (ev.turnId) done = { ...done, turnId: ev.turnId };
      if (ev.completedAt) done = { ...done, ts: Date.parse(ev.completedAt) || undefined };
      // Streaming is over — reveal the cards below the finished answer.
      msgs[lastIdx] = promotePendingCards(done);
      let start = lastIdx;
      while (start > 0 && (msgs[start - 1].role === "command" || msgs[start - 1].role === "question")) start--;
      if (start < lastIdx) {
        const bub = msgs[lastIdx];
        const cards = msgs.slice(start, lastIdx);
        msgs.splice(start, lastIdx - start + 1, bub, ...cards);
      }
      break;
    }
    default:
      break;
  }
  return msgs;
}

// ---------- conversation history rebuild ----------
// One proposal card, built the same way whether the frame arrived live on the turn that staged it or
// was restated by a conversation load while it was still waiting.
//
// Built in ONE place on purpose. A restated proposal that rendered even slightly differently from a
// live one would be a second answer to "what is this action", and the surface most likely to see the
// restated form is the one arriving via a notification — the surface with the least context.
function proposalMessage(ev, profile = NO_PROFILE) {
  return {
    role: "command",
    // A conversation-unique correlation handle minted here rather than the frame's id: the
    // assistant's command.proposed id is a per-turn counter that restarts each turn, so two drafts in
    // one conversation collide on it. The id is only ever used here, to correlate proposed with its
    // outcome (redeeming authorizes with the token, never the id), so a fresh uid keeps each card's
    // patches scoped to that card.
    cmdId: uid(),
    verb: ev.verb,
    subjectId: ev.subject ? ev.subject.id : null,
    subjectResource: (ev.subject && ev.subject.resource) || "server",
    // A name the person asked the result to be given, when the action makes something new.
    instanceName: ev.instanceName || null,
    confirm: ev.confirm || (profile.proposalLabel(ev.verb) + "?"),
    reason: ev.reason || null,
    // A file the action writes carries a { path, proposedContent } preview, so the card can show the
    // exact change before it is accepted; null for every other verb.
    file: ev.file || null,
    // The confirmation token that redeems the action, and a draft's starting content.
    token: ev.token || null,
    draftYaml: ev.configValue ?? null,
    // A draft card is a small state machine (proposed → verifying → verified|failed, looping back to
    // proposed when a repair runs out); the surface patches bpState onto this message as its save
    // round-trip resolves. It starts at the review checkpoint.
    bpState: ev.verb === "blueprint" ? "proposed" : undefined,
    state: "proposed",
  };
}

function scaffoldHistory(entries, profile = NO_PROFILE) {
  const out = [];
  if (!Array.isArray(entries)) return out;
  entries.forEach((e, ei) => {
    if (!e) return;
    if (e.kind === "checkpoint") {
      out.push({ role: "checkpoint", label: "Conversation compacted to save context", at: e.createdAt });
      return;
    }
    const t = e.turn;
    if (!t) return;
    const userMsg = { role: "user", content: t.prompt || "" };
    if (e.startedAt) userMsg.ts = Date.parse(e.startedAt) || undefined;
    out.push(userMsg);
    const bubble = { role: "assistant", content: t.final || "", ts: Date.parse(e.createdAt) || undefined };
    // How long the answer took, as the assistant recorded it: from the prompt arriving to the entry
    // being written.
    const started = Date.parse(e.startedAt);
    if (started && bubble.ts) { bubble.startedAt = started; bubble.endedAt = bubble.ts; }
    // The turn's durable id and the verdict already on it. History is the bulk of any corpus, so
    // without these a replayed answer could never be rated — only the newest one could.
    const recorded = e.recordId || e.turnId;
    if (recorded) bubble.turnId = recorded;
    if (e.feedback && e.feedback.rating) {
      bubble.feedback = { rating: e.feedback.rating, note: e.feedback.note || null };
    }
    if (t.thinking) bubble.thinking = t.thinking;
    if (t.usage) bubble.usage = t.usage;
    // A question the assistant asked is drawn as a question, not as a tool it used; the call that
    // asked it is the turn's last word when nothing follows it.
    const calls = Array.isArray(t.tools) ? t.tools : [];
    const used = calls.filter(tl => tl && tl.tool !== ASK_QUESTION);
    const tools = used.map((tl, ti) => ({ id: "h" + ei + "_" + ti, label: toolLabel(tl.tool, tl.label), state: "done", summary: tl.summary || "" }));
    if (tools.length) bubble.tools = tools;
    const cards = used
      .map(tl => { const card = tl.card || tl.result; return card ? profile.adaptCard(card) : null; })
      .filter(Boolean);
    if (cards.length) bubble.cards = cards;
    if (!t.final && t.outcome && t.outcome !== "ok") { bubble.error = true; bubble.errorText = "This turn didn’t complete."; }
    const asked = calls.filter(tl => tl && tl.tool === ASK_QUESTION && tl.arguments && Array.isArray(tl.arguments.questions));
    // An answerless turn that only asked has nothing of its own to draw.
    const blank = !bubble.content && !bubble.thinking && !tools.length && !cards.length && !bubble.error;
    if (!(asked.length && blank)) out.push(bubble);
    asked.forEach(tl => out.push(questionMessage(
      { id: "h" + ei, questions: tl.arguments.questions }, ei === entries.length - 1 ? "open" : "asked")));
    used.forEach(tl => {
      const c = tl.confirmation;
      if (!c) return;
      out.push(waitingProposal(c));
      const waiting = out[out.length - 1];
      // What became of it rides on the confirmation, or beside it on the tool.
      const resolution = c.resolution || tl.resolution;
      if (resolution) {
        const settled = settleProposal(out, c.handle, resolution, profile);
        out.length = 0;
        out.push(...settled);
      } else if (c.expiresAt && Date.parse(c.expiresAt) <= Date.now()) {
        waiting.state = "expired";
      }
    });
  });
  return out;
}

// The transcript, plus whatever is still awaiting approval in it.
//
// The proposals go at the END rather than beside the turn that staged them: the assistant reports them
// as the conversation's outstanding set, not as part of any turn's record, and a conversation runs one
// turn at a time — so the last thing said is the thing they belong to. Placing them anywhere else
// would mean inventing an association the assistant never stated.
function scaffoldConversation(data, profile = NO_PROFILE) {
  const out = scaffoldHistory(data && data.entries, profile);
  const pending = (data && data.pending) || [];
  for (const ev of pending) out.push(proposalMessage(ev, profile));
  return out;
}

function latestUsage(messages) {
  if (!Array.isArray(messages)) return null;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m && m.role === "assistant" && m.usage) return m.usage;
  }
  return null;
}

// Render a turn from a `turn.attach` snapshot — the state of a turn this surface did not watch from
// the start, or one it has just been redrawn with after falling behind.
//
// The snapshot REPLACES whatever this surface was rendering for the live turn rather than being merged
// into it: it is the assistant's own account of that turn, and reconciling two partial views is how a
// duplicated tool row or a doubled sentence gets in. Everything before the live turn is untouched.
function scaffoldLiveTurn(messages, attach, profile = NO_PROFILE) {
  const settled = messages.filter(m => !m.live);
  // When the turn began. The bubble this surface put up as it sent the prompt holds the moment it was
  // sent; a running snapshot with nothing in it yet is a turn starting now; any other snapshot joins a
  // turn part-way or one still queued, and its start is not known here.
  const prior = messages.find(m => m.live && m.role === "assistant");
  const empty = !attach.text && !attach.thinking && !(attach.tools && attach.tools.length);
  const startedAt = (prior && prior.startedAt) || (empty && attach.state === "running" ? Date.now() : undefined);
  const tools = (attach.tools || []).map(t => ({
    id: t.id,
    label: toolLabel(t.name, t.label),
    state: t.state === "done" ? "done" : "pending",
    summary: t.summary || "",
  }));
  const cards = (attach.tools || [])
    .map(t => (t.card ? profile.adaptCard(t.card) : null))
    .filter(Boolean);

  const bubble = {
    role: "assistant",
    live: true,
    startedAt,
    content: attach.text || "",
    thinking: attach.thinking || undefined,
    tools: tools.length ? tools : undefined,
    // Cards are held back until the turn finishes, exactly as a watched turn holds them — so a
    // mirrored turn and a first-hand one reach their final shape through the same step.
    pendingCards: cards.length ? cards : undefined,
  };

  return [
    ...settled,
    { role: "user", content: attach.prompt || "", live: true },
    bubble,
  ];
}

// One conversation as the ASSISTANT states it, turned into a row this surface holds. The listing path
// and the create path (`/new` answers with the row it made) both come through here, so a chat adopted
// the moment it is started and the same chat read back later are the same object — including its
// name, which is the assistant's either way.
//
// `loaded: false` marks the transcript as not yet fetched, which is true of both: a fresh chat has no
// transcript and a listed one has not been read.
function adoptServerConversation(s, hostId) {
  return {
    id: s.id,
    title: s.title || NEW_CHAT_TITLE,
    messages: [],
    created: Date.parse(s.createdAt) || 0,
    lastActivity: Date.parse(s.lastActivityAt) || 0,
    turns: typeof s.turnCount === "number" ? s.turnCount : undefined,
    think: typeof s.think === "boolean" ? s.think : undefined,
    autorun: typeof s.autorun === "boolean" ? s.autorun : undefined,
    hostId,
    remote: true,
    loaded: false,
  };
}

function mergeServerConversations(local, serverList, hostId) {
  if (!Array.isArray(serverList) || serverList.length === 0) return local;
  const byId = new Map(local.map(c => [c.id, c]));
  const merged = local.slice();
  for (const s of serverList) {
    if (!s || !s.id) continue;
    const existing = byId.get(s.id);
    if (existing) {
      const patch = {};
      // The NAME overwrites, like the switches below and for the same reason: the assistant is what
      // names a conversation, and what is held here is only ever a record of what it last said.
      if (s.title) patch.title = s.title;
      if (!existing.hostId) patch.hostId = hostId;
      // When it was last spoken in OVERWRITES: the assistant holds every surface's turns, and this
      // browser only ever saw its own. A conversation carried on from a phone is stale here by
      // exactly the amount that matters to anything ordering by it.
      const touched = Date.parse(s.lastActivityAt);
      if (touched) patch.lastActivity = touched;
      // The switches OVERWRITE, where everything else above only fills a gap: they are the
      // assistant's, any surface may have moved them since this browser last looked, and what is
      // cached here is only ever a record of what they were.
      if (typeof s.think === "boolean") patch.think = s.think;
      if (typeof s.autorun === "boolean") patch.autorun = s.autorun;
      // The turn count is how a re-read of the listing notices that a conversation grew while this
      // surface was not watching — a stream that was down, or a device only just opened. A transcript
      // is refetched because it demonstrably has more turns in it, never merely because a stream
      // reconnected.
      if (typeof s.turnCount === "number") {
        patch.turns = s.turnCount;
        if (typeof existing.turns === "number" && s.turnCount > existing.turns) patch.stale = true;
      }
      if (Object.keys(patch).length) merged[merged.indexOf(existing)] = { ...existing, ...patch };
    } else {
      merged.push(adoptServerConversation(s, hostId));
    }
  }
  merged.sort((a, b) => (b.lastActivity || b.created || 0) - (a.lastActivity || a.created || 0));
  return merged;
}

export {
  NEW_CHAT_TITLE, conversationTitle,
  loadConversations, saveConversations,
  uid, toolLabel, promotePendingCards, reduceTurnFrame, proposalMessage, waitingProposal, settleProposal,
  questionMessage, answersText,
  scaffoldHistory, scaffoldConversation, scaffoldLiveTurn, latestUsage,
  adoptServerConversation, mergeServerConversations,
};
