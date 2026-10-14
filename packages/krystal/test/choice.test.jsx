import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Accordion, ColorInput, Combobox, Disclosure, OptionList, RadioGroup, Slider, Tab, TabList, TabPanel, Tabs,
} from "@thekrystalship/krystal";

describe("Combobox", () => {
  const options = [
    { value: "ant", label: "Ant" },
    { value: "ape", label: "Ape" },
    { value: "bee", label: "Bee", disabled: true },
    { value: "cat", label: "Cat", detail: "feline" },
  ];

  it("filters as the person types and tracks the active option with aria-activedescendant", async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Animal" options={options} />);
    const input = screen.getByRole("combobox", { name: "Animal" });
    await user.click(input);
    await screen.findByRole("listbox");
    expect(screen.getAllByRole("option")).toHaveLength(4);

    await user.keyboard("a");
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Ant", "Ape", "Catfeline"]);
    expect(input.getAttribute("aria-activedescendant")).toBe(screen.getAllByRole("option")[0].id);

    await user.keyboard("{ArrowDown}");
    expect(input.getAttribute("aria-activedescendant")).toBe(screen.getAllByRole("option")[1].id);
    expect(document.activeElement).toBe(input);

    await user.keyboard("{Enter}");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(input.value).toBe("Ape");
  });

  it("skips a disabled option and reports the pick", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Combobox aria-label="Animal" options={options} onChange={onChange} />);
    await user.click(screen.getByRole("combobox"));
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(onChange).toHaveBeenCalledWith("cat", options[3]);
  });

  it("shows the empty line when nothing matches, and Escape closes then clears", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Combobox aria-label="Animal" options={options} defaultValue="ant" onChange={onChange} />);
    const input = screen.getByRole("combobox");
    expect(input.value).toBe("Ant");
    await user.click(input);
    await user.clear(input);
    await user.keyboard("zzz");
    expect(await screen.findByText("No matches")).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(screen.queryByText("No matches")).toBeNull();
    await user.keyboard("{Escape}");
    expect(input.value).toBe("");
    expect(onChange).toHaveBeenCalledWith(null, null);
  });
});

