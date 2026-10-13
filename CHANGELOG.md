# Changelog

## [0.30.0-dev.1]

### Added
- **`Pill`**, the one small non-interactive label: a `tone` of neutral, accent, info, ok, warn, danger or
  muted, a `size` of md or sm, and an `icon` or a leading `dot` before its text.
- **`PasswordInput`**: an `Input` with a reveal button in its suffix (eye, eye-off), `revealLabel` naming the
  button in each state; every `Input` prop and the ref reach the input.
- **`ProviderMark`, `providerLabel` and `ProviderButton`**: the discord, github, google and microsoft marks
  (any other provider draws a `log-in` icon), their names, and a `Button` carrying a mark with the caller's
  label. `brand` fills it with the provider's colour through the new tokens `--brand-<provider>` and
  `--on-brand-<provider>`, the same in every theme; `busy` swaps the mark for the spinner.
- **`List` and `ListRow`**: a framed list of rows with a `lead`, a title and `sub`, `Pill`s in `meta`, a
  monospace `aside` and `actions`. `onOpen` or `href` stretches the title's hit area over the row while the
  actions stay separate targets; `selected`, `disabled` and `tone` (a thin leading edge) mark a row; at phone
  width `meta` and `aside` wrap under the title.
- **`CardScreen`**: the centred card on the page background with a brand block above and a `foot` under it,
  `width` `sm` or `md`, safe-area padding, and no `style` attribute so a static document can reuse its classes.
- **`CopyField`**: a read-only `Input` with a copy button in its suffix that shows a check after the text is on
  the clipboard.

### Changed
- **The badges draw through `Pill`**: `NavItem`'s and `SubTabs`'s counts, `TabBar`'s pip, `ShowcaseCard`'s
  badge and `BriefCard`'s count keep their class names and share one height, weight, case and tint
  per tone. The showcase badge is no longer uppercase or taller than the others, and the family
  sheets keep only placement and the fills their surroundings need.

## [0.29.4]

### Changed
- **A file that is neither a picture nor text, and none of the kinds named in 0.29.3, says the assistant
  cannot read it**, without advice about converting a picture, which the chat does itself.

## [0.29.3]

### Changed
- **A file the assistant cannot read says what to send instead**, on its chip as it is attached: a PDF
  (paste the text, or a screenshot of the page), an office document (paste the text, or save it as plain
  text or CSV), a recording (use the microphone), a video (a screenshot of the moment), an archive (the
  files inside it). They are told apart by name and type before anything is read.

## [0.29.2]

### Fixed
- **On an Android phone, *File* opens the phone's file browser.** Chrome on Android answers any
  `<input type=file>` with a chooser of the camera and the photo picker, whatever its `accept`, and offers
  the file browser only for the File System Access picker. *File* is that picker
  (`showOpenFilePicker({ multiple: true })`) where the browser has it and the chat is not in another
  origin's frame, which may not show one; a cancelled picker attaches nothing. Everywhere else, framed
  included (a Discord Activity), *File* is the file input as before.

## [0.29.1]

