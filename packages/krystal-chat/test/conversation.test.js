import { describe, expect, it, vi } from "vitest";
import {
  NEW_CHAT_TITLE, adoptServerConversation, answersText, conversationTitle, mergeServerConversations,
  questionMessage, reduceTurnFrame, scaffoldConversation, scaffoldHistory, scaffoldLiveTurn, settleProposal,
  toolLabel, waitingProposal,
} from "../src/chat/conversation.js";

const bubble = (extra) => ({ role: "assistant", content: "", ...extra });
const run = (messages, frames, profile) => frames.reduce((m, f) => reduceTurnFrame(m, f, profile), messages);

describe("reduceTurnFrame", () => {
  it("appends text and thinking deltas to the live bubble", () => {
    const out = run([{ role: "user", content: "hi" }, bubble()], [
      { type: "text.delta", text: "Hel" }, { type: "text.delta", text: "lo" },
      { type: "thinking.delta", text: "hmm" },
    ]);
    expect(out[1]).toMatchObject({ content: "Hello", thinking: "hmm" });
  });

  it("changes nothing when the last entry is not an assistant bubble", () => {
    const messages = [{ role: "user", content: "hi" }];
    expect(reduceTurnFrame(messages, { type: "text.delta", text: "x" })).toBe(messages);
  });

  it("marks a turn queued behind another, and clears the wait on the next frame", () => {
    let out = run([bubble()], [{ type: "turn.started", queuedBehind: "t0", ahead: 2 }]);
    expect(out[0].waiting).toBe(2);
    out = run(out, [{ type: "text.delta", text: "go" }]);
    expect(out[0].waiting).toBeUndefined();
    expect(out[0].content).toBe("go");
  });

  it("shows compaction by stage and ends it on the next frame of another kind", () => {
    let out = run([bubble()], [{ type: "context.compacting", stage: "summarizing" }]);
    expect(out[0].compacting).toBe("summarizing");
    out = run([bubble()], [{ type: "context.compacting", stage: "clearing" }]);
    expect(out[0].compacting).toBe("clearing");
    out = run(out, [{ type: "text.delta", text: "x" }]);
    expect(out[0].compacting).toBeUndefined();
  });

  it("runs a tool from start to result, labelling it from the frame, else from its name", () => {
    const out = run([bubble()], [
      { type: "tool.start", id: "1", tool: "list_servers", label: "Listing servers" },
      { type: "tool.start", id: "2", tool: "get_status" },
      { type: "tool.result", id: "1", tool: "list_servers", summary: "3 servers" },
    ]);
    expect(out[0].tools).toEqual([
      { id: "1", label: "Listing servers", state: "done", summary: "3 servers" },
      { id: "2", label: "Get status", state: "pending" },
    ]);
  });

  it("accepts a tool.result with no tool.start", () => {
    const out = run([bubble()], [{ type: "tool.result", id: "9", tool: "ask", summary: "s" }]);
    expect(out[0].tools).toEqual([]);
  });

  it("holds a card back until done, then moves it below the answer", () => {
    const profile = { ...{ adaptCard: (r) => ({ kind: "card", tool: r.tool }), proposalLabel: (v) => v, proposal: () => ({}), verdict: () => ({}) } };
    let out = run([bubble()], [
      { type: "tool.start", id: "1", tool: "t" },
      { type: "tool.result", id: "1", tool: "t", summary: "s", result: { tool: "t" } },
      { type: "text.delta", text: "answer" },
    ], profile);
    expect(out[0].cards).toBeUndefined();
    expect(out[0].pendingCards).toEqual([{ kind: "card", tool: "t" }]);
    out = run(out, [{ type: "done", text: "answer", completedAt: "2026-10-14T10:00:00Z", turnId: 12, usage: { in: 1 } }], profile);
    expect(out[0].cards).toEqual([{ kind: "card", tool: "t" }]);
    expect(out[0].pendingCards).toBeUndefined();
    expect(out[0]).toMatchObject({ content: "answer", turnId: 12, usage: { in: 1 }, ts: Date.parse("2026-10-14T10:00:00Z") });
  });

  it("takes the memory the assistant wrote or forgot as a note, never as a product's card", () => {
    const adaptCard = vi.fn(() => ({ kind: "card" }));
    const profile = { adaptCard, proposalLabel: (v) => v, proposal: () => ({}), verdict: () => ({}) };
    const out = run([bubble()], [
      { type: "tool.result", id: "1", tool: "remember", summary: "Remembered", result: { kind: "memory", action: "remembered", key: "drink", summary: "Prefers tea." } },
      { type: "tool.result", id: "2", tool: "forget", summary: "Forgotten", result: { kind: "memory", action: "forgotten", key: "old", summary: "Likes coffee." } },
      { type: "done", text: "ok" },
    ], profile);
    expect(out[0].memories).toEqual([
      { action: "remembered", key: "drink", summary: "Prefers tea." },
      { action: "forgotten", key: "old", summary: "Likes coffee." },
    ]);
    expect(out[0].cards).toBeUndefined();
    expect(adaptCard).not.toHaveBeenCalled();
  });

  it("falls back to the summary alone for a tool whose result the product draws no card for", () => {
    const out = run([bubble()], [
      { type: "tool.start", id: "1", tool: "novel" },
      { type: "tool.result", id: "1", tool: "novel", summary: "did it", result: { shape: "unknown" } },
      { type: "done", text: "ok" },
    ]);
    expect(out[0].cards).toBeUndefined();
    expect(out[0].tools[0].summary).toBe("did it");
  });

  it("keys a stepping tool's progress by key or by call and words, checking earlier steps off", () => {
    const out = run([bubble()], [
      { type: "progress", id: "1", label: "Draft" },
      { type: "progress", id: "1", label: "Verify" },
      { type: "progress", id: "1", label: "Draft" },
    ]);
    expect(out[0].steps.map((s) => [s.label, s.status])).toEqual([["Draft", "active"], ["Verify", "done"]]);
    const keyed = run([bubble()], [
      { type: "progress", key: "a", label: "One" },
      { type: "progress", key: "a", label: "One again" },
    ]);
    expect(keyed[0].steps).toEqual([{ key: "a", label: "One again", status: "active" }]);
  });

  it("checks off active steps when the turn errors or ends", () => {
    const stepping = [{ type: "progress", id: "1", label: "Draft" }];
    expect(run([bubble()], [...stepping, { type: "done", text: "ok" }])[0].steps[0].status).toBe("done");
    const errored = run([bubble({ content: "partial" })], [...stepping, { type: "error", code: "assistant_failed", message: "No model." }]);
    expect(errored[0]).toMatchObject({ error: true, errorText: "No model.", content: "partial" });
    expect(errored[0].steps[0].status).toBe("done");
  });

  it("states a default reason when an error frame carries none", () => {
    expect(run([bubble()], [{ type: "error" }])[0].errorText).toBe("The assistant failed.");
  });

  it("places a proposal before the live bubble, as the card a stored conversation restates", () => {
    const frame = {
      type: "proposal", id: "p1", tool: "restart", handle: "a".repeat(32), verb: "restart_server",
      subject: "factorio", target: "Factorio", summary: "Restart Factorio?", expiresAt: "2026-10-14T11:00:00Z",
    };
    const out = run([{ role: "user", content: "restart it" }, bubble()], [frame]);
    expect(out.map((m) => m.role)).toEqual(["user", "command", "assistant"]);
    expect(out[1]).toMatchObject({
      verb: "restart_server", token: "a".repeat(32), summary: "Restart Factorio?", confirm: "Restart Factorio?", state: "proposed",
    });
    const { cmdId: _a, ...live } = out[1];
    const { cmdId: _b, ...stored } = waitingProposal({
      verb: frame.verb, subject: frame.subject, target: frame.target, summary: frame.summary, handle: frame.handle, expiresAt: frame.expiresAt,
    });
    expect(live).toEqual(stored);
  });

  it("places questions before the bubble and keeps them and proposals ahead of the answer at done", () => {
    const out = run([{ role: "user", content: "?" }, bubble()], [
      { type: "question", id: "q", questions: [{ question: "Which?", options: [{ label: "A" }, { label: "B" }] }] },
      { type: "proposal", handle: "h", verb: "v" },
      { type: "done", text: "Choose." },
    ]);
    expect(out.map((m) => m.role)).toEqual(["user", "assistant", "question", "command"]);
    expect(out[1].content).toBe("Choose.");
  });

  it("ignores a frame it does not know", () => {
    const start = [bubble({ content: "x" })];
    const out = reduceTurnFrame(start, { type: "future.frame", seq: 3 });
    expect(out[0]).toEqual(start[0]);
  });

  it("supersedes an earlier open blueprint draft when a new one is proposed", () => {
    const earlier = { role: "command", verb: "blueprint", bpState: "proposed", token: "t1" };
    const out = run([earlier, bubble()], [{ type: "command.proposed", verb: "blueprint", token: "t2", id: 1 }]);
    expect(out[0].bpState).toBe("superseded");
    expect(out[1]).toMatchObject({ verb: "blueprint", bpState: "proposed", token: "t2" });
  });
});

