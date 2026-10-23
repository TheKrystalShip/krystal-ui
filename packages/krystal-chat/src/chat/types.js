// The assistant chat's shapes, as JSDoc typedefs only. The module exports nothing at runtime; every
// other file in `src/chat`, `src/assistant` and `lib/assistantClient` names these through
// `import("./types.js").Name`, and the emitted declarations carry them to consumers.
//
// Three families live here:
//
//  - the wire contract's frames and bodies, field names exactly as `reference/assistant-wire-contract.md`
//    states them (turn frames, event-stream frames, conversations, attachments, memory, commands, push);
//  - the transcript this chat holds: a conversation and its messages, built from frames by
//    `reduceTurnFrame` and from stored entries by `scaffoldHistory`;
//  - what a site passes in: the `profile`, the slots and the connection badge.

export {};

// ---------- the turn stream ----------

/**
 * @typedef {object} Usage What a turn's context window held when it ended. A figure the assistant did
 * not measure is absent.
 * @property {number} [contextWindow] tokens the window holds
 * @property {number} [usedTokens] tokens the conversation occupies in it
 */

/** @typedef {{ type: "turn.started", seq?: number, turnId: string, conversationId: string, queuedBehind?: string, ahead?: number }} TurnStartedFrame */
/** @typedef {{ type: "text.delta", seq?: number, text: string }} TextDeltaFrame */
/** @typedef {{ type: "audio.delta", seq?: number, mime: string, data: string }} AudioDeltaFrame */
/** @typedef {{ type: "thinking.delta", seq?: number, text: string }} ThinkingDeltaFrame */
/** @typedef {{ type: "context.compacting", seq?: number, stage: "clearing" | "summarizing" }} ContextCompactingFrame */
/** @typedef {{ type: "tool.start", seq?: number, id: string | number, tool: string, arguments?: any, label?: string }} ToolStartFrame */
/** @typedef {{ type: "progress", seq?: number, id?: string | number, tool?: string, label: string, status: "active", key?: string }} ProgressFrame */
/** @typedef {{ type: "tool.result", seq?: number, id: string | number, tool: string, summary: string, result?: any, durationMs?: number, isError?: boolean, refused?: boolean }} ToolResultFrame */
/** @typedef {{ type: "proposal", seq?: number, id?: string | number, tool?: string, handle: string, verb: string, subject: string, target: string, summary: string, expiresAt: string }} ProposalFrame */
/** @typedef {{ type: "question", seq?: number, id?: string | number, questions: Question[] }} QuestionFrame */
/** @typedef {{ type: "log.gap", seq?: number, firstSeq: number }} LogGapFrame */
/** @typedef {{ type: "error", seq?: number, code: "assistant_failed" | "cancelled", message: string }} ErrorFrame */
/** @typedef {{ type: "done", seq?: number, text: string, completedAt?: string, usage?: Usage, turnId?: number }} DoneFrame */

/**
 * A product's own proposal frame (a drafted blueprint, a file change), read beside the contract's
 * `proposal`. `subject` is `{ id, resource? }` here and a string on the contract's frame.
 * @typedef {object} CommandProposedFrame
 * @property {"command.proposed"} type
 * @property {string} verb
 * @property {{ id: string, resource?: string }} [subject]
 * @property {string} [instanceName]
 * @property {string} [confirm] the sentence the action is offered with
 * @property {string} [reason]
 * @property {FileChange} [file]
 * @property {string} [token] the handle that redeems the action
 * @property {string} [configValue] a draft's starting content
 */

/**
 * The state of a turn this surface did not watch from its start, restated whole.
 * @typedef {object} TurnAttachFrame
 * @property {"turn.attach"} type
 * @property {string} turnId
 * @property {"running" | "queued"} state
 * @property {string} [prompt]
 * @property {string} [text]
 * @property {string} [thinking]
 * @property {{ id: string | number, name: string, label?: string, state?: "running" | "done", summary?: string, card?: any }[]} [tools]
 * @property {QueuedTurn[]} [queued]
 */

/** @typedef {{ type: "turn.queue", runningTurnId?: string, queued?: QueuedTurn[] }} TurnQueueFrame */

/** @typedef {{ turnId: string, prompt?: string }} QueuedTurn */

/**
 * Every frame a turn stream delivers to `onEvent`.
 * @typedef {TurnStartedFrame | TextDeltaFrame | AudioDeltaFrame | ThinkingDeltaFrame | ContextCompactingFrame
 *   | ToolStartFrame | ProgressFrame | ToolResultFrame | ProposalFrame | QuestionFrame | LogGapFrame
 *   | ErrorFrame | DoneFrame | CommandProposedFrame | TurnAttachFrame | TurnQueueFrame} Frame
 */

