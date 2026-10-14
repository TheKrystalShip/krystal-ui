import React from "react";
import AssistantFabIcon from "./AssistantFabIcon.jsx";

const PHONE_MAX = 768;

// The state of a dock: whether it is open, how wide it is, whether it is pinned beside the page or
// floats over it, and the measurements those depend on. Width, pin and open are this browser's own
// conveniences, kept under `${storageKey}:width`, `:pin` and `:open`.
//
// A pinned dock pushes the page over only while the page keeps at least `contentFloor` pixels; below
// that it floats whatever the pin says, and `canPush` is false so a pin control can say why. `pin`
// is null until somebody chooses, and an unchosen pin follows whether pushing is possible. On a
// phone the dock is full-width and never pushes.
//
// `storedOpen` is what `:open` held when the page loaded — "1", "0" or null — for a site that
// restores the dock once it knows the dock has something to show.
/**
 * @typedef {object} DockOptions
 * @property {string} storageKey Prefix of the localStorage keys.
 * @property {number} [defaultWidth] Width in pixels before one is stored.
 * @property {number} [minWidth] Narrowest width in pixels a resize reaches.
 * @property {number} [maxWidth] Widest width in pixels a resize reaches.
 * @property {number} [contentFloor] Pixels the page must keep for a pinned dock to push it.
 */
/**
 * @typedef {object} DockState
 * @property {boolean} open Whether the dock is shown.
 * @property {(open: boolean | ((open: boolean) => boolean)) => void} setOpen Sets the open state, from a value or an updater.
 * @property {string | null} storedOpen What `:open` held at load: "1", "0" or null.
 * @property {number} width The dock's width in pixels.
 * @property {(width: number) => void} setWidth Sets the width in pixels, within the minimum and maximum.
 * @property {(event: import("react").PointerEvent<HTMLElement>) => void} startResize Bound to the handle's pointerdown.
 * @property {boolean | null} pin Null until somebody chooses.
 * @property {(pin: boolean | null) => void} setPin Sets the pin, or null to follow whether pushing is possible.
 * @property {boolean} pinned Whether the dock is pinned beside the page.
 * @property {() => void} togglePin Flips the pin.
 * @property {boolean} canPush Whether the page keeps enough width for a pinned dock to push it.
 * @property {number} vw The viewport width in pixels.
 * @property {boolean} desktop Whether the viewport is wide enough to be a desktop rather than a phone.
 * @property {boolean} pushing Whether the dock is pinned, open and pushing the page over.
 */
/**
 * @param {DockOptions} [options]
 * @returns {DockState}
 */
function useDock({ storageKey, defaultWidth = 420, minWidth = 320, maxWidth = 900, contentFloor = 1000 } = /** @type {DockOptions} */ ({})) {
  const read = (name) => { try { return localStorage.getItem(storageKey + ":" + name); } catch { return null; } };
  const [open, setOpen] = React.useState(false);
  const [storedOpen] = React.useState(() => read("open"));
  const [pin, setPin] = React.useState(() => {
    const v = read("pin");
    return v === "1" ? true : v === "0" ? false : null;
  });
  const [width, setWidth] = React.useState(() => {
    const saved = parseInt(read("width") || "", 10);
    return saved && saved >= minWidth && saved <= maxWidth ? saved : defaultWidth;
  });
  const [vw, setVw] = React.useState(() => window.innerWidth);

  // Bound to the handle's pointerdown. The handle carries `--active` while it is held, and text
  // selection is off for the drag so the page does not highlight under the pointer.
  const startResize = React.useCallback((e) => {
    e.preventDefault();
    const handle = e.currentTarget;
    const startX = e.clientX;
    const startW = width;
    const max = Math.min(maxWidth, window.innerWidth - 80);
    const onMove = (ev) => {
      setWidth(Math.max(minWidth, Math.min(max, startW + (startX - ev.clientX))));
    };
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.body.style.userSelect = "";
      handle.classList.remove("k-assistant-dock__resize--active");
    };
    document.body.style.userSelect = "none";
    handle.classList.add("k-assistant-dock__resize--active");
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }, [width, minWidth, maxWidth]);

  React.useEffect(() => {
    try { localStorage.setItem(storageKey + ":width", String(width)); } catch { /* storage refused */ }
  }, [storageKey, width]);

  React.useEffect(() => {
    try {
      if (pin == null) localStorage.removeItem(storageKey + ":pin");
      else localStorage.setItem(storageKey + ":pin", pin ? "1" : "0");
    } catch { /* storage refused */ }
  }, [storageKey, pin]);

  React.useEffect(() => {
    try { localStorage.setItem(storageKey + ":open", open ? "1" : "0"); } catch { /* storage refused */ }
  }, [storageKey, open]);

  React.useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const desktop = vw > PHONE_MAX;
  const canPush = desktop && (vw - width) >= contentFloor;
  const pinned = pin == null ? canPush : (pin && canPush);
  const pushing = desktop && open && pinned;
  const togglePin = React.useCallback(() => setPin(!pinned), [pinned]);

  return React.useMemo(() => ({
    open, setOpen, storedOpen,
    width, setWidth, startResize,
    pin, setPin, pinned, togglePin, canPush,
    vw, desktop, pushing,
  }), [open, storedOpen, width, startResize, pin, pinned, togglePin, canPush, vw, desktop, pushing]);
}

// The dock itself: fixed to the right edge, sliding in when `dock.open`, with the resize handle on
// its left edge while it is open. Below `compactBelow` pixels it carries `--compact`, for content
// that tightens at that width.
/**
 * @param {object} props
 * @param {DockState} props.dock The state `useDock` returned.
 * @param {number} [props.compactBelow] Width under which the dock carries `--compact`.
 * @param {string} [props.className] Class name added to the root element.
 * @param {import("react").ReactNode} [props.children] The dock's content.
 */
function Dock({ dock, compactBelow = 550, className, children }) {
  return (
    <aside className={"k-assistant-dock" + (dock.open ? " k-assistant-dock--open" : "") + (dock.pushing ? " k-assistant-dock--push" : "")
        + (dock.width < compactBelow ? " k-assistant-dock--compact" : "") + (className ? " " + className : "")}
      style={{ width: dock.desktop ? dock.width : undefined }}>
      {dock.open && <div className="k-assistant-dock__resize" onPointerDown={dock.startResize} title="Drag to resize"></div>}
      {children}
    </aside>
  );
}

// The floating button that opens the dock, bottom-right.
/**
 * @param {object} props
 * @param {() => void} [props.onClick] Runs when the button is pressed; the site opens the dock.
 * @param {string} [props.label] The button's accessible name.
 */
function DockFab({ onClick, label = "Open assistant" }) {
  return (
    <button className="k-assistant-fab" onClick={onClick} title={label} aria-label={label}>
      <AssistantFabIcon size={22} />
    </button>
  );
}

export { Dock, DockFab, useDock };
