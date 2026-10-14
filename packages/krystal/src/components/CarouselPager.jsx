// CarouselPager — the marks under a `useCarousel`'s slides, one a slide: the shown one long, filling
// over the slide's time while the slides turn by themselves and holding where it is while they are
// held still. Choosing a mark shows its slide. `labels` names each mark's slide for a screen reader
// ("Show Heat"). `indicator` draws the marks only, for a surface where they are not to be focused,
// such as a television, where the slides are turned by time alone.
/**
 * @param {object} props
 * @param {ReturnType<typeof import("../hooks/useCarousel.js").useCarousel>} props.carousel The state `useCarousel` returned, whose slides the marks stand for.
 * @param {string[]} [props.labels] Each mark's accessible name.
 * @param {boolean} [props.indicator] Draw the marks only, not focusable.
 * @param {string} [props.className] Class name added to the root element.
 */
function CarouselPager({ carousel, labels = [], indicator = false, className }) {
  const { index, count, interval, epoch, autoplay, running, go } = carousel;
  if (count < 2) return null;
  const cls = "k-carousel-pager" + (autoplay ? " k-is-auto" : "") + (running ? "" : " k-is-held")
    + (className ? " " + className : "");
  const marks = Array.from({ length: count }, (_, i) => {
    const bar = (
      <span className="k-carousel-pager__bar">
        {i === index && <span key={epoch} className="k-carousel-pager__fill" style={{ animationDuration: interval + "ms" }} />}
      </span>
    );
    return indicator
      ? <span key={i} className="k-carousel-pager__mark" aria-current={i === index ? "true" : undefined}>{bar}</span>
      : (
        <button key={i} type="button" className="k-carousel-pager__mark" aria-label={labels[i] || `Slide ${i + 1}`}
          aria-current={i === index ? "true" : undefined} onClick={() => go(i)}>
          {bar}
        </button>
      );
  });
  return indicator
    ? <div className={cls} aria-hidden="true">{marks}</div>
    : <div className={cls} role="group" aria-label="Slides">{marks}</div>;
}

export { CarouselPager };
export default CarouselPager;
