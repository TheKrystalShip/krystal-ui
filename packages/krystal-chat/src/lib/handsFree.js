// handsFree.js — listening for the assistant's trigger phrase in a browser, and capturing what follows.
//
// Hands busy at a stove, a person addresses the assistant out loud: "hey assistant, set a ten minute
// timer". Nobody stops talking first so a device can hear its name, so the microphone's audio is
// SCANNED: every half second of new speech, its last three seconds are sent to the assistant's
// `/speech/scan`, and the trigger is looked for in the words that come back. Finding it starts a
// CAPTURE, from the end of the word before the trigger, that runs until the person has been quiet for
// a moment; the capture is what is transcribed and acted on.
//
// This is the browser half of the design `TheKrystalShip.Discord.Voice` holds for a voice channel
// (`kgsm-docs/systems/assistant/speech.md`, "Scanning"), with its numbers: windows near three seconds
// (shorter ones misread the trigger), a stride of half a second, a quiet of 600 ms that ends a command,
// a ceiling of eight seconds, and a loudness gate low enough to catch a quiet speaker.
//
// THE TRIGGER IS MATCHED IN A TRANSCRIPT, NOT IN SOUND. There is no wake-word model: whatever the
// recogniser writes for the phrase is what is matched, which is why `triggers` is a list. A phrasing it
// renders the same way every time is matchable, and a variant seen in practice is added to the list.
// The trigger is never put in the recogniser's priming, which would make a breath sound like it.
//
// Three layers, so the rules are tested without a microphone or a clock:
//   matchTrigger(text, triggers)        where a trigger is in a transcript, and what was asked after it
//   createTriggerListener(options)      the scanning and capturing, fed PCM and told the time
//   openMicrophone(onPcm)               the browser's microphone as 16 kHz mono signed 16-bit PCM
// and `useHandsFree`, the hook that joins them to an assistant client.

import React from "react";

/** The audio every layer speaks: 16 kHz mono signed 16-bit, as `/speech/*` takes it. */
export const RATE = 16000;

/** The listening limits, in milliseconds, as `TheKrystalShip.Discord.Voice` measured them. */
export const LIMITS = Object.freeze({
  scanWindow: 3000,
  scanStride: 500,
  commandQuiet: 600,
  maxCommand: 8000,
});

/** The loudness (RMS of 16-bit samples) above which a frame counts as somebody talking. */
export const VOICED_RMS = 300;

const MIN_VOICED_MS = 200;
const MIN_WINDOW_MS = 1000;
const TRIGGER_LEAD_MS = 200;

// Punctuation that can sit at either end of a request without being part of it.
const EDGES = /^[\s,.!?\-:;"“”]+|[\s,.!?\-:;"“”]+$/g;

const normalise = (word) => word.toLowerCase().normalize("NFD").replace(/[^\p{L}\p{N}]/gu, "");

/**
 * The trigger phrases as word lists, longest first, from a list or a comma-separated string.
 * @param {string | string[]} triggers
 * @returns {string[][]}
 */
export function parseTriggers(triggers) {
  const list = Array.isArray(triggers) ? triggers : String(triggers || "").split(",");
  return list
    .map((t) => t.split(/\s+/).map(normalise).filter(Boolean))
    .filter((words) => words.length > 0)
    .sort((a, b) => b.length - a.length);
}

/**
 * Where a trigger is in `transcript`, and what was asked after it; null when it was not addressed to
 * the assistant. The trigger may stand anywhere ("okay, hey assistant, next step"), the last one said
 * wins, punctuation and case never matter, and an empty request is somebody waiting to be heard.
 * @param {string} transcript
 * @param {string | string[]} triggers
 * @returns {{ index: number, wordIndex: number, words: number, request: string } | null}
 */
export function matchTrigger(transcript, triggers) {
  if (!transcript || !transcript.trim()) return null;
  const spans = [...String(transcript).matchAll(/\S+/g)].map((m) => ({ word: m[0], at: m.index || 0 }));
  const words = spans.map((s) => normalise(s.word));
  let bestStart = -1;
  let bestEnd = -1;
  for (const trigger of parseTriggers(triggers)) {
    for (let start = words.length - trigger.length; start >= 0; start--) {
      if (!trigger.every((w, i) => words[start + i] === w)) continue;
      if (start + trigger.length > bestEnd) {
        bestEnd = start + trigger.length;
        bestStart = start;
      }
      break;
    }
  }
  if (bestEnd < 0) return null;
  const request = spans.slice(bestEnd).map((s) => s.word).join(" ").replace(EDGES, "");
  return { index: spans[bestStart].at, wordIndex: bestStart, words: bestEnd - bestStart, request };
}

