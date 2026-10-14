import React from "react";

// A scrolling feed that tails: it stays pinned to the bottom while the reader is at the bottom and
// stops following the moment they scroll up to read something. Following is the reader's position,
// not a mode they set: scrolling back within `threshold` pixels of the bottom resumes it.
//
// Pass the scroller's ref, spread `onScroll` onto the same element, and list in `deps` whatever
// changes when content arrives (the messages, the newest line's id). On each change while following,
// the scroller moves to its end before paint. `onContentChange(added)` counts items that arrive
// while the reader is not following, so a site can say "N new below"; the count clears when the
// reader returns to the bottom. `scrollToBottom()` resumes following outright (a conversation
// switch, a "Latest" button).
/**
 * @param {import("react").RefObject<HTMLElement | null>} ref The scrolling element.
 * @param {object} [options]
 * @param {number} [options.threshold] Pixels from the bottom that still count as following.
 * @param {readonly unknown[]} [options.deps] Values that change when content arrives.
 * @returns {{
 *   atBottom: boolean,
 *   unread: number,
 *   scrollToBottom: () => void,
 *   onContentChange: (added?: number) => void,
 *   onScroll: () => void,
 * }}
 */
function useFollowTail(ref, { threshold = 80, deps = [] } = {}) {
  const [atBottom, setAtBottom] = React.useState(true);
  const [unread, setUnread] = React.useState(0);
  const followRef = React.useRef(true);

  const onScroll = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const follow = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    followRef.current = follow;
    setAtBottom(follow);
    if (follow) setUnread(0);
  }, [ref, threshold]);

  const scrollToBottom = React.useCallback(() => {
    followRef.current = true;
    setAtBottom(true);
    setUnread(0);
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [ref]);

  const onContentChange = React.useCallback((added = 1) => {
    if (!followRef.current) setUnread((n) => n + added);
  }, []);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (el && followRef.current) el.scrollTop = el.scrollHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the caller names what marks new content
  }, deps);

  return { atBottom, unread, scrollToBottom, onContentChange, onScroll };
}

export { useFollowTail };
