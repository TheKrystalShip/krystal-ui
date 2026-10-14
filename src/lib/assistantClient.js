// createAssistantClient — a browser client of one assistant, over the assistant wire contract
// (`tks-assistant/docs/wire-contract.md`): the turn stream, the confirm channel, the conversation event
// stream, conversations and their feedback, the command surface and the tool list, memory, Web Push,
// speech, review across people, and the files a person attaches to a message. Imports nothing but
// `lib/sse`, so code that runs outside a browser can load it (`@thekrystalship/krystal-ui/lib/assistantClient`).
//
//   const client = createAssistantClient({ baseUrl: "/assistant", getToken: () => session.token() });
//
// `baseUrl` is the assistant's address, or a function answering it, asked on every call: a site that
// resolves the address as it goes throws its own error from it when there is none. `getToken` answers
// the bearer to send, or null when nobody is signed in; the client holds no credential of its own.
//
// `renewToken()` (optional) answers a fresh bearer, or null when the session cannot be renewed, and
// `canRenew()` (optional) says whether asking is worth it. With them the client renews as the call
// allows:
//
//  - a call that may be sent twice (a read, a soft delete, a compact, a feedback vote, a memory write,
//    a transcription, an attachment read) is sent with the bearer held and, refused 401, renewed once
//    and sent again. A bearer whose JWT `exp` has passed is not sent at all: it is renewed first.
//  - a call that must not be (a turn, which would spend the prompt twice; a confirmation, whose handle
//    is single-use; a command, which may toggle; a stop, which could reach the next turn; an upload)
//    is never sent again. A lapsed bearer is renewed before it instead.
//
// Without `renewToken`, a 401 is reported as one, for the site to send somebody to sign in.
//
// Every failure is an Error carrying `code` and `status` (the HTTP status, or "ECONNREFUSED" when the
// assistant could not be reached), `envCode` (the refusal's own `code`, as `queue-full`) and
// `userMessage`, a sentence a surface can show as it stands. The lists the contract wraps
// (`{ conversations }`, `{ commands }`, `{ tools }`, `{ memories }`, `{ turns }`) are handed over as
// arrays.

import { parseSseEvent, readSseStream } from "./sse.js";

// A confirm stream may sit silent through a long action; well over the assistant's 15s heartbeat.
const IDLE_MS = 60000;

// How long to wait before each attempt to pick a turn up again after its stream dropped. The turn goes
// on without the reader, and the assistant keeps its frames for ten minutes, so the wait is for the
// network to come back, not for the turn.
const RESUME_DELAYS_MS = [300, 700, 1500, 3000, 5000, 8000];

/**
 * @param {number} status
 * @param {any} body
 * @returns {import("../chat/types.js").AssistantError}
 */
function failure(status, body) {
  const env = (body && body.error) || {};
  const message = typeof env === "string" ? env : (env.message || (body && body.message));
  const e = /** @type {import("../chat/types.js").AssistantError} */ (new Error(message || "HTTP " + status));
  e.code = status;
  e.status = status;
  e.envCode = (typeof env === "object" && env.code) || (body && body.code) || null;
  e.userMessage = message || "The assistant returned an error.";
  return e;
}
/** @returns {import("../chat/types.js").AssistantError} */
function unreachable() {
  const e = /** @type {import("../chat/types.js").AssistantError} */ (new Error("Can't reach the assistant (network)."));
  e.code = "ECONNREFUSED";
  e.userMessage = "Can't reach the assistant.";
  return e;
}
/** @returns {import("../chat/types.js").AssistantError} */
function signedOut() {
  const e = /** @type {import("../chat/types.js").AssistantError} */ (new Error("Not signed in."));
  e.code = 401;
  e.status = 401;
  e.userMessage = "Sign in to talk to the assistant.";
  return e;
}
const stoppedTurn = () => new DOMException("The turn was stopped.", "AbortError");