/**
 * Where in a scanned window the command begins: the end of the word before the trigger, or the
 * window's start when the trigger opened it. Null when the window does not hold the trigger.
 * @param {{ text: string, startMs: number, endMs: number }[]} tokens the scan's words with their times
 * @param {string | string[]} triggers
 * @returns {{ captureFromMs: number, request: string } | null}
 */
export function triggerInScan(tokens, triggers) {
  const words = (tokens || []).filter((t) => t && String(t.text || "").trim());
  // The recogniser's tokens may split a word ("as", "sistant"); a word is a token that starts with a space, or the first.
  const joined = [];
  for (const t of words) {
    const text = String(t.text);
    if (joined.length === 0 || /^\s/.test(text)) joined.push({ text: text.trim(), startMs: t.startMs, endMs: t.endMs });
    else {
      const last = joined[joined.length - 1];
      last.text += text.trim();
      last.endMs = t.endMs;
    }
  }
  const found = matchTrigger(joined.map((w) => w.text).join(" "), triggers);
  if (!found) return null;
  const before = joined[found.wordIndex - 1];
  return { captureFromMs: before ? before.endMs : 0, request: found.request };
}

/**
 * What was asked in a command whose scan held the trigger when the command's own reading does not.
 * Two readings of the same sound can disagree about the trigger ("pay assistant") and agree about the
 * ordinary words after it. So the request starts at the first word of the scan's request; failing
 * that, after the trigger's last word where it stands among the command's opening words (the capture
 * begins just before the trigger, so a misheard first word does not hide the rest of it); failing
 * that, the command is all request.
 * @param {string} transcript the command's own reading
 * @param {string} openingRequest what the scan read after the trigger
 * @param {string | string[]} [triggers]
 */
export function recoverRequest(transcript, openingRequest, triggers) {
  const words = String(transcript || "").split(/\s+/).filter(Boolean);
  const first = String(openingRequest || "").split(/\s+/).map(normalise).find(Boolean);
  let start = first ? words.findIndex((w) => normalise(w) === first) : -1;
  if (start < 0 && triggers) {
    for (const trigger of parseTriggers(triggers)) {
      const last = trigger[trigger.length - 1];
      const at = words.slice(0, trigger.length + 1).findIndex((w) => normalise(w) === last);
      if (at >= 0) { start = at + 1; break; }
    }
  }
  return (start < 0 ? words : words.slice(start)).join(" ").replace(EDGES, "");
}

const rms = (samples) => {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
};

const msOf = (samples) => (samples * 1000) / RATE;
const samplesOf = (ms) => Math.round((ms * RATE) / 1000);

/**
 * @typedef {object} TriggerListenerOptions
 * @property {string | string[]} triggers the phrases that address the assistant
 * @property {(pcm: Int16Array) => Promise<{ outcome: string, text?: string, tokens?: { text: string, startMs: number, endMs: number }[] }>} scan
 *   reads a window: the assistant's `/speech/scan`
 * @property {(command: { pcm: Int16Array, triggered: boolean, request: string }) => void} onCommand
 *   a command captured: the audio from just before the trigger to the quiet after it, and what the scan read after the trigger
 * @property {(state: "listening" | "capturing") => void} [onState]
 * @property {() => number} [now] the clock, in milliseconds
 * @property {Partial<typeof LIMITS>} [limits]
 */

/**
 * The scanning and capturing for one microphone. Feed it PCM with `append`, and call `tick` on a timer
 * so a command ends on quiet. A scan is never sent while one is out or a command is being captured; a
 * `busy` scan leaves the audio to be offered again with more in it.
 * @param {TriggerListenerOptions} options
 */