/**
 * One question the assistant put to the person: two to six options, the recommended one first.
 * @typedef {object} Question
 * @property {string} question
 * @property {string} [header]
 * @property {{ label: string, description?: string }[]} options
 * @property {boolean} multiple
 * @property {boolean} custom whether the person may answer in their own words
 */

/**
 * The person's answer to one question; `labels` exactly as sent, in the order shown.
 * @typedef {object} Answer
 * @property {string} [header]
 * @property {string} question
 * @property {string[]} labels
 * @property {string} [text]
 */

/**
 * The body of `POST /turn`.
 * @typedef {object} TurnRequest
 * @property {string} [prompt] required unless `answers` or `attachments` is given
 * @property {Answer[]} [answers]
 * @property {string[]} [attachments] ids of the caller's uploads, in order
 * @property {string} [conversationId] at most 200 characters and no `/`; absent is `default`
 * @property {string} [messageId] makes the request idempotent; the client mints one when absent
 * @property {"voice"} [style] a reply about to be read aloud
 * @property {boolean} [speak]
 * @property {"wav" | "pcm"} [speechFormat]
 */

// ---------- the event stream ----------

/** @typedef {{ type: "hello" }} HelloFrame The client's own report that the stream opened. */
/** @typedef {{ type: "turn.started", seq?: number, origin?: string, turnId: string, conversationId: string, prompt?: string, startedBy?: string | null, startedAt?: string | null, queuedBehind?: string | null }} EventTurnStarted */
/** @typedef {{ type: "turn.ended", seq?: number, origin?: string, turnId: string, conversationId?: string, outcome?: "ok" | "error" | "cancelled" }} EventTurnEnded */
/** @typedef {{ type: "conversation.started" | "conversation.updated" | "conversation.deleted", seq?: number, origin?: string, conversationId: string, reason?: "turn" | "compacted" | "feedback" }} EventConversation */
/** @typedef {{ type: "conversation.switches", seq?: number, origin?: string, conversationId: string, think: boolean, autorun?: boolean }} EventSwitches */
/** @typedef {{ type: "proposal.staged" | "proposal.running", seq?: number, origin?: string, conversationId: string, handle: string }} EventProposal */
/** @typedef {{ type: "proposal.resolved", seq?: number, origin?: string, conversationId: string, handle: string, status: "confirmed" | "declined" | "expired" | "failed", result?: string, at?: number }} EventProposalResolved */

/**
 * Every frame `GET /events` delivers, plus the turn frames of an assistant whose stream carries one
 * conversation's turn.
 * @typedef {(HelloFrame | EventTurnStarted | EventTurnEnded | EventConversation | EventSwitches | EventProposal
 *   | EventProposalResolved | LogGapFrame | Frame) & { origin?: string }} EventFrame
 */

// ---------- conversations on the wire ----------

/**
 * A row of `GET /conversations`. `title` is never null: the first prompt on one line, or `New chat`.
 * @typedef {object} ConversationInfo
 * @property {string} id
 * @property {string} title
 * @property {string} createdAt
 * @property {string} lastActivityAt
 * @property {number} turnCount
 * @property {boolean} think
 * @property {boolean} [autorun]
 */

/**
 * A stored tool call inside a turn record.
 * @typedef {object} StoredToolCall
 * @property {string} tool
 * @property {string} [label]
 * @property {string} [summary]
 * @property {any} [card]
 * @property {any} [result]
 * @property {any} [arguments]
 * @property {boolean} [isError]
 * @property {StoredConfirmation} [confirmation]
 * @property {Resolution} [resolution]
 */

/**
 * A proposal a stored tool left waiting on the person.
 * @typedef {object} StoredConfirmation
 * @property {string} handle
 * @property {string} verb
 * @property {string} [subject]
 * @property {string} [target]
 * @property {string} [summary]
 * @property {string} [expiresAt]
 * @property {Resolution} [resolution]
 */

/**
 * How a proposal ended.
 * @typedef {object} Resolution
 * @property {"confirmed" | "declined" | "expired" | "failed"} status
 * @property {string} [result] the outcome in words
 * @property {number | string} [at]
 */