### Fixed
- **A phone can attach a text file.** `+` opens a menu (the chat's own `ChatMenu`, as the options use)
  with two pickers: *Picture*, taking `image/*`, which a phone offers as its photos and camera; and
  *File*, taking any file, which a phone offers as its file browser. One picker for both made Chrome on
  Android offer its photo and camera chooser alone, and a list of text extensions greyed out a file
  whose extension a phone does not map. A file that is neither a picture nor text is refused on its chip
  as before. Where the assistant reads no pictures, `+` opens the file picker at once.

## [0.29.0]

### Changed
- **`createAssistantClient` is the one client of the wire contract**, carrying what the Control Panel's
  own client did, and lives at the import-free subpath `@thekrystalship/krystal-ui/lib/assistantClient`
  (the barrel still exports it).
  - `baseUrl` may be a function, asked on every call; where the assistant is is asked before the
    bearer, so an assistant with no address fails with the site's own error.
  - `renewToken()` and `canRenew()` (optional): a call that may be sent twice is renewed and sent again
    when refused 401; a turn, a confirmation, a command, a stop and an upload are never sent twice, their
    bearer renewed first when its JWT `exp` has passed. Without `renewToken` a 401 is reported.
  - A turn carries a message id and is picked up again from its last frame after a dropped connection
    (`GET /turns/{id}/events?after=`), each frame delivered once; a turn the assistant no longer holds
    ends with a network error, and a cancelled one surfaces as an AbortError. `turns()` and
    `follow(turnId, { after, onEvent, signal })` read the turns open on any surface.
  - The event stream opens with a `hello`, reopens from its last position, and takes a `log.gap`'s
    position; `attach` calls nothing unless the assistant's own `hello` names its stream.
  - `confirm({ token, decision })` sends the contract's `{ handle, decision }`, and the client says
    `declines: true`.
  - Conversations, commands, tools, memories and turns come back as arrays.
  - A refusal carries `envCode`, the refusal's own `code`.
  - Added: `request(method, path, body, opts)` for a product's own routes; the review routes
    (`reviewUsers`, `reviewStats`, `reviewConversations`, `reviewConversation(person, id)`,
    `reviewAttachment(person, id, attachmentId)`).
- **A reviewed transcript's attachments come from the site's `loadReviewAttachment(hostId,
  conversationId, attachment)`**, beside `loadTranscript`, which names the conversation as the site's
  review listing does; the chat no longer asks the client for them.

## [0.28.0]

### Added
- **Attachments to a message.** `+` at the composer's left (a page's one-row composer and a panel's
  bar alike) opens the file picker, offering pictures only where the assistant reads them, and a file
  pasted into or dropped on the composer is taken the same way. A picture is decoded with its
  orientation applied, resized to 2048 pixels on its longer side with the browser's high-quality
  resampling, and written as the smaller of PNG and JPEG, its quality and then its size stepped down
  until it is under about 3 MB, which also drops the camera's location and device data; a PNG already
  within that is sent as it is. A text file is read as UTF-8 and counted at three characters a token,
  as the assistant counts it. Each is uploaded as it is attached, as a chip over the field with its
  thumbnail or file icon, its progress and a remove button. A refusal stands on its chip (not a
  picture or text, a picture over the message's count, a text file longer than a message carries) and
  the text files of a message together over the limit stop the send with the reason. A message may be
  its attachments alone.
- **Sent attachments in the transcript.** A message's pictures are thumbnails over its bubble, one
  alone shown in its own proportions, and open full size in `ChatLightbox`; its text files are chips
  that open the file. History reads them back through the client, since reading one takes the
  person's credential, once per attachment for the life of the page; a message this page sent shows
  its own copy until a reload.
- `createAssistantClient` gains `attachmentLimits()`, `uploadAttachment(blob, name, { onProgress,
  signal })` (with upload progress) and `attachment(conversationId, id)`. `Chat` offers attachments
  only to a client that has them, and shows a reviewed transcript's through `reviewAttachment`.
- Exports: `ChatMessageAttachments`, `ComposerAttachments`, `ChatLightbox`, and from
  `src/chat/attachments.js` `prepareAttachment`, `acceptFor`, `textOverLimit`, `sizeLabel`.

## [0.27.0]

### Added
- **`Chat`'s `layout="page"`: the chat as the whole page a phone's tab opens.** It stands on the
  page's background with no frame, so a black theme is black edge to edge; its header draws its rule
  once the thread scrolls under it. The header carries the conversation's title, a way back to the
  empty conversation (reopening one already waiting empty rather than starting a second) and the
  conversation list as a sheet from the left edge; no close or window buttons and no rail at any
  width. The empty conversation is the greeting in the middle of the screen, with the opening
  suggestions as a row of chips over the composer, each one sent as it is picked, until the person
  writes. The composer is one row: the field growing as it fills, the options (Thinking, Read aloud)
  and the microphone or send, at the tight `--r-sm` radius. An answer carries no name above it. While
  the person writes, `body.chat-typing` gives the tab bar's room to the keyboard, which the chat lays
  over the page with the VirtualKeyboard API where the browser has it; a press elsewhere ends typing
  once it has landed. `layout="panel"` is the default and draws the chat as before.
- **`slots`: a site's own blocks in the chat's frame.** `start` (the empty conversation's column),
  `aboveComposer`, `headerActions` and `history` (the head of the conversation list) each take a node
  or a function of the chat's handle; a place left empty draws the chat's own blocks. Every block in
  the chat reads the handle with `useChat()`: `layout`, `empty`, `usable`, `assistant`, `input`, the
  `conversations`, `ask(text)`, `draft(text)`, `newChat()`, `open(id)` and `client()`. The chat's own
  blocks are exported for a site composing its own: `ChatGreeting`, `ChatSuggestions`,
  `ChatSuggestionChips`, `ChatRecent`, `ChatPrivacyNote`, and `ChatBlock` to set a site's block in the
  column.
- **`usePhone()`**: whether the window is 768px wide or narrower, following it as it changes.

### Changed
- **`BriefingPanel` is replaced by the `start` slot.** A site's block in the empty conversation is
  composed there with the chat's own (`ChatGreeting`, `ChatSuggestions`, `ChatBlock`, `ChatRecent`,
  `ChatPrivacyNote`), and takes `useChat().draft` where it was handed `onPick`. Its wrapper is
  `.chat-start__block`, in place of `.chat-start__brief`.
- **A popover follows its button.** One that a layout change moves while the popover is open (a bar
  coming back, a panel growing) has the popover placed against it again, each frame it is open,
  where it was placed only on a resize or a scroll.

## [0.26.6]

### Fixed
- **A chat in the dock draws no frame of its own.** The dock draws the panel's edges and the bar or
  strip under it draws the bottom one, so `.chat-main` inside `.assistant-dock .chat-page--docked`
  has no border: on a phone its bottom edge stood as a second line on the tab bar's, or on a site's
  strip above the bar, and on a wide screen its left edge beside the dock's.

## [0.26.5]

### Changed
- **On a television a `CollectionTile`'s posters are square-cornered.** An image drawn with rounded
  corners at the panel's resolution costs a television's GPU far more than a square one, and a tile
  draws three or four. On the reference Fire TV, moving down through Cinema's Discover misses a frame
  budget by more than 50 ms 16 to 23 times over 19 moves rather than 33 to 41, and its worst stall is
  103 to 137 ms rather than 203 to 237.

## [0.26.4]

### Changed
- **A `TvCard` asks for its picture once it is a quarter of a screen from being seen.** Every card is
  rendered, so it no longer leaves its picture to the browser's lazy loading, whose reach on a
  television covers a whole page: it shows its surface until it is within a quarter of its scrollers
  of the screen, down the page and along a row. `useNear` (the hook a `CollectionTile` already used)
  takes how far ahead to look, and a tile still looks half a screen ahead. A page loads the pictures
  it did before every card was rendered: on Cinema's Home in the television lab, 40 requests and
  2.6 MB.

## [0.26.3]

### Changed
- **Every `TvCard` is rendered, those past the screen's edge too.** A card skipped until it nears the
  screen was styled and laid out again each time a moving row or page carried it across that edge.
  On the reference Fire TV, with the site's dimming drawn as an overlay, moving through Home's and
  Movies' rows and in and out of the bar misses a frame budget 23 to 28 times over 26 moves rather
  than 33 to 38, and the worst stall crossing into the bar is 120 to 140 ms rather than 220.

## [0.26.2]

### Changed
- **On a television, focus is lit by the glow alone, drawn at once.** A focused card, collection
  tile, button, place in the bar or pill keeps its lift and its glow, without the drop shadow under
  it, and the glow no longer eases in: either one is painted again at the panel's resolution on every
  frame of the lift, which a television's GPU does not keep up with. On the reference Fire TV, moving
  through Home's and Movies' rows misses a frame budget 32 times over the sweep's 28 moves rather than
  99 to 103.

## [0.26.1]

### Changed
- **A `CollectionTile` asks for its posters within half a screen of being seen.** One
  `IntersectionObserver` shared by every tile watches with half a screen of margin, counted past the
  clipped edge of a rail the tile scrolls in (`scrollMargin`), and a tile draws its posters' images once
  it is that near. The browser's own lazy loading reaches much further, which on a page a few screens
  tall is all of it. An engine without `scrollMargin` draws them at once and leaves them to that lazy
  loading.

## [0.26.0]

### Changed
- **`CollectionTile`'s posters load lazily.** Each poster is an image (`.collection-tile__art`) filling
  its slot, `.collection-tile__poster` in a fan and `.collection-tile__cell` in a strip, loaded lazily
  and decoded off the main thread, so a tile far down a page or along a rail fetches nothing until it
  nears the screen. A slot shows `--surface-3` until its poster arrives.

## [0.25.1]

### Fixed
- **The dock has no resize handle on phones.** At 768px and narrower the dock takes the whole width,
  so `.assistant-dock__resize` is not shown there; wider, it keeps the tab.

## [0.25.0]

### Changed
- **The dock's resize handle is a tab inside the dock's left edge.** `.assistant-dock__resize` is a
  14px strip along the inside of the edge, and its `::before` is the tab: 6px wide and 40px long, its
  long side along the edge, its ends cut at 45 degrees, nothing of it outside the panel. It is
  `--border-strong` at rest and `--krystal-teal` under a pointer or while held
  (`.assistant-dock__resize--active`). A site's drawer from the bottom edge draws the same tab lying
  along its top edge.

## [0.24.0]

### Added
- **`ShowcaseCard`'s `eyebrow`**: `{ label, icon?, tone?: "accent" }`, a short line set on the art
  above the name saying what kind of thing the card is. It is light on the dark art in every theme,
  and `"accent"` mixes the theme's accent toward white so it reads there too. Styles:
  `.showcase-card__eyebrow`, `.showcase-card__eyebrow--accent`.
- **`ShowcaseCard`'s `segments`**: an array of fractions from 0 to 1, the thing's parts in order,
  drawn along the art's foot as one short bar per part, each filled as far as its fraction. It takes
  the foot in place of `progress`. Styles: `.showcase-card__segments`.

### Changed
- The name and the eyebrow sit in `.showcase-card__caption`, which is placed at the art's foot;
  `.showcase-card__name` is no longer positioned itself.

## [0.23.0]

### Added
- **`ShowcaseCard`'s `ribbon`**: a switch hanging from the art's top edge on the left, for keeping the
  thing without opening it. While `on` it is filled, draws `iconOn`, and is always shown; while off it
  is shown on the card a fine pointer hovers or that holds focus, and always on a touch screen. Its
  button is a finger's size around a smaller tab, `onClick` gets the press's event, and a `corner`
  moves over to make room. Styles: `.showcase-card__ribbon`, `.showcase-card__ribbon-tab`.

## [0.22.0]

### Added
- **`useCarousel`**: one of `count` slides at a time, turning to the next every `interval` and back to
  the first after the last. It holds still while a mouse is over the slides, while keyboard focus is in
  them (`pauseOnFocus`), while the page is hidden and while `paused` is set, keeps what was left of a
  slide's time across a pause, and never turns by itself under reduced motion. A key or a press in the
  slides starts the slide's time over, and a touch swiped across them turns them. `rootProps` go on
  what holds the slides.
- **`CarouselPager`**: a mark a slide under a `useCarousel`, the shown one long and filling over the
  slide's time, held while the slides are held. Choosing a mark shows its slide; `indicator` draws the
  marks unfocusable, for a television. Styles: `styles/carousel.css`.

## [0.21.2]

### Fixed
- A `CollectionTile` of `size="sm"` draws its fan above its name's line rather than beside it, so a
  name as long as the tile is wide never runs under the posters.

## [0.21.1]

### Fixed
- A `CollectionTile` of `size="sm"` keeps its fan clear of its name: the fan is narrower and the name
  has more of the tile.

## [0.21.0]

### Added
- **`CollectionTile`**: a set of titles as a link, drawn from its posters. `variant="fan"` sets a mark
  and a name at the left with three posters fanned inside the right edge, for a set whose order means
  nothing; `variant="strip"` lays its posters along the top in order, numbered, with the rest counted,
  and with `total` and `watched` follows somebody through it: the titles ahead dim, a segment per title
  fills, `next` is named, and `doneLabel` once all are watched. It fills the width it is given at 16:9
  (`size="sm"`: 25:16 and one poster fewer in a strip) and sizes everything inside from that width. On
  a television it is a flat wide card focused as a `TvCard` is. Styles: `styles/collection-tile.css`.

## [0.20.2]

### Fixed
- Speech endpoints use the correct harness routes: `POST /speech/transcribe` for transcription and `POST /speech/wake`
  to signal an opening microphone or voice channel.

## [0.20.1]

### Changed
- The assistant has no name: the composer placeholder, the "isn't answering" hint, the stopped-answering
  row and the command verdicts say "the assistant" whatever the host is called.
- Bursts of `conversation.activity` and `conversation.updated` events read the conversation listing
  once, after the burst has been quiet for 500 ms.

## [0.20.0]

### Added
- **A turn running on another surface is seen and followed.** `turn.started` and `turn.ended` on the
  event stream keep a list of the person's open turns (read whole through the client's optional
  `turns()` on arrival, on a reconnect and on returning to the foreground). A running turn on the open
  conversation that this surface did not start is read through the client's optional `follow(turnId,
  { signal, onEvent })`, so its prompt and the reply so far appear and the rest is drawn as it is
  written; when it ends the conversation is read again. The composer is busy for it, Stop reaches it,
  and a prompt waiting behind it shows as a chip with its place and a discard.
- A turn this surface sent that waits behind another says so on its answer ("Waiting for the turn ahead",
  with how many are ahead) until its first frame.

## [0.19.0]

### Added
- **The chat reads the assistant wire contract's own frames.** A `proposal` frame draws the same
  action card a stored turn's `confirmation` restates, with the proposal's sentence, an `expiresAt`
  that turns the card to Expired when it passes, and a Decline button for a client that sets
  `declines: true` (the confirm channel then takes `{ token, decision: "decline" }`). A stored turn's
  proposal is rebuilt with what became of it, and `proposal.staged`, `proposal.running` and
  `proposal.resolved` on the event stream move the card on every surface. `turn.started` addresses
  the turn Stop reaches; `context.compacting` shows as the wait it is; `conversation.updated` and
  `log.gap` re-read the list; a `progress` frame with no `key` is keyed by its call and words.
- **Questions.** A `question` frame is drawn as `ChatQuestions`: each question with its options as
  choices (a single pick, or toggles for `multiple`), a field for the person's own words when
  `custom` is true, and one press to send. The answers go out as the next turn with an empty prompt;
  a question the person has moved past, and one in a stored conversation, is plain text.
- `Chat` calls `wakeSpeech()` on a client that has it when the microphone opens.
- A stored turn's `card` and `recordId` are read beside the older `result` and `turnId`; memory
  rows tagged `plugin`, `source: "person"` and `maxPerPerson` are read beside `you` and `maxPerOwner`.

### Changed
- `useConversationStream` works with a client that has no `attach` or `streamId`.

### Fixed
- The composer no longer passes React an `onCompositionCancel`, which is not an event it has (a
  cancelled composition ends with `compositionend`), so mounting the chat stops logging a warning.

## [0.18.1]

### Fixed
- **A `Button` with `href` keeps its label on hover.** The link hover colour no longer reaches a
  button or icon button drawn as a link, so a primary one's words and icon stop turning the colour
  of its own hover fill, and no variant grows an underline.

## [0.18.0]

### Added
- **`OptionList`**: a choice drawn as full-width rows in one bordered group, each row a real radio or
  checkbox inside its label (`multiple`), with a `detail` after the label and a monospace `aside` at
  its end. The chosen row of a single choice is tinted with the accent; `size` is `md` (52px rows) or
  `sm` (44px, 48px on a phone); `collapsedAfter` with `moreLabel` ends a long list with a row that
  reveals the rest; `variant="segmented"` lays a short single choice side by side, label over aside.
- **`Meter`**: a 6px bar holding one `value` (a progressbar) or several `segments` in tones laid end
  to end (a meter), with a monospace caption from `start` and `end`.
- Both are drawn by `styles/controls.css` (`.k-optlist*`, `.k-meter*`).

## [0.17.2]

### Fixed
- **A television page whose cards all step back at once no longer stalls.** A `TvCard` changes
  opacity without a transition, and one off the screen is skipped until it nears it: entering Home's
  rows on a Fire TV restyled every card on every frame of 73 transitions.

## [0.17.1]

### Fixed
- `TvBackdrop` decodes a new picture before fading it in, and no longer animates its height between
  sizes: on a Fire TV both stalled the frame the artwork changed in.

## [0.17.0]

### Added
- **The parts a television page is built from**: `TvBar` and `TvBarButton`, `TvBackdrop`,
  `TvSpotlight`, `TvRow`, `TvCard` and `TvTile`, drawn by `styles/tv.css`, with the margins and card
  sizes as `--tv-*` tokens on `:root[data-tv]`.
- `--shadow-lift` and `--glow-accent` tokens.

### Changed
- **Focus on a television lifts what it is on** instead of drawing an outline and a halo: a card grows
  and rises with a hairline and the accent's light while the rest of its row dims, a button or a place
  in the bar turns into a light pill, and anything else takes the hairline and the light. A primary
  button's ink is dark there.

## [0.16.0]

### Added
- **A site on a television**: with `data-tv` on the root element, the focused element carries a ring
  that reads from across a room (an opaque outline with a gap, and the accent outside it), and
  `Rail` draws no scroll arrows, since a row scrolls to whatever takes focus in it. `styles/tv.css`,
  last in `styles.css`; a site importing sheets one by one adds it after everything else.

### Fixed
- A key pressed on one of `ShowcaseCard`'s `tools` goes on to the document, so a site's own keys
  (Escape, the arrows) answer while a tool has focus. The card's Enter still opens the card only from
  the card itself.
- `styles.css` imports `styles/assistant-pages.css` once.

## [0.15.0]

### Added
- **The assistant's pages**, each over the assistant client and naming no product:
  `AssistantChatsPage` (the chat's `listTarget` as a page), `AssistantMemoryPage` and its section
  `AssistantMemory` with `AssistantMemoryEditor` (the list, the counts against the assistant's
  limits, writing, correcting and forgetting; `unavailable`, `whose`, `BodyEditor` and
  `keyPlaceholder` are the site's), `AssistantSkillsPage` (commands offered through `onUse`, tools
  listed) and `AssistantNotifications` (this browser's push subscription, on and off; `offSub` and
  `children` are the site's). `assistantPushStatus`, `assistantPushSubscribe` and
  `assistantPushUnsubscribe` are its calls on their own.
- `createAssistantClient` gains `tools`, `memories`, `memoryLimits`, `writeMemory`, `deleteMemory`,
  `pushKey`, `pushDevices`, `pushSubscribe` and `pushUnsubscribe`, on the routes the assistant
  wire contract names.
- `styles/assistant-pages.css`, after `settings.css` in `styles.css`: the pages' reading measure
  (`.assistant-page`) and the memory editor (`.mem-editor__*`). A site importing sheets one by one
  adds it. `settings.css` gains `.settings-value` and `.settings-value--mono`.

## [0.14.0]

### Changed
- **The chat window is redrawn in the design system's language**, on every surface that renders
  `Chat`. Three shapes only: text in the column, a card, a one-line event row. The look moves into
  four new sheets after `chat.css` in `styles.css`: `chat-chrome.css` (header, review bar, empty
  conversation, history), `chat-turns.css` (messages, markdown, feedback, the Activity line),
  `chat-actions.css` (the action card, diff, events, command cards, card rows) and
  `chat-composer.css` (the composer, its switches and menus, the slash menu, voice). A site that
  imports sheets one by one adds the four.
- Your message is a bubble with its time on hover; an answer is text, its mark and name only on the
  first answer of a run (`ChatMessage` `lead`), with copy, the thumbs and the time under it on hover.
  Classes `.chat-turn*`; the `user` prop is no longer read.
- `renderMarkdown` draws headings, lists (one level of nesting), tables, links (http and https only),
  italic, quotes, rules and fenced code in a card with a language bar and a copy button. `.chat-md__*`.
- The assistant's work is one Activity line (`ChatActivity`, `.chat-activity*`): working with the
  current step, then "Thought and used 3 tools · 6s", opening to the list of steps. An answer
  carries `startedAt` and `endedAt`, live and from history.
- A failed or interrupted turn is `error: true` with `errorText`, drawn as a quiet warning line under
  what the answer did say.
- A proposed action is one card (`ChatCommand`, `.chat-actcard`) that changes in place: proposed, the
  confirm step, running, then verified, not verified or failed; a `verify` entry carrying the
  command's `cmdId` folds into it. A `write_file` proposal with `file.currentContent` shows a line
  diff (`ChatFileChange`, `.chat-diff*`). `profile.proposal` may return `title`; a verdict may carry
  `tone` ("warn", "danger").
- Toggles, scope changes, compaction and the assistant going and coming back are event rows
  (`ChatEvent`, `ChatEventRow`, `.chat-event*`), worded from what they record and timed by their
  entry's `at`. A day row (`ChatDaySeparator`) marks a change of date.
- `/help` and `/tools` are `ChatCard`s (`.chat-cmds*`); a command row's Use puts it in the composer
  (`ChatThread` `onUseCommand`).
- `ChatCard`: tones neutral, accent, ok, warn, danger, muted; confidence as a dot and a word; the open
  action a ghost button; the head wraps in a narrow column. `ChatCardRows` / `ChatCardRow` (label,
  value, verdict ok/warn/danger/neutral, action; no label = full width) are the row every card body
  uses.
- The header names the conversation, carries a Conversation options menu (Compact, Delete) on a full
  page and the host picker and window buttons in a dock, and shows the connection only when it is
  not online. The review bar is one line.
- The empty conversation is a greeting, suggestion cards (`suggestions` items may be
  `{ text, icon }`), recent conversations and the privacy line (`.chat-start*`, `.chat-recent*`).
- The composer's switches are labelled toggle buttons, and one options menu of switches below 560px
  of composer width; the context meter is a ring that opens its numbers and Compact; queued
  messages and the unavailable line sit above the box; recording takes the box over. The keyboard
  hint is gone; the placeholder mentions `/` when the assistant offers commands.

### Removed
- `ChatThinking`, `ChatContextPill`, `ChatSteps` and `ChatPending` (the Activity line draws all four),
  and the rules of the old chat parts in `chat.css`: `.chat-msg*`, `.chat-code*`, `.chat-disc*`,
  `.chat-context*`, `.chat-steps*`, `.chat-actions*`, `.chat-action*`, `.chat-verify*`,
  `.chat-scope-notice`, `.chat-toggle-notice*`, `.chat-cmdcard*`, `.chat-id*`, `.chat-headbtn*`,
  `.chat-act-toggle*`, `.chat-ctx*`, `.chat-send*`, `.chat-empty*`, `.chat-suggestion*`, `.voice-bar*`,
  `.voice-note*`, `.chat-railbar*`, `.chat-page--solo` and their companions.

## [0.13.1]

### Added
- `Chat` `listTarget`: a page of the site's own where the conversation list is drawn full width —
  New chat as a primary button, a row per conversation with its delete, the open one marked, and an
  `EmptyState` when there are none. `.chat-list`, `.chat-list__rows`, `.chat-list__item`,
  `.chat-list__item--active`, `.chat-list__open`, `.chat-list__title`.

### Changed
- A chat whose conversation list a site draws itself (`railTarget` or `listTarget`) carries no
  history popover in its header.

## [0.13.0]

### Added
- The page furniture, in `styles/page.css` (after `controls.css` in `styles.css`):
  - `PageHeader`: a page's title, an optional `sub` line and its `actions`. `.k-pagehead`,
    `.k-pagehead__titles`, `__title`, `__sub`, `__actions`.
  - `Notice`: a line a page says about itself, in a `tone` of `info` (default), `ok`, `warn` or
    `danger`, with an icon; a danger notice is an alert. `.k-notice`, `.k-notice--<tone>`.
  - `EmptyState`: an icon in a disc, a title, a line or two, a monospace `detail` and `actions`;
    `tone` `neutral`, `accent`, `warn` or `danger`; `page` for the whole screen on a card.
    `.k-empty`, `.k-empty--<tone>`, `.k-empty--card`, `.k-empty-page`, `.k-empty__*`.
  - `ErrorBoundary`: catches what throws while its children render; `fallback` (a node or
    `(reset, error) => node`), `resetKey`, `onError`; without a fallback, a whole-screen crash with
    the error and a reload.
- `Dialog`, in `styles/dialog.css` (after `portal.css`): a framed sheet on `Modal` with a head
  (`icon`, `title`, close), `sub`, a scrolling body and a `foot`; `size` `md` (520px), `lg` (720px),
  `xl` (960px); `fill` for a definite height, full screen on a phone; `art` for a banner; `as="form"`
  with `onSubmit`. `.k-backdrop`, `.k-modal`, `.k-modal--<size>`, `.k-modal--fill`, `.k-modal__art`,
  `__head`, `__icon`, `__title`, `__sub`, `__close`, `__body`, `__foot`.
- `ChatCard` and `ConfidenceBadge`: the card a product draws under an answer, drawing the `.ev-card`
  family chat.css already styled. `tone` `neutral`, `ok`, `danger` or `muted` (`.ev-card--<tone>`);
  `confidence` `confirmed`, `likely` or `possible`; `onOpen` with `openLabel`, or an `action` node. Its
  way to the full context is an outline `Button`.
- `Chat` `railTarget`: the element a site's sidebar gives the conversation list, which is drawn
  there as nav items (`.chat-convos`, `.chat-convos__item`, `.chat-convos__del`) while the chat takes
  the whole width (`.chat-page--railless`). `onShowConversation` and `conversationShown` for a site
  that shows other pages beside the list. `.chat-page--framed` fills an `AppShell`'s main column.
- `k-rise`, the keyframe a sheet arrives with, in `styles/motion.css`. The chat's pop-out already
  named it.

### Fixed
- On a phone with a tab bar, the main column ends above the bar. Its padding was added to a full
  screen's height, so the last of every page sat under the bar.
- A `ChatCard` whose sub line is longer than the card wraps instead of being cut off.

### Added
- The basic controls, in `styles/controls.css` (after `scrollbar.css` in `styles.css`), extracted
  from the Control Panel's button and field families and made one set:
  - `Button`: variants `primary`, `secondary` (default), `outline`, `ghost`, `accent`, `danger`,
    `warning`, `link`; sizes `xs` 26, `sm` 30, `md` 34 (default), `lg` 38, `xl` 46; `icon` and
    `iconRight` (a Lucide name or a node), `tone` (`danger`, `warning`, `success` on hover), `busy`,
    `pressed`, `armed`, `wide`, and `href` for a link drawn as a button. Forwards its ref.
    `.k-btn`, `.k-btn--<variant>`, `.k-btn--<size>`, `.k-btn--tone-<tone>`, `.k-btn--wide`,
    `.k-btn--bare`, `.is-armed`.
  - `IconButton`: the square form, `label` as its accessible name and tooltip; variants `outline`
    (default), `ghost`, `secondary`; sizes `xs`–`lg` on Button's heights; `tone`, `busy`, `pressed`,
    `armed`. `.k-iconbtn`.
  - `Spinner`: a ring in the current colour, `size` in pixels, announced as a status when given a
    `label`. `.k-spinner`.
  - `Input` and `Textarea`: sizes `sm`, `md`, `lg`; `mono`, `wide`, `invalid`; `prefix` and `suffix`
    words inside the frame (`.k-input--affixed`, `.k-input__el`, `.k-input__affix`). Forward their
    refs. `.k-input`, `.k-textarea`.
  - `Checkbox`: a native checkbox in the accent colour with its words beside it; `onChange` receives
    the checked state. `.k-check`, `.k-check__box`, `.k-check__label`.
  - `Field`: a label, its control, and a hint or an error; `aside` beside the label; `group` for a
    frame holding several controls. `.k-field`, `.k-field__label`, `.k-field__aside`,
    `.k-field__hint`, `.k-field__error`.
- `Select` `size` (`sm`, `md`, `lg`) and an `inline` variant sized to its options.
- `k-armed`, the keyframe an armed control breathes with, in `styles/motion.css`.

### Changed
- `Toggle` is drawn by `.k-toggle` and `.k-toggle__knob` and is a `role="switch"` with
  `aria-checked`; its knob takes `--on-accent` when on.
- The chat's verifying, history-loading and compacting states draw `Spinner`, which is styled by
  the package.

## [0.11.0]

### Added
- `styles/scrollbar.css`: every scrollable surface's scrollbar, a thin track-less thumb inset from
  its edge in the theme's `--scrollbar-thumb` and `--scrollbar-thumb-hover`, with `scrollbar-width`
  and `scrollbar-color` for the browsers that draw the standard properties. It sits after
  `motion.css` in `styles.css`.

## [0.10.0]

### Added
- `ShowcaseCard` `tools`: `[{ icon, label, onClick, on?, tone?: "danger" }]`, small round buttons on
  the art's top-right (under the badge when there is one) for what is done to the thing besides
  opening it; `on` marks a switch that is on. A pointer that hovers finds them on the card it is over,
  and a touch screen shows them always. `.showcase-card__tools`, `.showcase-card__tool`.
- `ShowcaseCard` `progress`: a number from 0 to 1 drawn as a bar along the art's foot, the success
  colour at 1. `.showcase-card__progress`.

## [0.9.0]

### Added
- `Skeleton`: one placeholder block, `w` and `h` any CSS length (a number is pixels) and `r` its
  corner radius, shimmering while a surface loads and holding still under
  `prefers-reduced-motion`. Styles are `styles/skeleton.css`, last in `styles.css`: `.skel` the
  block, and `.skel-card`, `.skel-card__art`, `.skel-row` and `.skel-toolbar` the frames a site
  arranges blocks in.

## [0.8.0]

### Added
- `Breadcrumbs`: a view-only trail, `items` of `{ label, href? }` with the current page last. Ancestors
  with an `href` are links, the current page carries `aria-current="page"`, and separators are drawn
  in CSS so a screen reader skips them. `onNavigate(href, event)` takes a plain left click; modified
  clicks and other buttons stay with the browser. It stays on one line at every width, each crumb
  ellipsizing, ancestors before the current page. Styles are `styles/breadcrumbs.css`, after
  `pagination.css` in `styles.css`.

## [0.7.0]

### Added
- `SidebarAccount`: the signed-in person at the foot of the sidebar, an avatar with their name and a
  `sub` line, opening a menu upward of `items` (`{ icon, label, onClick, danger }`) under a head with
  the name and an optional `detail`. On the collapsed rail it is the avatar alone. Its styles, the
  `sidebar__account*` classes, are in `styles/shell.css`; the menu head's second line is
  `.sidebar__account-menu__detail`.
- `Sidebar` takes `closeNav`, which rules off the last group as the groups are ruled off from each
  other.

### Changed
- `Sidebar`'s `top` slot is wrapped in `.sidebar__top`, and the hairline under the brand moves under
  it, so the brand and a search field under it read as one header.

## [0.6.0]

### Added
- `TabBar`: the phone's row of tabs along the bottom edge, each an icon over its label with the
  current one in the accent and an optional count on the icon, clearing the home indicator.
- `AppShell` takes `tabBar`. Given one, a phone (768px and narrower) draws the bar instead of the
  sidebar's drawer and its edge handle, scrolls the main column clear of it, ends an open dock above
  it and hides the dock's floating launcher, which a tab stands in for. Wide screens are unchanged.
- `styles/tabbar.css`, after `footer.css` in `styles.css`.

## [0.5.1]

### Fixed
- A toolbar's Filters and Sort popovers on a phone (600px and narrower) hang from the toolbar and span
  it, instead of hanging their 300px off their button and past the screen's right edge.

### Added
- `ShowcaseCard` is a container named `showcase`, and a fact's icon sits in `.showcase-spec__ico`, so
  a site can fit the facts to the card's own width — letting the icons go on a narrow card, say. The
  icon's own inline display could not be overridden by a sheet.

## [0.5.0]

### Added
- `ShowcaseCard`: a catalogue tile — key art with the name set on it, an optional caution chip and
  badge on the art, a row of facts (an unstated one reads as a muted em-dash), and a foot with one
  status line and the card's action, a button when it does something other than open the card. The
  whole card opens the thing. Its status line is kept when empty, so cards in a row stay level.
- `styles/showcase.css`. Its live dot animates with `kr-pulse`, which a site defines if it wants one.

## [0.4.0]

### Added
- `Footer`: the footer a page ends with, pinned to the bottom of the main column when the page is
  short — the site's mark, wordmark, tagline and an optional note (with a pulsing dot when `live`),
  link groups beside it laid out in their own number of columns, and a bar carrying `copy` and `end`.
  A link the site handles itself takes `onClick` and keeps a modified click the browser's; any other
  opens in a new tab. It collapses on the main column's width.
- `GithubMark`, GitHub's mark for a link to github.com.
- `styles/footer.css`.

## [0.3.1]

### Fixed
- `Chat`'s header names the assistant by `assistantName`, as the transcript does.

## [0.3.0]

### Added
- `Chat`: a conversation with one assistant over the assistant wire contract — turns streamed over
  Server-Sent Events and mirrored to the caller's other open surfaces, proposed actions confirmed by
  their token, the conversation list kept in step with the assistant's, slash commands, thinking and
  auto-run switches, answers read aloud, voice notes, answer feedback, and a read-only review of
  somebody else's conversation. It is given its client (`clientFor`), whether the site is signed in
  (`authed`), and a `profile` saying how the product reads tool results and proposed actions.
- `createAssistantClient({ baseUrl, getToken })`, a client of that contract for a site that holds its
  own bearer; `useConversationStream`; and the parts the chat is drawn from (`ChatThread`,
  `ChatMessage`, `ChatCommand`, `MarkdownTextarea`, `VoiceComposerBar`, `useVoiceRecorder`, …) with the
  conversation functions beneath it (`reduceTurnFrame`, `scaffoldHistory`, `mergeServerConversations`, …).
- `styles/chat.css`, including the card shell under an answer (`.chat-evidence`, `.ev-card`) and the
  chat's layout inside the dock.
- `lib/sse`, the Server-Sent Events reader, addressable on its own.
- `npm run lint` and `npm run check:markdown` (the composer's highlighter emits every character once).

## [0.2.0]

### Added
- The application frame: `AppShell` (a sidebar beside a scrolling main column, room reserved for a
  pinned dock), `Sidebar` with its collapsed icon rail and its phone drawer, `SidebarGroup` (with an
  optional label), `NavItem` (keyboard-reachable, with a count badge), `MobileNavToggle`, and the
  `useStoredFlag` and `useEdgeSwipe` hooks. The sidebar's search field styles (`.sidebar__search`)
  come with it.
- The dock: `Dock`, `DockFab` and `useDock` — open, resizable, pinned beside the page or floating
  over it, each kept in the browser under a key the site chooses.
- `Hero`, the cinematic banner: key art behind a scrim, a heading on the art, a frosted control bar,
  and the `.gbtn` glass button. `.hero__on-art` gives anything else set on the art the same
  theme-invariant palette.

## [0.1.0]

### Added
- The package: tokens and themes with the Inter and JetBrains Mono faces, the shared keyframes, and
  the components every Krystal site starts from — `BriefCard`, `Rail`, `SubTabs`, `Toolbar`,
  `Pagination`, `Select`, `Modal`, `ReversablePortal`, `SettingsSection`/`SettingsRow`/`Toggle`,
  `ThemePicker`, `Toasts`, `NotificationsPanel`, `Icon`, `AccountAvatar` and `AssistantFabIcon` —
  with their stylesheets, the store they read (`createStore`/`useStore`), the theme preference, the
  toast store, `copyText`, the Web Push browser mechanics and `fmtRelative`.
- A toast carries an opaque `subject`, handed back through `NotificationsPanel`'s `onOpen`.
- The modules under `lib/` are addressable one at a time (`@thekrystalship/krystal-ui/lib/store`),
  for code that runs outside a browser and must not load React DOM.
