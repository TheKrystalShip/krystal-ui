import React from "react";

// useDockDrag — one height a finger moves between closed and open: a dock or a sheet standing on an
// edge that grows upward. The height runs from the closed height to the open one, and `--dock-p` on
// the panel and on its scrim is how far along that is, 0 to 1, which a stylesheet turns into the
// open content coming in and the scrim darkening.
//
// A finger moves it from the grips the caller binds (`grip`, or `handlers`, which start a drag while
// the dock is open only on the head), and, while open, from the body when that is scrolled to its top
// and the finger moves down (touch events, since the body scrolls natively until the dock takes the
// touch). A press is a drag once it travels SLOP. Let go, it settles at whichever height the drag's
// distance or speed says: a drag far enough, or a shorter one fast enough, commits to the other
// height. A push past the open height is followed a fifth of the way, at most OVERDRAG_CAP. A press
// held HOLD_MS without a drag is handed to `onHold`. A sideways swipe on the closed dock is handed to
// `onAway` when the caller gives one. The click that ends a drag or a hold is swallowed, so letting
// go never also presses what the finger started on.
//
// The caller owns what is drawn and where the panel stands. `measure` reports the heights at rest:
// the closed height, the open content's natural height and the highest the panel may stand. `live`
// says the open content is drawn: while open, while a finger grows the panel and while it settles.

const SLOP = 8; // px a press travels before it is a drag rather than a tap
const SHIFT_FRACTION = 0.25; // of the way between the two heights a drag commits at...
const SHIFT_FLOOR = 36; // ...never under this
const SHIFT_CAP = 100; // ...nor over this
const FLICK_SPEED = 0.5; // px per ms, over the last 100 ms of the finger's travel
const FLICK_FLOOR = 12; // a flick shorter than this is a twitch
const OVERDRAG = 0.2; // the share of a push past the open height the panel follows...
const OVERDRAG_CAP = 24; // ...and at most this many px
const AWAY_FRACTION = 0.3; // of the panel's width a sideways swipe leaves at...
const AWAY_FLOOR = 72; // ...never under this
const AWAY_FLICK_FLOOR = 16;
const SLIDE_MS = 180;
const SETTLE_MS = 220;
const HOLD_MS = 500;
const BUZZ_MS = 15;

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A short vibration where the phone has one: a gesture has landed. */
function buzz() {
  try {
    if (typeof navigator.vibrate === "function") navigator.vibrate(BUZZ_MS);
  } catch {
    // A phone that refuses to vibrate still has the screen to show it.
  }
}

/** Takes the click that ends a drag, which is not a tap on whatever the finger started on. */
function swallowClick() {
  const swallow = (/** @type {Event} */ ev) => { ev.stopPropagation(); ev.preventDefault(); };
  window.addEventListener("click", swallow, { capture: true, once: true });
  setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 0);
}

/** Takes the click that ends a press which is still down, once the finger lets go. */
function swallowNextClick() {
  const swallow = (/** @type {Event} */ ev) => { ev.stopPropagation(); ev.preventDefault(); };
  window.addEventListener("click", swallow, { capture: true, once: true });
  const drop = () => setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 0);
  window.addEventListener("pointerup", drop, { once: true });
  window.addEventListener("pointercancel", drop, { once: true });
}

/**
 * @typedef {object} DockMeasure
 * @property {number} shut The closed height, the panel's top border included.
 * @property {number | null} natural The open content's natural height, the top border included; null while the open content is not drawn.
 * @property {number} cap The highest the panel may stand.
 */
/**
 * @typedef {object} DockHold
 * @property {EventTarget | null} target What the press started on.
 */
/**
 * @typedef {object} DockDragOptions
 * @property {boolean} open Whether the panel rests open.
 * @property {(open: boolean) => void} onOpenChange Called with the height a drag settles at when that is not the one the panel rests at.
 * @property {(at: { edge: number }) => DockMeasure | null} measure The heights at rest, read from the page; `edge` is the panel's top border. Null leaves the last measure standing.
 * @property {(hold: DockHold) => boolean} [onHold] Called when a press has been held without a drag; returns whether it took the hold (a vibration, and the click that ends the press swallowed).
 * @property {() => void} [onAway] Turns on the sideways swipe of the closed panel; called once the panel has slid away.
 * @property {boolean} [eager] Draws the open content (`live`) as soon as a press lands on the closed panel rather than once a drag begins; true by default.
 * @property {boolean} [haptics] Vibrates when a drag commits to the other height; true by default.
 * @property {string} [heldClass] The class the panel carries while a finger moves it; "k-is-held" by default.
 * @property {string} [pullIgnore] A selector for what inside the body keeps a touch of its own rather than pulling the panel down.
 */
