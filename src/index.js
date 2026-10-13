// @thekrystalship/krystal-ui — the components, stores and helpers every Krystal site is built from.
// The styles are separate: import "@thekrystalship/krystal-ui/styles.css" once, or the individual
// sheets under "@thekrystalship/krystal-ui/styles/" to place them in a cascade of your own.

export { AccountAvatar } from "./components/AccountAvatar.jsx";
export { AssistantMemory } from "./assistant/AssistantMemory.jsx";
export { AssistantMemoryEditor } from "./assistant/AssistantMemoryEditor.jsx";
export { AssistantNotifications } from "./assistant/AssistantNotifications.jsx";
export { AssistantChatsPage, AssistantMemoryPage, AssistantSkillsPage } from "./assistant/AssistantPages.jsx";
export { pushStatus as assistantPushStatus, pushSubscribe as assistantPushSubscribe, pushUnsubscribe as assistantPushUnsubscribe } from "./assistant/push.js";
export { default as AssistantFabIcon } from "./components/AssistantFabIcon.jsx";
export { Breadcrumbs } from "./components/Breadcrumbs.jsx";
export { BriefCard } from "./components/BriefCard.jsx";
export { Button, IconButton } from "./components/Button.jsx";
export { Checkbox, Field, Input, Textarea } from "./components/fields.jsx";
export { Dialog } from "./components/Dialog.jsx";
export { EmptyState } from "./components/EmptyState.jsx";
export { ErrorBoundary } from "./components/ErrorBoundary.jsx";
export { Chat, CHAT_PRIVACY_NOTICE, DEFAULT_PROFILE as CHAT_DEFAULT_PROFILE, DEFAULT_TOGGLE_COPY as CHAT_TOGGLE_COPY } from "./chat/Chat.jsx";
export { ChatActivity } from "./chat/ChatActivity.jsx";
export {
  ChatBlock, ChatGreeting, ChatPrivacyNote, ChatRecent, ChatSuggestionChips, ChatSuggestions, useChat,
} from "./chat/slots.jsx";
export {
  ChatCommand, ChatDaySeparator, ChatEvent, ChatEventRow, ChatFileChange, ChatVerify,
} from "./chat/ChatMessageParts.jsx";
export { CarouselPager } from "./components/CarouselPager.jsx";
export { CollectionTile } from "./components/CollectionTile.jsx";
export { ChatCard, ChatCardRow, ChatCardRows, ConfidenceBadge } from "./chat/ChatCard.jsx";
export { ChatMessage } from "./chat/ChatMessage.jsx";
export { ChatThread } from "./chat/ChatThread.jsx";
export { ChatMessageAttachments, ComposerAttachments, ChatLightbox } from "./chat/ChatAttachments.jsx";
export { prepareAttachment, acceptFor, textOverLimit, sizeLabel } from "./chat/attachments.js";
export { MarkdownTextarea } from "./chat/MarkdownTextarea.jsx";
export { renderMarkdown } from "./chat/markdown.jsx";
export { VoiceComposerBar, VoiceNoteBubble, useVoiceRecorder } from "./chat/VoiceNote.jsx";
export { createAssistantClient } from "./chat/client.js";
export { useConversationStream } from "./chat/useConversationStream.js";
export {
  NEW_CHAT_TITLE, conversationTitle, uid as chatUid, toolLabel, promotePendingCards, reduceTurnFrame,
  proposalMessage, waitingProposal, settleProposal, questionMessage, answersText,
  scaffoldHistory, scaffoldConversation, scaffoldLiveTurn, latestUsage,
  adoptServerConversation, mergeServerConversations,
} from "./chat/conversation.js";
export { Dock, DockFab, useDock } from "./components/Dock.jsx";
export { Footer, GithubMark } from "./components/Footer.jsx";
export { Hero } from "./components/Hero.jsx";
export { Icon } from "./components/Icon.jsx";
export { Meter } from "./components/Meter.jsx";
export { Modal } from "./components/Modal.jsx";
export { Notice } from "./components/Notice.jsx";
export { NotificationsPanel } from "./components/NotificationsPanel.jsx";
export { OptionList } from "./components/OptionList.jsx";
export { PageHeader } from "./components/PageHeader.jsx";
export { Pagination, paginationWindow, useDebouncedValue } from "./components/Pagination.jsx";
export { Rail } from "./components/Rail.jsx";
export { ReversablePortal } from "./components/ReversablePortal.jsx";
export { Select } from "./components/Select.jsx";
export { SettingsRow, SettingsSection } from "./components/settings-primitives.jsx";
export { ShowcaseCard } from "./components/ShowcaseCard.jsx";
export { Skeleton } from "./components/Skeleton.jsx";
export { Spinner } from "./components/Spinner.jsx";
export { AppShell, MobileNavToggle, NavItem, Sidebar, SidebarAccount, SidebarGroup, TabBar } from "./components/Shell.jsx";
export { SubTabs } from "./components/SubTabs.jsx";
export { ThemePicker } from "./components/ThemePicker.jsx";
export { Toasts } from "./components/Toasts.jsx";
export { Toggle } from "./components/Toggle.jsx";
export { TvBackdrop, TvBar, TvBarButton, TvCard, TvRow, TvSpotlight, TvTile } from "./components/Tv.jsx";
export {
  Toolbar, ToolbarButton, ToolbarCount, ToolbarFilters, ToolbarSearch, ToolbarSort, ToolbarSpacer, useFilters,
} from "./components/Toolbar.jsx";

export { useCarousel } from "./hooks/useCarousel.js";
export { useEdgeSwipe } from "./hooks/useEdgeSwipe.js";
export { usePhone } from "./hooks/usePhone.js";
export { usePortalPopover } from "./hooks/usePortalPopover.js";
export { useStoredFlag } from "./hooks/useStoredFlag.js";

export { copyText } from "./lib/clipboard.js";
export * as pushBrowser from "./lib/pushBrowser.js";
export { createStore, useStore } from "./lib/store.js";
export { themeStore, useThemePref, useResolvedTheme, resolveTheme, THEME_KEY, THEME_OPTS } from "./lib/theme.js";
export { fmtRelative } from "./lib/time.js";
export { toast, toastStore, unreadCount, unreadTone } from "./lib/toasts.js";
