// ChatQuestions — questions the assistant put to the person. While they are the last word of the
// conversation each question is drawn with its options as choices (one pick, or toggles when the
// question allows several) and, when the person may answer in their own words, a text field; the
// answers are sent once every question has one. After that, or once the person has said something
// else, the questions are plain text, and the answers are the person's message below them.
//
// `msg` is a `question` entry: `{ questions: [{ question, header?, options: [{ label, description? }],
// multiple, custom }], state }`. `open` says the person may still answer; `onAnswer(msg, answers)` takes
// one `{ header?, question, labels, text? }` per question, in the order shown.

import React from "react";

import { Button } from "../components/Button.jsx";
import { Input } from "../components/fields.jsx";
import { OptionList } from "../components/OptionList.jsx";

function ChatQuestions({ msg, open, onAnswer }) {
  const questions = msg.questions || [];
  const [picked, setPicked] = React.useState(() => questions.map(() => []));
  const [written, setWritten] = React.useState(() => questions.map(() => ""));
  const [sending, setSending] = React.useState(false);

  if (!open) {
    return (
      <div className="chat-asked">
        {questions.map((q, i) => (
          <p key={i} className="chat-asked__row">
            {q.header && <span className="chat-asked__header">{q.header}</span>}
            <span className="chat-asked__text">{q.question}</span>
          </p>
        ))}
      </div>
    );
  }

  const answered = (i) => picked[i].length > 0 || written[i].trim().length > 0;
  const ready = questions.length > 0 && questions.every((q, i) => answered(i));

  const setAt = (set) => (i, value) => set((all) => all.map((v, k) => (k === i ? value : v)));
  const pick = setAt(setPicked);
  const write = setAt(setWritten);

  const send = () => {
    if (!ready || sending) return;
    setSending(true);
    onAnswer(msg, questions.map((q, i) => {
      const answer = { question: q.question, labels: picked[i] };
      if (q.header) answer.header = q.header;
      const text = written[i].trim();
      if (text) answer.text = text;
      return answer;
    }));
  };

  return (
    <div className="chat-questions" role="group" aria-label="Questions">
      {questions.map((q, i) => (
        <div key={i} className="chat-questions__item">
          {q.header && <span className="chat-questions__header">{q.header}</span>}
          <p className="chat-questions__text">{q.question}</p>
          <OptionList size="sm" multiple={q.multiple} label={q.question} disabled={sending}
            options={q.options.map((o) => ({ value: o.label, label: o.label, detail: o.description }))}
            value={q.multiple ? picked[i] : (picked[i][0] ?? null)}
            onChange={(v) => pick(i, q.multiple ? v : [v])} />
          {q.custom && (
            <Input size="sm" wide className="chat-questions__own" value={written[i]} disabled={sending}
              aria-label={"Your own answer to " + q.question} placeholder="Or write your own"
              maxLength={2000}
              onChange={(e) => write(i, e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && ready) { e.preventDefault(); send(); } }} />
          )}
        </div>
      ))}
      <div className="chat-questions__foot">
        <Button variant="primary" size="sm" icon="arrow-up" busy={sending} disabled={!ready} onClick={send}>
          Send answers
        </Button>
      </div>
    </div>
  );
}

export { ChatQuestions };
