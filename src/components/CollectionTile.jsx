import { Icon } from "./Icon.jsx";

// CollectionTile — a set of titles shown by its posters, as a link. It fills the width it is given
// (a rail's item, a grid's cell) at a fixed shape, and everything inside it is sized from that width,
// so one tile reads the same in a rail, a phone's grid and a television's row.
//
//   variant="fan"    a set whose order means nothing (a mood, a category): the mark and the name at the
//                    left, the first three `posters` fanned inside the right edge.
//   variant="strip"  a set in order (a series): the posters along the top in the order given, numbered,
//                    as many as fit and the rest counted, the name on the foot. With `total` and
//                    `watched`, it follows somebody through it: once one is watched the rest dim, a
//                    segment per title fills, and `next` is named; with all of them watched it says
//                    `doneLabel`. `caption` is what it says before any is watched.
//
// `size` "sm" is the shape for a phone's grid: a little taller for its width, and a strip shows one
// poster fewer. `label` is the accessible name when `name` alone does not say enough. Every other prop
// reaches the link, so a site hands it `href` and `onClick`; on a television (`data-tv`) it takes focus
// as a TvCard does.
function CollectionTile({
  variant = "fan", name, icon, caption, posters = [], total, watched = 0, next, doneLabel = "Watched",
  size = "md", label, className, ...rest
}) {
  const cls = "collection-tile collection-tile--" + variant + " collection-tile--" + size
    + (className ? " " + className : "");
  return (
    <a className={cls} aria-label={label || name} {...rest}>
      {variant === "strip"
        ? <Strip name={name} caption={caption} posters={posters} total={total} watched={watched} next={next}
            doneLabel={doneLabel} fit={size === "sm" ? 3 : 4} />
        : <Fan name={name} icon={icon} caption={caption} posters={posters} />}
    </a>
  );
}

function Fan({ name, icon, caption, posters }) {
  // Fewer than three posters stack in from the right, so the fan never leaves a hole at its edge.
  const shown = posters.filter(Boolean).slice(0, 3);
  const places = ["c", "b", "a"].slice(0, shown.length).reverse();
  return (
    <>
      <span className="collection-tile__fan" aria-hidden="true">
        {shown.map((src, i) => (
          <span key={i} className={"collection-tile__poster collection-tile__poster--" + places[i]}
            style={{ backgroundImage: `url("${src}")` }} />
        ))}
      </span>
      {icon && <span className="collection-tile__mark" aria-hidden="true"><Icon name={icon} size={16} /></span>}
      <span className="collection-tile__text">
        <span className="collection-tile__name">{name}</span>
        {caption && <span className="collection-tile__caption">{caption}</span>}
      </span>
    </>
  );
}

function Strip({ name, caption, posters, total, watched, next, doneLabel, fit }) {
  const count = total != null ? total : posters.length;
  const over = count > fit;
  const shown = posters.slice(0, over ? fit - 1 : fit);
  const started = watched > 0;
  const done = started && watched >= count;
  const state = done ? doneLabel : started ? (next || `${watched} / ${count}`) : caption;
  return (
    <>
      <span className="collection-tile__strip" aria-hidden="true">
        {shown.map((src, i) => (
          <span key={i}
            className={"collection-tile__cell" + (started && !done && i >= watched ? " is-ahead" : "")}
            style={src ? { backgroundImage: `url("${src}")` } : undefined}>
            <span className="collection-tile__num">{i + 1}</span>
          </span>
        ))}
        {over && <span className="collection-tile__cell collection-tile__more">+{count - shown.length}</span>}
      </span>
      <span className="collection-tile__foot">
        {started && (
          <span className="collection-tile__segs" aria-hidden="true">
            {Array.from({ length: count }, (_, i) => <i key={i} className={i < watched ? "is-on" : undefined} />)}
          </span>
        )}
        <span className="collection-tile__line">
          <span className="collection-tile__name">{name}</span>
          {state && <span className={"collection-tile__state" + (started && !done ? " is-next" : "")}>{state}</span>}
        </span>
      </span>
    </>
  );
}

export { CollectionTile };
export default CollectionTile;
