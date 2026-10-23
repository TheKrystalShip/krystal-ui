import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationList, createNotificationInbox, createNotificationsClient } from "@thekrystalship/krystal";

const row = (id, extra = {}) => ({ id, kind: "ready", text: "Row " + id, createdAt: new Date().toISOString(), read: false, ...extra });

describe("createNotificationsClient", () => {
  it("speaks the routes through the site's request", async () => {
    const request = vi.fn().mockResolvedValue({});
    const client = createNotificationsClient({ request });
    await client.list({ before: "a b", limit: 10 });
    await client.markRead(["1"]);
    await client.markRead();
    await client.setPreferences({ ready: false });
    await client.unsubscribe("https://push/x");
    expect(request.mock.calls).toEqual([
      ["GET", "/notifications?before=a%20b&limit=10"],
      ["POST", "/notifications/read", { ids: ["1"] }],
      ["POST", "/notifications/read", {}],
      ["PUT", "/notifications/preferences", { kinds: { ready: false } }],
      ["DELETE", "/push/subscribe", { endpoint: "https://push/x" }],
    ]);
  });
});

describe("createNotificationInbox", () => {
  const fake = (items) => ({
    list: vi.fn(async () => ({ unread: items.filter((n) => !n.read).length, items, more: false })),
    kinds: vi.fn(async () => ({ kinds: [{ id: "ready", title: "Ready", icon: "bell", tone: "teal", switchable: true, enabledByDefault: true }] })),
    markRead: vi.fn(async (ids) => { items.forEach((n) => { if (!ids || ids.includes(n.id)) n.read = true; }); }),
  });

  it("reads while watched and marks optimistically", async () => {
    const client = fake([row("a"), row("b")]);
    const inbox = createNotificationInbox(client, { everyMs: 1e9 });
    const stop = inbox.watch();
    await inbox.refresh();
    expect(inbox.store.getState().unread).toBe(2);
    expect(inbox.store.getState().kinds).toHaveLength(1);

    const marking = inbox.markRead(["a"]);
    expect(inbox.store.getState().unread).toBe(1);
    expect(inbox.store.getState().items.find((n) => n.id === "a").read).toBe(true);
    await marking;
    expect(client.markRead).toHaveBeenCalledWith(["a"]);

    await inbox.markRead();
    expect(inbox.store.getState().unread).toBe(0);
    stop();
  });

  it("keeps an error out of the rows it already holds", async () => {
    const client = fake([row("a")]);
    const inbox = createNotificationInbox(client, { everyMs: 1e9 });
    await inbox.refresh();
    client.list.mockRejectedValueOnce(new Error("down"));
    await inbox.refresh();
    expect(inbox.store.getState().items).toHaveLength(1);
    expect(inbox.store.getState().error.message).toBe("down");
  });
});

describe("NotificationList", () => {
  it("says there is nothing, and why a read failed", () => {
    const { rerender } = render(<NotificationList items={[]} />);
    expect(screen.getByText("Nothing yet.")).toBeTruthy();
    rerender(<NotificationList items={null} error={new Error("No answer.")} />);
    expect(screen.getByRole("alert").textContent).toContain("No answer.");
  });

  it("groups by day and opens a row with a link", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const old = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString();
    render(<NotificationList onOpen={onOpen}
      items={[row("a", { url: "/x", action: "Watch" }), row("b", { createdAt: old, read: true })]} />);
    expect(screen.getByText("Today")).toBeTruthy();
    expect(screen.getAllByRole("heading")).toHaveLength(2);
    expect(screen.getAllByRole("img", { name: "Unread" })).toHaveLength(1);
    expect(screen.getByText("Watch →")).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: /Row a/ }));
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }));
  });
});
