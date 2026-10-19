import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatCommand } from "@thekrystalship/krystal-chat";

const msg = { role: "command", state: "proposed", verb: "report", summary: "Report the garlic of Hachee. Now: 12 heads." };
const meta = { label: "Send report", icon: "flag", tone: "info" };

describe("ChatCommand", () => {
  it("draws the summary under the title by default", () => {
    render(<ChatCommand msg={msg} onRun={() => {}} meta={meta} title="Report" />);
    expect(screen.getByText("Report the garlic of Hachee. Now: 12 heads.")).toBeTruthy();
  });

  it("draws a product's body in place of the summary, with its own decline words", () => {
    const decline = vi.fn();
    render(<ChatCommand msg={msg} onRun={() => {}} onDecline={decline} meta={meta} title="Report"
      body={<dl><dt>Now</dt><dd>12 heads</dd><dt>Should be</dt><dd>12 cloves</dd></dl>} declineLabel="Don't send" />);
    expect(screen.queryByText(/Report the garlic/)).toBeNull();
    expect(screen.getByText("12 cloves")).toBeTruthy();
    screen.getByRole("button", { name: "Don't send" }).click();
    expect(decline).toHaveBeenCalledWith(msg);
  });

  it("takes a product's own line under the title", () => {
    render(<ChatCommand msg={msg} onRun={() => {}} meta={meta} title="Report" sub="Amount · Garlic" />);
    expect(screen.getByText("Amount · Garlic")).toBeTruthy();
    expect(screen.queryByText(/Report the garlic/)).toBeNull();
  });
});
