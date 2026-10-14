import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom has no layout. The pieces of it the components ask about are answered here: an attached
// element has one client rect, so "is this focusable thing visible" is true; observers exist and
// observe nothing; the media queries a component reads are all false.
Object.defineProperty(HTMLElement.prototype, "getClientRects", {
  configurable: true,
  value() {
    return this.isConnected ? [{ x: 0, y: 0, width: 100, height: 20, top: 0, left: 0, right: 100, bottom: 20 }] : [];
  },
});

globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
globalThis.IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
window.matchMedia ??= (query) => ({
  matches: false, media: query, onchange: null,
  addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false; },
});
Element.prototype.scrollIntoView ??= function scrollIntoView() {};
Element.prototype.setPointerCapture ??= function setPointerCapture() {};
Element.prototype.releasePointerCapture ??= function releasePointerCapture() {};
globalThis.CSS ??= {};
globalThis.CSS.escape ??= (s) => String(s).replace(/[^a-zA-Z0-9_-]/g, "\\$&");

afterEach(() => cleanup());
