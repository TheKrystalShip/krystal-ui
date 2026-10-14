// push.js — registering this browser for an assistant's Web Push, over an assistant client
// (`createAssistantClient`, or any object with its push calls).
//
// An assistant announces one thing: an action it proposed and is waiting on the person to approve,
// once they have stopped looking at the chat. The browser half — whether this browser can subscribe,
// binding a subscription to the assistant's key, giving it up — is `lib/pushBrowser`; this is the
// half that tells the assistant.

import { acquire, currentEndpoint, release, support } from "@thekrystalship/krystal/lib/pushBrowser";

/**
 * What `pushStatus` reports: the browser's own push state with whether the assistant sends and whether this browser is registered.
 * @typedef {object} PushStatus
 * @property {string} state `unsupported`, `needs-install`, `denied` or `ready`
 * @property {boolean} [canPrompt]
 * @property {boolean} enabled the assistant sends pushes at all
 * @property {boolean} registered this browser is registered with the assistant
 * @property {boolean} [unreachable] the assistant did not answer
 * @property {string} [reason] why it did not
 */

/**
 * Whether this browser could receive a notification, and whether the assistant would send one.
 *
 * The two are separate questions with separate answers: a browser that cannot subscribe is told
 * what to do about it (on iOS, "add to the Home Screen"), and an assistant whose operator has the
 * whole path switched off says so rather than offering a switch that achieves nothing.
 *
 * @param {Pick<import("../chat/types.js").AssistantClient, "pushKey" | "pushDevices">} client
 * @returns {Promise<PushStatus>}
 */
async function pushStatus(client) {
  const browser = support();
  if (browser.state === "unsupported" || browser.state === "needs-install") {
    return { ...browser, enabled: false, registered: false };
  }

  let enabled = false;
  let registered = false;
  try {
    const key = await client.pushKey();
    enabled = key.enabled !== false;

    // "Is this browser registered" is the only device question this screen can ask: it knows its own
    // endpoint and nothing about anyone's other devices, which is exactly as much as it should.
    const endpoint = await currentEndpoint();
    if (endpoint) {
      const devices = await client.pushDevices();
      registered = (devices.endpoints || []).includes(endpoint);
    }
  } catch (e) {
    // An assistant that will not answer is not a browser that cannot subscribe, so what the browser
    // can do is still reported. The reason travels with it: a lapsed session and an assistant that is
    // down produce the same silence here, and telling somebody to check the network when they need to
    // sign in again is a wrong answer, not a vague one.
    const status = e && e.status;
    return {
      ...browser,
      enabled: false,
      registered: false,
      unreachable: true,
      reason: status === 401 || status === 403
        ? "Your session with the assistant has expired — reload the app to sign back in."
        : (e && (e.userMessage || e.message)) || "The assistant didn't answer.",
    };
  }

  return { ...browser, enabled, registered };
}

/**
 * Subscribe this browser and register it with the assistant.
 *
 * Must be called from a real user gesture: a permission prompt that was not asked for is denied,
 * and a denied permission is close to unrecoverable.
 *
 * @param {Pick<import("../chat/types.js").AssistantClient, "pushKey" | "pushSubscribe">} client
 * @returns {Promise<string>} the endpoint registered
 */
async function pushSubscribe(client) {
  const { publicKey } = await client.pushKey();
  const sub = await acquire(publicKey);

  // toJSON() is the shape the browser minted; the two keys are what the payload is encrypted to.
  const json = sub.toJSON();
  await client.pushSubscribe({
    endpoint: json.endpoint,
    p256dh: json.keys && json.keys.p256dh,
    auth: json.keys && json.keys.auth,
  });
  return sub.endpoint;
}

/**
 * Give this browser up, telling the assistant before the browser forgets its own endpoint.
 *
 * @param {Pick<import("../chat/types.js").AssistantClient, "pushUnsubscribe">} client
 */
async function pushUnsubscribe(client) {
  await release((endpoint) => client.pushUnsubscribe({ endpoint }));
}

export { pushStatus, pushSubscribe, pushUnsubscribe };
