// splash.js — the splash: the site's mark on the canvas, drawn into the document by the build
// (`siteIdentity` in `@thekrystalship/krystal/vite`) so it paints with the first bytes, held over
// everything the site does before its first screen is ready, then faded away.
//
// What is on screen decides how long it stays. A screen that is ready the moment it is drawn holds
// nothing, and the splash leaves once the site calls `settleSplash` after a commit. A screen still
// coming holds it (`holdSplash`) until what it waits for has arrived. Whatever is still holding it, it
// is gone at `SPLASH_CAP_MS` after the document started, and the page is shown as it stands.
//
// A page without the splash's element loads this module to no effect.

/** The longest the splash stays, from the moment the document started. */
export const SPLASH_CAP_MS = 3000;
/** How long it takes to fade; `styles/splash.css` holds the same in the splash's transition. */
const FADE_MS = 280;

// Outside a page (a site's tests, a document stub without the DOM's methods) there is no splash.
const element = () => (typeof document !== "undefined" && typeof document.getElementById === "function"
  ? document.getElementById("k-splash") : null);

let holds = 0;
let gone = !element();
let checking = false;

/**
 * Keeps the splash up until the function handed back is called. A hold let go is checked a frame
 * later, so a screen that replaces another in one commit takes the hold over before it can lapse.
 * @returns {() => void}
 */
export function holdSplash() {
  holds += 1;
  let held = true;
  return () => {
    if (!held) return;
    held = false;
    holds -= 1;
    settleSplash();
  };
}

/**
 * Lets the splash go if nothing on screen holds it, a frame from now.
 * @returns {void}
 */
export function settleSplash() {
  if (gone || checking) return;
  checking = true;
  requestAnimationFrame(() => {
    checking = false;
    if (holds === 0) leave();
  });
}

function leave() {
  if (gone) return;
  gone = true;
  const splash = element();
  if (!splash) return;
  splash.classList.add("k-is-leaving");
  const still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  setTimeout(() => splash.remove(), still ? 0 : FADE_MS);
}

if (!gone) setTimeout(leave, Math.max(0, SPLASH_CAP_MS - performance.now()));