export function createTriggerListener({ triggers, scan, onCommand, onState, now = () => Date.now(), limits = {} }) {
  const L = { ...LIMITS, ...limits };
  const keep = samplesOf(L.maxCommand + L.scanWindow + 1000);
  const ring = new Int16Array(keep);
  let end = 0;
  let voiced = 0;
  let voicedAtScan = 0;
  let scannedTo = 0;
  let floor = 0;
  let scanOut = false;
  let capturing = false;
  let captureFrom = 0;
  let request = "";
  let lastVoicedAt = 0;
  let stopped = false;

  const oldest = () => Math.max(0, end - keep);
  const read = (from, to) => {
    const out = new Int16Array(Math.max(0, to - from));
    for (let i = 0; i < out.length; i++) out[i] = ring[(from + i) % keep];
    return out;
  };

  const finish = () => {
    const pcm = read(captureFrom, end);
    capturing = false;
    floor = end;
    scannedTo = end;
    voicedAtScan = voiced;
    if (onState) onState("listening");
    onCommand({ pcm, triggered: true, request });
  };

  const maybeScan = () => {
    if (stopped || capturing || scanOut) return;
    if (end - scannedTo < samplesOf(L.scanStride)) return;
    if (voiced - voicedAtScan < samplesOf(MIN_VOICED_MS)) return;
    const from = Math.max(floor, end - samplesOf(L.scanWindow), oldest());
    if (end - from < samplesOf(MIN_WINDOW_MS)) return;
    const to = end;
    const voicedThen = voiced;
    scanOut = true;
    scan(read(from, to)).then((result) => {
      scanOut = false;
      if (stopped || capturing || !result || result.outcome === "busy") return;
      scannedTo = to;
      voicedAtScan = voicedThen;
      if (result.outcome !== "ok") return;
      const found = triggerInScan(result.tokens || [], triggers);
      if (!found) return;
      capturing = true;
      request = found.request;
      captureFrom = Math.min(Math.max(from + samplesOf(found.captureFromMs - TRIGGER_LEAD_MS), from, floor, oldest()), to);
      lastVoicedAt = now();
      if (onState) onState("capturing");
    }, () => { scanOut = false; });
  };

  return {
    /** Adds 16 kHz mono PCM, as the microphone delivers it. */
    append(samples) {
      if (stopped || samples.length === 0) return;
      for (let i = 0; i < samples.length; i++) ring[(end + i) % keep] = samples[i];
      end += samples.length;
      if (rms(samples) >= VOICED_RMS) {
        voiced += samples.length;
        lastVoicedAt = now();
      }
      if (capturing && end - captureFrom >= samplesOf(L.maxCommand)) finish();
      else maybeScan();
    },
    /** Ends a command whose speaker has gone quiet. */
    tick() {
      if (capturing && now() - lastVoicedAt >= L.commandQuiet) finish();
    },
    /** Forgets everything heard so far: what was said while the assistant spoke is not a command. */
    reset() {
      capturing = false;
      floor = end;
      scannedTo = end;
      voicedAtScan = voiced;
    },
    stop() { stopped = true; },
    get capturing() { return capturing; },
    /** How long the audio held, in milliseconds. */
    get heardMs() { return msOf(end); },
  };
}

/**
 * The microphone as 16 kHz mono signed 16-bit PCM, in short frames. Resolves to `close()`; rejects
 * when the browser has no microphone or the person refused it.
 * @param {(pcm: Int16Array) => void} onPcm
 * @returns {Promise<() => void>}
 */
export async function openMicrophone(onPcm) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
  const Ctor = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
  const ctx = new Ctor();
  const source = ctx.createMediaStreamSource(stream);
  // A script processor rather than a worklet: a worklet is a module the page's policy would have to
  // allow, and this does a little arithmetic on a few thousand samples a tenth of a second.
  const node = ctx.createScriptProcessor(4096, 1, 1);
  const step = ctx.sampleRate / RATE;
  let carry = 0;
  node.onaudioprocess = (e) => {
    const input = e.inputBuffer.getChannelData(0);
    const out = new Int16Array(Math.floor((input.length - carry) / step) + 1);
    let n = 0;
    for (let pos = carry; pos < input.length; pos += step) {
      const i = Math.floor(pos);
      const frac = pos - i;
      const a = input[i];
      const b = i + 1 < input.length ? input[i + 1] : a;
      const v = Math.max(-1, Math.min(1, a + (b - a) * frac));
      out[n++] = v < 0 ? v * 0x8000 : v * 0x7fff;
      carry = pos + step - input.length;
    }
    onPcm(out.subarray(0, n));
  };
  // A muted gain keeps the processor running without playing the microphone back.
  const mute = ctx.createGain();
  mute.gain.value = 0;
  source.connect(node);
  node.connect(mute);
  mute.connect(ctx.destination);
  return () => {
    node.onaudioprocess = null;
    try { source.disconnect(); node.disconnect(); mute.disconnect(); } catch { /* already gone */ }
    stream.getTracks().forEach((t) => t.stop());
    ctx.close().catch(() => {});
  };
}

