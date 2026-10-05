// createAssistantClient — a browser client of one assistant, over the assistant wire contract
// (`kgsm-llm/docs/wire-contract.md`): the turn stream, the confirm channel, the conversation event
// stream, conversations and their feedback, the command surface and the tool list, memory, Web Push,
// and speech.
//
//   const client = createAssistantClient({ baseUrl: "/assistant", getToken: () => session.token() });
//
// `getToken` answers the bearer to send, renewed if the site renews it, or null when nobody is
// signed in; the client holds no credential of its own. A call refused 401 is reported as one, for
// the site to send somebody to sign in, and is never replayed: a turn would spend the prompt twice
// and a confirmation token is single-use.
//
// Every failure is an Error carrying `code` (the HTTP status, or "ECONNREFUSED" when the assistant
// could not be reached) and `userMessage`, a sentence a surface can show as it stands.

import { readSseStream } from "../lib/sse.js";

// A confirm stream may sit silent through a long action; well over the assistant's 15s heartbeat.
const IDLE_MS = 60000;

function failure(status, body) {
  const env = (body && body.error) || {};
  const message = typeof env === "string" ? env : (env.message || (body && body.message));
  const e = new Error(message || "HTTP " + status);
  e.code = status;
  e.status = status;
  e.userMessage = message || "The assistant returned an error.";
  return e;
}
function unreachable() {
  const e = new Error("Can't reach the assistant (network).");
  e.code = "ECONNREFUSED";
  e.userMessage = "Can't reach the assistant.";
  return e;
}
function signedOut() {
  const e = new Error("Not signed in.");
  e.code = 401;
  e.status = 401;
  e.userMessage = "Sign in to talk to the assistant.";
  return e;
}

