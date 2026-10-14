// Whether the page is drawn for a television: its root carries `data-tv`, the mark the package's
// television styles and spatial focus key off. On a television the remote's arrows belong to spatial
// focus, which moves between every control by where it sits, so a composite widget leaves them alone.

/** @returns {boolean} */
export function onTelevision() {
  return typeof document !== "undefined" && document.documentElement.hasAttribute("data-tv");
}
