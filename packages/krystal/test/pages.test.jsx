import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormField, SignInScreen } from "@thekrystalship/krystal";

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