/**
 * The turn inside a history entry.
 * @typedef {object} TurnRecord
 * @property {string} prompt
 * @property {string} [final] the reply
 * @property {string} [thinking]
 * @property {AttachmentInfo[]} [attachments]
 * @property {StoredToolCall[]} [tools]
 * @property {Usage} [usage]
 * @property {"ok" | "error" | "capHit" | "cancelled" | "empty"} [outcome]
 */

/**
 * One entry of a conversation's history: a turn or a checkpoint.
 * @typedef {object} HistoryEntry
 * @property {"turn" | "checkpoint"} [kind]
 * @property {TurnRecord} [turn]
 * @property {string} [startedAt]
 * @property {string} [createdAt]
 * @property {number} [recordId] the id feedback names
 * @property {number} [turnId]
 * @property {{ rating?: "up" | "down", note?: string | null }} [feedback]
 */

/**
 * `GET /conversations/{id}`: the history oldest first, and the proposals still waiting.
 * @typedef {object} ConversationDetail
 * @property {string} id
 * @property {boolean} think
 * @property {boolean} [autorun]
 * @property {HistoryEntry[]} entries
 * @property {CommandProposedFrame[]} [pending]
 */

/**
 * A turn of the caller's that has not ended, as `GET /turns` lists it.
 * @typedef {object} OpenTurn
 * @property {string} turnId
 * @property {string} conversationId
 * @property {string} [prompt]
 * @property {string | null} [startedBy]
 * @property {string | null} [startedAt]
 * @property {"running" | "queued"} state
 * @property {string | null} [queuedBehind]
 */

/**
 * `POST /conversations/{id}/compact`.
 * @typedef {{ compacted: boolean, messagesCompacted?: number, summary?: string }} CompactResult
 */

/**
 * The body of `POST /conversations/{id}/turns/{recordId}/feedback`.
 * @typedef {{ rating?: "up" | "down" | null, note?: string | null }} FeedbackBody
 */

// ---------- attachments ----------

/**
 * What an upload became, and what a stored message lists. `localUrl` is this page's copy of what it
 * sent and is never stored.
 * @typedef {object} AttachmentInfo
 * @property {string} [id]
 * @property {"image" | "text"} kind
 * @property {string} name
 * @property {string} [mimeType]
 * @property {number} [size]
 * @property {string} [localUrl]
 */

/**
 * `GET /attachments/limits`: what a message may carry now.
 * @typedef {object} AttachmentLimits
 * @property {boolean} images whether the assistant reads pictures
 * @property {string[]} [imageTypes]
 * @property {number} [maxImages]
 * @property {number} [maxImageBytes]
 * @property {number} [maxImagePixels]
 * @property {number} [imageTokens]
 * @property {number} [maxTextTokens]
 * @property {number} [maxTextBytes]
 */

/**
 * A file as it will be uploaded.
 * @typedef {object} PreparedAttachment
 * @property {"image" | "text"} kind
 * @property {Blob} blob
 * @property {string} name
 * @property {string} mimeType
 * @property {number} [width]
 * @property {number} [height]
 * @property {number} [tokens] a text file's size in assistant tokens
 */

/**
 * The outcome of preparing a file: what to upload, or a sentence for the person.
 * @typedef {Partial<PreparedAttachment> & { error?: string }} PreparedOrError
 */

/**
 * One attachment waiting in the composer.
 * @typedef {object} ComposerAttachment
 * @property {string} key
 * @property {"image" | "text"} [kind]
 * @property {string} name
 * @property {string} [previewUrl]
 * @property {"preparing" | "uploading" | "ready" | "error"} status
 * @property {number} progress 0 to 1
 * @property {string} [error]
 */

// ---------- memory, commands, tools, push, speech ----------

/**
 * One memory of the person's.
 * @typedef {object} Memory
 * @property {string} key
 * @property {string} summary
 * @property {string} [body]
 * @property {string} [writtenAt]
 * @property {"person" | "conversation" | "you"} [source] `you` is read as `person`
 * @property {string} [plugin]
 */

/** @typedef {{ maxPerPerson: number, maxSummaryLength: number, maxBodyLength: number }} MemoryLimits */

/** @typedef {{ summary: string, body?: string }} MemoryWrite */

/**
 * A command the assistant lists for this caller.
 * @typedef {object} CommandInfo
 * @property {string} name
 * @property {string} description
 * @property {boolean} [mutates]
 * @property {{ name: string, description?: string, required?: boolean, values?: string[] | null }[]} [options]
 */

