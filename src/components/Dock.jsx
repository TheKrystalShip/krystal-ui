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
function useDock({ storageKey, defaultWidth = 420, minWidth = 320, maxWidth = 900, contentFloor = 1000 } = {}) {
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
      handle.classList.remove("assistant-dock__resize--active");
    };
    document.body.style.userSelect = "none";
    handle.classList.add("assistant-dock__resize--active");
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
function Dock({ dock, compactBelow = 550, className, children }) {
  return (
    <aside className={"assistant-dock" + (dock.open ? " assistant-dock--open" : "") + (dock.pushing ? " assistant-dock--push" : "")
        + (dock.width < compactBelow ? " assistant-dock--compact" : "") + (className ? " " + className : "")}
      style={{ width: dock.desktop ? dock.width : undefined }}>
      {dock.open && <div className="assistant-dock__resize" onPointerDown={dock.startResize} title="Drag to resize"></div>}
      {children}
    </aside>
  );
}

// The floating button that opens the dock, bottom-right.
function DockFab({ onClick, label = "Open assistant" }) {
  return (
    <button className="assistant-fab" onClick={onClick} title={label} aria-label={label}>
      <AssistantFabIcon size={22} />
    </button>
  );
}

export { Dock, DockFab, useDock };
