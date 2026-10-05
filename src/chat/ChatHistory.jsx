// ChatHistory — the conversation list as a portaled popover, opened from the header's history
// button where the chat has no rail to keep it in (the dock, a phone).

import React from "react";
import { createPortal } from "react-dom";
import { Icon } from "../components/Icon.jsx";
import { IconButton } from "../components/Button.jsx";
import { Spinner } from "../components/Spinner.jsx";
import { usePortalPopover } from "../hooks/usePortalPopover.js";
import { fmtRelative } from "../lib/time.js";
import { conversationTitle } from "./conversation.js";

function ChatHistory({ convos, activeId, onPick, onDelete, onOpen, loading }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const { pos, menuRef } = usePortalPopover(open, setOpen, ref);
  const toggle = () => setOpen(o => { const next = !o; if (next && onOpen) onOpen(); return next; });
  return (
    <div className="chat-hist">
      <IconButton ref={ref} icon="history" label="Chat history" variant="ghost" size="sm"
        onClick={toggle} aria-haspopup="menu" aria-expanded={open} />
      {open && pos && createPortal(
        <div className="chat-hist__menu" role="menu" aria-label="Chat history" ref={menuRef} style={pos}
          onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}>
          <div className="chat-hist__head">Chat history</div>
          <div className="chat-hist__list">
            {convos.length === 0 && !loading && <div className="chat-hist__empty">No conversations yet</div>}
            {convos.map(c => {
              const when = c.lastActivity || c.created || 0;
              const lit = c.id === activeId;
              return (
                <div key={c.id} className={"chat-hist__row" + (lit ? " chat-hist__row--active" : "")}>
                  <button type="button" role="menuitem" className="chat-hist__open"
                    aria-current={lit ? "true" : undefined}
                    onClick={() => { onPick(c.id); setOpen(false); }}>
                    <Icon name="message-square" size={14} className="chat-hist__icon" />
                    <span className="chat-hist__title">{conversationTitle(c)}</span>
                    {when > 0 && <span className="chat-hist__time">{fmtRelative(new Date(when))}</span>}
                  </button>
                  <IconButton icon="trash-2" label={"Delete " + conversationTitle(c)} variant="ghost" size="xs"
                    tone="danger" className="chat-hist__del" onClick={(e) => onDelete(c.id, e)} />
                </div>
              );
            })}
            {loading && (
              <div className="chat-hist__empty"><Spinner size={13} /> Loading</div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export { ChatHistory };