/**
 * `POST /commands/{name}`: `command` and `message`, plus whichever of the rest the command produced.
 * @typedef {object} CommandResult
 * @property {string} command
 * @property {string} message
 * @property {string} [conversationId]
 * @property {ConversationInfo} [conversation]
 * @property {boolean} [state] a switch's new position
 * @property {CompactResult} [compaction]
 * @property {CommandInfo[]} [commands]
 * @property {ToolInfo[]} [tools]
 * @property {Memory[]} [memories]
 */

/**
 * A tool of the assistant's catalog. `description` is written for the model.
 * @typedef {object} ToolInfo
 * @property {string} name
 * @property {string} description
 * @property {string} [class]
 * @property {boolean} [deferred]
 * @property {any} [parameters]
 */

/** @typedef {{ publicKey: string, enabled: boolean }} PushKey */
/** @typedef {{ endpoint: string, p256dh: string, auth: string }} PushSubscription */
/** @typedef {{ endpoints: string[] }} PushDevices */

/**
 * What an assistant's speech can do: asked before a microphone is offered.
 * @typedef {{ hear: boolean, speak: boolean, scan?: boolean }} SpeechCapabilities
 */
/**
 * `POST /speech/scan`: `ok` with the words and their times, `busy` (offer the window again a moment
 * later), or `unavailable`.
 * @typedef {{ outcome: "ok" | "busy" | "unavailable", text?: string, tokens?: { text: string, startMs: number, endMs: number }[] }} ScanResult
 */

/**
 * `POST /speech/transcribe`: the words in a recording. An empty text is a quiet room.
 * @typedef {{ text: string }} Transcript
 */

// ---------- confirmation ----------

/**
 * The body a surface hands `client.confirm`: the proposal's handle (as `token` or `handle`) and the
 * decision, `confirm` by default.
 * @typedef {object} ConfirmRequest
 * @property {string} [token]
 * @property {string} [handle]
 * @property {"confirm" | "decline"} [decision]
 */

/**
 * The terminal `result` of a confirmation.
 * @typedef {object} ConfirmResult
 * @property {"result"} [type]
 * @property {string} handle
 * @property {"confirm" | "decline"} decision
 * @property {"confirmed" | "declined" | "failed"} status
 * @property {boolean} success
 * @property {string} text the outcome in words
 * @property {any} [card]
 */

/**
 * A confirmation's `progress` frame.
 * @typedef {{ type: "progress", label?: string, status?: string }} ConfirmProgress
 */

// ---------- the transcript ----------

/**
 * A file change a proposal carries, shown as a diff before it is accepted. A `currentContent` of null
 * with nothing omitted is a file that does not exist yet.
 * @typedef {object} FileChange
 * @property {string} path
 * @property {string} proposedContent
 * @property {string | null} [currentContent]
 * @property {"binary" | "unavailable" | string} [currentOmitted] why the "before" was held back
 */

/**
 * @typedef {object} VoiceMeta The saved shape of a voice note.
 * @property {string} id
 * @property {number} duration seconds
 * @property {number[]} peaks bar heights, 0 to 1
 */

/**
 * One tool row of an answer's Activity line.
 * @typedef {{ id: string | number, label: string, state: "pending" | "done", summary?: string }} ToolRow
 */

/**
 * A skill the assistant's product registered, as `GET /skills` lists it.
 * @typedef {{ name: string, description: string }} SkillInfo
 */

/**
 * A change the assistant made to the person's memory during a turn, from its `remember` or `forget`.
 * @typedef {{ action: "remembered" | "forgotten", key: string, summary: string }} MemoryNote
 */

/**
 * One step a long-running tool reported.
 * @typedef {{ key: string, label: string, status: "active" | "done" }} StepRow
 */

/**
 * One line of a verdict.
 * @typedef {{ label?: string, detail?: string, status?: "pass" | "ok" | "success" | "warn" | "fail" | "danger" }} VerdictLine
 */