/**
 * @typedef {object} DockDragHandlers
 * @property {(e: import("react").PointerEvent<any>) => void} onPointerDown
 * @property {(e: import("react").PointerEvent<any>) => void} onPointerMove
 * @property {(e: import("react").PointerEvent<any>) => void} onPointerUp
 * @property {(e: import("react").PointerEvent<any>) => void} onPointerCancel
 */
/**
 * @typedef {object} DockDragResult
 * @property {boolean} live The open content is drawn.
 * @property {import("react").MutableRefObject<any>} panel Ref for the element whose height moves.
 * @property {import("react").MutableRefObject<any>} scrim Ref for the scrim, which follows `--dock-p`.
 * @property {import("react").MutableRefObject<any>} head Ref for the open panel's head, which a drag may start on.
 * @property {import("react").MutableRefObject<any>} body Ref for the open panel's scrolling body.
 * @property {DockDragHandlers} handlers Pointer handlers for the panel: a press starts a drag on the closed panel, and on the open panel only on `head`.
 * @property {DockDragHandlers} grip Pointer handlers for an element that starts a drag whether the panel is closed or open.
 * @property {import("react").MutableRefObject<{ shut: number, open: number, cap: number, drawn: boolean }>} size The heights at rest, as last measured.
 * @property {() => void} measure Measures the heights now.
 * @property {(animate: boolean) => void} rest Moves the panel to the height it rests at, animated or not.
 * @property {() => boolean} grabbing Whether a finger is moving the panel.
 */

/**
 * @param {DockDragOptions} options
 * @returns {DockDragResult}
 */