describe("settleProposal", () => {
  const card = () => waitingProposal({ verb: "restart_server", handle: "h1", subject: "s", target: "Factorio" });

  it("marks a declined or expired proposal as that, with no outcome row", () => {
    const messages = [card()];
    expect(settleProposal(messages, "h1", { status: "declined" })[0].state).toBe("declined");
    expect(settleProposal(messages, "h1", { status: "expired" })[0].state).toBe("expired");
    expect(settleProposal(messages, "h1", { status: "declined" })).toHaveLength(1);
  });

  it("marks a confirmed one and puts the outcome beside it once", () => {
    const out = settleProposal([card()], "h1", { status: "confirmed", result: "Restarted.", at: 5 });
    expect(out.map((m) => m.role)).toEqual(["command", "verify"]);
    expect(out[0].state).toBe("confirmed");
    expect(out[1].result).toMatchObject({ ok: true, headline: "Restarted." });
    const again = settleProposal(out, "h1", { status: "confirmed", result: "Restarted." });
    expect(again).toHaveLength(2);
  });

  it("records a failed confirmation as an unsuccessful outcome", () => {
    const out = settleProposal([card()], "h1", { status: "failed", result: "Port busy." });
    expect(out[1].result.ok).toBe(false);
  });

  it("returns the messages as they were for an unknown handle or no resolution", () => {
    const messages = [card()];
    expect(settleProposal(messages, "nope", { status: "declined" })).toBe(messages);
    expect(settleProposal(messages, "h1", null)).toBe(messages);
  });
});

