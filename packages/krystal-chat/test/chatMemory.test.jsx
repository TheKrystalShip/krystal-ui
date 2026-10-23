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
    tools: vi.fn(() => Promise.resolve([
      { name: "server_status", class: "read", description: "Current state of game servers, read live.\n- With server: running or stopped." },
      { name: "server_action", class: "staged", description: "Propose an action on one server. Nothing happens until the person confirms; say it is waiting for them.\n- One action per call." },
    ])),
    skills: vi.fn(() => Promise.resolve([
      { name: "restore-backup", description: "Roll a server back to an earlier backup safely." },
      { name: "find-a-forgotten-film", description: "Identify a film someone half remembers." },
    ])),
  };
  return new Proxy(impl, {
    get: (target, prop) => (prop in target ? target[prop] : prop === "declines" || prop === "then" ? undefined : () => new Promise(() => {})),
  });
}

function renderChat(client, storageKey = "test:" + Math.random()) {
  return render(
    <Chat docked assistantHost={{ id: "a", name: "Assistant" }} clientFor={() => client} authed
      connection={{ tone: "online", label: "Connected", usable: true }} storageKey={storageKey} />,
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

describe("What the assistant wrote down, in the conversation", () => {
  // A conversation this browser holds, whose answer wrote one memory and forgot another.
  function seeded() {
    const key = "test:seeded:" + Math.random();
    localStorage.setItem(key, JSON.stringify([{
      id: "c1", title: "Dinner", hostId: "a", loaded: true,
      messages: [
        { role: "user", content: "I don't eat meat" },
        { role: "assistant", content: "Noted.", memories: [
          { action: "remembered", key: "diet", summary: "Vegetarian; eats fish occasionally" },
          { action: "forgotten", key: "old-diet", summary: "Eats everything" },
        ] },
      ],
    }]));
    return key;
  }

  it("follows the answer as one line per change, and Edit opens that memory", async () => {
    renderChat(fakeClient(), seeded());
    expect(screen.getByText("Remembered: Vegetarian; eats fish occasionally")).toBeTruthy();
    expect(screen.getByText("Forgot: Eats everything")).toBeTruthy();
    // Only the memory written is offered for correcting.
    expect(screen.getAllByRole("button", { name: "Edit" })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(await screen.findByDisplayValue("Vegetarian; eats fish occasionally")).toBeTruthy();
    expect(screen.getByText("Edit memory")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    await screen.findByText("Does not like horror films");
  });
});

describe("Chat's skills", () => {
  it("lists each skill by a readable name and its description, in the conversation's place", async () => {
    const client = fakeClient();
    renderChat(client);
    fireEvent.click(screen.getByRole("button", { name: "Options" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Skills" }));
    expect(await screen.findByText("Restore backup")).toBeTruthy();
    expect(screen.getByText("Roll a server back to an earlier backup safely.")).toBeTruthy();
    expect(screen.getByText("Find a forgotten film")).toBeTruthy();
    expect(screen.getByText("Skills")).toBeTruthy();
    expect(document.querySelector(".k-chat-composer").hidden).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.queryByText("Restore backup")).toBeNull();
  });
});

describe("Chat's tools", () => {
  it("lists each tool by a readable name and the first sentence of its description", async () => {
    renderChat(fakeClient());
    fireEvent.click(screen.getByRole("button", { name: "Options" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Tools" }));
    expect(await screen.findByText("Server status")).toBeTruthy();
    expect(screen.getByText("Current state of game servers, read live.")).toBeTruthy();
    // What it tells the model about calling it is not the person's to read.
    expect(screen.queryByText(/With server/)).toBeNull();
    expect(screen.getByText("Propose an action on one server. · Asks you to confirm first")).toBeTruthy();
    expect(screen.getByText("Tools")).toBeTruthy();
  });
});
