// The banner at the top of a detail page, in two variants. `art` is a CSS background-image value
// (`url(...)`, a gradient, or both layered).
//
//   cinematic (default)  the art full-bleed behind a scrim, and the page's own content over it. The
//                        content is laid out with the sheet's classes: `.k-hero__statuspos` for a pill
//                        floated top-left, `.k-hero__body` for the bottom block, `.k-hero__heading`
//                        and `.k-hero__name` for the title on the art, `.k-hero__bar` with its
//                        `.k-hero__group`s and `.k-hero-btn`s for the frosted control bar.
//   card                 a bordered card with the art behind a veil that fades from the surface on
//                        the left, and the children in a column over its left 60%: an `h1.k-hero__name`,
//                        `.k-hero__tags` with `.k-hero__tag`s, and a row of actions.
/**
 * @param {object} props
 * @param {string} [props.art] A CSS background-image value.
 * @param {"cinematic" | "card"} [props.variant] `cinematic` (the default) or `card`.
 * @param {string} [props.className] Class name added to the root element.
 * @param {import("react").ReactNode} [props.children] The content over the art.
 */
function Hero({ art, variant = "cinematic", className, children }) {
  const artLayer = <div className="k-hero__art" style={{ backgroundImage: art, backgroundSize: "cover", backgroundPosition: "center" }}></div>;
  if (variant === "card") {
    return (
      <section className={"k-hero" + (className ? " " + className : "")}>
        {artLayer}
        <div className="k-hero__veil"></div>
        <div className="k-hero__content">{children}</div>
      </section>
    );
  }
  return (
    <section className={"k-hero k-hero--cinematic" + (className ? " " + className : "")}>
      {artLayer}
      <div className="k-hero__scrim"></div>
      {children}
    </section>
  );
}

export { Hero };