describe("scaffoldHistory and scaffoldConversation", () => {
  const entry = (extra, turn) => ({
    kind: "turn", createdAt: "2026-10-14T10:00:02Z", startedAt: "2026-10-14T10:00:00Z", recordId: 41,
    turn: { prompt: "hi", final: "hello", outcome: "ok", ...turn }, ...extra,
  });

  it("rebuilds what a turn wrote to the person's memory from its calls' cards", () => {
    const out = scaffoldHistory([entry({}, { tools: [
      { tool: "remember", summary: "Remembered", card: { kind: "memory", action: "remembered", key: "drink", summary: "Prefers tea." } },
      { tool: "recall", summary: "'drink': Prefers tea." },
    ] })]);
    expect(out[1].memories).toEqual([{ action: "remembered", key: "drink", summary: "Prefers tea." }]);
    expect(out[1].cards).toBeUndefined();
  });

  it("rebuilds a prompt and its reply with the record id, timing and verdict", () => {
    const out = scaffoldHistory([entry({ feedback: { rating: "up", note: "good" } })]);
    expect(out[0]).toMatchObject({ role: "user", content: "hi", ts: Date.parse("2026-10-14T10:00:00Z") });
    expect(out[1]).toMatchObject({
      role: "assistant", content: "hello", turnId: 41, feedback: { rating: "up", note: "good" },
      startedAt: Date.parse("2026-10-14T10:00:00Z"), endedAt: Date.parse("2026-10-14T10:00:02Z"),
    });
  });

  it("draws a checkpoint, skips empty entries and tolerates a non-array", () => {
    expect(scaffoldHistory(undefined)).toEqual([]);
    const out = scaffoldHistory([null, { kind: "checkpoint", createdAt: "x" }, { kind: "turn" }]);
    expect(out).toHaveLength(1);
    expect(out[0].role).toBe("checkpoint");
  });

  it("marks a turn that never completed as failed", () => {
    const out = scaffoldHistory([entry({}, { final: "", outcome: "error" })]);
    expect(out[1]).toMatchObject({ error: true });
  });

  it("rebuilds tools as done rows and leaves out the question tool, which is drawn as a question", () => {
    const out = scaffoldHistory([entry({}, {
      tools: [
        { tool: "list_servers", summary: "3" },
        { tool: "ask_question", arguments: { questions: [{ question: "Which?", options: [{ label: "A" }] }] } },
      ],
    })]);
    expect(out[1].tools).toEqual([{ id: "h0_0", label: "List servers", state: "done", summary: "3" }]);
    const q = out.find((m) => m.role === "question");
    expect(q).toMatchObject({ state: "open" });
    expect(q.questions[0]).toMatchObject({ question: "Which?", multiple: false, custom: true });
  });

  it("opens only the last turn's question; an earlier one is asked, not open", () => {
    const asking = (n) => entry({}, { final: "", tools: [{ tool: "ask_question", arguments: { questions: [{ question: "Q" + n, options: [] }] } }] });
    const out = scaffoldHistory([asking(1), asking(2)]);
    expect(out.filter((m) => m.role === "question").map((m) => m.state)).toEqual(["asked", "open"]);
    expect(out.filter((m) => m.role === "assistant")).toHaveLength(0);
  });

  it("restates a waiting proposal, settles a resolved one and expires a lapsed one", () => {
    const tool = (confirmation) => ({ tool: "restart", summary: "s", confirmation });
    const waiting = { verb: "v", handle: "w", summary: "Go?", expiresAt: "2999-01-01T00:00:00Z" };
    const lapsed = { verb: "v", handle: "l", summary: "Go?", expiresAt: "2000-01-01T00:00:00Z" };
    const done = { verb: "v", handle: "d", summary: "Go?", resolution: { status: "confirmed", result: "Ran." } };
    const out = scaffoldHistory([entry({}, { tools: [tool(waiting), tool(lapsed), tool(done)] })]);
    const states = Object.fromEntries(out.filter((m) => m.role === "command").map((m) => [m.token, m.state]));
    expect(states).toEqual({ w: "proposed", l: "expired", d: "confirmed" });
    expect(out.some((m) => m.role === "verify")).toBe(true);
  });

  it("puts a conversation's pending proposals at the end", () => {
    const out = scaffoldConversation({
      entries: [entry({})],
      pending: [{ verb: "blueprint", token: "t", subject: { id: "s", resource: "server" } }],
    });
    expect(out.map((m) => m.role)).toEqual(["user", "assistant", "command"]);
    expect(out[2]).toMatchObject({ verb: "blueprint", token: "t", subjectId: "s" });
  });

  it("passes a stored card through the profile", () => {
    const profile = { adaptCard: (r) => ({ shown: r.tool }), proposalLabel: (v) => v, proposal: () => ({}), verdict: () => ({}) };
    const out = scaffoldHistory([entry({}, { tools: [{ tool: "t", card: { tool: "t" } }] })], profile);
    expect(out[1].cards).toEqual([{ shown: "t" }]);
  });
});

