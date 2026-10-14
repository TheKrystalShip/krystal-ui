import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, DataState, Form, FormError, FormField, FormSubmit, StatTile, Table, sortRows, useForm } from "@thekrystalship/krystal";

describe("Table", () => {
  const columns = [
    { key: "name", header: "Name", sortable: true },
    { key: "size", header: "Size", sortable: true },
    { key: "note", header: "Note" },
  ];
  const rows = [
    { id: 1, name: "bravo", size: 30, note: null },
    { id: 2, name: "alpha", size: null, note: "x" },
    { id: 3, name: "charlie", size: 10, note: "y" },
  ];

  it("sets aria-sort on the sorted column only and asks for the opposite direction on a second press", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(<Table columns={columns} rows={rows} sort={{ key: "name", dir: "asc" }} onSortChange={onSortChange} label="Files" />);
    const heads = screen.getAllByRole("columnheader");
    expect(heads.map((h) => h.getAttribute("aria-sort"))).toEqual(["ascending", "none", null]);
    await user.click(within(heads[0]).getByRole("button"));
    expect(onSortChange).toHaveBeenLastCalledWith({ key: "name", dir: "desc" });
    await user.click(within(heads[1]).getByRole("button"));
    expect(onSortChange).toHaveBeenLastCalledWith({ key: "size", dir: "asc" });
  });

  it("sortRows puts an unknown value last in both directions", () => {
    const ids = (dir) => sortRows(rows, columns, { key: "size", dir }).map((r) => r.id);
    expect(ids("asc")).toEqual([3, 1, 2]);
    expect(ids("desc")).toEqual([1, 3, 2]);
  });

  it("draws an unknown cell as a dash with a spoken word, never a zero", () => {
    render(<Table columns={columns} rows={rows} />);
    const cells = screen.getAllByRole("cell");
    expect(cells[2].textContent).toContain("unknown");
    expect(cells[2].textContent).not.toContain("0");
  });

  it("opens a row from its first cell and leaves a row action to itself", async () => {
    const user = userEvent.setup();
    const onRowOpen = vi.fn();
    const onDelete = vi.fn();
    render(<Table columns={columns} rows={rows} onRowOpen={onRowOpen}
      rowActions={(row) => <Button onClick={() => onDelete(row.id)}>Delete {row.id}</Button>} />);
    await user.click(screen.getByRole("button", { name: "bravo" }));
    expect(onRowOpen).toHaveBeenCalledWith(rows[0]);
    await user.click(screen.getByRole("button", { name: "Delete 2" }));
    expect(onDelete).toHaveBeenCalledWith(2);
    expect(onRowOpen).toHaveBeenCalledTimes(1);
  });

  it("renders a link as the first cell when rowHref is given", () => {
    render(<Table columns={columns} rows={rows} rowHref={(r) => "#/" + r.id} />);
    expect(screen.getByRole("link", { name: "bravo" }).getAttribute("href")).toBe("#/1");
  });

  it("falls back to the data states when there are no rows, is loading, or has failed", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { rerender } = render(<Table columns={columns} rows={[]} emptyTitle="No files" />);
    expect(screen.getByText("No files")).toBeTruthy();
    rerender(<Table columns={columns} rows={rows} loading />);
    expect(document.querySelector("[aria-busy='true']")).toBeTruthy();
    rerender(<Table columns={columns} rows={rows} error="Broke" onRetry={onRetry} />);
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe("DataState", () => {
  it("shows the skeleton while loading, ahead of an error and the data", () => {
    render(<DataState loading error="no" data={[1]}>content</DataState>);
    expect(document.querySelector("[aria-busy='true']")).toBeTruthy();
    expect(screen.queryByText("content")).toBeNull();
    expect(screen.queryByText("no")).toBeNull();
  });

  it("shows the error message from a string or an Error, with a retry when offered", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { rerender } = render(<DataState error={new Error("Boom")} onRetry={onRetry}>content</DataState>);
    expect(screen.getByText("Boom")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    rerender(<DataState error="Plain">content</DataState>);
    expect(screen.getByText("Plain")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows the empty state for an empty array or an explicit isEmpty, and the children otherwise", () => {
    const { rerender } = render(<DataState data={[]} emptyTitle="Nothing here">content</DataState>);
    expect(screen.getByText("Nothing here")).toBeTruthy();
    rerender(<DataState data={{ n: 0 }} isEmpty emptyTitle="Nothing here">content</DataState>);
    expect(screen.getByText("Nothing here")).toBeTruthy();
    rerender(<DataState data={[1, 2]}>{(d) => <p>{d.length} rows</p>}</DataState>);
    expect(screen.getByText("2 rows")).toBeTruthy();
  });
});

describe("StatTile", () => {
  it("draws a null or undefined value as unknown, never as zero", () => {
    const { rerender } = render(<StatTile label="Players" value={null} unit="online" />);
    const tile = screen.getByText("Players").closest(".k-stat");
    expect(tile.textContent).toContain("unknown");
    expect(tile.textContent).not.toContain("0");
    expect(tile.textContent).not.toContain("online");
    rerender(<StatTile label="Players" />);
    expect(tile.textContent).toContain("unknown");
  });

  it("draws a real zero as 0", () => {
    render(<StatTile label="Players" value={0} />);
    const tile = screen.getByText("Players").closest(".k-stat");
    expect(tile.querySelector(".k-stat__value").textContent).toBe("0");
    expect(tile.textContent).not.toContain("unknown");
  });
});

function Signup({ onSubmit, extra }) {
  const form = useForm({
    defaultValues: { name: "", email: "" },
    rules: { name: { required: "Name is required" }, email: { required: true } },
    onSubmit,
  });
  return (
    <Form form={form} aria-label="Sign up">
      {extra}
      <FormField name="name" label="Name" />
      <FormField name="email" label="Email" />
      <FormSubmit>Save</FormSubmit>
    </Form>
  );
}

describe("Form", () => {
  it("shows required errors on submit only, focuses the first invalid field, and does not call onSubmit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Signup onSubmit={onSubmit} />);
    await user.type(screen.getByRole("textbox", { name: "Email" }), "a@b");
    expect(screen.queryByText("Name is required")).toBeNull();
    await user.clear(screen.getByRole("textbox", { name: "Email" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Name is required")).toBeTruthy();
    expect(screen.getByText("Required")).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Name" })));
    expect(screen.getByRole("textbox", { name: "Name" }).getAttribute("aria-invalid")).toBe("true");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with the values once valid", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<Signup onSubmit={onSubmit} />);
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Ada");
    await user.type(screen.getByRole("textbox", { name: "Email" }), "ada@x.org");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: "Ada", email: "ada@x.org" }));
  });

  it("places server errors on their fields, focuses the first one, and clears a form message on edit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({ errors: { email: "Already taken" }, message: "Could not save." });
    render(<Signup onSubmit={onSubmit} />);
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Ada");
    await user.type(screen.getByRole("textbox", { name: "Email" }), "ada@x.org");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Already taken")).toBeTruthy();
    expect(screen.getByText("Could not save.")).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Email" })));
    await user.type(screen.getByRole("textbox", { name: "Name" }), "x");
    await waitFor(() => expect(screen.queryByText("Could not save.")).toBeNull());
  });

  it("turns a thrown error into the form message", async () => {
    const user = userEvent.setup();
    render(<Signup onSubmit={() => Promise.reject(new Error("Offline"))} />);
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Ada");
    await user.type(screen.getByRole("textbox", { name: "Email" }), "a@b");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Offline")).toBeTruthy();
  });

  it("draws an error for a name with no field as the form message", async () => {
    const user = userEvent.setup();
    render(<Signup onSubmit={() => Promise.resolve({ errors: { nowhere: "Nope" } })} />);
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Ada");
    await user.type(screen.getByRole("textbox", { name: "Email" }), "a@b");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Nope")).toBeTruthy();
  });

  it("draws the form message in a FormError placed by the caller, and only once", async () => {
    const user = userEvent.setup();
    render(<Signup onSubmit={() => Promise.resolve({ message: "Bad" })} extra={<FormError />} />);
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Ada");
    await user.type(screen.getByRole("textbox", { name: "Email" }), "a@b");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Bad");
    expect(screen.getAllByText("Bad")).toHaveLength(1);
  });
});