function createAssistantClient({ baseUrl, getToken }) {
  const base = String(baseUrl || "").replace(/\/$/, "");
  // The id the assistant gave this browser's event stream. Sent on every call so the changes this
  // surface causes come back stamped with it, which is how the stream tells its own echo from a
  // change made in another tab. Empty until a stream is open.
  let streamId = null;

  const headersFor = async (extra) => {
    const token = await getToken();
    if (!token) throw signedOut();
    const h = { Authorization: "Bearer " + token, ...extra };
    if (streamId) h["X-Assistant-Origin"] = streamId;
    return h;
  };

  const request = async (method, path, init) => {
    let res;
    try {
      res = await fetch(base + path, { method, ...init });
    } catch (e) {
      if (e && e.name === "AbortError") throw e;
      throw unreachable();
    }
    return res;
  };

  const json = async (method, path, body, opts) => {
    const headers = await headersFor({ Accept: "application/json" });
    if (body !== undefined && body !== null) headers["Content-Type"] = "application/json";
    const res = await request(method, path, {
      headers,
      body: body === undefined || body === null ? undefined : JSON.stringify(body),
      signal: opts && opts.signal,
    });
    if (res.status === 204) return null;
    let payload = null;
    try { payload = await res.json(); } catch { payload = null; }
    if (!res.ok) throw failure(res.status, payload);
    return payload;
  };

  const stream = async (method, path, body, onEvent, signal) => {
    const headers = await headersFor({ Accept: "text/event-stream" });
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const res = await request(method, path, {
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
    if (!res.ok) {
      let payload = null; try { payload = await res.json(); } catch { payload = null; }
      throw failure(res.status, payload);
    }
    await readSseStream(res, onEvent, signal);
  };

  // POST /turn — frames stream until the terminal `done`/`error`. A transport drop just ends the
  // pump: the text already delivered is real, and a `done` that did not arrive is never invented.
  const turn = (body, opts) => {
    const { onEvent, signal } = opts || {};
    return stream("POST", "/turn", body, (evt) => { if (onEvent) onEvent(evt); }, signal);
  };

  // GET /events — the caller's own conversation changes. The stream names itself in its first frame
  // (`hello`). Ending is normal and is the caller's to retry (useConversationStream does).
  const events = async (opts) => {
    const { onEvent, signal } = opts || {};
    try {
      await stream("GET", "/events", undefined, (evt) => {
        if (evt && evt.type === "hello" && evt.streamId) streamId = evt.streamId;
        if (onEvent) onEvent(evt);
      }, signal);
    } finally {
      // The id belongs to a connection: a dead one left behind would stamp later calls with a
      // stream nothing is listening on.
      streamId = null;
    }
  };

  // POST /confirm — redeeming what a turn proposed. `progress` frames drive a live sub-label, and a
  // terminal `result` carries the outcome. A stream that goes quiet past IDLE_MS is reported as a
  // failure the person can retry rather than left as an endless spinner.
  const confirm = async (body, opts) => {
    const { onProgress, signal } = opts || {};
    const ctrl = new AbortController();
    let idle = null;
    const arm = () => {
      if (idle) clearTimeout(idle);
      idle = setTimeout(() => ctrl.abort(new DOMException("confirm idle timeout", "TimeoutError")), IDLE_MS);
    };
    const onAbort = () => ctrl.abort(signal.reason);
    if (signal) { if (signal.aborted) ctrl.abort(signal.reason); else signal.addEventListener("abort", onAbort); }

    let result = null, streamErr = null;
    try {
      arm();
      await stream("POST", "/confirm", body, (evt) => {
        arm();
        if (evt.type === "result") result = evt;
        else if (evt.type === "progress" && onProgress) onProgress(evt);
        else if (evt.type === "error") streamErr = evt.message || "The action failed.";
      }, ctrl.signal);
    } catch (e) {
      if (e && e.name === "TimeoutError") {
        throw failure(0, { error: { message: "The action's stream went quiet — it may still be running. Try again in a moment." } });
      }
      throw e;
    } finally {
      if (idle) clearTimeout(idle);
      if (signal) signal.removeEventListener("abort", onAbort);
    }
    if (streamErr) throw failure(0, { error: { message: streamErr } });
    if (!result) throw failure(0, { error: { message: "The action ended without a result — it may still be running. Try again in a moment." } });
    return result;
  };

  // POST /transcribe — 16kHz mono signed 16-bit PCM, answered with the words in it.
  const transcribe = async (pcm, opts) => {
    const headers = await headersFor({ "Content-Type": "application/octet-stream", Accept: "application/json" });
    const res = await request("POST", "/transcribe", { headers, body: pcm, signal: opts && opts.signal });
    let payload = null;
    try { payload = await res.json(); } catch { payload = null; }
    if (!res.ok) throw failure(res.status, payload);
    return payload;
  };

  const enc = encodeURIComponent;
  return {
    me: (opts) => json("GET", "/me", null, opts),
    speech: (opts) => json("GET", "/speech", null, opts),
    transcribe,
    conversations: (opts) => json("GET", "/conversations", null, opts),
    conversation: (id, opts) => json("GET", "/conversations/" + enc(id), null, opts),
    deleteConversation: (id) => json("DELETE", "/conversations/" + enc(id)),
    compact: (id) => json("POST", "/conversations/" + enc(id) + "/compact"),
    feedback: (id, turnId, body) => json("POST", "/conversations/" + enc(id) + "/turns/" + turnId + "/feedback", body),
    commands: (opts) => json("GET", "/commands", null, opts),
    runCommand: (name, body) => json("POST", "/commands/" + enc(name), body || {}),
    // The tools the assistant may use on the caller's behalf, already filtered to what they hold:
    // `[{ name, description, parameters }]`. The description is written for the model.
    tools: (opts) => json("GET", "/tools", null, opts),
    // What the assistant has written down about the caller, and what one memory may weigh. Writing
    // one creates or corrects it, because a memory is revised by rewriting its key.
    memories: (opts) => json("GET", "/memories", null, opts),
    memoryLimits: (opts) => json("GET", "/memories/limits", null, opts),
    writeMemory: (key, memory) => json("PUT", "/memories/" + enc(key), memory),
    deleteMemory: (key) => json("DELETE", "/memories/" + enc(key)),
    // Web Push: the key a browser subscribes against (and whether the assistant sends at all), this
    // caller's registered endpoints, and registering or forgetting this browser.
    pushKey: (opts) => json("GET", "/push/key", null, opts),
    pushDevices: (opts) => json("GET", "/push/devices", null, opts),
    pushSubscribe: (body) => json("POST", "/push/subscribe", body),
    pushUnsubscribe: (body) => json("DELETE", "/push/subscribe", body),
    attach: (conversationId) => json("POST", "/events/attach", { conversationId: conversationId || null }),
    stopTurn: (turnId) => json("DELETE", "/turns/" + enc(turnId)),
    turn,
    confirm,
    events,
    streamId: () => streamId,
  };
}

export { createAssistantClient };
