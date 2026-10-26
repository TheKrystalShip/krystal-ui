import { describe, expect, it } from "vitest";
import { render, act, waitFor } from "@testing-library/react";
import { Chat } from "@thekrystalship/krystal-chat";

const typingOn = () => document.body.classList.contains("k-chat-typing");

describe("Chat typing state on a page", () => {
  it("clears when the chat's node moves while the composer has focus", async () => {
    const a = document.createElement("div");
    const b = document.createElement("div");
    const host = document.createElement("div");
    a.appendChild(host);
    document.body.append(a, b);
    const { container } = render(<Chat layout="page" />, { container: host });
    const area = container.querySelector("textarea");
    expect(area).toBeTruthy();
    await act(async () => { area.focus(); });
    expect(typingOn()).toBe(true);
    expect(document.body.dataset.chatTyping).toBeDefined();
    await act(async () => { b.appendChild(host); });
    expect(document.activeElement).not.toBe(area);
    await waitFor(() => expect(typingOn()).toBe(false));
    expect(document.body.dataset.chatTyping).toBeUndefined();
  });

  it("follows a plain blur", async () => {
    const { container } = render(<Chat layout="page" />);
    const area = container.querySelector("textarea");
    await act(async () => { area.focus(); });
    expect(typingOn()).toBe(true);
    await act(async () => { area.blur(); });
    expect(typingOn()).toBe(false);
  });
});
