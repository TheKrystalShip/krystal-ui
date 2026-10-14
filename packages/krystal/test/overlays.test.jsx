import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, ConfirmDialog, Dialog, FormDialog, FormField, useForm, IconButton, Modal, Tooltip } from "@thekrystalship/krystal";

function Opener({ children, nested }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <main data-testid="page"><button onClick={() => setOpen(true)}>open</button></main>
      {open && (
        <Dialog title="First" onClose={() => setOpen(false)}>
          <input aria-label="name" />
          {nested}
          {children}
        </Dialog>
      )}
    </>
  );
}

describe("Dialog and Modal", () => {
  it("moves focus in, traps Tab, and returns focus to the opener", async () => {
    const user = userEvent.setup();
    render(<Opener />);
    const opener = screen.getByRole("button", { name: "open" });
    await user.click(opener);
    const dialog = screen.getByRole("dialog", { name: "First" });
    expect(dialog.contains(document.activeElement)).toBe(true);

    for (let i = 0; i < 6; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
    for (let i = 0; i < 6; i++) {
      await user.tab({ shift: true });
      expect(dialog.contains(document.activeElement)).toBe(true);
    }

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it("marks the rest of the body inert while open and clears it on close", async () => {
    const user = userEvent.setup();
    render(<Opener />);
    const page = screen.getByTestId("page").parentElement;
    await user.click(screen.getByRole("button", { name: "open" }));
    expect(page.hasAttribute("inert")).toBe(true);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(page.hasAttribute("inert")).toBe(false);
  });

  it("keeps an inert the page set itself", async () => {
    const user = userEvent.setup();
    const aside = document.createElement("aside");
    aside.setAttribute("inert", "");
    document.body.appendChild(aside);
    render(<Opener />);
    await user.click(screen.getByRole("button", { name: "open" }));
    await user.keyboard("{Escape}");
    expect(aside.hasAttribute("inert")).toBe(true);
    aside.remove();
  });

  it("closes only the topmost dialog on Escape and hands inert back to the parent", async () => {
    const user = userEvent.setup();
    function Stack() {
      const [inner, setInner] = React.useState(false);
      return (
        <Dialog title="Outer" onClose={() => {}}>
          <button onClick={() => setInner(true)}>more</button>
          {inner && <Dialog title="Inner" onClose={() => setInner(false)}><button>inside</button></Dialog>}
        </Dialog>
      );
    }
    render(<Stack />);
    const outerScrim = screen.getByRole("dialog", { name: "Outer" }).parentElement;
    await user.click(screen.getByRole("button", { name: "more" }));
    expect(screen.getByRole("dialog", { name: "Inner" })).toBeTruthy();
    expect(outerScrim.hasAttribute("inert")).toBe(true);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Inner" })).toBeNull();
    expect(screen.getByRole("dialog", { name: "Outer" })).toBeTruthy();
    expect(outerScrim.hasAttribute("inert")).toBe(false);
  });

  it("holds Escape, the scrim and the close button while canClose is false", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Dialog title="Busy" onClose={onClose} canClose={false}><button>x</button></Dialog>);
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("dialog").parentElement);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Close" }).hasAttribute("disabled")).toBe(true);
  });

  it("closes on a press on the scrim but not on one that starts inside", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Modal onClose={onClose}><div role="dialog" aria-label="m"><button>in</button></div></Modal>);
    await user.click(screen.getByRole("button", { name: "in" }));
    expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByRole("dialog").parentElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("focuses the data-autofocus element", () => {
    render(<Dialog title="A"><input aria-label="first" /><input aria-label="second" data-autofocus /></Dialog>);
    expect(document.activeElement).toBe(screen.getByLabelText("second"));
  });

  it("closes with one Escape when the close button carries a Tooltip", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Dialog title="Tip" onClose={onClose}>
        <Tooltip label="Dismiss"><IconButton icon="x" label="Dismiss it" /></Tooltip>
      </Dialog>,
    );
    const tipped = screen.getByRole("button", { name: "Dismiss it" });
    tipped.focus();
    // jsdom has no :focus-visible; the tooltip shows on a resting pointer instead.
    await user.hover(tipped);
    await waitFor(() => expect(screen.getByRole("tooltip")).toBeTruthy(), { timeout: 2000 });
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("ConfirmDialog", () => {
  const setup = (onConfirm, onClose = vi.fn()) => {
    render(<ConfirmDialog title="Delete it" confirm="Delete" busyLabel="Deleting" onConfirm={onConfirm} onClose={onClose}>Gone for good.</ConfirmDialog>);
    return onClose;
  };

  it("closes after a confirm that resolves to nothing", async () => {
    const user = userEvent.setup();
    const onClose = setup(() => Promise.resolve());
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("draws a refusal and stays open for another try", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValueOnce({ refusal: "Still in use." }).mockResolvedValueOnce(undefined);
    const onClose = setup(onConfirm);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(await screen.findByText("Still in use.")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onConfirm).toHaveBeenCalledTimes(2);
  });

  it("draws a rejection's message the same way", async () => {
    const user = userEvent.setup();
    const onClose = setup(() => Promise.reject(new Error("Server said no.")));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(await screen.findByText("Server said no.")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("holds Escape and cancel while the change runs, and shows the busy label", async () => {
    const user = userEvent.setup();
    let finish;
    const onClose = setup(() => new Promise((r) => { finish = r; }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByRole("button", { name: /Deleting/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancel" }).hasAttribute("disabled")).toBe(true);
    await user.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
    finish();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });
});

describe("Button", () => {
  it("does not fire onClick while disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>go</Button>);
    await user.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("FormDialog", () => {
  function Host({ onSubmit, onClose }) {
    const form = useForm({ defaultValues: { name: "" }, rules: { name: { required: "Name it" } }, onSubmit });
    return (
      <FormDialog form={form} title="Add" onClose={onClose} submit="Create" busyLabel="Creating">
        <FormField name="name" label="Name" control="input" />
      </FormDialog>
    );
  }

  it("submits with Enter, shows a field's rule, and shows the form's refusal", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValueOnce({ message: "Taken." }).mockResolvedValueOnce(undefined);
    render(<Host onSubmit={onSubmit} onClose={vi.fn()} />);
    await user.type(screen.getByRole("textbox", { name: "Name" }), "{Enter}");
    expect(await screen.findByText("Name it")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
    await user.type(screen.getByRole("textbox", { name: "Name" }), "bob{Enter}");
    expect(await screen.findByText("Taken.")).toBeTruthy();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("cancels with the Cancel button and Escape, and holds both while it submits", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    let release;
    const onSubmit = vi.fn(() => new Promise((r) => { release = r; }));
    render(<Host onSubmit={onSubmit} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    await user.type(screen.getByRole("textbox", { name: "Name" }), "bob");
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(screen.getByRole("button", { name: "Cancel" }).hasAttribute("disabled")
      || screen.getByRole("button", { name: "Cancel" }).getAttribute("aria-disabled") === "true").toBe(true);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
    release();
  });
});
