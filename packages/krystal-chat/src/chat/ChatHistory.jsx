// ChatHistory — the conversation list, opened from the header's history button where the chat has
// no rail to keep it in: a portaled popover in a panel, and a sheet over the whole screen where the
// chat is a page (`sheet`), with a new chat at its head.

import React from "react";
import { createPortal } from "react-dom";
import { Icon } from "@thekrystalship/krystal";
import { IconButton } from "@thekrystalship/krystal";
import { Spinner } from "@thekrystalship/krystal";
import { useModalBehaviour } from "@thekrystalship/krystal";
import { usePortalPopover } from "@thekrystalship/krystal";
import { fmtRelative } from "@thekrystalship/krystal";
import { conversationTitle } from "./conversation.js";

/**
 * The conversations, newest first, each opening on a press and deleted by its own button.
 * @param {object} props
 * @param {import("./types.js").Conversation[]} props.convos
 * @param {string | null} props.activeId
 * @param {(id: string) => void} props.onPick
 * @param {(id: string, event: import("react").MouseEvent) => void} props.onDelete
 * @param {boolean} [props.loading]
 * @param {() => void} [props.close]
 * @param {string} [props.role]
 */
function HistoryRows({ convos, activeId, onPick, onDelete, loading, close, role }) {
  return (
    <>
      {convos.length === 0 && !loading && <div className="k-chat-hist__empty">No conversations yet</div>}
      {convos.map(c => {
        const when = c.lastActivity || c.created || 0;
        const lit = c.id === activeId;
        return (
          <div key={c.id} className={"k-chat-hist__row" + (lit ? " k-chat-hist__row--active" : "")}>
            <button type="button" role={role} className="k-chat-hist__open"
              aria-current={lit ? "true" : undefined}
              onClick={() => { onPick(c.id); close(); }}>
              <Icon name="message-square" size={14} className="k-chat-hist__icon" />
              <span className="k-chat-hist__title">{conversationTitle(c)}</span>
              {when > 0 && <span className="k-chat-hist__time">{fmtRelative(new Date(when))}</span>}
            </button>
            <IconButton icon="trash-2" label={"Delete " + conversationTitle(c)} variant="ghost" size="xs"
              tone="danger" className="k-chat-hist__del" onClick={(e) => onDelete(c.id, e)} />
          </div>
        );
      })}
      {loading && (
        <div className="k-chat-hist__empty"><Spinner size={13} /> Loading</div>
      )}
    </>
  );
}

/**
 * The sheet: the screen's full height from its left edge, over a scrim that closes it, as Escape does; focus stays in it and the screen behind is inert.
 * @param {object} props
 * @param {() => void} props.close
 * @param {import("react").ReactNode} [props.head]
 * @param {import("./types.js").Conversation[]} props.convos
 * @param {string | null} props.activeId
 * @param {(id: string) => void} props.onPick
 * @param {(id: string, event: import("react").MouseEvent) => void} props.onDelete
 * @param {boolean} [props.loading]
 */
function HistorySheet({ close, head, ...rows }) {
  const root = React.useRef(null);
  useModalBehaviour(root, { onClose: close });
  return createPortal(
    <div ref={root} className="k-chat-sheet" role="dialog" aria-modal="true" aria-label="Chats">
      <div className="k-chat-sheet__scrim" onClick={close} />
      <div className="k-chat-sheet__panel">
        <div className="k-chat-sheet__head">
          <span className="k-chat-sheet__title">Chats</span>
          <IconButton icon="x" label="Close" variant="ghost" size="sm" onClick={close} />
        </div>
        <div className="k-chat-sheet__list">
          {head}
          <HistoryRows {...rows} close={close} />
        </div>
      </div>
    </div>,
    document.body
  );
}

// `head` is a site's block at the top of the list (the `history` slot).
/**
 * The conversation list, as a popover or a sheet.
 * @param {object} props
 * @param {import("./types.js").Conversation[]} props.convos
 * @param {string | null} props.activeId
 * @param {(id: string) => void} props.onPick
 * @param {(id: string, event: import("react").MouseEvent) => void} props.onDelete
 * @param {() => void} [props.onOpen] called when the list opens
 * @param {boolean} [props.loading]
 * @param {boolean} [props.sheet] a sheet instead of a popover
 * @param {import("react").ReactNode} [props.head] a site's block at the top of the list
 */
function ChatHistory({ convos, activeId, onPick, onDelete, onOpen, loading, sheet = false, head = null }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const { pos, menuRef } = usePortalPopover(open && !sheet, setOpen, ref);
  const toggle = () => setOpen(o => { const next = !o; if (next && onOpen) onOpen(); return next; });
  const close = React.useCallback(() => setOpen(false), []);
  const rows = { convos, activeId, onPick, onDelete, loading };
  if (sheet) {
    return (
      <div className="k-chat-hist">
        <IconButton ref={ref} icon="history" label="Chats" variant="ghost" size="sm"
          onClick={toggle} aria-haspopup="dialog" aria-expanded={open} />
        {open && <HistorySheet {...rows} close={close} head={head} />}
      </div>
    );
  }
  return (
    <div className="k-chat-hist">
      <IconButton ref={ref} icon="history" label="Chat history" variant="ghost" size="sm"
        onClick={toggle} aria-haspopup="menu" aria-expanded={open} />
      {open && pos && createPortal(
        <div className="k-chat-hist__menu" role="menu" aria-label="Chat history" ref={menuRef} style={pos}
          onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}>
          <div className="k-chat-hist__head">Chat history</div>
          <div className="k-chat-hist__list">
            {head}
            <HistoryRows {...rows} close={close} role="menuitem" />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export { ChatHistory };
