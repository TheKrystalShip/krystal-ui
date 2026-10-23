import { PageHeader } from "@thekrystalship/krystal";

// The page a site hosting an assistant gives it beside the chat, at a reading measure
// (`.k-assistant-page`): its conversations.

// AssistantPage — the column a page beside the chat stands in: a reading measure, centred, with the
// page's own padding and gap. A site's own page about the assistant (its settings) is drawn in it too.
/**
 * @param {import("react").ComponentPropsWithoutRef<"div">} props
 */
function AssistantPage({ className, ...rest }) {
  return <div {...rest} className={"k-assistant-page" + (className ? " " + className : "")} />;
}

// The conversations, as a page — a phone's tab of them. The list is the chat's own: `Chat` draws it
// into the element this page hands back through `listRef` (its `listTarget`), so what is listed,
// opened and deleted here is exactly what the chat holds.
/**
 * @param {object} props
 * @param {import("react").Ref<HTMLDivElement>} [props.listRef] the element `Chat` draws its list into (its `listTarget`)
 * @param {string} [props.title] The page's heading.
 */
function AssistantChatsPage({ listRef, title = "Chats" }) {
  return (
    <AssistantPage>
      <PageHeader title={title} />
      <div ref={listRef} />
    </AssistantPage>
  );
}

export { AssistantChatsPage, AssistantPage };