/**
 * One entry of a transcript. `role` says which of the fields below it uses; a product's own roles are
 * drawn by `renderEntry` and carry whatever fields the product sets.
 *
 * - `user`: `content`, `ts`, `attachments`, `voice`.
 * - `assistant`: `content`, `thinking`, `tools`, `steps`, `cards`, `pendingCards`, `memories`, `usage`, `turnId`,
 *   `feedback`, `ts`, `startedAt`, `endedAt`, `live`, `error`, `errorText`, `waiting`, `compacting`.
 * - `command`: a proposed action: `cmdId`, `verb`, `subject`, `target`, `summary`, `confirm`, `token`
 *   (the handle that redeems it), `file`, `expiresAt`, `state`, and a product's `subjectId`,
 *   `subjectResource`, `instanceName`, `reason`, `draftYaml`, `bpState`. The thread folds its outcome
 *   in as `verify`.
 * - `verify`: what a confirmed action came to: `id`, `cmdId`, `action`, `state`, `result`, `progress`, `at`.
 * - `question`: `id`, `questions`, `state`.
 * - `system`, `scope`, `checkpoint`, `toggle`, `day`: events about the conversation: `kind`, `label`,
 *   `name`, `toggle`, `on`, `at`.
 * - `commandHelp`, `commandTools`: the cards `/help` and `/tools` leave: `commands`, `tools`.
 *
 * @typedef {object} Message
 * @property {string} role which entry this is: `user`, `assistant`, `command`, `verify`, `question`, `system`, `scope`, `checkpoint`, `toggle`, `day`, `commandHelp`, `commandTools`, or a product's own
 * @property {string} [content] the entry's text
 * @property {number} [ts] epoch ms
 * @property {number | string} [at] epoch ms, or an ISO string as a stored entry carries it
 * @property {boolean} [live] part of a turn still running
 * @property {AttachmentInfo[]} [attachments] the pictures and files a user turn carries
 * @property {VoiceMeta} [voice] a voice note a user turn was spoken as
 * @property {string} [thinking] the reasoning the assistant streamed ahead of its answer
 * @property {(ToolRow & Partial<ToolInfo>)[]} [tools] an answer's tool rows; `commandTools` lists the assistant's tools here
 * @property {StepRow[]} [steps] the progress steps of a stepping tool, checked off as they finish
 * @property {ChatCardData[]} [cards] cards drawn under the finished answer
 * @property {ChatCardData[]} [pendingCards] cards held back until the turn ends
 * @property {MemoryNote[]} [memories] what the assistant wrote down or forgot about the person during the turn
 * @property {Usage} [usage] what the context window held when the turn ended
 * @property {number} [turnId] the record id feedback names
 * @property {{ rating: "up" | "down", note: string | null } | null} [feedback] the person's rating of the answer, with an optional note; null when unrated
 * @property {number} [startedAt] epoch ms the turn began
 * @property {number} [endedAt] epoch ms the turn ended; with `startedAt` it gives the duration the activity line shows
 * @property {boolean} [error] the turn ended in failure; on a proposal, the action failed to run
 * @property {string} [errorText] the reason a failed turn states under its text
 * @property {number} [waiting] turns ahead of this one
 * @property {"clearing" | "summarizing"} [compacting] the stage of a context compaction in progress
 * @property {string} [cmdId] correlates a proposal with its outcome
 * @property {string} [verb] what a proposed action does, as the assistant names it
 * @property {string} [subject] what a proposed action acts on, as a name
 * @property {string | null} [subjectId] the identifier of a proposal's subject
 * @property {string} [subjectResource] the kind of resource a proposal's subject is
 * @property {string} [target] where a proposed action lands, named for the person
 * @property {string} [summary] the sentence that says what a proposed action will do
 * @property {string | null} [confirm] the sentence the action is offered with
 * @property {string | null} [reason] why the assistant proposed the action
 * @property {string | null} [instanceName] the name of the instance a proposal concerns
 * @property {FileChange | null} [file] the file change a proposal would save
 * @property {string | null} [token] the handle that redeems the action
 * @property {string | null} [draftYaml] a draft's content a proposal offers for review
 * @property {"proposed" | "verifying" | "verified" | "failed" | "superseded"} [bpState] where a blueprint proposal stands: proposed, being verified, verified, failed or replaced by a newer one
 * @property {string | null} [expiresAt] when an unanswered proposal lapses, as an ISO string
 * @property {string} [state] a proposal's `proposed`, `confirmed`, `declined` or `expired`; a verify's `pending` or `done`; a question's `open`, `answered` or `asked`
 * @property {boolean} [auto] a proposal that ran without being asked
 * @property {Message} [verify] a proposal's outcome, folded in by the thread
 * @property {string | number} [id] names a verify or question entry
 * @property {{ label: string, verb?: string, serverName?: string }} [action] how an outcome names its action: the label, and optionally the verb and the server it ran against
 * @property {Verdict} [result] what a confirmed action came to, in the product's words
 * @property {string | null} [progress] the latest step of a pending action
 * @property {Question[]} [questions] the questions an asked `question` entry holds
 * @property {string} [kind] `assistant-down` or `reconnected` on a `system` entry
 * @property {string} [label] the words of an event line, or the heading of a `/help` or `/tools` card
 * @property {string} [name] the assistant a `scope` entry names
 * @property {"thinking" | "actions"} [toggle] which switch a `toggle` entry records
 * @property {boolean} [on] where the switch a `toggle` entry records now stands
 * @property {CommandInfo[]} [commands] the commands a `/help` card lists
 * @property {any} [field] a product's own fields ride on its own roles
 */

