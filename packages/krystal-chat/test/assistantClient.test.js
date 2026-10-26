import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAssistantClient } from "@thekrystalship/krystal-chat/lib/assistantClient";

const jwt = (expSeconds) => "h." + btoa(JSON.stringify({ exp: expSeconds })).replace(/=+$/, "") + ".s";
const fresh = () => jwt(Math.floor(Date.now() / 1000) + 3600);
const expired = () => jwt(Math.floor(Date.now() / 1000) - 60);

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

/** An SSE response whose body holds `frames`, each `{ type, seq, ... }`, then ends (or errors). */
function sse(frames, { drop = false } = {}) {
  const enc = new TextEncoder();
  const text = frames.map((f) => "event: " + f.type + (f.seq != null ? "\nid: " + f.seq : "") + "\ndata: " + JSON.stringify(f) + "\n\n").join("");
  // One chunk, then the end or a transport error once it has been read.
  const body = new ReadableStream({
    start(controller) { controller.enqueue(enc.encode(text)); },
    pull(controller) {
      if (drop) controller.error(new TypeError("network error")); else controller.close();
    },
  });
  return new Response(body, { status: 200, headers: { "Content-Type": "text/event-stream" } });
}

const bearerOf = (call) => call[1].headers.Authorization;

let fetchMock;
beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("assistant client: the person's clock", () => {
  it("names the browser's time zone on every call", async () => {
    const client = createAssistantClient({ baseUrl: "/a", getToken: () => fresh() });
    fetchMock.mockResolvedValue(json(200, { conversations: [] }));
    await client.conversations();
    expect(fetchMock.mock.calls[0][1].headers["X-Time-Zone"]).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
  });

  it("sends no zone where the browser names none", async () => {
    vi.spyOn(Intl, "DateTimeFormat").mockImplementation(() => ({ resolvedOptions: () => ({}) }));
    const client = createAssistantClient({ baseUrl: "/a", getToken: () => fresh() });
    fetchMock.mockResolvedValue(json(200, { conversations: [] }));
    await client.conversations();
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty("X-Time-Zone");
    vi.restoreAllMocks();
  });
});

