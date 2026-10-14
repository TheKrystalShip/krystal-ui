import React from "react";

// A scrolling feed that tails: it stays pinned to the bottom while the reader is at the bottom and
// stops following the moment they scroll up to read something. Following is the reader's position,
// not a mode they set: scrolling back within `threshold` pixels of the bottom resumes it.
//
// Pass the scroller's ref, spread `onScroll` onto the same element, and list in `deps` whatever
// changes when content arrives (the messages, the newest line's id). On each change while following,
// the scroller moves to its end before paint. `scrollToBottom()` resumes following outright (a
// conversation switch, a "Latest" button).
//
// The unread count has two sources. `onContentChange(added)` counts what the caller says arrived
// while the reader is not following. A feed that hands over the identity of its rows is measured
// instead: `keys` lists every row's key, oldest first, and `unread` is how many rows sit after the
// newest one the reader had seen when they parked. A capped window that drops its oldest rows
// and keeps a constant length still counts correctly, because the newest key is what changes; a
// seen row that has been trimmed away means every row in the window is unread. The count clears when
// the reader returns to the bottom.
//
// `anchorAttribute` holds a parked reader's place across changes above the viewport. The scroller's
// children carry that attribute with `String(key)` as the value; the topmost row in view and its
// offset are recorded as the reader scrolls, and after each content change the scroller is moved so
// that row sits where it was, so trimming rows off the top, or inserting some there, does not slide
// the line being read. A row trimmed away puts the reader at the top of what is left. The scroller
// should switch the browser's own scroll anchoring off (`overflow-anchor: none`) so that one
// mechanism moves it. The hook's own moves raise scroll events it does not read back.
/**
 * @param {import("react").RefObject<HTMLElement | null>} ref The scrolling element.
 * @param {object} [options]
 * @param {number} [options.threshold] Pixels from the bottom that still count as following.
 * @param {readonly unknown[]} [options.deps] Values that change when content arrives.
 * @param {readonly (string | number)[]} [options.keys] The key of every row, oldest first; makes `unread` a measured count.
 * @param {string} [options.anchorAttribute] The attribute (such as `data-k`) whose value on each child row is `String(key)`; holds a parked reader's row still.
 * @returns {{
 *   atBottom: boolean,
 *   unread: number,
 *   scrollToBottom: () => void,
 *   onContentChange: (added?: number) => void,
 *   onScroll: () => void,
 * }}
 */
function useFollowTail(ref, { threshold = 80, deps = [], keys, anchorAttribute } = {}) {
  const [atBottom, setAtBottom] = React.useState(true);
  const [unread, setUnread] = React.useState(0);
  const followRef = React.useRef(true);
  const anchorRef = React.useRef(/** @type {{ key: string, delta: number } | null} */ (null));
  const seenRef = React.useRef(/** @type {string | null} */ (null));
  const settledRef = React.useRef(/** @type {number | null} */ (null));
  const keysRef = React.useRef(keys);
  keysRef.current = keys;
  const newest = keys && keys.length ? String(keys[keys.length - 1]) : null;

  const setFollow = (follow) => {
    followRef.current = follow;
    setAtBottom(follow);
  };

  // The scroll event a move of the hook's own raises names a position the hook already stated, so
  // it is recognised by that position and not read back.
  const moveTo = (el, top) => {
    const v = Math.max(0, top);
    if (Math.abs(el.scrollTop - v) < 0.5) return;
    el.scrollTop = v;
    settledRef.current = el.scrollTop;
  };

  // The first child row, top to bottom, that ends below the viewport's top edge. Rows are in
  // document order, so the search halves the rows; a row without the attribute is skipped by the
  // caller's choice of what carries it.
  const topRow = (el) => {
    const rows = el.children;
    let lo = 0;
    let hi = rows.length - 1;
    let found = null;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const row = /** @type {HTMLElement} */ (rows[mid]);
      if (row.offsetTop + row.offsetHeight > el.scrollTop) { found = row; hi = mid - 1; } else lo = mid + 1;
    }
    return found && found.hasAttribute(anchorAttribute) ? found : null;
  };

  const readPosition = (el) => {
    if (el.scrollHeight - el.scrollTop - el.clientHeight <= threshold) {
      setFollow(true);
      setUnread(0);
      anchorRef.current = null;
      seenRef.current = null;
      return;
    }
    setFollow(false);
    if (seenRef.current == null) seenRef.current = newest;
    if (anchorAttribute) {
      const row = topRow(el);
      anchorRef.current = row ? { key: row.getAttribute(anchorAttribute), delta: row.offsetTop - el.scrollTop } : null;
    }
  };

  const onScroll = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const settled = settledRef.current;
    settledRef.current = null;
    if (settled != null && Math.abs(el.scrollTop - settled) < 0.5) return;
    readPosition(el);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- readPosition reads the latest props through its closure and refs
  }, [ref, threshold, anchorAttribute, newest]);

  const scrollToBottom = React.useCallback(() => {
    setFollow(true);
    setUnread(0);
    anchorRef.current = null;
    seenRef.current = null;
    const el = ref.current;
    if (el) moveTo(el, el.scrollHeight);
  }, [ref]);

  const onContentChange = React.useCallback((added = 1) => {
    if (!followRef.current && !keysRef.current) setUnread((n) => n + added);
  }, []);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (followRef.current) {
      moveTo(el, el.scrollHeight);
      if (keys) setUnread(0);
      return;
    }
    const a = anchorRef.current;
    if (a && anchorAttribute) {
      const sel = "[" + anchorAttribute + '="' + (window.CSS && CSS.escape ? CSS.escape(a.key) : a.key) + '"]';
      const row = /** @type {HTMLElement | null} */ (el.querySelector(sel));
      if (row) moveTo(el, row.offsetTop - a.delta);
      else { moveTo(el, 0); readPosition(el); }
    }
    if (keys) setUnread(countAfter(keys, seenRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the caller names what marks new content; the newest key is added to it
  }, [newest, ...deps]);

  return { atBottom, unread, scrollToBottom, onContentChange, onScroll };
}

// How many keys sit after the one the reader last saw. A seen key that is no longer in the list means
// everything left arrived since, and no seen key (the reader never parked) means nothing is unread.
function countAfter(keys, seen) {
  if (seen == null) return 0;
  for (let i = keys.length - 1; i >= 0; i--) if (String(keys[i]) === seen) return keys.length - 1 - i;
  return keys.length;
}

export { useFollowTail };
