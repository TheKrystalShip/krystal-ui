import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { Avatar, BriefEmpty, BriefItem, DetailPage, FormField, ListPage, ListRow, Notice, SignInScreen, StatTile } from "@thekrystalship/krystal";

describe("SignInScreen", () => {
  it("draws usernameExtra between the username and the password, and passwordHint inside the password's frame", () => {
    render(
      <SignInScreen password defaultValues={{ displayName: "" }}
        usernameExtra={<FormField name="displayName" label="Display name" control="input" />}
        passwordHint="At least 12 characters."
        extraFields={<FormField name="confirm" label="Confirm" control="input" />} />,
    );
    const order = ["Username", "Display name", "Password", "Confirm"].map((name) => screen.getByLabelText(name));
    order.slice(1).forEach((el, i) => {
      expect(order[i].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
    const hint = screen.getByText("At least 12 characters.");
    expect(hint.closest(".k-field")).toBe(screen.getByLabelText("Password").closest(".k-field"));
  });
});

describe("ListPage and DetailPage empty states", () => {
  it("ListPage draws an `empty` node in place of the built empty state", () => {
    render(<ListPage title="People" items={[]} empty={<p>Nobody yet.</p>} emptyTitle="Ignored" />);
    expect(screen.getByText("Nobody yet.")).toBeTruthy();
    expect(screen.queryByText("Ignored")).toBeNull();
  });

  it("DetailPage passes `empty` and `emptyIcon` through", () => {
    const { container, rerender } = render(<DetailPage isEmpty empty={<p>No such account.</p>} />);
    expect(screen.getByText("No such account.")).toBeTruthy();
    rerender(<DetailPage isEmpty emptyTitle="Not found" emptyIcon="search-x" />);
    expect(screen.getByText("Not found")).toBeTruthy();
    expect(container.querySelector(".k-datastate--empty svg")).toBeTruthy();
  });
});

describe("Notice action", () => {
  it("draws the action after the text, and nothing without one", () => {
    const { container, rerender } = render(<Notice tone="danger" action={<button>Retry</button>}>Failed.</Notice>);
    const notice = screen.getByRole("alert");
    expect(notice.querySelector(".k-notice__action button")).toBeTruthy();
    expect(notice.querySelector(".k-notice__text").compareDocumentPosition(screen.getByRole("button")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    rerender(<Notice tone="danger">Failed.</Notice>);
    expect(container.querySelector(".k-notice__action")).toBeNull();
  });
});

describe("Brief furniture", () => {
  it("BriefItem draws `below` in the text column after the detail, and tags in the title line", () => {
    const { container } = render(
      <BriefItem title="Rule" tags={<span>tag</span>} detail="What about it" below={<input aria-label="Warn at" />} />,
    );
    const body = container.querySelector(".k-brief__body");
    expect(body.querySelector(".k-brief__item-title").textContent).toBe("Ruletag");
    expect(body.querySelector(".k-brief__detail").nextElementSibling.contains(screen.getByLabelText("Warn at"))).toBe(true);
  });

  it("BriefEmpty draws its children after the body line", () => {
    render(<BriefEmpty title="None" body="Nothing yet.">{<button>Add</button>}</BriefEmpty>);
    expect(screen.getByText("Nothing yet.").nextElementSibling).toBe(screen.getByRole("button", { name: "Add" }));
  });
});

describe("ListRow", () => {
  it("stands as a div outside a List and draws `detail` under the sub", () => {
    const { container } = render(<ListRow as="div" title="Row" sub="Quiet" detail={<span>chip</span>} data-row="x" />);
    const root = container.querySelector("[data-row=x]");
    expect(root.tagName).toBe("DIV");
    expect(screen.getByText("Quiet").nextElementSibling.textContent).toBe("chip");
  });

  it("stays an li by default", () => {
    const { container } = render(<ul><ListRow title="Row" /></ul>);
    expect(container.querySelector("li.k-listrow")).toBeTruthy();
  });
});

describe("StatTile aside", () => {
  it("draws the aside beside the label, and a press on it does not open the tile", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onPin = vi.fn();
    render(<StatTile label="CPU" value={4} onOpen={onOpen} aside={<button onClick={onPin}>Pin</button>} />);
    await user.click(screen.getByRole("button", { name: "Pin" }));
    expect(onPin).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "CPU" }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});

describe("StatTile head", () => {
  it("draws the label in a head, an unknown value as a dash read as unknown, and the aside", () => {
    const { container } = render(<StatTile label="Disk" value={null} aside={<i data-testid="dot" />} />);
    expect(container.querySelector(".k-stat__head").textContent).toContain("Disk");
    expect(screen.getByTestId("dot").closest(".k-stat__head")).toBeTruthy();
    expect(container.querySelector(".k-stat__body").textContent).toContain("unknown");
  });

  it("draws View with its word, and at size sm the arrow alone named by the label", async () => {
    const user = userEvent.setup();
    const onView = vi.fn();
    const { rerender } = render(<StatTile label="CPU" value={1} onView={onView} />);
    await user.click(screen.getByRole("button", { name: "View" }));
    expect(onView).toHaveBeenCalledTimes(1);
    rerender(<StatTile label="CPU" size="sm" value={1} onView={onView} />);
    const btn = screen.getByRole("button", { name: "View CPU" });
    expect(btn.textContent.trim()).toBe("");
    await user.click(btn);
    expect(onView).toHaveBeenCalledTimes(2);
  });
});

describe("Avatar", () => {
  it("draws one letter, a tone, and leaves the diameter to CSS with size=css", () => {
    const { container } = render(<Avatar name="Ada Lovelace" letters={1} tone="info" size="css" />);
    const el = container.querySelector(".k-avatar");
    expect(el.textContent).toBe("A");
    expect(el.className).toContain("k-avatar--info");
    expect(el.className).toContain("k-avatar--fluid");
    expect(el.style.width).toBe("");
  });

  it("keeps two letters and the gradient by default", () => {
    const { container } = render(<Avatar name="Ada Lovelace" size="lg" />);
    expect(container.querySelector(".k-avatar").textContent).toBe("AL");
    expect(container.querySelector(".k-avatar").style.width).toBe("40px");
  });
});