describe("assistant client: a call that may be sent twice", () => {
  it("renews once on a 401 and sends again with the new bearer", async () => {
    const renewToken = vi.fn().mockResolvedValue("renewed");
    const client = createAssistantClient({ baseUrl: "/a", getToken: () => fresh(), renewToken });
    fetchMock
      .mockResolvedValueOnce(json(401, { error: "expired", code: "unauthorized" }))
      .mockResolvedValueOnce(json(200, { conversations: [{ id: "c1" }] }));
    expect(await client.conversations()).toEqual([{ id: "c1" }]);
    expect(renewToken).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(bearerOf(fetchMock.mock.calls[1])).toBe("Bearer renewed");
  });

  it("does not renew a second time when the renewed bearer is refused as well", async () => {
    const renewToken = vi.fn().mockResolvedValue("renewed");
    const client = createAssistantClient({ baseUrl: "/a", getToken: () => fresh(), renewToken });
    fetchMock.mockResolvedValue(json(401, { error: "no", code: "unauthorized" }));
    await expect(client.conversations()).rejects.toMatchObject({ status: 401, envCode: "unauthorized" });
    expect(renewToken).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reports a 401 as one when there is no renewToken", async () => {
    const client = createAssistantClient({ baseUrl: "/a", getToken: () => fresh() });
    fetchMock.mockResolvedValue(json(401, { error: "Sign in.", code: "unauthorized" }));
    await expect(client.conversations()).rejects.toMatchObject({ status: 401, userMessage: "Sign in." });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("renews a lapsed bearer before sending, so the lapsed one is never sent", async () => {
    const renewToken = vi.fn().mockResolvedValue("renewed");
    const client = createAssistantClient({ baseUrl: "/a", getToken: () => expired(), renewToken });
    fetchMock.mockResolvedValue(json(200, { tools: [] }));
    await client.tools();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(bearerOf(fetchMock.mock.calls[0])).toBe("Bearer renewed");
  });

  it("is signed out, without a request, when there is no bearer and nothing to renew with", async () => {
    const client = createAssistantClient({ baseUrl: "/a", getToken: () => null });
    await expect(client.conversations()).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not ask to renew when canRenew says it is not worth it", async () => {
    const renewToken = vi.fn();
    const client = createAssistantClient({ baseUrl: "/a", getToken: () => fresh(), renewToken, canRenew: () => false });
    fetchMock.mockResolvedValue(json(401, { error: "no" }));
    await expect(client.conversations()).rejects.toMatchObject({ status: 401 });
    expect(renewToken).not.toHaveBeenCalled();
  });

  it("reports an unreachable assistant with code ECONNREFUSED", async () => {
    const client = createAssistantClient({ baseUrl: "/a", getToken: () => fresh() });
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    await expect(client.conversations()).rejects.toMatchObject({ code: "ECONNREFUSED", userMessage: "Can't reach the assistant." });
  });

  it("hands a wrapped list over as an array, and an empty one when the body has none", async () => {
    const client = createAssistantClient({ baseUrl: () => "/a/", getToken: () => fresh() });
    fetchMock.mockResolvedValueOnce(json(200, {})).mockResolvedValueOnce(json(200, { commands: [{ name: "help" }] }));
    expect(await client.conversations()).toEqual([]);
    expect(await client.commands()).toEqual([{ name: "help" }]);
    expect(fetchMock.mock.calls[0][0]).toBe("/a/conversations");
  });
});

describe("assistant client: a call that must not be sent twice", () => {
  const once = {
    "runCommand": (c) => c.runCommand("think", { argument: "on" }),
    "stopTurn": (c) => c.stopTurn("t1"),
    "confirm": (c) => c.confirm({ token: "h".repeat(32) }),
    "turn": (c) => c.turn({ prompt: "hi" }),
  };

  for (const [name, run] of Object.entries(once)) {
    it(name + " is sent once and a 401 is reported, never renewed and resent", async () => {
      const renewToken = vi.fn().mockResolvedValue("renewed");
      const client = createAssistantClient({ baseUrl: "/a", getToken: () => fresh(), renewToken });
      fetchMock.mockResolvedValue(json(401, { error: "no", code: "unauthorized" }));
      await expect(run(client)).rejects.toMatchObject({ status: 401 });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(renewToken).not.toHaveBeenCalled();
    });

    it(name + " renews a lapsed bearer before it is spent", async () => {
      const renewToken = vi.fn().mockResolvedValue("renewed");
      const client = createAssistantClient({ baseUrl: "/a", getToken: () => expired(), renewToken });
      fetchMock.mockResolvedValue(json(401, { error: "no" }));
      await expect(run(client)).rejects.toBeTruthy();
      expect(renewToken).toHaveBeenCalledTimes(1);
      expect(bearerOf(fetchMock.mock.calls[0])).toBe("Bearer renewed");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  }
});

describe("assistant client: the turn stream", () => {
  const frames = (type, text, seq) => ({ type, text, seq });

  it("delivers frames in order and ends on done", async () => {
    const client = createAssistantClient({ baseUrl: "/a", getToken: () => fresh() });
    fetchMock.mockResolvedValue(sse([
      { type: "turn.started", seq: 1, turnId: "t1", conversationId: "c" },
      frames("text.delta", "Hel", 2), frames("text.delta", "lo", 3),
      { type: "done", seq: 4, text: "Hello", turnId: 7 },
    ]));
    const got = [];
    await client.turn({ prompt: "hi", conversationId: "c" }, { onEvent: (f) => got.push(f.type) });
    expect(got).toEqual(["turn.started", "text.delta", "text.delta", "done"]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/a/turn");
    expect(init.headers.Accept).toBe("text/event-stream");
    const sent = JSON.parse(init.body);
    expect(sent.prompt).toBe("hi");
    expect(typeof sent.messageId).toBe("string");
  });

  it("sends the prompt once, picks the turn up after the last seq when the stream drops, and delivers each frame once", async () => {
    const client = createAssistantClient({ baseUrl: "/a", getToken: () => fresh() });
    fetchMock
      .mockResolvedValueOnce(sse([
        { type: "turn.started", seq: 1, turnId: "t 1", conversationId: "c" },
        frames("text.delta", "Hel", 2),
      ], { drop: true }))
      .mockResolvedValueOnce(sse([
        frames("text.delta", "Hel", 2),
        frames("text.delta", "lo", 3),
        { type: "done", seq: 4, text: "Hello", turnId: 7 },
      ]));
    const got = [];
    await client.turn({ prompt: "hi" }, { onEvent: (f) => got.push(f.seq) });
    expect(got).toEqual([1, 2, 3, 4]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("/a/turn");
    expect(fetchMock.mock.calls[0][1].method).toBe("POST");
    expect(fetchMock.mock.calls[1][0]).toBe("/a/turns/t%201/events?after=2");
    expect(fetchMock.mock.calls[1][1].method).toBeUndefined();
  });

  it("never sends the prompt again when the connection fails before any frame", async () => {
    const client = createAssistantClient({ baseUrl: "/a", getToken: () => fresh() });
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    // Not following a turn yet, so the reconnect is the same POST with the same messageId: the
    // assistant treats it as one turn.
    const run = client.turn({ prompt: "hi", messageId: "m-1" });
    const outcome = run.then(() => "done", (e) => e);
    await vi.waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(1), { timeout: 2000 });
    for (const c of fetchMock.mock.calls) expect(JSON.parse(c[1].body).messageId).toBe("m-1");
    void outcome;
  });

  it("ends with an AbortError when the turn was cancelled", async () => {
    const client = createAssistantClient({ baseUrl: "/a", getToken: () => fresh() });
    fetchMock.mockResolvedValue(sse([
      { type: "turn.started", seq: 1, turnId: "t1" },
      { type: "error", seq: 2, code: "cancelled", message: "Stopped." },
    ]));
    const got = [];
    await expect(client.turn({ prompt: "hi" }, { onEvent: (f) => got.push(f.type) })).rejects.toMatchObject({ name: "AbortError" });
    expect(got).toEqual(["turn.started"]);
  });

  it("delivers a failed turn's error frame and resolves", async () => {
    const client = createAssistantClient({ baseUrl: "/a", getToken: () => fresh() });
    fetchMock.mockResolvedValue(sse([
      { type: "turn.started", seq: 1, turnId: "t1" },
      { type: "error", seq: 2, code: "assistant_failed", message: "No model." },
    ]));
    const got = [];
    await client.turn({ prompt: "hi" }, { onEvent: (f) => got.push(f) });
    expect(got[1]).toMatchObject({ type: "error", message: "No model." });
  });

  it("throws the refusal before the first byte with its code and sentence", async () => {
    const client = createAssistantClient({ baseUrl: "/a", getToken: () => fresh() });
    fetchMock.mockResolvedValue(json(409, { error: "Too many waiting.", code: "queue-full" }));
    await expect(client.turn({ prompt: "hi" })).rejects.toMatchObject({
      status: 409, envCode: "queue-full", userMessage: "Too many waiting.",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports a turn the assistant no longer holds as a network error when picking it up", async () => {
    const client = createAssistantClient({ baseUrl: "/a", getToken: () => fresh() });
    fetchMock.mockResolvedValue(json(404, { error: "Unknown turn.", code: "turn-unknown" }));
    await expect(client.follow("t9", { after: 5 })).rejects.toMatchObject({ code: "ECONNREFUSED" });
    expect(fetchMock.mock.calls[0][0]).toBe("/a/turns/t9/events?after=5");
  });

  it("ignores unknown frames and keep-alive comments", async () => {
    const client = createAssistantClient({ baseUrl: "/a", getToken: () => fresh() });
    const enc = new TextEncoder();
    fetchMock.mockResolvedValue(new Response(new ReadableStream({
      start(c) {
        c.enqueue(enc.encode(": keepalive\n\n"));
        c.enqueue(enc.encode('data: {"type":"future.frame","seq":1,"x":1}\n\n'));
        c.enqueue(enc.encode('data: {"type":"done","seq":2,"text":"ok"}\n\n'));
        c.close();
      },
    }), { status: 200 }));
    const got = [];
    await client.turn({ prompt: "hi" }, { onEvent: (f) => got.push(f.type) });
    expect(got).toEqual(["future.frame", "done"]);
  });
});

describe("assistant client: confirm", () => {
  it("posts the handle as a decision and returns the terminal result, passing progress along", async () => {
    const client = createAssistantClient({ baseUrl: "/a", getToken: () => fresh() });
    fetchMock.mockResolvedValue(sse([
      { type: "progress", label: "Working" },
      { type: "result", status: "confirmed", success: true, text: "Done." },
    ]));
    const progress = [];
    const result = await client.confirm({ token: "ab".repeat(16), decision: "decline" }, { onProgress: (p) => progress.push(p.label) });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ handle: "ab".repeat(16), decision: "decline" });
    expect(progress).toEqual(["Working"]);
    expect(result).toMatchObject({ status: "confirmed", success: true });
  });

  it("fails with the stream's own message, and when the stream ends with no result", async () => {
    const client = createAssistantClient({ baseUrl: "/a", getToken: () => fresh() });
    fetchMock.mockResolvedValueOnce(sse([{ type: "error", message: "Refused." }]));
    await expect(client.confirm({ token: "x" })).rejects.toMatchObject({ userMessage: "Refused." });
    fetchMock.mockResolvedValueOnce(sse([]));
    await expect(client.confirm({ token: "x" })).rejects.toMatchObject({ userMessage: expect.stringContaining("without a result") });
  });

  it("surfaces a handle's refusal codes", async () => {
    const client = createAssistantClient({ baseUrl: "/a", getToken: () => fresh() });
    fetchMock.mockResolvedValue(json(410, { error: "That lapsed.", code: "confirmation-expired" }));
    await expect(client.confirm({ token: "x" })).rejects.toMatchObject({ status: 410, envCode: "confirmation-expired" });
  });
});

describe("assistant client: speech", () => {
  it("scans a window of PCM and reads the outcome, renewing a refused bearer", async () => {
    const renewToken = vi.fn().mockResolvedValue("renewed");
    const client = createAssistantClient({ baseUrl: "/a", getToken: () => fresh(), renewToken });
    fetchMock
      .mockResolvedValueOnce(json(401, { error: "expired", code: "unauthorized" }))
      .mockResolvedValueOnce(json(200, { outcome: "ok", text: "hey assistant", tokens: [] }));
    const pcm = new Int16Array(16000).buffer;
    expect(await client.scan(pcm)).toEqual({ outcome: "ok", text: "hey assistant", tokens: [] });
    expect(fetchMock.mock.calls[1][0]).toBe("/a/speech/scan");
    expect(fetchMock.mock.calls[1][1].headers["Content-Type"]).toBe("application/octet-stream");
  });

  it("says a line and answers the audio, or refuses with the assistant's words", async () => {
    const client = createAssistantClient({ baseUrl: "/a", getToken: () => fresh() });
    fetchMock.mockResolvedValueOnce(new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "Content-Type": "audio/wav" } }));
    const blob = await client.say("Your potatoes are done.");
    expect(blob.size).toBe(3);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ text: "Your potatoes are done.", format: "wav" });
    fetchMock.mockResolvedValueOnce(json(503, { error: "Nothing can speak.", code: "speech-unavailable" }));
    await expect(client.say("Hello")).rejects.toMatchObject({ status: 503, envCode: "speech-unavailable" });
  });
});
