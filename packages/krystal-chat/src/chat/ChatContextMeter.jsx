// How full the conversation's context window is, as the chat options menu draws it: a ring, the
// percentage and the way to compact. Nothing is drawn before the assistant has reported a window,
// because a ring at 0% says nothing a fresh chat does not.

import React from "react";

// The point past which the window is worth watching: the ring and the figures take the warning ink.
const WARN_AT = 75;

// The window's figures from a turn's `usage`, or null when there is no window to speak of.
/**
 * The window's figures from a turn's usage, or null when there is no window to speak of.
 * @param {import("./types.js").Usage | null | undefined} usage
 * @returns {{ win: number, used: number, pct: number, warn: boolean } | null}
 */
function contextUsage(usage) {
  const win = usage && usage.contextWindow > 0 ? usage.contextWindow : 0;
  if (!win) return null;
  const used = usage.usedTokens >= 0 ? usage.usedTokens : 0;
  const pct = Math.min(100, Math.round((used / win) * 100));
  return { win, used, pct, warn: pct >= WARN_AT };
}

// A 16px ring that fills clockwise from the top.
const RING_R = 7;
const RING_C = 2 * Math.PI * RING_R;
/**
 * @param {object} props
 * @param {number} props.pct 0 to 100
 */
function ContextRing({ pct }) {
  return (
    <svg className="k-chat-ctxring" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <circle className="k-chat-ctxring__track" cx="10" cy="10" r={RING_R} />
      <circle className="k-chat-ctxring__fill" cx="10" cy="10" r={RING_R}
        strokeDasharray={((pct / 100) * RING_C).toFixed(2) + " " + RING_C.toFixed(2)}
        transform="rotate(-90 10 10)" />
    </svg>
  );
}

// Compacting through `onCompact`, with the answer it gave: closed when it compacted, a note when it
// had nothing to summarize or failed.
/**
 * Compacting through `onCompact`: closes when it compacted, notes when it had nothing to summarize or failed.
 * @param {(() => Promise<import("./types.js").CompactResult>) | null | undefined} onCompact
 * @param {() => void} onDone
 * @returns {{ compacting: boolean, note: string | null, setNote: (note: string | null) => void, run: () => Promise<void> }}
 */
function useCompact(onCompact, onDone) {
  const [compacting, setCompacting] = React.useState(false);
  const [note, setNote] = React.useState(null);
  const run = async () => {
    if (!onCompact || compacting) return;
    setCompacting(true);
    setNote(null);
    try {
      const r = await onCompact();
      if (r && r.compacted) onDone();
      else setNote("Nothing to summarize yet.");
    } catch (e) {
      setNote(e && e.code === 401 ? "Session expired · sign in again to compact." : "Couldn’t compact · try again.");
    } finally {
      setCompacting(false);
    }
  };
  return { compacting, note, setNote, run };
}

export { ContextRing, contextUsage, useCompact };
