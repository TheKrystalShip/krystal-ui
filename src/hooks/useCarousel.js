import React from "react";

// One of `count` slides at a time, turning to the next every `interval` milliseconds and back to the
// first after the last. Spread `rootProps` on what holds the slides and hand the whole result to a
// `CarouselPager`.
//
// It holds still while a mouse is over the slides, while focus a keyboard moved is in them
// (`pauseOnFocus`), while the page is hidden, while `paused` is set, and never turns by itself for
// somebody whose system asks for reduced motion. A key pressed or a pointer put down in the slides
// starts the slide's time over, so what is about to be chosen is not turned away under the press. A
// touch swiped across the slides turns them by hand, as `go`, `next` and `prev` do, and the slide
// chosen by hand is given its whole time.
//
// `index` is the slide shown, `autoplay` whether the slides turn by themselves at all, `running`
// whether they are turning now, and `epoch` a number that changes whenever a slide's time starts over.

/** How far a touch has to travel across the slides, and how much more across than along, to turn them. */
const SWIPE_PX = 48;
const SWIPE_RATIO = 1.5;

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(() => matches("(prefers-reduced-motion: reduce)"));
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  return reduced;
}

function matches(media) {
  return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(media).matches;
}

function useCarousel({ count, interval = 8000, start = 0, pauseOnFocus = true, paused = false }) {
  const [index, setIndex] = React.useState(() => (count > 0 ? start % count : 0));
  const [epoch, setEpoch] = React.useState(0);
  const [hover, setHover] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const [hidden, setHidden] = React.useState(() => typeof document !== "undefined" && document.hidden);
  const reduced = useReducedMotion();
  const remaining = React.useRef(interval);
  const epochNow = React.useRef(0);
  const touch = React.useRef(null);

  const shown = count > 0 ? Math.min(index, count - 1) : 0;
  const autoplay = count > 1 && !reduced;
  const running = autoplay && !paused && !hover && !(pauseOnFocus && focus) && !hidden;

  const restart = React.useCallback(() => {
    remaining.current = interval;
    epochNow.current += 1;
    setEpoch(epochNow.current);
  }, [interval]);

  const go = React.useCallback((i) => {
    if (count < 1) return;
    setIndex(((i % count) + count) % count);
    restart();
  }, [count, restart]);

  React.useEffect(() => {
    const change = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", change);
    return () => document.removeEventListener("visibilitychange", change);
  }, []);

  // The slide's time is kept across a pause: what was left of it when the slides stopped is what they
  // wait once they turn again.
  React.useEffect(() => {
    if (!running) return undefined;
    const mine = epochNow.current;
    const budget = remaining.current;
    const began = Date.now();
    const timer = setTimeout(() => go(shown + 1), budget);
    return () => {
      clearTimeout(timer);
      if (epochNow.current === mine) remaining.current = Math.max(0, budget - (Date.now() - began));
    };
  }, [running, shown, epoch, go]);

  const rootProps = {
    "data-carousel": "",
    "aria-roledescription": "carousel",
    onPointerEnter: (e) => { if (e.pointerType === "mouse") setHover(true); },
    onPointerLeave: (e) => { if (e.pointerType === "mouse") setHover(false); },
    onFocus: (e) => { if (e.target.matches && e.target.matches(":focus-visible")) setFocus(true); },
    onBlur: (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocus(false); },
    onKeyDown: () => restart(),
    onPointerDown: (e) => {
      restart();
      touch.current = e.pointerType === "mouse" ? null : { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e) => {
      const from = touch.current;
      touch.current = null;
      if (!from) return;
      const dx = e.clientX - from.x;
      const dy = e.clientY - from.y;
      if (Math.abs(dx) >= SWIPE_PX && Math.abs(dx) >= SWIPE_RATIO * Math.abs(dy)) go(shown + (dx < 0 ? 1 : -1));
    },
    onPointerCancel: () => { touch.current = null; },
  };

  return {
    index: shown, count, interval, epoch, autoplay, running,
    go, next: () => go(shown + 1), prev: () => go(shown - 1), rootProps,
  };
}

export { useCarousel };
