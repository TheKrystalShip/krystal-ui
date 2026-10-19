import { describe, expect, it } from "vitest";
import { createTriggerListener, matchTrigger, recoverRequest, triggerInScan } from "../src/lib/handsFree.js";

const RATE = 16000;
const loud = (ms) => new Int16Array((ms * RATE) / 1000).fill(3000);
const quiet = (ms) => new Int16Array((ms * RATE) / 1000);

describe("matchTrigger", () => {
  it("finds the trigger anywhere, last one wins, punctuation and case aside", () => {
    expect(matchTrigger("Hey, assistant! Next step.", "hey assistant").request).toBe("Next step");
    expect(matchTrigger("okay so hey assistant set a timer", "hey assistant").request).toBe("set a timer");
    expect(matchTrigger("hey assistant no wait, hey assistant, repeat that", "hey assistant").request).toBe("repeat that");
    expect(matchTrigger("Hey assistant.", "hey assistant").request).toBe("");
    expect(matchTrigger("the assistant said hey", "hey assistant")).toBeNull();
  });

  it("takes several triggers, comma-separated or listed", () => {
    expect(matchTrigger("Okay computer, next", "hey assistant, okay computer").request).toBe("next");
    expect(matchTrigger("hé assistant volgende stap", ["hey assistant", "he assistant"]).request).toBe("volgende stap");
  });
});

describe("triggerInScan", () => {
  it("captures from the end of the word before the trigger, joining split tokens", () => {
    const tokens = [
      { text: " So", startMs: 0, endMs: 300 },
      { text: " hey", startMs: 400, endMs: 600 },
      { text: " as", startMs: 600, endMs: 750 },
      { text: "sistant", startMs: 750, endMs: 1000 },
      { text: " next", startMs: 1100, endMs: 1300 },
    ];
    expect(triggerInScan(tokens, "hey assistant")).toEqual({ captureFromMs: 300, request: "next" });
    expect(triggerInScan(tokens.slice(1), "hey assistant").captureFromMs).toBe(0);
    expect(triggerInScan(tokens.slice(0, 2), "hey assistant")).toBeNull();
  });
});

describe("recoverRequest", () => {
  it("cuts the command at the scan's first request word, else keeps all of it", () => {
    expect(recoverRequest("Pay a system, set a ten minute timer", "set a ten minute timer")).toBe("set a ten minute timer");
    expect(recoverRequest("Pay a system, something", "next step")).toBe("Pay a system, something");
    expect(recoverRequest("Pay Assistant Next Step", "", "hey assistant, hay assistant")).toBe("Next Step");
    expect(recoverRequest("Right. Pay assistant, repeat that.", "", "hey assistant")).toBe("repeat that");
    expect(recoverRequest("Something else entirely", "", "hey assistant")).toBe("Something else entirely");
  });
});

describe("createTriggerListener", () => {
  function rig(answer) {
    let now = 0;
    const scans = [];
    const commands = [];
    const listener = createTriggerListener({
      triggers: "hey assistant",
      now: () => now,
      scan: (pcm) => { scans.push(pcm.length); return Promise.resolve(answer(scans.length)); },
      onCommand: (c) => commands.push(c),
    });
    const feed = (block) => {
      for (let i = 0; i < block.length; i += 1600) {
        listener.append(block.subarray(i, i + 1600));
        now += 100;
        listener.tick();
      }
    };
    return { listener, scans, commands, feed, flush: () => new Promise((r) => setTimeout(r, 0)) };
  }

  it("scans only after a second of audio holding speech, and never in silence", async () => {
    const r = rig(() => ({ outcome: "ok", text: "", tokens: [] }));
    r.feed(quiet(3000));
    expect(r.scans).toEqual([]);
    r.feed(loud(500));
    await r.flush();
    expect(r.scans.length).toBe(1);
    expect(r.scans[0]).toBe(3 * RATE);
  });

  it("captures from just before the trigger until the speaker is quiet", async () => {
    const r = rig((n) => n === 1
      ? { outcome: "ok", tokens: [{ text: " hey", startMs: 1000, endMs: 1200 }, { text: " assistant", startMs: 1200, endMs: 1600 }] }
      : { outcome: "ok", tokens: [] });
    r.feed(loud(1500));
    await r.flush();
    expect(r.listener.capturing).toBe(true);
    r.feed(loud(1000));
    expect(r.commands).toEqual([]);
    r.feed(quiet(800));
    expect(r.commands.length).toBe(1);
    expect(r.commands[0].triggered).toBe(true);
    expect(r.listener.capturing).toBe(false);
  });

  it("offers a window the recogniser was too busy for again, and a command never runs past its ceiling", async () => {
    let busy = true;
    const r = rig(() => (busy ? { outcome: "busy" } : { outcome: "ok", tokens: [{ text: " hey", startMs: 0, endMs: 100 }, { text: " assistant", startMs: 100, endMs: 300 }] }));
    r.feed(loud(1200));
    await r.flush();
    busy = false;
    r.feed(loud(100));
    await r.flush();
    expect(r.scans.length).toBe(2);
    expect(r.listener.capturing).toBe(true);
    r.feed(loud(9000));
    expect(r.commands.length).toBe(1);
  });

  it("forgets what it heard when reset, as while the assistant speaks", async () => {
    const r = rig(() => ({ outcome: "ok", tokens: [] }));
    r.feed(loud(1500));
    await r.flush();
    r.listener.reset();
    r.feed(quiet(100));
    expect(r.scans.length).toBe(1);
  });
});