/**
 * @typedef {"off" | "starting" | "listening" | "capturing" | "reading" | "unavailable" | "denied"} HandsFreeState
 */

/**
 * Hands-free listening against an assistant client: while `enabled`, the microphone is open and
 * scanned for `triggers`, and each command heard is transcribed and handed to `onCommand` as text.
 * `paused` holds listening (while the assistant itself is speaking, say) and forgets what it heard.
 * A transcript is the person's words as heard: the caller decides what to do with them.
 *
 * States: `off`; `starting` (asking for the microphone); `listening`; `capturing` (the trigger was
 * heard); `reading` (the command is being transcribed); `unavailable` (the assistant cannot scan, or
 * the browser has no microphone); `denied` (the person refused the microphone).
 * @param {{ client: any, triggers: string | string[], enabled: boolean, paused?: boolean,
 *   onCommand: (text: string) => void }} options
 * @returns {{ state: HandsFreeState }}
 */
export function useHandsFree({ client, triggers, enabled, paused = false, onCommand }) {
  const [state, setState] = React.useState(/** @type {HandsFreeState} */ ("off"));
  const commandRef = React.useRef(onCommand);
  React.useEffect(() => { commandRef.current = onCommand; }, [onCommand]);
  const pausedRef = React.useRef(paused);
  const listenerRef = React.useRef(/** @type {ReturnType<typeof createTriggerListener> | null} */ (null));
  React.useEffect(() => {
    pausedRef.current = paused;
    if (paused && listenerRef.current) listenerRef.current.reset();
  }, [paused]);
  const key = Array.isArray(triggers) ? triggers.join(",") : String(triggers || "");

  React.useEffect(() => {
    if (!enabled || !client) { setState("off"); return undefined; }
    let gone = false;
    let close = null;
    let timer = null;
    setState("starting");
    (async () => {
      let can = null;
      try { can = await client.speech(); } catch { can = null; }
      if (gone) return;
      if (!can || !can.scan || !can.hear) { setState("unavailable"); return; }
      client.wakeSpeech().catch(() => {});
      const listener = createTriggerListener({
        triggers: key,
        scan: (pcm) => client.scan(pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + pcm.byteLength)),
        onState: (s) => { if (!gone) setState(s); },
        onCommand: async ({ pcm, request }) => {
          if (gone) return;
          setState("reading");
          let text = "";
          try {
            const heard = await client.transcribe(pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + pcm.byteLength));
            text = heard && typeof heard.text === "string" ? heard.text : "";
          } catch {
            text = "";
          }
          if (gone) return;
          setState("listening");
          // The command's own reading usually holds the trigger; when it does not, the scan already decided.
          const found = matchTrigger(text, key);
          const said = found ? found.request : recoverRequest(text, request, key);
          if (said || request) commandRef.current(said || request);
        },
      });
      listenerRef.current = listener;
      try {
        close = await openMicrophone((pcm) => { if (!pausedRef.current) listener.append(pcm); });
      } catch (e) {
        if (!gone) setState(e && e.name === "NotAllowedError" ? "denied" : "unavailable");
        return;
      }
      if (gone) { close(); return; }
      timer = setInterval(() => listener.tick(), 100);
      setState("listening");
    })();
    return () => {
      gone = true;
      if (listenerRef.current) listenerRef.current.stop();
      listenerRef.current = null;
      if (timer) clearInterval(timer);
      if (close) close();
    };
  }, [enabled, client, key]);

  return { state };
}
