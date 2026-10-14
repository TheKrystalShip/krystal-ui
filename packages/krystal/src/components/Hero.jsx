// The cinematic banner: `art` (a CSS background-image value — `url(...)`, a gradient, or both
// layered) full-bleed behind a scrim, and the page's own content over it. The content is laid out
// with the sheet's classes: `.hero__statuspos` for a pill floated top-left, `.hero__body` for the
// bottom block, `.hero__heading` and `.hero__name` for the title on the art, `.hero__bar` with its
// `.hero__group`s and `.gbtn`s for the frosted control bar.
/**
 * @param {object} props
 * @param {string} [props.art] A CSS background-image value.
 * @param {string} [props.className]
 * @param {import("react").ReactNode} [props.children]
 */
function Hero({ art, className, children }) {
  return (
    <section className={"hero hero--cinematic" + (className ? " " + className : "")}>
      <div className="hero__art" style={{ backgroundImage: art, backgroundSize: "cover", backgroundPosition: "center" }}></div>
      <div className="hero__scrim"></div>
      {children}
    </section>
  );
}

export { Hero };
