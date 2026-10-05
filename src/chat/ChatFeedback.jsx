// ChatFeedback — the thumbs under an assistant answer. The only place the SPA asks whether a reply was
// any GOOD; everything else it shows about a turn (how long it took, which tools it called, whether it
// errored) describes how the answer was produced, not whether it helped.
//
// Two rules shape the interaction:
//
//   * The vote lands on click, before any note is written. A note is worth more than a rating, but a
//     note form that had to be submitted for the vote to count would lose the vote every time someone
//     changed their mind about explaining — and the rating is the part that is always available.
//   * The note is offered on a thumbs-DOWN only, and is skippable. "What went wrong" is the sentence a
//     tuning pass acts on; there is no equivalent question for an answer that worked.
//
// Read-only mode states the recorded verdict in words with no controls, because it is used where the
// reader is not the person who received the answer — a reviewer's opinion of someone else's
// conversation is a different fact, and this surface does not collect it.
//
// It lays out as a wrapping row whose note form takes a line of its own, so a parent row (the answer's
// meta row) can flow it in beside its own controls.

import React from "react";

import { Button, IconButton } from "../components/Button.jsx";
import { Icon } from "../components/Icon.jsx";
import { Input } from "../components/fields.jsx";

const NOTE_MAX = 400;

function ChatFeedback({ turnId, feedback, onRate, readOnly }) {
  // No id means the turn was never persisted, so there is nothing to attach a verdict to. Showing
  // controls that cannot record anything would be worse than showing none.
  const [noteOpen, setNoteOpen] = React.useState(false);
  const [note, setNote] = React.useState("");
  const rating = feedback ? feedback.rating : null;

  if (!turnId) return null;

  if (readOnly) {
    if (!rating) return null;
    return (
      <div className="chat-fb chat-fb--ro">
        <span className={"chat-fb__verdict chat-fb__verdict--" + rating}>
          <Icon name={rating === "up" ? "thumbs-up" : "thumbs-down"} size={13} strokeWidth={2} />
          {rating === "up" ? "Marked helpful" : "Marked unhelpful"}
        </span>
        {feedback.note && <span className="chat-fb__note">“{feedback.note}”</span>}
      </div>
    );
  }

  const rate = (next) => {
    // Pressing the thumb that is already lit withdraws the verdict — the same affordance that set it.
    const withdrawing = rating === next;
    onRate(withdrawing ? null : next, null);
    setNoteOpen(!withdrawing && next === "down");
    setNote("");
  };

  const saveNote = () => {
    if (!note.trim()) return;
    onRate("down", note.trim());
    setNoteOpen(false);
  };

  const closeNote = () => { setNoteOpen(false); setNote(""); };

  return (
    <div className={"chat-fb" + (rating ? " chat-fb--rated" : "")}>
      <IconButton variant="ghost" size="xs" icon="thumbs-up"
        className={"chat-fb__thumb chat-fb__thumb--up"}
        pressed={rating === "up"}
        label="This answer helped"
        title={rating === "up" ? "Undo" : "This answer helped"}
        onClick={() => rate("up")} />
      <IconButton variant="ghost" size="xs" icon="thumbs-down"
        className={"chat-fb__thumb chat-fb__thumb--down"}
        pressed={rating === "down"}
        label="This answer didn’t help"
        title={rating === "down" ? "Undo" : "This answer didn’t help"}
        onClick={() => rate("down")} />
      {feedback && feedback.note && !noteOpen && (
        <span className="chat-fb__note">“{feedback.note}”</span>
      )}
      {rating === "down" && !noteOpen && !(feedback && feedback.note) && (
        <Button variant="link" size="xs" className="chat-fb__ask" onClick={() => setNoteOpen(true)}>
          Say what went wrong
        </Button>
      )}

      {noteOpen && (
        <div className="chat-fb__note-form">
          <Input size="sm" type="text"
            value={note}
            maxLength={NOTE_MAX}
            autoFocus
            placeholder="What was wrong?"
            aria-label="What was wrong with this answer"
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); saveNote(); }
              // Escape abandons the note, not the vote — the thumbs-down is already recorded.
              if (e.key === "Escape") { e.preventDefault(); closeNote(); }
            }} />
          <Button variant="primary" size="sm" onClick={saveNote} disabled={!note.trim()}>Send</Button>
          <Button variant="ghost" size="sm" onClick={closeNote}>Skip</Button>
        </div>
      )}
    </div>
  );
}

export { ChatFeedback };