// A JWT's `exp` in ms, or null when the bearer is not a JWT that says.
function expiresAt(token) {
  try {
    const part = String(token).split(".")[1];
    if (!part) return null;
    const exp = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/"))).exp;
    return typeof exp === "number" ? exp * 1000 : null;
  } catch { return null; }
}
function lapsed(token) {
  const exp = expiresAt(token);
  return exp !== null && exp <= Date.now();
}

// A fresh id for a turn's request. The assistant treats a message id it has already seen as the same
// turn, so asking again with it after a failed connection never spends the prompt twice.
function messageId() {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/**
 * @param {number} ms
 * @param {AbortSignal} [signal]
 * @returns {Promise<void>}
 */
const pause = (ms, signal) => new Promise((resolve, reject) => {
  if (signal && signal.aborted) { reject(stoppedTurn()); return; }
  const onAbort = () => { clearTimeout(t); reject(stoppedTurn()); };
  const t = setTimeout(() => { if (signal) signal.removeEventListener("abort", onAbort); resolve(); }, ms);
  if (signal) signal.addEventListener("abort", onAbort, { once: true });
});

const listOf = (key) => (payload) => (payload && Array.isArray(payload[key]) ? payload[key] : []);

async function payloadOf(res) {
  try { return await res.json(); } catch { return null; }
}

/**
 * A browser client of one assistant over the assistant wire contract.
 *
 * @param {import("../chat/types.js").AssistantClientOptions} options
 * @returns {import("../chat/types.js").AssistantClient}
 */
function createAssistantClient({ baseUrl, getToken, renewToken, canRenew }) {
  const baseOf = () => String((typeof baseUrl === "function" ? baseUrl() : baseUrl) || "").replace(/\/$/, "");
  const renewable = () => typeof renewToken === "function" && (typeof canRenew !== "function" || canRenew());

  // The id the assistant gave this browser's event stream, for an assistant that names one in a
  // `hello` frame. Sent on every call so the changes this surface causes come back stamped with it,
  // which is how the stream tells its own echo from a change made in another tab. Empty until a stream
  // that names itself is open.
  let streamId = null;
  // The position of the last event the stream delivered, so a stream that reopens asks for what it
  // missed rather than for everything.
  let eventSeq = 0;

  // The bearer for a call that may be sent again: a lapsed one is not worth a request, so it is renewed
  // first; an unreadable `exp` says nothing, so that one is sent and healed from a 401.
  const bearerToReplay = async () => {
    let token = await getToken();
    if (token && lapsed(token) && renewable()) token = null;
    if (!token && renewable()) token = await renewToken();
    if (!token) throw signedOut();
    return token;
  };
  // The bearer for a call that is sent once: a lapsed one is renewed before it is spent.
  const bearerForOnce = async () => {
    let token = await getToken();
    if ((!token || lapsed(token)) && typeof renewToken === "function") token = await renewToken();
    if (!token) throw signedOut();
    return token;
  };

  const headersOf = (token, extra) => {
    const h = { ...extra, Authorization: "Bearer " + token };
    if (streamId) h["X-Assistant-Origin"] = streamId;
    return h;
  };

  const send = async (base, path, init) => {
    try {
      return await fetch(base + path, init);
    } catch (e) {
      if (e && e.name === "AbortError") throw e;
      throw unreachable();
    }
  };

  // One request. `once` is a call that must not be sent twice; any other is renewed and sent again
  // when refused 401. Where the assistant is is asked before the bearer: an assistant with no address
  // has nothing to present a credential to.
  /**
   * @param {string} method
   * @param {string} path
   * @param {{ body?: BodyInit | null, headers?: Record<string, string>, signal?: AbortSignal, once?: boolean }} [options]
   * @returns {Promise<Response>}
   */
  const call = async (method, path, { body, headers, signal, once } = {}) => {
    const base = baseOf();
    const init = (token) => ({ method, headers: headersOf(token, headers), body, signal });
    if (once) return send(base, path, init(await bearerForOnce()));
    let res = await send(base, path, init(await bearerToReplay()));
    if (res.status === 401 && renewable()) {
      const renewed = await renewToken();
      if (!renewed) throw signedOut();
      res = await send(base, path, init(renewed));
    }
    return res;
  };

  const json = async (method, path, body, opts) => {
    const headers = { Accept: "application/json" };
    if (body !== undefined && body !== null) headers["Content-Type"] = "application/json";
    const res = await call(method, path, {
      headers,
      body: body === undefined || body === null ? undefined : JSON.stringify(body),
      signal: opts && opts.signal,
      once: opts && opts.once,
    });
    if (res.status === 204) return null;
    const payload = await payloadOf(res);
    if (!res.ok) throw failure(res.status, payload);
    return payload;
  };
  const jsonOnce = (method, path, body) => json(method, path, body, { once: true });

  // POST /turn — the conversation itself. Frames stream until the terminal `done`/`error`.
  //
  // A turn is a session at the assistant, not this request: when the connection drops before the
  // terminal frame, the turn is picked up again with `GET /turns/{id}/events?after=<seq>`, from the last
  // frame delivered, and the caller sees one unbroken stream. A frame is delivered once: a replay that
  // starts earlier than the last one seen is skipped up to it. A connection that cannot be had again, or
  // a turn the assistant no longer holds, ends the call with a network error, so a surface reports a
  // turn that stopped rather than showing one that never finishes.
  //
  // A turn the person stopped ends with an `error` frame coded `cancelled`; that is a stop, not a
  // failure, so it surfaces as an AbortError. An abort of `signal` rethrows.
  /**
   * @param {{ body?: import("../chat/types.js").TurnRequest, turnId?: string, after?: number }} target a new turn's body, or the turn to follow
   * @param {{ onEvent?: (frame: import("../chat/types.js").Frame) => void, signal?: AbortSignal }} [opts]
   * @returns {Promise<void>}
   */
  const runTurn = async ({ body, turnId: followed, after }, opts) => {
    const { onEvent, signal } = opts || {};
    const base = baseOf();
    const request = body ? { ...body, messageId: body.messageId || messageId() } : null;

    let turnId = followed || null;   // addresses the turn once its first frame has arrived
    let delivered = after || 0;      // the highest seq handed to the caller
    let ended = false;               // a terminal frame has been delivered
    let stopped = false;             // the turn was cancelled

    const deliver = (evt) => {
      if (typeof evt.seq === "number") {
        if (evt.seq <= delivered) return;
        delivered = evt.seq;
      }
      if (evt.type === "turn.started" && evt.turnId) turnId = evt.turnId;
      if (evt.type === "done") ended = true;
      if (evt.type === "error") {
        ended = true;
        if (evt.code === "cancelled") { stopped = true; return; }
      }
      if (onEvent) onEvent(evt);
    };

    for (let attempt = 0; ; attempt++) {
      const token = await bearerForOnce();
      let res = null;
      try {
        res = turnId === null
          ? await fetch(base + "/turn", {
            method: "POST",
            headers: headersOf(token, { "Content-Type": "application/json", Accept: "text/event-stream" }),
            body: JSON.stringify(request),
            signal,
          })
          : await fetch(base + "/turns/" + encodeURIComponent(turnId) + "/events?after=" + delivered, {
            headers: headersOf(token, { Accept: "text/event-stream" }),
            signal,
          });
      } catch (e) {
        if (e && e.name === "AbortError") throw e;
        res = null;
      }

      if (res && !res.ok) {
        const payload = await payloadOf(res);
        // A turn past its retention cannot be picked up; anything else is the assistant's refusal.
        if (turnId !== null && res.status === 404) throw unreachable();
        throw failure(res.status, payload);
      }

      if (res) {
        await readSseStream(res, deliver, signal);
        if (ended) break;
      }

      if (signal && signal.aborted) throw stoppedTurn();
      if (attempt >= RESUME_DELAYS_MS.length) throw unreachable();
      await pause(RESUME_DELAYS_MS[attempt], signal);
    }

    if (stopped && !followed) throw stoppedTurn();
  };

  const turn = (body, opts) => runTurn({ body }, opts);

  // Following a turn another surface opened is the same stream read from the start (or from `after`),
  // picked up again the same way. A turn that was stopped ends the call quietly: the one watching it
  // did not ask for the stop.
  const follow = (turnId, opts) => runTurn({ turnId, after: (opts && opts.after) || 0 }, opts);

  // GET /events — the caller's own conversation changes, as they happen. The assistant sends nothing
  // when it opens, so the open is reported as a `hello` frame: that is what tells a reconnecting
  // surface to re-read what it missed. The bearer is taken fresh, because a stream is long-lived and
  // there is no 401 to heal once its body is flowing. Ending is normal and is the caller's to retry
  // (useConversationStream does). A reopened stream asks for the events after the last one delivered;
  // when the assistant no longer holds them it says so with `log.gap`, and the position becomes the
  // gap's.
  const events = async (opts) => {
    const { onEvent, signal } = opts || {};
    const base = baseOf();
    const token = await bearerForOnce();
    let res;
    try {
      res = await fetch(base + "/events" + (eventSeq ? "?after=" + eventSeq : ""), {
        headers: headersOf(token, { Accept: "text/event-stream" }),
        signal,
      });
    } catch (e) {
      if (e && e.name === "AbortError") throw e;
      throw unreachable();
    }
    if (!res.ok) throw failure(res.status, await payloadOf(res));

    try {
      if (onEvent) onEvent({ type: "hello" });
      await readSseStream(res, (evt) => {
        // An assistant that names its stream does so in a `hello` of its own, already reported.
        if (evt.type === "hello") {
          if (evt.streamId) streamId = evt.streamId;
          return;
        }
        if (evt.type === "log.gap" && typeof evt.firstSeq === "number") eventSeq = Math.max(0, evt.firstSeq - 1);
        else if (typeof evt.seq === "number") eventSeq = evt.seq;
        if (onEvent) onEvent(evt);
      }, signal);
    } finally {
      // The id belongs to a connection: a dead one left behind would stamp later calls with a stream
      // nothing is listening on.
      streamId = null;
    }
  };

  // Points the open stream at a conversation, for an assistant whose stream names itself and carries
  // one conversation's turn frames. Any other has nothing to point.
  const attach = (conversationId) => (streamId
    ? jsonOnce("POST", "/events/attach", { conversationId: conversationId || null })
    : Promise.resolve(null));

  // POST /confirm — deciding what a turn proposed. `body.token` is the proposal's handle and
  // `body.decision` is `confirm` (the default) or `decline`. `progress` frames drive a live sub-label,
  // and a terminal `result` carries the outcome. A watchdog resets on every byte, keepalives included,
  // so a stream that goes quiet past IDLE_MS is a failure the person can retry rather than an endless
  // spinner. The handle is single-use, so this is never sent twice.
  const confirm = async (body, opts) => {
    const { onProgress, signal } = opts || {};
    const base = baseOf();
    const token = await bearerForOnce();

    const ctrl = new AbortController();
    let idle = null;
    const arm = () => {
      if (idle) clearTimeout(idle);
      idle = setTimeout(() => ctrl.abort(new DOMException("confirm idle timeout", "TimeoutError")), IDLE_MS);
    };
    const onAbort = () => ctrl.abort(signal.reason);
    if (signal) { if (signal.aborted) ctrl.abort(signal.reason); else signal.addEventListener("abort", onAbort); }
    const release = () => {
      if (idle) clearTimeout(idle);
      if (signal) signal.removeEventListener("abort", onAbort);
    };

    let res;
    try {
      res = await fetch(base + "/confirm", {
        method: "POST",
        headers: headersOf(token, { "Content-Type": "application/json", Accept: "text/event-stream" }),
        body: JSON.stringify({ handle: body.token || body.handle, decision: body.decision || "confirm" }),
        signal: ctrl.signal,
      });
    } catch (e) {
      release();
      if (signal && signal.aborted) throw e;
      throw unreachable();
    }
    if (!res.ok) {
      release();
      throw failure(res.status, await payloadOf(res));
    }

    let result = null, streamErr = null;
    try {
      arm();
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const chunk = await reader.read();
        arm();
        if (chunk.done) break;
        buf += decoder.decode(chunk.value, { stream: true });
        let at;
        while ((at = buf.indexOf("\n\n")) !== -1) {
          const evt = parseSseEvent(buf.slice(0, at));
          buf = buf.slice(at + 2);
          if (!evt) continue;
          if (evt.type === "result") result = evt;
          else if (evt.type === "progress" && onProgress) onProgress(evt);
          else if (evt.type === "error") streamErr = evt.message || "The action failed.";
        }
      }
    } catch (e) {
      if (e && e.name === "TimeoutError") {
        throw failure(0, { error: { message: "The action's stream went quiet — it may still be running. Try again in a moment." } });
      }
      if (signal && signal.aborted) throw e;
      throw unreachable();
    } finally {
      release();
    }
    if (streamErr) throw failure(0, { error: { message: streamErr } });
    if (!result) throw failure(0, { error: { message: "The action ended without a result — it may still be running. Try again in a moment." } });
    return result;
  };

  // POST /speech/transcribe — 16kHz mono signed 16-bit PCM, answered with the words in it. The same
  // audio twice is the same words, so a refused bearer is renewed and the recording sent again.
  const transcribe = async (pcm, opts) => {
    const res = await call("POST", "/speech/transcribe", {
      headers: { "Content-Type": "application/octet-stream", Accept: "application/json" },
      body: pcm,
      signal: opts && opts.signal,
    });
    const payload = await payloadOf(res);
    if (!res.ok) throw failure(res.status, payload);
    return payload;
  };

  // POST /attachments — one file, its body the file itself, answered with what the assistant took it
  // as: `{ id, kind, name, mimeType, size }`. Sent with XMLHttpRequest, the one browser request that
  // reports how much of its body has gone: `onProgress(sent, total)`. Sent once.
  const uploadAttachment = async (blob, name, opts) => {
    const { onProgress, signal } = opts || {};
    const base = baseOf();
    const headers = headersOf(await bearerForOnce(), { Accept: "application/json" });
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", base + "/attachments?name=" + encodeURIComponent(name || "file"));
      for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
      xhr.setRequestHeader("Content-Type", "application/octet-stream");
      if (onProgress) xhr.upload.onprogress = (e) => onProgress(e.loaded, e.lengthComputable ? e.total : blob.size);
      xhr.onload = () => {
        let payload = null;
        try { payload = JSON.parse(xhr.responseText); } catch { payload = null; }
        if (xhr.status >= 200 && xhr.status < 300 && payload) resolve(payload);
        else reject(failure(xhr.status, payload));
      };
      xhr.onerror = () => reject(unreachable());
      xhr.onabort = () => reject(new DOMException("upload aborted", "AbortError"));
      if (signal) {
        if (signal.aborted) { xhr.abort(); return; }
        signal.addEventListener("abort", () => xhr.abort(), { once: true });
      }
      xhr.send(blob);
    });
  };

  // An attachment's bytes, as a Blob of their type.
  const blobAt = async (path, opts) => {
    const res = await call("GET", path, { signal: opts && opts.signal });
    if (!res.ok) throw failure(res.status, await payloadOf(res));
    return res.blob();
  };

  const enc = encodeURIComponent;
  const reviewPath = (person, conversationId) =>
    "/review/people/" + enc(person) + "/conversations/" + enc(conversationId);

  return {
    // A route of the product's own beside the contract's (`wire-contract.md` §14): JSON in and out, with
    // the same renewal, sent once when `opts.once` says it must not be sent twice.
    request: (method, path, body, opts) => json(method, path, body, opts),
    me: (opts) => json("GET", "/me", null, opts),
    // What this assistant's speech can do: `{ hear, speak, scan }`, asked before a microphone is offered.
    speech: (opts) => json("GET", "/speech", null, opts),
    // The microphone is opening: speech is about to be wanted, so the models are loaded ahead of need.
    wakeSpeech: (opts) => json("POST", "/speech/wake", null, opts),
    transcribe,
    conversations: (opts) => json("GET", "/conversations", null, opts).then(listOf("conversations")),
    conversation: (id, opts) => json("GET", "/conversations/" + enc(id), null, opts),
    deleteConversation: (id) => json("DELETE", "/conversations/" + enc(id)),
    compact: (id) => json("POST", "/conversations/" + enc(id) + "/compact"),
    feedback: (id, turnId, body) => json("POST", "/conversations/" + enc(id) + "/turns/" + turnId + "/feedback", body),
    // The commands this caller may type, and running one. Running one is sent once: a switch given no
    // state toggles, so a second send would flip it back.
    commands: (opts) => json("GET", "/commands", null, opts).then(listOf("commands")),
    runCommand: (name, body) => jsonOnce("POST", "/commands/" + enc(name), body || {}),
    // The tools the assistant may use on the caller's behalf: `[{ name, description, parameters }]`.
    // The description is written for the model.
    tools: (opts) => json("GET", "/tools", null, opts).then(listOf("tools")),
    // What the assistant has written down about the caller, and what one memory may weigh. Writing
    // one creates or corrects it, because a memory is revised by rewriting its key.
    memories: (opts) => json("GET", "/memories", null, opts).then(listOf("memories")),
    memoryLimits: (opts) => json("GET", "/memories/limits", null, opts),
    writeMemory: (key, memory) => json("PUT", "/memories/" + enc(key), memory),
    deleteMemory: (key) => json("DELETE", "/memories/" + enc(key)),
    // Web Push: the key a browser subscribes against (and whether the assistant sends at all), this
    // caller's registered endpoints, and registering or forgetting this browser.
    pushKey: (opts) => json("GET", "/push/key", null, opts),
    pushDevices: (opts) => json("GET", "/push/devices", null, opts),
    pushSubscribe: (body) => json("POST", "/push/subscribe", body),
    pushUnsubscribe: (body) => json("DELETE", "/push/subscribe", body),
    // Review across people (`wire-contract.md` §12), for the people the assistant lets read other
    // people's conversations. A conversation under review is named by its person and its id.
    reviewUsers: (opts) => json("GET", "/review/people", null, opts),
    reviewStats: (query, opts) => json("GET", "/review/usage" + (query || ""), null, opts),
    reviewConversations: (person, opts) =>
      json("GET", "/review/conversations?limit=200&person=" + enc(person), null, opts),
    reviewConversation: (person, conversationId, opts) => json("GET", reviewPath(person, conversationId), null, opts),
    reviewAttachment: (person, conversationId, attachmentId, opts) =>
      blobAt(reviewPath(person, conversationId) + "/attachments/" + enc(attachmentId), opts),
    // What a message may carry (`{ images, maxImages, maxImageBytes, maxTextTokens, ... }`), an upload,
    // and an attachment of the caller's own conversation read back.
    attachmentLimits: (opts) => json("GET", "/attachments/limits", null, opts),
    uploadAttachment,
    attachment: (conversationId, attachmentId, opts) =>
      blobAt("/conversations/" + enc(conversationId) + "/attachments/" + enc(attachmentId), opts),
    // The caller's turns that have not ended, on whichever surface opened them, oldest first:
    // `[{ turnId, conversationId, prompt, startedBy, startedAt, state, queuedBehind? }]`, and reading
    // one of them frame by frame from the start or from `opts.after`.
    turns: (opts) => json("GET", "/turns", null, opts).then(listOf("turns")),
    follow,
    // End a turn, running or still queued, from any surface watching it. Sent once: a second stop
    // could reach the next turn on a busy conversation.
    stopTurn: (turnId) => jsonOnce("DELETE", "/turns/" + enc(turnId)),
    turn,
    // A proposal can be declined as well as confirmed.
    declines: true,
    confirm,
    events,
    attach,
    streamId: () => streamId,
  };
}

export { createAssistantClient };
