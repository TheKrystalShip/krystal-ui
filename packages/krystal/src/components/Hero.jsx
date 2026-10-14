// The cinematic banner: `art` (a CSS background-image value — `url(...)`, a gradient, or both
// layered) full-bleed behind a scrim, and the page's own content over it. The content is laid out
// with the sheet's classes: `.k-hero__statuspos` for a pill floated top-left, `.k-hero__body` for the
// bottom block, `.k-hero__heading` and `.k-hero__name` for the title on the art, `.k-hero__bar` with its
// `.k-hero__group`s and `.k-hero-btn`s for the frosted control bar.
/**
 * @param {object} props
 * @param {string} [props.art] A CSS background-image value.
 * @param {string} [props.className]
 * @param {import("react").ReactNode} [props.children]
 */
function Hero({ art, className, children }) {
  return (
    <section className={"k-hero k-hero--cinematic" + (className ? " " + className : "")}>
      <div className="k-hero__art" style={{ backgroundImage: art, backgroundSize: "cover", backgroundPosition: "center" }}></div>
      <div className="k-hero__scrim"></div>
      {children}
    </section>
  );
}

export { Hero };