function TabsFixture(props) {
  return (
    <Tabs defaultValue="a" {...props}>
      <TabList label="Sections">
        <Tab value="a">Alpha</Tab>
        <Tab value="b">Beta</Tab>
        <Tab value="c" disabled>Gamma</Tab>
        <Tab value="d">Delta</Tab>
      </TabList>
      <TabPanel value="a">panel a</TabPanel>
      <TabPanel value="b">panel b</TabPanel>
      <TabPanel value="d">panel d</TabPanel>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("wires roles and shows only the selected panel", () => {
    render(<TabsFixture />);
    const alpha = screen.getByRole("tab", { name: "Alpha" });
    expect(alpha.getAttribute("aria-selected")).toBe("true");
    expect(alpha.tabIndex).toBe(0);
    expect(screen.getByRole("tab", { name: "Beta" }).tabIndex).toBe(-1);
    expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe(alpha.id);
    expect(screen.queryByText("panel b")).toBeNull();
  });

  it("selects on arrow focus with automatic activation, skipping a disabled tab, with wrap and Home/End", async () => {
    const user = userEvent.setup();
    render(<TabsFixture />);
    screen.getByRole("tab", { name: "Alpha" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Beta" }).getAttribute("aria-selected")).toBe("true");
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Delta" }).getAttribute("aria-selected")).toBe("true");
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Alpha" }));
    await user.keyboard("{End}");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Delta" }));
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Alpha" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("panel a")).toBeTruthy();
  });

  it("moves focus without selecting under manual activation, then selects on Enter", async () => {
    const user = userEvent.setup();
    render(<TabsFixture activation="manual" />);
    screen.getByRole("tab", { name: "Alpha" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Beta" }));
    expect(screen.getByRole("tab", { name: "Alpha" }).getAttribute("aria-selected")).toBe("true");
    await user.keyboard("{Enter}");
    expect(screen.getByRole("tab", { name: "Beta" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("panel b")).toBeTruthy();
  });
});

describe("RadioGroup", () => {
  const options = [
    { value: "a", label: "Alpha" },
    { value: "b", label: "Beta", disabled: true },
    { value: "c", label: "Gamma" },
  ];

  it("has one tab stop on the chosen radio and moves the choice with the arrows, skipping a disabled one", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [v, setV] = React.useState("a");
      return <RadioGroup label="Letter" options={options} value={v} onChange={setV} />;
    }
    render(<Controlled />);
    const radios = screen.getAllByRole("radio");
    expect(radios.map((r) => r.tabIndex)).toEqual([0, -1, -1]);
    radios[0].focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Gamma" }).getAttribute("aria-checked")).toBe("true");
    expect(document.activeElement).toBe(screen.getByRole("radio", { name: "Gamma" }));
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Alpha" }).getAttribute("aria-checked")).toBe("true");
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("radio", { name: "Gamma" }).getAttribute("aria-checked")).toBe("true");
  });

  it("leaves the cross-axis arrows to the page, and every arrow on a television", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const seen = [];
    render(<div onKeyDown={(e) => seen.push(e.key + ":" + e.defaultPrevented)}>
      <RadioGroup label="Letter" options={options} value="a" onChange={onChange} />
    </div>);
    const alpha = screen.getByRole("radio", { name: "Alpha" });
    alpha.focus();
    await user.keyboard("{ArrowDown}");
    expect(onChange).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(alpha);
    expect(seen).toContain("ArrowDown:false");

    document.documentElement.setAttribute("data-tv", "");
    try {
      seen.length = 0;
      await user.keyboard("{ArrowRight}");
      expect(onChange).not.toHaveBeenCalled();
      expect(seen).toContain("ArrowRight:false");
      screen.getByRole("radio", { name: "Gamma" }).focus();
      await user.keyboard("{Enter}");
      expect(onChange).toHaveBeenCalledWith("c");
    } finally {
      document.documentElement.removeAttribute("data-tv");
    }
  });

  it("puts the tab stop on the first enabled radio when none is chosen", () => {
    render(<RadioGroup label="Letter" options={options} />);
    expect(screen.getAllByRole("radio").map((r) => r.tabIndex)).toEqual([0, -1, -1]);
  });
});

describe("Slider", () => {
  it("steps with the arrows, pages, and Home/End, and reports aria-valuetext through format", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onChangeEnd = vi.fn();
    render(<Slider label="Volume" defaultValue={50} step={5} format={(n) => n + " percent"}
      onChange={onChange} onChangeEnd={onChangeEnd} />);
    const thumb = screen.getByRole("slider", { name: "Volume" });
    expect(thumb.getAttribute("aria-valuenow")).toBe("50");
    expect(thumb.getAttribute("aria-valuetext")).toBe("50 percent");
    thumb.focus();
    await user.keyboard("{ArrowRight}");
    expect(thumb.getAttribute("aria-valuenow")).toBe("55");
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(thumb.getAttribute("aria-valuetext")).toBe("45 percent");
    await user.keyboard("{PageUp}");
    expect(thumb.getAttribute("aria-valuenow")).toBe("55");
    await user.keyboard("{End}");
    expect(thumb.getAttribute("aria-valuenow")).toBe("100");
    await user.keyboard("{ArrowRight}");
    expect(thumb.getAttribute("aria-valuenow")).toBe("100");
    await user.keyboard("{Home}");
    expect(thumb.getAttribute("aria-valuenow")).toBe("0");
    expect(onChange).toHaveBeenLastCalledWith(0);
    expect(onChangeEnd).toHaveBeenLastCalledWith(0);
  });

  it("ignores keys while disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Slider label="Volume" defaultValue={50} disabled onChange={onChange} />);
    const thumb = screen.getByRole("slider");
    thumb.focus();
    await user.keyboard("{ArrowRight}");
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("Disclosure and Accordion", () => {
  it("toggles aria-expanded and reports it", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Disclosure summary="More" onOpenChange={onOpenChange}>body</Disclosure>);
    const button = screen.getByRole("button", { name: "More" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    await user.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(button.getAttribute("aria-controls")).toBe(screen.getByRole("region", { hidden: true }).id);
  });

  const three = (props) => (
    <Accordion {...props}>
      <Disclosure value="a" summary="One">a</Disclosure>
      <Disclosure value="b" summary="Two">b</Disclosure>
      <Disclosure value="c" summary="Three" disabled>c</Disclosure>
    </Accordion>
  );
  const expanded = () => screen.getAllByRole("button").map((b) => b.getAttribute("aria-expanded"));

  it("single type opens one at a time and collapses the open one when collapsible", async () => {
    const user = userEvent.setup();
    render(three({ type: "single" }));
    await user.click(screen.getByRole("button", { name: "One" }));
    await user.click(screen.getByRole("button", { name: "Two" }));
    expect(expanded()).toEqual(["false", "true", "false"]);
    await user.click(screen.getByRole("button", { name: "Two" }));
    expect(expanded()).toEqual(["false", "false", "false"]);
  });

  it("single type keeps the last one open when not collapsible", async () => {
    const user = userEvent.setup();
    render(three({ type: "single", collapsible: false, defaultValue: "a" }));
    await user.click(screen.getByRole("button", { name: "One" }));
    expect(expanded()).toEqual(["true", "false", "false"]);
  });

  it("multiple type opens several and reports the list", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(three({ type: "multiple", onChange }));
    await user.click(screen.getByRole("button", { name: "One" }));
    await user.click(screen.getByRole("button", { name: "Two" }));
    expect(expanded()).toEqual(["true", "true", "false"]);
    expect(onChange).toHaveBeenLastCalledWith(["a", "b"]);
  });

  it("moves between headers with the arrows, skipping a disabled one, and Home/End", async () => {
    const user = userEvent.setup();
    render(three({ type: "single" }));
    screen.getByRole("button", { name: "One" }).focus();
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Two" }));
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "One" }));
    await user.keyboard("{End}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Two" }));
    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "One" }));
  });
});

