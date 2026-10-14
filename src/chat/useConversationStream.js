import React from "react";

// useConversationStream — hold the assistant's `GET /events` open, so a conversation open on two
// surfaces agrees with itself without either polling the other.
//
// `client` is the assistant's client (`createAssistantClient`, or a site's own with the same
// methods): `events`, `attach` and `streamId` are what this reads. `clientKey` names which assistant
// that is, and changing it re-opens the stream; a client object rebuilt on every render does not.
//
// Two things this owns that the client deliberately does not:
//
//  - **Reconnection.** A stream ends for ordinary reasons (a proxy idle timeout, a sleeping laptop, a
//    dropped network) and the fix is always to open another. Backoff is exponential and capped, so an
//    assistant that is down is retried patiently rather than hammered.
//  - **The resync after a gap.** Nothing was buffered while the stream was down, so a reopened stream
//    knows nothing about what it missed. `onResync` fires on every reconnection — never on the first
//    connection, where the caller has just read the list anyway — and re-reading the listing is what
//    closes the gap. This is why the events themselves need no delivery guarantee.
//
// A surface skips its OWN echoes here rather than in the reducer: the assistant stamps each event with
// the stream whose caller caused it, so an event carrying this stream's id is something this surface
// has already applied, and applying it twice is at best a wasted render.

const FIRST_RETRY_MS = 1000;
const MAX_RETRY_MS = 30000;

/**
 * Holds the assistant's event stream open, reconnecting with backoff, and re-points it at the open conversation.
 * @param {object} options
 * @param {Pick<import("./types.js").AssistantClient, "events" | "streamId"> & Partial<Pick<import("./types.js").AssistantClient, "attach">> | null} options.client
 * @param {string | null} options.clientKey names which assistant; changing it re-opens the stream
 * @param {boolean} options.enabled
 * @param {string | null} [options.conversationId] the conversation on screen
 * @param {(event: import("./types.js").EventFrame) => void} options.onEvent
 * @param {() => void} [options.onResync] fires on every reconnection after the first connection
 */
function useConversationStream({ client, clientKey, enabled, conversationId, onEvent, onResync }) {
  // Held in refs so a changed callback never tears the stream down and reconnects: the identity of
  // `onEvent` changes on most renders, and a reconnect per render would be a reconnect storm.
  const eventRef = React.useRef(onEvent);
  const resyncRef = React.useRef(onResync);
  const watchingRef = React.useRef(conversationId);
  const clientRef = React.useRef(client);
  eventRef.current = onEvent;
  resyncRef.current = onResync;
  clientRef.current = client;

  // Re-point the open stream when the person opens a different conversation. Held in a ref as well so
  // a stream that reconnects attaches to what is on screen NOW rather than to whatever was open when
  // it was first established.
  React.useEffect(() => {
    watchingRef.current = conversationId;
    if (!clientKey || !enabled || !clientRef.current) return;
    // A stream that carries every conversation's changes needs no pointing; only an assistant whose
    // stream sends one conversation's turn frames has an `attach`.
    if (typeof clientRef.current.attach !== "function") return;
    // Only an OPEN stream can be re-pointed: an attach names a stream, and this surface has no name
    // until the assistant's `hello` frame has arrived. With no stream there is nothing to say — the
    // open handler below attaches to whatever this ref holds, so a conversation selected before the
    // stream is running, or during a reconnect gap, is picked up the moment one is.
    if (!clientRef.current.streamId()) return;
    clientRef.current.attach(conversationId).catch(() => {});
  }, [clientKey, enabled, conversationId]);

  React.useEffect(() => {
    if (!clientKey || !enabled) return undefined;

    let stopped = false;
    let timer = null;
    let controller = null;
    let attempt = 0;
    let connected = false;   // has a stream carried anything for this assistant yet?

    const run = async () => {
      while (!stopped) {
        controller = new AbortController();
        let opened = false;
        const c = clientRef.current;
        try {
          await c.events({
            signal: controller.signal,
            onEvent: (evt) => {
              if (!evt || !evt.type) return;
              if (!opened) {
                opened = true;
                attempt = 0;                       // a stream that spoke is a stream that works
                // A stream carries turn frames only for the conversation it is pointed at, so say
                // which one before anything can be missed. The assistant answers on the stream itself.
                if (typeof c.attach === "function") c.attach(watchingRef.current).catch(() => {});
                if (connected && resyncRef.current) resyncRef.current();
                connected = true;
              }
              // The opening frame is plumbing; the client has already recorded the id from it.
              if (evt.type === "hello") return;
              if (evt.origin && typeof c.streamId === "function" && evt.origin === c.streamId()) return;
              if (eventRef.current) eventRef.current(evt);
            },
          });
        } catch {
          // An abort is this effect being cleaned up; anything else is an assistant we could not
          // reach. Both end the same way — the loop below decides whether to try again.
        }
        if (stopped) return;

        // Ending is not a failure, so a stream that ran and stopped retries promptly; one that never
        // opened backs off, because the assistant is the thing that is not answering.
        const wait = opened ? FIRST_RETRY_MS : Math.min(FIRST_RETRY_MS * 2 ** attempt++, MAX_RETRY_MS);
        await new Promise((resolve) => { timer = setTimeout(resolve, wait); });
      }
    };

    run();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      if (controller) controller.abort();
    };
  }, [clientKey, enabled]);
}

export { useConversationStream };