/**
 * A conversation as this browser holds it: a cache of what the assistant holds, which is the record.
 * @typedef {object} Conversation
 * @property {string} id
 * @property {string} title
 * @property {Message[]} messages
 * @property {number} [created] epoch ms
 * @property {number} [lastActivity] epoch ms
 * @property {number} [turns]
 * @property {boolean} [think]
 * @property {boolean} [autorun]
 * @property {string} [hostId] the assistant that holds it
 * @property {boolean} [remote]
 * @property {boolean} [loaded] whether the transcript has been fetched
 * @property {boolean} [stale] whether the transcript is known to be behind
 */

/**
 * A card a product draws from a tool result. Opaque to the chat: only the profile's `adaptCard` and
 * the site's `renderCards` read it.
 * @typedef {any} ChatCardData
 */

// ---------- what a site passes to Chat ----------

/**
 * The assistant addressed.
 * @typedef {object} AssistantHost
 * @property {string} id
 * @property {string} name
 * @property {string} [title]
 */

/**
 * The header badge and the usable gate, decided by the site.
 * @typedef {object} Connection
 * @property {"online" | "warn" | "danger" | "muted"} tone the badge shows for any tone but `online`
 * @property {string} label
 * @property {boolean} usable whether the assistant is answering
 * @property {string | null} [message] why it is not
 */

/**
 * A proposed action as the product words it.
 * @typedef {object} ProposalView
 * @property {{ label: string, icon?: string, tone?: "info" | "danger" | string }} meta
 * @property {string} [target]
 * @property {string} targetName
 * @property {boolean} [runnable] false draws a disabled button
 * @property {string} [unavailable] why it cannot run here
 * @property {string} [title] names the action when label and target do not read
 * @property {import("react").ReactNode} [body] what the action does, drawn in the card under its title, in place of the summary line
 * @property {string | null} [sub] the line under the title in place of the summary; null draws none
 * @property {string} [declineLabel] the Decline button's words
 */

/**
 * What a confirmed action came to, in the product's words.
 * @typedef {object} Verdict
 * @property {boolean} ok
 * @property {"warn" | "danger"} [tone] when not ok: it ran but the end state was not seen, or it did not run
 * @property {string} headline
 * @property {VerdictLine[]} [lines]
 * @property {number | string} [at]
 */

/**
 * What a product shows of its own: cards, and how a proposed action reads.
 * @typedef {object} Profile
 * @property {(result: any) => ChatCardData | null} adaptCard a tool result to a card for `renderCards`, or null
 * @property {(verb: string) => string} proposalLabel what a proposed action is offered as, absent its own sentence
 * @property {(msg: Message) => ProposalView} proposal the card and the outcome of a proposed action
 * @property {(msg: Message, targetName: string, response: Partial<ConfirmResult> | null) => Verdict} verdict the outcome of a confirmed action
 */

/**
 * What the renderers a site passes may do to the conversation.
 * @typedef {object} ChatApi
 * @property {((msg: Message) => void) | null} run confirms a proposal; null while a transcript is under review
 * @property {(updater: Message[] | ((messages: Message[]) => Message[])) => void} setMessages patches the open transcript
 * @property {() => AssistantClient | null} client the open assistant's client
 * @property {boolean} [readOnly] set while a transcript is under review
 */

/**
 * What every block inside a chat reads through `useChat()`.
 * @typedef {object} ChatHandle
 * @property {"page" | "panel"} layout
 * @property {boolean} empty whether the open conversation has nothing in it yet
 * @property {boolean} usable whether the assistant is answering
 * @property {AssistantHost | null} assistant
 * @property {string} input what the composer holds
 * @property {string} greeting
 * @property {string} noAssistant
 * @property {Suggestion[]} suggestions
 * @property {Conversation[]} conversations
 * @property {string | null} activeId
 * @property {(text: string) => void} ask sends `text` as the next turn
 * @property {(text: string) => void} draft puts `text` in the composer and focuses it
 * @property {() => void} newChat opens an empty conversation
 * @property {(id: string) => void} open opens a conversation
 * @property {() => AssistantClient | null} client
 */