function useDockDrag(options) {
  const { open } = options;
  const opts = React.useRef(options);
  opts.current = options;
  const panel = React.useRef(/** @type {any} */ (null));
  const scrim = React.useRef(/** @type {any} */ (null));
  const head = React.useRef(/** @type {any} */ (null));
  const body = React.useRef(/** @type {any} */ (null));
  const size = React.useRef({ shut: 0, open: 0, cap: 0, drawn: false });
  const height = React.useRef(/** @type {number | null} */ (null));
  const grab = React.useRef(/** @type {any} */ (null));
  const timer = React.useRef(0);
  const openNow = React.useRef(open);
  openNow.current = open;
  const [live, setLive] = React.useState(open);

  const held = () => opts.current.heldClass || "k-is-held";
  // Until the open content is drawn and measured, the panel opens toward the highest it may stand.
  const ceiling = () => (size.current.drawn && size.current.open > size.current.shut ? size.current.open : size.current.cap);
  const progress = (/** @type {number} */ h) => {
    const { shut } = size.current, full = ceiling();
    if (full <= shut) return h > shut ? 1 : 0;
    return Math.min(1, Math.max(0, (h - shut) / (full - shut)));
  };
  const paint = (/** @type {number} */ h, /** @type {boolean} */ animate) => {
    const node = panel.current;
    if (!node) return;
    height.current = h;
    const moving = animate && !reduced();
    node.style.transition = moving ? `height ${SETTLE_MS}ms var(--ease-out), --dock-p ${SETTLE_MS}ms var(--ease-out)` : "none";
    node.style.height = `${h}px`;
    node.style.setProperty("--dock-p", String(progress(h)));
    if (scrim.current) {
      scrim.current.style.transition = moving ? `--dock-p ${SETTLE_MS}ms var(--ease-out)` : "none";
      scrim.current.style.setProperty("--dock-p", String(progress(h)));
    }
  };
  const measure = () => {
    const node = panel.current;
    if (!node) return;
    const edge = node.clientTop;
    const m = opts.current.measure({ edge });
    if (!m) return;
    const { shut } = m;
    const natural = m.natural == null ? shut : m.natural;
    const full = Math.max(shut, Math.min(natural, m.cap));
    size.current = { shut, open: full, cap: Math.max(shut, m.cap), drawn: m.natural != null };
    node.style.setProperty("--dock-open-h", `${full - edge}px`);
  };
  /** Settles at rest open or closed, and lets the open content go once closed. */
  const rest = (/** @type {boolean} */ animate) => {
    clearTimeout(timer.current);
    paint(openNow.current ? size.current.open : size.current.shut, animate);
    if (!openNow.current) timer.current = window.setTimeout(() => { if (!openNow.current && !grab.current) setLive(false); }, animate ? SETTLE_MS : 0);
  };
  React.useEffect(() => () => {
    clearTimeout(timer.current);
    if (grab.current) clearTimeout(grab.current.hold);
  }, []);

  // Opened or closed by a tap, a key, the scrim or the page: the open content is drawn first, then the panel moves.
  React.useEffect(() => {
    if (open && !live) { setLive(true); return; }
    if (!grab.current) { measure(); rest(true); }
    // The panel's functions read refs alone, so the ones of any render are the same.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, live]);

  const begin = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ t) =>
    ({ x, y, axis: null, from: height.current ?? size.current.shut, opened: openNow.current, samples: [{ t, x, y }] });
  const track = (/** @type {any} */ g, /** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ t) => {
    g.samples.push({ t, x, y });
    while (g.samples.length > 2 && t - g.samples[0].t > 100) g.samples.shift();
  };
  const follow = (/** @type {any} */ g, /** @type {number} */ y) => {
    const { shut } = size.current, full = ceiling();
    let h = g.from - (y - g.y);
    if (h > full) h = full + Math.min(OVERDRAG_CAP, (h - full) * OVERDRAG);
    paint(Math.max(shut, h), false);
  };
  const settle = (/** @type {any} */ g, /** @type {boolean} */ cancelled) => {
    const { shut } = size.current, full = ceiling();
    const first = g.samples[0], last = g.samples[g.samples.length - 1];
    const growth = (first.y - last.y) / Math.max(1, last.t - first.t);
    const moved = (height.current ?? g.from) - g.from;
    const far = Math.min(SHIFT_CAP, Math.max(SHIFT_FLOOR, (full - shut) * SHIFT_FRACTION));
    let target = g.opened;
    if (!cancelled && g.opened && (moved <= -far || (growth <= -FLICK_SPEED && moved <= -FLICK_FLOOR))) target = false;
    if (!cancelled && !g.opened && (moved >= far || (growth >= FLICK_SPEED && moved >= FLICK_FLOOR))) target = true;
    const before = openNow.current;
    openNow.current = target;
    rest(true);
    if (target !== before) {
      if (opts.current.haptics !== false) buzz();
      opts.current.onOpenChange(target);
    }
  };
  /** The closed panel followed sideways, faded as it goes. */
  const slide = (/** @type {number} */ dx, /** @type {boolean} */ animate) => {
    const node = panel.current;
    if (!node) return;
    node.style.transition = animate ? `transform ${SLIDE_MS}ms var(--ease-out), opacity ${SLIDE_MS}ms var(--ease-out)` : "none";
    node.style.transform = dx ? `translateX(${dx}px)` : "";
    node.style.opacity = dx ? String(Math.max(0.4, 1 - Math.abs(dx) / (node.offsetWidth || 1) * 0.9)) : "";
  };

  const hold = (/** @type {any} */ g, /** @type {EventTarget | null} */ target) => {
    if (grab.current !== g || g.axis || !opts.current.onHold) return;
    if (!opts.current.onHold({ target })) return;
    grab.current = null;
    buzz();
    swallowNextClick();
  };

  // A finger or a pointer on a grip. `gated` grips start a drag on the open panel only from its head.
  const down = (/** @type {boolean} */ gated) => (/** @type {import("react").PointerEvent<any>} */ e) => {
    if (e.button > 0 || !e.isPrimary) return;
    if (gated && openNow.current && !(head.current && head.current.contains(e.target))) return;
    const g = { id: e.pointerId, ...begin(e.clientX, e.clientY, e.timeStamp), hold: 0 };
    grab.current = g;
    // The open content is drawn while the finger is still inside the slop, so the drag's first frames move the panel rather than draw it.
    if (opts.current.eager !== false && !openNow.current) { clearTimeout(timer.current); setLive(true); }
    if (opts.current.onHold) {
      const target = e.target;
      g.hold = window.setTimeout(() => hold(g, target), HOLD_MS);
    }
  };
  const move = (/** @type {import("react").PointerEvent<any>} */ e) => {
    const g = grab.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x, dy = e.clientY - g.y;
    if (!g.axis) {
      if (Math.hypot(dx, dy) < SLOP) return;
      clearTimeout(g.hold);
      g.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      // Sideways is the closed panel's alone, when the caller gives it one, and a closed panel has nowhere lower to go.
      if ((g.axis === "x" && (g.opened || !opts.current.onAway)) || (g.axis === "y" && !g.opened && dy > 0)) { grab.current = null; if (!g.opened) rest(true); return; }
      if (!openNow.current) { clearTimeout(timer.current); setLive(true); }
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* a pointer that is gone has nothing to capture */ }
      panel.current?.classList.add(held());
    }
    track(g, e.clientX, e.clientY, e.timeStamp);
    if (g.axis === "x") slide(dx, false);
    else follow(g, e.clientY);
  };
  const finish = (/** @type {import("react").PointerEvent<any>} */ e, /** @type {boolean} */ cancelled) => {
    const g = grab.current;
    if (!g || g.id !== e.pointerId) return;
    grab.current = null;
    clearTimeout(g.hold);
    // A press that was no drag: a tap opens the panel through the caller, and anything else leaves it closed.
    if (!g.axis) { if (!openNow.current) rest(true); return; }
    panel.current?.classList.remove(held());
    swallowClick();
    if (g.axis === "y") { settle(g, cancelled); return; }
    const dx = e.clientX - g.x;
    const first = g.samples[0], last = g.samples[g.samples.length - 1];
    const speed = (last.x - first.x) / Math.max(1, last.t - first.t);
    const width = panel.current ? panel.current.offsetWidth : 360;
    const away = !cancelled && (Math.abs(dx) >= Math.max(AWAY_FLOOR, width * AWAY_FRACTION) || (Math.abs(speed) >= FLICK_SPEED && Math.abs(dx) >= AWAY_FLICK_FLOOR));
    if (!away) { slide(0, true); return; }
    const gone = () => opts.current.onAway && opts.current.onAway();
    if (reduced()) { gone(); return; }
    slide((dx < 0 ? -1 : 1) * width, true);
    if (panel.current) panel.current.style.opacity = "0";
    setTimeout(gone, SLIDE_MS);
  };

  // A finger pulling the open body down from its top: touch events, since the body scrolls
  // natively until the panel takes the touch, and taking it means cancelling the first move.
  React.useEffect(() => {
    const node = body.current;
    if (!node) return undefined;
    let g = /** @type {any} */ (null);
    const start = (/** @type {TouchEvent} */ e) => {
      g = null;
      if (e.touches.length !== 1 || !openNow.current || grab.current) return;
      const ignore = opts.current.pullIgnore;
      if (ignore && e.target instanceof Element && e.target.closest(ignore)) return;
      const t = e.touches[0];
      g = { ...begin(t.clientX, t.clientY, e.timeStamp), taken: null };
    };
    const moved = (/** @type {TouchEvent} */ e) => {
      if (!g) return;
      const t = e.touches[0];
      const dx = t.clientX - g.x, dy = t.clientY - g.y;
      if (g.taken === null) {
        if (Math.abs(dx) + Math.abs(dy) < 3) return;
        g.taken = node.scrollTop <= 0 && dy > 0 && dy >= Math.abs(dx);
        if (g.taken) {
          grab.current = g;
          panel.current?.classList.add(held());
        }
      }
      if (!g.taken) return;
      if (e.cancelable) e.preventDefault();
      track(g, t.clientX, t.clientY, e.timeStamp);
      follow(g, t.clientY);
    };
    const end = (/** @type {boolean} */ cancelled) => () => {
      const was = g;
      g = null;
      if (!was || !was.taken) return;
      grab.current = null;
      panel.current?.classList.remove(held());
      swallowClick();
      settle(was, cancelled);
    };
    const ended = end(false), cancelled = end(true);
    node.addEventListener("touchstart", start, { passive: true });
    node.addEventListener("touchmove", moved, { passive: false });
    node.addEventListener("touchend", ended);
    node.addEventListener("touchcancel", cancelled);
    return () => {
      node.removeEventListener("touchstart", start);
      node.removeEventListener("touchmove", moved);
      node.removeEventListener("touchend", ended);
      node.removeEventListener("touchcancel", cancelled);
    };
    // The panel's functions read refs alone, so the ones of any render are the same.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  const handlersOf = (/** @type {boolean} */ gated) => ({
    onPointerDown: down(gated),
    onPointerMove: move,
    onPointerUp: (/** @type {import("react").PointerEvent<any>} */ e) => finish(e, false),
    onPointerCancel: (/** @type {import("react").PointerEvent<any>} */ e) => finish(e, true),
  });

  // The functions a caller calls from its own effects are the same for the life of the panel.
  const latest = React.useRef({ measure, rest });
  latest.current = { measure, rest };
  const stable = React.useRef({
    measure: () => latest.current.measure(),
    rest: (/** @type {boolean} */ animate) => latest.current.rest(animate),
    grabbing: () => Boolean(grab.current),
  });

  return {
    live, panel, scrim, head, body, size,
    handlers: handlersOf(true),
    grip: handlersOf(false),
    ...stable.current,
  };
}

export { useDockDrag, buzz };
