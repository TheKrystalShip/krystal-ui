import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Chat } from "@thekrystalship/krystal-chat";

const MEMORIES = [
  { key: "diet", summary: "Vegetarian; eats fish occasionally", body: "", writtenAt: "2026-10-20T10:00:00Z", source: "conversation", plugin: "galley" },
  { key: "no-horror", summary: "Does not like horror films", body: "", writtenAt: "2026-10-19T10:00:00Z", source: "person", plugin: "moviebot" },
];

// A client that answers the memory calls and leaves every other call the chat makes pending, so the
// chat stands still around what is being tested.
function fakeClient() {
  const impl = {
    memories: vi.fn(() => Promise.resolve(MEMORIES.slice())),
    memoryLimits: vi.fn(() => Promise.resolve({ maxPerPerson: 50, maxSummaryLength: 160, maxBodyLength: 4000 })),
    writeMemory: vi.fn((key, m) => Promise.resolve({ key, ...m, writtenAt: "2026-10-23T10:00:00Z", source: "person", plugin: "kgsm" })),
    deleteMemory: vi.fn(() => Promise.resolve(null)),
  };
  return new Proxy(impl, {
    get: (target, prop) => (prop in target ? target[prop] : prop === "declines" || prop === "then" ? undefined : () => new Promise(() => {})),
  });
}

function renderChat(client) {
  return render(
    <Chat docked assistantHost={{ id: "a", name: "Assistant" }} clientFor={() => client} authed
      connection={{ tone: "online", label: "Connected", usable: true }} storageKey={"test:" + Math.random()} />,
  );
}

async function openMemory() {
  fireEvent.click(screen.getByRole("button", { name: "Options" }));
  fireEvent.click(await screen.findByRole("menuitem", { name: "Memory" }));
  await screen.findByText("Vegetarian; eats fish occasionally");
}

describe("Chat's memory", () => {
  it("opens from the header's options in the conversation's place and leads back", async () => {
    renderChat(fakeClient());
    expect(screen.queryByRole("menuitem", { name: "Compact" })).toBeNull();
    await openMemory();
    expect(screen.getByText("Memory")).toBeTruthy();
    expect(screen.getByText(/2 of 50 kept/)).toBeTruthy();
    expect(document.querySelector(".k-chat-composer").hidden).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.queryByText("Vegetarian; eats fish occasionally")).toBeNull();
    expect(document.querySelector(".k-chat-composer").hidden).toBe(false);
  });

  it("forgets only on the second press", async () => {
    const client = fakeClient();
    renderChat(client);
    await openMemory();
    fireEvent.click(screen.getAllByRole("button", { name: "Forget" })[0]);
    expect(client.deleteMemory).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Forget for good" }));
    expect(client.deleteMemory).toHaveBeenCalledWith("diet");
    await waitFor(() => expect(screen.queryByText("Vegetarian; eats fish occasionally")).toBeNull());
  });

  it("edits a memory in the list's place and saves it", async () => {
    const client = fakeClient();
    renderChat(client);
    await openMemory();
    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[1]);
    expect(screen.getByText("Edit memory")).toBeTruthy();
    const summary = screen.getByDisplayValue("Does not like horror films");
    fireEvent.change(summary, { target: { value: "Does not like horror or gore" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Does not like horror or gore");
    expect(client.writeMemory).toHaveBeenCalledWith("no-horror", { summary: "Does not like horror or gore", body: "" });
    expect(screen.getByText("Memory")).toBeTruthy();
  });

  it("forgets from the editor on the second press, back in the list", async () => {
    const client = fakeClient();
    renderChat(client);
    await openMemory();
    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Forget" }));
    expect(client.deleteMemory).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Forget for good" }));
    await screen.findByText("Does not like horror films");
    expect(client.deleteMemory).toHaveBeenCalledWith("diet");
    expect(screen.queryByText("Vegetarian; eats fish occasionally")).toBeNull();
  });
});