/**
 * A slot's content: a node, or a function of the chat's handle returning one.
 * @typedef {import("react").ReactNode | ((chat: ChatHandle) => import("react").ReactNode)} Slot
 */

/**
 * The places in the chat's frame a site fills; an empty place draws the chat's own block.
 * @typedef {object} ChatSlots
 * @property {Slot} [start] the empty conversation's column
 * @property {Slot} [aboveComposer] a row over the composer
 * @property {Slot} [headerActions] buttons in the header, before the chat's own
 * @property {Slot} [history] the head of the conversation list
 */

/**
 * An opening suggestion: its words, or `{ text, icon }` with a Lucide icon name.
 * @typedef {string | { text: string, icon?: string }} Suggestion
 */

/**
 * What a conversation's switches say in each state.
 * @typedef {{ on: string, off: string }} ToggleCopyPair
 * @typedef {{ thinking: ToggleCopyPair, actions: ToggleCopyPair }} ToggleCopy
 */

/**
 * A transcript under review: the person's conversation named as the site's review listing names it.
 * @typedef {object} Review
 * @property {string} hostId
 * @property {{ id: string, title?: string, turnCount?: number, deleted?: boolean, user?: { displayName?: string, userId: string } } | null} conversation
 */

/**
 * The chat's own address for an assistant: `{ id, name, title }` plus the picker's call.
 * @typedef {object} HostPickerProps
 * @property {AssistantHost[]} hosts
 * @property {AssistantHost | undefined} current
 * @property {(id: string) => void} onSelect
 */

// ---------- the client ----------

/**
 * Every failure of a client call. `code` and `status` are the HTTP status, or `"ECONNREFUSED"` when the
 * assistant could not be reached; `envCode` is the refusal's own code (`queue-full`); `userMessage` is
 * a sentence a surface can show as it stands.
 * @typedef {Error & { code: number | string, status?: number, envCode?: string | null, userMessage: string }} AssistantError
 */

/**
 * @typedef {object} AssistantClientOptions
 * @property {string | (() => string)} baseUrl the assistant's address, asked on every call when a function
 * @property {() => string | null | Promise<string | null>} getToken the bearer to send, or null when nobody is signed in
 * @property {() => Promise<string | null>} [renewToken] a fresh bearer, or null when the session cannot be renewed
 * @property {() => boolean} [canRenew] whether asking `renewToken` is worth it
 */

/** @typedef {{ signal?: AbortSignal }} CallOptions */
/** @typedef {{ signal?: AbortSignal, once?: boolean }} RequestOptions */

