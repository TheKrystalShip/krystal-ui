import React from "react";

// useSheetPull — pull-to-dismiss for a sheet that slides in from an edge, bound to the sheet's head.
// A touch or pen that drags the head toward the edge moves the sheet with the finger and fades the
// scrim; let go far enough, or fast enough, the pull is handed to `onPull` (which closes the sheet),
// otherwise the sheet settles back open. A mouse never pulls. The head holds `touch-action: none`, so
// a pull never reaches the browser's own scrolling or pull to refresh.
//
// The pull is far enough at a fraction of the sheet's extent along its axis, never under the floor or
// over the cap, so a short sheet and a tall one both ask for a deliberate pull; a flick is a release
// moving toward the edge faster than FLICK_SPEED over the last 100 ms of travel.
//
// Returns `panel`, a ref for the sheet, and `head`, the pointer handlers for its head. The scrim is
// the sheet's parent element.

const PULL_FRACTION = 0.3;
const PULL_FLOOR = 40;
const PULL_CAP = 120;
const FLICK_SPEED = 0.5; // px per ms
const FLICK_FLOOR = 16; // a flick shorter than this is a twitch
const SLOP = 6; // px a press travels before it is a drag rather than a tap
const SETTLE_MS = 180;

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * @param {"bottom" | "right" | "left"} side The edge the sheet slides from.
 * @param {() => void} onPull
 * @param {boolean} [enabled]
 */
function useSheetPull(side, onPull, enabled = true) {
  const panel = React.useRef(/** @type {any} */ (null));
  const grab = React.useRef(/** @type {any} */ (null));
  const timer = React.useRef(0);
  const pull = React.useRef(onPull);
  pull.current = onPull;
  const vertical = side === "bottom";
  const dir = side === "left" ? -1 : 1;
  React.useEffect(() => () => clearTimeout(timer.current), []);

  const scrimOf = () => panel.current?.parentElement || null;
  const extent = () => (vertical ? panel.current?.offsetHeight : panel.current?.offsetWidth) || 1;

  // `d` is the distance along the dismiss direction, 0 at rest.
  const place = (d, animate) => {
    const el = panel.current;
    if (!el) return;
    el.style.animation = "none";
    el.style.transition = animate ? "transform " + SETTLE_MS + "ms var(--ease-out)" : "none";
    el.style.transform = d ? "translate" + (vertical ? "Y" : "X") + "(" + d * dir + "px)" : "";
    const scrim = scrimOf();
    if (scrim) {
      scrim.style.transition = animate ? "opacity " + SETTLE_MS + "ms var(--ease-out)" : "none";
      scrim.style.opacity = d ? String(Math.max(0, 1 - d / extent())) : "";
    }
  };
  const settleOpen = () => {
    const animate = !reduced();
    place(0, animate);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (panel.current) panel.current.style.transition = "";
      const scrim = scrimOf();
      if (scrim) scrim.style.transition = "";
    }, animate ? SETTLE_MS : 0);
  };

  const along = (e) => (vertical ? e.clientY : e.clientX) * dir;
  const across = (e) => (vertical ? e.clientX : e.clientY);

  const onPointerDown = (e) => {
    if (!enabled || e.pointerType === "mouse" || !e.isPrimary) return;
    grab.current = { id: e.pointerId, a: along(e), c: across(e), dragging: false, samples: [{ t: e.timeStamp, a: along(e) }] };
  };
  const onPointerMove = (e) => {
    const g = grab.current;
    if (!g || g.id !== e.pointerId) return;
    const d = along(e) - g.a;
    const x = across(e) - g.c;
    if (!g.dragging) {
      if (Math.abs(x) > SLOP && Math.abs(x) > Math.abs(d)) { grab.current = null; return; }
      if (d <= SLOP) return;
      g.dragging = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.classList.add("k-is-held");
    }
    g.samples.push({ t: e.timeStamp, a: along(e) });
    while (g.samples.length > 2 && e.timeStamp - g.samples[0].t > 100) g.samples.shift();
    place(Math.max(0, d), false);
  };
  const finish = (e, cancelled) => {
    const g = grab.current;
    if (!g || g.id !== e.pointerId) return;
    grab.current = null;
    if (!g.dragging) return;
    e.currentTarget.classList.remove("k-is-held");
    // The press that was a drag is not a tap on whatever the finger started on.
    const swallow = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
    window.addEventListener("click", swallow, { capture: true, once: true });
    setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 0);

    const first = g.samples[0];
    const last = g.samples[g.samples.length - 1];
    const d = Math.max(0, last.a - g.a);
    const speed = last.t > first.t ? (last.a - first.a) / (last.t - first.t) : 0;
    const far = Math.min(PULL_CAP, Math.max(PULL_FLOOR, extent() * PULL_FRACTION));
    const pulled = !cancelled && (d >= far || (speed >= FLICK_SPEED && d >= FLICK_FLOOR));
    if (!pulled) { settleOpen(); return; }

    // Away it goes, then the pull is handed over; a sheet that stays (a close the page refuses)
    // comes back to rest rather than staying off screen.
    const handOver = () => { pull.current(); settleOpen(); };
    if (reduced() || !panel.current) { handOver(); return; }
    place(extent(), true);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(handOver, SETTLE_MS);
  };

  return {
    panel,
    head: {
      onPointerDown, onPointerMove,
      onPointerUp: (e) => finish(e, false),
      onPointerCancel: (e) => finish(e, true),
    },
  };
}

export { useSheetPull };