describe("OptionList", () => {
  const options = [
    { value: "a", label: "Alpha" },
    { value: "b", label: "Beta" },
    { value: "c", label: "Gamma", disabled: true },
    { value: "d", label: "Delta" },
  ];

  it("single: radios in one group; the arrows move the choice", async () => {
    const user = userEvent.setup();
    function Single() {
      const [v, setV] = React.useState("a");
      return <OptionList label="Pick" options={options} value={v} onChange={setV} />;
    }
    render(<Single />);
    expect(screen.getByRole("radiogroup", { name: "Pick" })).toBeTruthy();
    screen.getByRole("radio", { name: "Alpha" }).focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: "Beta" }).checked).toBe(true);
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: "Delta" }).checked).toBe(true);
  });

  it("multiple: checkboxes report the list in option order", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function Many() {
      const [v, setV] = React.useState(["d"]);
      return <OptionList multiple label="Pick" options={options} value={v} onChange={(n) => { onChange(n); setV(n); }} />;
    }
    render(<Many />);
    await user.click(screen.getByRole("checkbox", { name: "Alpha" }));
    expect(onChange).toHaveBeenLastCalledWith(["a", "d"]);
    await user.click(screen.getByRole("checkbox", { name: "Delta" }));
    expect(onChange).toHaveBeenLastCalledWith(["a"]);
    expect(screen.getByRole("checkbox", { name: "Gamma" }).disabled).toBe(true);
  });

  it("collapses after a count, keeps the chosen ones visible, and reveals the rest", async () => {
    const user = userEvent.setup();
    render(<OptionList label="Pick" options={options} value="d" onChange={() => {}} collapsedAfter={2} />);
    expect(screen.getAllByRole("radio").map((r) => r.value)).toEqual(["a", "b", "d"]);
    await user.click(screen.getByRole("button", { name: /1 more/ }));
    expect(screen.getAllByRole("radio")).toHaveLength(4);
  });

  it("focuses the first revealed option that can take focus", async () => {
    const user = userEvent.setup();
    render(<OptionList label="Pick" options={options} value="a" onChange={() => {}} collapsedAfter={2} />);
    await user.click(screen.getByRole("button", { name: /2 more/ }));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("radio", { name: "Delta" })));
  });
});

describe("Tabs ids", () => {
  it("names a tab's panel with one id even when the value holds a space", () => {
    render(
      <Tabs defaultValue="Danger zone">
        <TabList label="x"><Tab value="Danger zone">Danger</Tab></TabList>
        <TabPanel value="Danger zone">p</TabPanel>
      </Tabs>,
    );
    const controls = screen.getByRole("tab").getAttribute("aria-controls");
    expect(controls).not.toMatch(/\s/);
    expect(screen.getByRole("tabpanel").id).toBe(controls);
  });
});

describe("RadioGroup swatch and ColorInput", () => {
  const options = [
    { value: "#ffffff", label: "White", color: "#ffffff" },
    { value: "#ff0000", label: "Red", color: "#ff0000" },
  ];

  it("names each disc by its label, chooses with arrows like any radio group, and leaves the picker out of the order", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RadioGroup variant="swatch" label="Colour" picker="Another" options={options} value="#ffffff" onChange={onChange} />);
    const white = screen.getByRole("radio", { name: "White" });
    expect(white.getAttribute("aria-checked")).toBe("true");
    expect(white.textContent).toBe("");
    white.focus();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith("#ff0000");
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("marks the picker as chosen when the value is none of the options, and reports the picked colour", () => {
    const onChange = vi.fn();
    const { container } = render(<RadioGroup variant="swatch" label="Colour" picker="Another" options={options} value="#123456" onChange={onChange} />);
    const input = screen.getByLabelText("Another");
    expect(input.value).toBe("#123456");
    expect(container.querySelector(".k-swatch--picker.k-is-on")).toBeTruthy();
    fireEvent.change(input, { target: { value: "#abcdef" } });
    expect(onChange).toHaveBeenCalledWith("#abcdef");
  });

  it("ColorInput is a colour input named by its label", () => {
    render(<ColorInput label="Text colour" value="#ffcc00" />);
    expect(screen.getByLabelText("Text colour").getAttribute("type")).toBe("color");
  });
});
