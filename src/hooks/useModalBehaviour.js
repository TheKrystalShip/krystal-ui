import React from "react";

// useModalBehaviour — what makes an overlay a dialog rather than a picture of one. Attach it to the
// ref of the element portaled into <body> (the scrim, or the sheet's outermost element) and it
//   • moves focus into the sheet on open (an `autoFocus` / `data-autofocus` element, else the first
//     focusable, else the sheet itself) and hands it back to whatever held it before, on close
//   • keeps Tab and Shift+Tab inside the sheet
//   • marks every other child of <body> `inert` while it is the topmost overlay
//   • closes on Escape, only when it is the topmost overlay and `canClose` allows it
//
// Open overlays form a module-level stack. Only the top entry owns the inert background and the
// Escape key, so a dialog opened from a dialog leaves its parent inert and a close of the child
// gives the parent its background back. The inert set is recomputed from the stack on every push
// and pop, and only elements this module marked are ever un-marked, so an `inert` a page set itself
// stays. A body child marked `data-inert-exempt` (the toast region) is never made inert.
//
// `onClose` and `canClose` are read through a ref, so a new callback identity each render never
// reorders the stack or re-runs the focus handling.

const stack = [];
const inerted = new Set();

const FOCUSABLE = [
  "a[href]", "button:not([disabled])", "input:not([disabled]):not([type=hidden])",
  "select:not([disabled])", "textarea:not([disabled])", "summary", "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function bodyChild(el) {
  let node = el;
  while (node && node.parentNode !== document.body) node = node.parentNode;
  return node;
}

function applyInert() {
  inerted.forEach((el) => el.removeAttribute("inert"));
  inerted.clear();
  const top = stack[stack.length - 1];
  const keep = top && bodyChild(top.root.current);
  if (!keep) return;
  Array.from(document.body.children).forEach((el) => {
    if (el === keep || el.hasAttribute("inert") || el.hasAttribute("data-inert-exempt")) return;
    el.setAttribute("inert", "");
    inerted.add(el);
  });
}

function focusables(root) {
  return Array.from(root.querySelectorAll(FOCUSABLE)).filter(
    (el) => el.getClientRects().length > 0 && !el.closest("[inert]"),
  );
}

function sheetOf(root) {
  return root.querySelector("[role='dialog']") || root.firstElementChild || root;
}

function focusInto(root) {
  if (root.contains(document.activeElement)) return;
  const target = root.querySelector("[data-autofocus]") || focusables(root)[0];
  if (target) { target.focus(); return; }
  const sheet = sheetOf(root);
  if (!sheet.hasAttribute("tabindex")) sheet.setAttribute("tabindex", "-1");
  sheet.focus();
}

function useModalBehaviour(root, { onClose, canClose = true } = {}) {
  const live = React.useRef({});
  live.current = { onClose, canClose };
  // Read during the first render, before any child's `autoFocus` has moved focus.
  const opener = React.useRef(undefined);
  if (opener.current === undefined) {
    opener.current = typeof document === "undefined" ? null : document.activeElement;
  }

  React.useEffect(() => {
    const el = root.current;
    if (!el) return undefined;
    const entry = { root, live };
    stack.push(entry);
    applyInert();
    focusInto(el);

    const onKey = (e) => {
      if (e.key === "Escape") {
        const { onClose: close, canClose: allowed } = live.current;
        if (stack[stack.length - 1] !== entry || e.defaultPrevented || !allowed || !close) return;
        close();
        return;
      }
      if (e.key !== "Tab" || stack[stack.length - 1] !== entry) return;
      const items = focusables(el);
      if (items.length === 0) { e.preventDefault(); sheetOf(el).focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      const at = document.activeElement;
      if (e.shiftKey && (at === first || !el.contains(at) || at === sheetOf(el))) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && (at === last || !el.contains(at))) {
        e.preventDefault(); first.focus();
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      stack.splice(stack.indexOf(entry), 1);
      applyInert();
      const back = opener.current;
      if (back && back.isConnected && typeof back.focus === "function") back.focus();
    };
  }, [root]);
}

export { useModalBehaviour };