describe("scaffoldLiveTurn", () => {
  it("replaces the live turn with the snapshot and keeps what came before", () => {
    const messages = [
      { role: "user", content: "old" }, { role: "assistant", content: "older" },
      { role: "user", content: "now", live: true }, { role: "assistant", content: "par", live: true, startedAt: 99 },
    ];
    const out = scaffoldLiveTurn(messages, {
      state: "running", prompt: "now", text: "partial answer",
      tools: [{ id: "1", name: "list_servers", state: "done", summary: "3" }, { id: "2", name: "get_status", state: "running" }],
    });
    expect(out).toHaveLength(4);
    expect(out[3]).toMatchObject({ live: true, content: "partial answer", startedAt: 99 });
    expect(out[3].tools.map((t) => t.state)).toEqual(["done", "pending"]);
    expect(out.filter((m) => m.live)).toHaveLength(2);
  });
});

describe("the conversation list", () => {
  it("never leaves a conversation without a title", () => {
    expect(conversationTitle({})).toBe(NEW_CHAT_TITLE);
    expect(conversationTitle({ title: "Hello" })).toBe("Hello");
    expect(adoptServerConversation({ id: "a", title: "" }).title).toBe(NEW_CHAT_TITLE);
  });

  it("adopts an unknown conversation with its transcript not yet loaded", () => {
    expect(adoptServerConversation({
      id: "a", title: "T", createdAt: "2026-10-14T09:00:00Z", lastActivityAt: "2026-10-14T10:00:00Z", turnCount: 3, think: true,
    }, "walter")).toMatchObject({ id: "a", title: "T", turns: 3, think: true, hostId: "walter", remote: true, loaded: false, messages: [] });
  });

  it("lets the assistant's name, time, switch and count overwrite, and marks a grown conversation stale", () => {
    const local = [{ id: "a", title: "mine", messages: [{ role: "user" }], lastActivity: 1, turns: 2, think: false, loaded: true }];
    const out = mergeServerConversations(local, [
      { id: "a", title: "theirs", lastActivityAt: "2026-10-14T10:00:00Z", turnCount: 4, think: true },
    ], "walter");
    expect(out[0]).toMatchObject({
      title: "theirs", lastActivity: Date.parse("2026-10-14T10:00:00Z"), turns: 4, think: true, stale: true, hostId: "walter", loaded: true,
    });
    expect(out[0].messages).toHaveLength(1);
  });

  it("does not mark stale when the count is the same, and keeps a host already set", () => {
    const local = [{ id: "a", title: "t", messages: [], turns: 2, hostId: "jessie" }];
    const out = mergeServerConversations(local, [{ id: "a", title: "t", turnCount: 2 }], "walter");
    expect(out[0].stale).toBeUndefined();
    expect(out[0].hostId).toBe("jessie");
  });

  it("adds the unknown, orders newest activity first, and returns the list untouched for an empty answer", () => {
    const local = [{ id: "a", title: "A", messages: [], lastActivity: 10 }];
    const out = mergeServerConversations(local, [
      { id: "b", title: "B", lastActivityAt: "2026-10-14T10:00:00Z" },
      null,
      { title: "no id" },
    ]);
    expect(out.map((c) => c.id)).toEqual(["b", "a"]);
    expect(mergeServerConversations(local, [])).toBe(local);
    expect(mergeServerConversations(local, undefined)).toBe(local);
  });
});

describe("small helpers", () => {
  it("toolLabel prefers the frame's label, then reads the name", () => {
    expect(toolLabel("get_status", "Checking")).toBe("Checking");
    expect(toolLabel("get_status")).toBe("Get status");
    expect(toolLabel(undefined)).toBe("Working");
  });

  it("answersText states each answer on one line under its header, else its question", () => {
    expect(answersText([
      { header: "Game", question: "Which game?", labels: ["Factorio"], text: " and  more " },
      { question: "Why?", labels: [], text: "because" },
    ])).toBe("Answers: Game: Factorio, and more; Why?: because");
    expect(answersText([])).toBe("");
    expect(answersText(undefined)).toBe("");
  });

  it("questionMessage normalises options and defaults", () => {
    const m = questionMessage({ questions: [{ question: "Q", options: [{ label: "A", description: "d" }], multiple: true, custom: false }] });
    expect(m.state).toBe("open");
    expect(m.questions[0]).toEqual({ question: "Q", header: null, options: [{ label: "A", description: "d" }], multiple: true, custom: false });
  });
});
