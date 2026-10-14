import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DetailPage, FormField, ListPage, Notice, SignInScreen } from "@thekrystalship/krystal";

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
