// @thekrystalship/krystal-chat — the assistant chat, the assistant's settings pages and the client of
// the assistant wire contract. It builds on @thekrystalship/krystal, which a site installs beside it.
// The styles are separate: import "@thekrystalship/krystal-chat/styles.css" once, or the individual
// sheets under "@thekrystalship/krystal-chat/styles/" to place them in a cascade of your own.

export { AssistantNotifications } from "./assistant/AssistantNotifications.jsx";
export { AssistantChatsPage, AssistantPage, AssistantSkillsPage } from "./assistant/AssistantPages.jsx";
export { pushStatus as assistantPushStatus, pushSubscribe as assistantPushSubscribe, pushUnsubscribe as assistantPushUnsubscribe } from "./assistant/push.js";
export { Chat, CHAT_PRIVACY_NOTICE, DEFAULT_PROFILE as CHAT_DEFAULT_PROFILE, DEFAULT_TOGGLE_COPY as CHAT_TOGGLE_COPY } from "./chat/Chat.jsx";
export { ChatEvidence } from "./chat/ChatFrame.jsx";
export { ChatActivity } from "./chat/ChatActivity.jsx";
export {
  ChatBlock, ChatGreeting, ChatSuggestionChips, useChat,
} from "./chat/slots.jsx";
export {
  ChatCommand, ChatDaySeparator, ChatEvent, ChatEventRow, ChatFileChange, ChatVerify,
} from "./chat/ChatMessageParts.jsx";
export { ChatCard, ChatCardRow, ChatCardRows, ConfidenceBadge } from "./chat/ChatCard.jsx";
export { ChatMessage } from "./chat/ChatMessage.jsx";
export { ChatThread } from "./chat/ChatThread.jsx";
export { ChatMessageAttachments, ComposerAttachments, ChatLightbox } from "./chat/ChatAttachments.jsx";
export { prepareAttachment, acceptFor, textOverLimit, sizeLabel } from "./chat/attachments.js";
export { MarkdownTextarea } from "./chat/MarkdownTextarea.jsx";
export { renderMarkdown } from "./chat/markdown.jsx";
export { VoiceComposerBar, VoiceNoteBubble, useVoiceRecorder } from "./chat/VoiceNote.jsx";
export { createAssistantClient } from "./lib/assistantClient.js";
export { LIMITS as HANDS_FREE_LIMITS, createTriggerListener, matchTrigger, openMicrophone, parseTriggers, recoverRequest, triggerInScan, useHandsFree } from "./lib/handsFree.js";
export { armAudio, createSpokenReply } from "./chat/spokenReply.js";
export { useConversationStream } from "./chat/useConversationStream.js";
export {
  NEW_CHAT_TITLE, conversationTitle, uid as chatUid, toolLabel, promotePendingCards, reduceTurnFrame,
  proposalMessage, waitingProposal, settleProposal, questionMessage, answersText,
  scaffoldHistory, scaffoldConversation, scaffoldLiveTurn, latestUsage,
  adoptServerConversation, mergeServerConversations,
} from "./chat/conversation.js";
