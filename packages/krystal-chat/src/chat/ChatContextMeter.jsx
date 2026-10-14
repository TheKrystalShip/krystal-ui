// ChatContextMeter — how full the conversation's context window is: a ring and a percentage in the
// composer's bar, opening a popover with the figures and the way to compact. Nothing is drawn before
// the assistant has reported a window, because a ring at 0% says nothing a fresh chat does not.

import React from "react";
import { createPortal } from "react-dom";
import { Button } from "@thekrystalship/krystal";
import { usePortalPopover } from "@thekrystalship/krystal";

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

/**
 * @param {object} props
 * @param {import("./types.js").Usage | null} [props.usage]
 * @param {(() => Promise<import("./types.js").CompactResult>) | null} [props.onCompact]
 */
function ChatContextMeter({ usage, onCompact }) {
  const ctx = contextUsage(usage);
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const { pos, menuRef } = usePortalPopover(open, setOpen, ref);
  const compact = useCompact(onCompact, () => setOpen(false));
  const { setNote } = compact;
  React.useEffect(() => { if (!open) setNote(null); }, [open, setNote]);

  if (!ctx) return null;
  const fmt = (n) => n.toLocaleString();

  return (
    <>
      <Button ref={ref} variant="ghost" size="xs"
        className={"k-chat-ctx-btn" + (ctx.warn ? " k-chat-ctx-btn--warn" : "")}
        icon={<ContextRing pct={ctx.pct} />}
        onClick={() => setOpen(o => !o)}
        aria-label={"Context used: " + ctx.pct + "%"}
        title={"Context window · " + fmt(ctx.used) + " of " + fmt(ctx.win) + " tokens"}
        aria-haspopup="dialog"
        aria-expanded={open}>
        <span className="k-chat-ctx-btn__pct">{ctx.pct}%</span>
      </Button>
      {open && pos && createPortal(
        <div className={"k-chat-ctxpop" + (ctx.warn ? " k-chat-ctxpop--warn" : "")} ref={menuRef} style={pos}
          role="dialog" aria-label="Context window">
          <div className="k-chat-ctxpop__head">
            <span className="k-chat-ctxpop__pct">{ctx.pct}%</span>
            <span className="k-chat-ctxpop__cap">of the context window used</span>
          </div>
          <div className="k-chat-ctxpop__bar"><i style={{ width: ctx.pct + "%" }} /></div>
          <dl className="k-chat-ctxpop__nums">
            <dt>Used</dt><dd>{fmt(ctx.used)}</dd>
            <dt>Window</dt><dd>{fmt(ctx.win)}</dd>
          </dl>
          <div className="k-chat-ctxpop__foot">
            <Button variant="outline" size="sm" icon="rotate-ccw" busy={compact.compacting}
              disabled={!onCompact} onClick={compact.run}>
              Compact
            </Button>
            {compact.note && <span className="k-chat-ctxpop__note">{compact.note}</span>}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

export { ChatContextMeter, ContextRing, contextUsage, useCompact };