/**
 * @typedef {object} AssistantClient
 * @property {(method: string, path: string, body?: any, opts?: RequestOptions) => Promise<any>} request a route of the product's own beside the contract's
 * @property {(opts?: CallOptions) => Promise<any>} me
 * @property {(opts?: CallOptions) => Promise<SpeechCapabilities>} speech
 * @property {(opts?: CallOptions) => Promise<any>} wakeSpeech
 * @property {(pcm: ArrayBuffer, opts?: CallOptions) => Promise<Transcript>} transcribe 16 kHz mono signed 16-bit PCM
 * @property {(pcm: ArrayBuffer, opts?: CallOptions) => Promise<ScanResult>} scan a window of at most ten seconds of the same audio, read for what it holds
 * @property {(text: string, opts?: CallOptions & { format?: "wav" | "pcm" }) => Promise<Blob>} say a line in the assistant's voice
 * @property {(opts?: CallOptions) => Promise<ConversationInfo[]>} conversations
 * @property {(id: string, opts?: CallOptions) => Promise<ConversationDetail>} conversation
 * @property {(id: string) => Promise<null>} deleteConversation
 * @property {(id: string) => Promise<CompactResult>} compact
 * @property {(id: string, turnId: number, body: FeedbackBody) => Promise<null>} feedback
 * @property {(opts?: CallOptions) => Promise<CommandInfo[]>} commands
 * @property {(name: string, body?: { conversationId?: string, argument?: string }) => Promise<CommandResult>} runCommand sent once
 * @property {(opts?: CallOptions) => Promise<ToolInfo[]>} tools
 * @property {(opts?: CallOptions) => Promise<SkillInfo[]>} [skills] what the assistant knows how to do; a client without it offers no Skills page
 * @property {(opts?: CallOptions) => Promise<Memory[]>} memories
 * @property {(opts?: CallOptions) => Promise<MemoryLimits>} memoryLimits
 * @property {(key: string, memory: MemoryWrite) => Promise<Memory>} writeMemory
 * @property {(key: string) => Promise<null>} deleteMemory
 * @property {(opts?: CallOptions) => Promise<PushKey>} pushKey the key a browser subscribes under, and whether the assistant sends pushes at all
 * @property {(opts?: CallOptions) => Promise<PushDevices>} pushDevices the endpoints registered for the caller
 * @property {(body: PushSubscription) => Promise<null>} pushSubscribe registers a browser's subscription with the assistant
 * @property {(body: { endpoint: string }) => Promise<null>} pushUnsubscribe removes the registration of one endpoint
 * @property {(opts?: CallOptions) => Promise<any>} reviewUsers
 * @property {(query?: string, opts?: CallOptions) => Promise<any>} reviewStats
 * @property {(person: string, opts?: CallOptions) => Promise<any>} reviewConversations
 * @property {(person: string, conversationId: string, opts?: CallOptions) => Promise<any>} reviewConversation
 * @property {(person: string, conversationId: string, attachmentId: string, opts?: CallOptions) => Promise<Blob>} reviewAttachment
 * @property {(opts?: CallOptions) => Promise<AttachmentLimits>} attachmentLimits
 * @property {(blob: Blob, name: string, opts?: { signal?: AbortSignal, onProgress?: (sent: number, total: number) => void }) => Promise<AttachmentInfo>} uploadAttachment sent once
 * @property {(conversationId: string, attachmentId: string, opts?: CallOptions) => Promise<Blob>} attachment
 * @property {(opts?: CallOptions) => Promise<OpenTurn[]>} turns
 * @property {(turnId: string, opts?: { onEvent?: (frame: Frame) => void, signal?: AbortSignal, after?: number }) => Promise<void>} follow reads a turn another surface opened
 * @property {(turnId: string) => Promise<null>} stopTurn sent once
 * @property {(body: TurnRequest, opts?: { onEvent?: (frame: Frame) => void, signal?: AbortSignal }) => Promise<void>} turn streams frames until the terminal `done` or `error`
 * @property {boolean} declines whether the confirm channel takes a decline
 * @property {(body: ConfirmRequest, opts?: { onProgress?: (frame: ConfirmProgress) => void, signal?: AbortSignal }) => Promise<ConfirmResult>} confirm
 * @property {(opts?: { onEvent?: (frame: EventFrame) => void, signal?: AbortSignal }) => Promise<void>} events the caller's own conversation changes; resolves when the stream ends
 * @property {(conversationId: string | null) => Promise<any>} attach points an open stream at a conversation
 * @property {() => string | null} streamId the id the assistant gave the open event stream
 */

// ---------- the composer's parts ----------

/**
 * One entry of the slash-command completion list.
 * @typedef {object} CommandSuggestion
 * @property {string} key
 * @property {CommandInfo} command
 * @property {string} [value] the value a second-stage entry carries
 * @property {string} insert what accepting it puts in the composer
 * @property {boolean} runnable false opens the value stage instead of sending
 * @property {string} label how the command is typed
 * @property {string} [detail]
 */

/**
 * One row of a line diff; a `skip` row stands for `count` unchanged lines folded away.
 * @typedef {{ type: "same" | "del" | "add" | "skip", text?: string, count?: number }} DiffOp
 */

/**
 * What `useVoiceRecorder` returns.
 * @typedef {object} VoiceRecorder
 * @property {"idle" | "recording" | "transcribing" | "error" | string} phase
 * @property {number} seconds
 * @property {number[]} levels live waveform levels, 0 to 1
 * @property {string} transcript
 * @property {string} interim
 * @property {string} error
 * @property {boolean} supported whether this browser can record
 * @property {() => Promise<void>} start
 * @property {() => Promise<VoicePayload | null>} finish stops and transcribes; null when nothing was kept
 * @property {() => void} cancel
 * @property {boolean} held a recording that failed to transcribe is still held
 */

/**
 * A finished voice note.
 * @typedef {object} VoicePayload
 * @property {string} id
 * @property {number} duration seconds
 * @property {number[]} peaks bar heights, 0 to 1
 * @property {string} transcript
 * @property {Blob} blob
 */

/**
 * What a `BodyEditor` slot component is given.
 * @typedef {object} MemoryBodyEditorProps
 * @property {string} value
 * @property {(text: string) => void} onChange
 * @property {string} [path] names the memory so an editor can keep a model per memory
 * @property {boolean} [readOnly]
 */
