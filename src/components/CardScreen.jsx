// CardScreen — the centred card on the page background that the sign-in family, the wait for
// approval, a device approval and a site's signed-out screens stand on. The brand block (`mark`, an
// image URL; `wordmark`, the screen's heading; `tagline`) sits above the card, `foot` under it.
//
//   width   sm (400px, the default) | md (520px)
//
// It fills the viewport and pads for the device's safe areas. It writes no `style` attribute: a
// static document served under a policy that refuses inline styles uses these classes as they are
// (k-cardscreen, k-cardscreen--sm|md, k-cardscreen__card, __brand, __mark, __wordmark, __tagline,
// __foot). Inside a taller or shorter box, a caller sets `--k-cardscreen-height` on an ancestor.
function CardScreen({ mark, wordmark, tagline, children, foot, width = "sm", className }) {
  const brand = mark || wordmark || tagline;
  return (
    <div className={"k-cardscreen k-cardscreen--" + width + (className ? " " + className : "")}>
      <div className="k-cardscreen__inner">
        {brand && (
          <div className="k-cardscreen__brand">
            {mark && <img className="k-cardscreen__mark" src={mark} alt="" />}
            {wordmark && <h1 className="k-cardscreen__wordmark">{wordmark}</h1>}
            {tagline && <div className="k-cardscreen__tagline">{tagline}</div>}
          </div>
        )}
        <div className="k-cardscreen__card">{children}</div>
        {foot != null && <div className="k-cardscreen__foot">{foot}</div>}
      </div>
    </div>
  );
}

export { CardScreen };
