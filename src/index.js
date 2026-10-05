// @thekrystalship/krystal-ui — the components, stores and helpers every Krystal site is built from.
// The styles are separate: import "@thekrystalship/krystal-ui/styles.css" once, or the individual
// sheets under "@thekrystalship/krystal-ui/styles/" to place them in a cascade of your own.

export { AccountAvatar } from "./components/AccountAvatar.jsx";
export { default as AssistantFabIcon } from "./components/AssistantFabIcon.jsx";
export { Breadcrumbs } from "./components/Breadcrumbs.jsx";
export { BriefCard } from "./components/BriefCard.jsx";
export { Button, IconButton } from "./components/Button.jsx";
export { Checkbox, Field, Input, Textarea } from "./components/fields.jsx";
export { Dialog } from "./components/Dialog.jsx";
export { EmptyState } from "./components/EmptyState.jsx";
export { ErrorBoundary } from "./components/ErrorBoundary.jsx";
export { Chat, CHAT_PRIVACY_NOTICE, DEFAULT_PROFILE as CHAT_DEFAULT_PROFILE, DEFAULT_TOGGLE_COPY as CHAT_TOGGLE_COPY } from "./chat/Chat.jsx";
export {
  ChatCommand, ChatContextPill, ChatPending, ChatSteps, ChatThinking, ChatVerify,
} from "./chat/ChatMessageParts.jsx";
export { ChatCard, ConfidenceBadge } from "./chat/ChatCard.jsx";
export { ChatMessage } from "./chat/ChatMessage.jsx";
export { ChatThread } from "./chat/ChatThread.jsx";
export { MarkdownTextarea } from "./chat/MarkdownTextarea.jsx";
export { renderMarkdown } from "./chat/markdown.jsx";
export { VoiceComposerBar, VoiceNoteBubble, useVoiceRecorder } from "./chat/VoiceNote.jsx";
export { createAssistantClient } from "./chat/client.js";
export { useConversationStream } from "./chat/useConversationStream.js";
export {
  NEW_CHAT_TITLE, conversationTitle, uid as chatUid, toolLabel, promotePendingCards, reduceTurnFrame,
  proposalMessage, scaffoldHistory, scaffoldConversation, scaffoldLiveTurn, latestUsage,
  adoptServerConversation, mergeServerConversations,
} from "./chat/conversation.js";
export { Dock, DockFab, useDock } from "./components/Dock.jsx";
export { Footer, GithubMark } from "./components/Footer.jsx";
export { Hero } from "./components/Hero.jsx";
export { Icon } from "./components/Icon.jsx";
export { Modal } from "./components/Modal.jsx";
export { Notice } from "./components/Notice.jsx";
export { NotificationsPanel } from "./components/NotificationsPanel.jsx";
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
export {
  Toolbar, ToolbarButton, ToolbarCount, ToolbarFilters, ToolbarSearch, ToolbarSort, ToolbarSpacer, useFilters,
} from "./components/Toolbar.jsx";

export { useEdgeSwipe } from "./hooks/useEdgeSwipe.js";
export { usePortalPopover } from "./hooks/usePortalPopover.js";
export { useStoredFlag } from "./hooks/useStoredFlag.js";

export { copyText } from "./lib/clipboard.js";
export * as pushBrowser from "./lib/pushBrowser.js";
export { createStore, useStore } from "./lib/store.js";
export { themeStore, useThemePref, useResolvedTheme, resolveTheme, THEME_KEY, THEME_OPTS } from "./lib/theme.js";
export { fmtRelative } from "./lib/time.js";
export { toast, toastStore, unreadCount, unreadTone } from "./lib/toasts.js";
