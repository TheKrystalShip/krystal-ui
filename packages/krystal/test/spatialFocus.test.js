import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createSpatialFocus } from "@thekrystalship/krystal";

// jsdom has no layout: each element's rectangle is its data-box="left,top,width,height".
const original = Element.prototype.getBoundingClientRect;
beforeEach(() => {
  Element.prototype.getBoundingClientRect = function box() {
    const [x, y, w, h] = (this.getAttribute("data-box") || "0,0,0,0").split(",").map(Number);
    return { x, y, left: x, top: y, width: w, height: h, right: x + w, bottom: y + h, toJSON() {} };
  };
  Element.prototype.scrollTo = function scrollTo() {};
});
afterEach(() => {
  Element.prototype.getBoundingClientRect = original;
  document.body.innerHTML = "";
});

/** A grid of buttons named by cell, `cols` wide, 100px cells with a 20px gap. */
function grid(cols, rows, { skip = [] } = {}) {
  const host = document.createElement("main");
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const name = r + "," + c;
      if (skip.includes(name)) continue;
      const b = document.createElement("button");
      b.textContent = name;
      b.setAttribute("data-box", [c * 120, r * 120, 100, 100].join(","));
      host.appendChild(b);
    }
  }
  document.body.appendChild(host);
  return host;
}
const at = (name) => [...document.querySelectorAll("button")].find((b) => b.textContent === name);
const press = (key) => {
  const e = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
  document.activeElement.dispatchEvent(e);
  return e;
};

describe("spatial focus", () => {
  it("moves to the nearest control in the direction of each arrow, and takes the key", () => {
    grid(3, 3);
    const nav = createSpatialFocus();
    nav.start();
    at("1,1").focus();
    expect(press("ArrowRight").defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(at("1,2"));
    press("ArrowDown");
    expect(document.activeElement).toBe(at("2,2"));
    press("ArrowLeft");
    expect(document.activeElement).toBe(at("2,1"));
    press("ArrowUp");
    expect(document.activeElement).toBe(at("1,1"));
    nav.destroy();
  });

  it("stays on the edge: the end of a row does not jump into the next", () => {
    grid(3, 2);
    const nav = createSpatialFocus();
    nav.start();
    at("0,2").focus();
    press("ArrowRight");
    expect(document.activeElement).toBe(at("0,2"));
    nav.destroy();
  });

  it("prefers the candidate nearer along the arrow over one far to the side, and skips a hole", () => {
    grid(3, 3, { skip: ["1,1"] });
    const nav = createSpatialFocus();
    nav.start();
    at("1,0").focus();
    press("ArrowRight");
    expect(document.activeElement).toBe(at("1,2"));
    at("0,0").focus();
    press("ArrowDown");
    expect(document.activeElement).toBe(at("1,0"));
    nav.destroy();
  });

  it("ignores disabled and hidden controls", () => {
    grid(3, 1);
    at("0,1").disabled = true;
    const nav = createSpatialFocus();
    nav.start();
    at("0,0").focus();
    press("ArrowRight");
    expect(document.activeElement).toBe(at("0,2"));
    at("0,2").setAttribute("aria-hidden", "true");
    at("0,0").focus();
    press("ArrowRight");
    expect(document.activeElement).toBe(at("0,0"));
    nav.destroy();
  });

  it("keeps Left and Right for a slider", () => {
    const host = grid(2, 1);
    const slider = document.createElement("div");
    slider.setAttribute("role", "slider");
    slider.tabIndex = 0;
    slider.setAttribute("data-box", "240,0,100,100");
    host.appendChild(slider);
    const nav = createSpatialFocus();
    nav.start();
    slider.focus();
    expect(press("ArrowLeft").defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(slider);
    nav.destroy();
  });

  it("starts on the control marked data-tv-initial when nothing holds focus", () => {
    grid(2, 2);
    at("1,1").setAttribute("data-tv-initial", "");
    const nav = createSpatialFocus();
    nav.focusInitial();
    expect(document.activeElement).toBe(at("1,1"));
  });

  it("holds focus inside an open dialog", () => {
    grid(2, 1);
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("data-box", "0,300,300,100");
    for (const [i, name] of ["ok", "cancel"].entries()) {
      const b = document.createElement("button");
      b.textContent = name;
      b.setAttribute("data-box", [i * 120, 300, 100, 50].join(","));
      dialog.appendChild(b);
    }
    document.body.appendChild(dialog);
    const nav = createSpatialFocus();
    nav.start();
    at("ok").focus();
    press("ArrowUp");
    expect(dialog.contains(document.activeElement)).toBe(true);
    press("ArrowRight");
    expect(document.activeElement).toBe(at("cancel"));
    nav.destroy();
  });

  it("calls onBack for Escape when no overlay is open", () => {
    grid(1, 1);
    let backs = 0;
    const nav = createSpatialFocus({ onBack: () => { backs++; return true; } });
    nav.start();
    at("0,0").focus();
    expect(press("Escape").defaultPrevented).toBe(true);
    expect(backs).toBe(1);
    nav.destroy();
  });
});
