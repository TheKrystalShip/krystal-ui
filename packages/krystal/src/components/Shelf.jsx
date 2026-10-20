import React from "react";

// Shelf — a titled section of a page that lays its items out in a grid: a heading with an optional
// line under it and an `action` opposite (a View all link), optional `controls` under the heading
// (chips that narrow what it shows), then the items. It has no frame of its own: it sits on the page,
// where Rail sits in a brief card and scrolls. How many items stand in a row follows the shelf's own
// width, by container query (styles/shelf.css): `columns` across, and `narrowColumns` once the shelf is
// narrower than a phone's width, whatever narrows it.
//
/**
 * @param {object} props
 * @param {import("react").ReactNode} props.title The shelf's heading.
 * @param {import("react").ReactNode} [props.sub] A line under the heading.
 * @param {import("react").ReactNode} [props.action] A control opposite the heading, such as a View all link.
 * @param {import("react").ReactNode} [props.controls] A row under the heading, such as chips that narrow the items.
 * @param {number} [props.columns] Items in a row; 4 when left out.
 * @param {number} [props.narrowColumns] Items in a row once the shelf is narrow; 2 when left out.
 * @param {import("react").ReactNode} [props.empty] Drawn in place of the grid when there are no items.
 * @param {"h2" | "h3"} [props.headingLevel] The heading's element; h2 when left out.
 * @param {import("react").ReactNode} [props.children] The items, each a grid cell.
 * @param {string} [props.className] Extra class names on the root element.
 * @param {import("react").CSSProperties} [props.style] Inline style on the root element.
 */
function Shelf({ title, sub, action, controls, columns, narrowColumns, empty, headingLevel = "h2", children, className, style }) {
  const id = React.useId();
  const Heading = headingLevel;
  const items = React.Children.toArray(children).filter(Boolean);
  const vars = {
    ...(columns ? { "--k-shelf-columns": columns } : null),
    ...(narrowColumns ? { "--k-shelf-narrow-columns": narrowColumns } : null),
    ...style,
  };
  return (
    <section className={"k-shelf" + (className ? " " + className : "")} style={vars} aria-labelledby={id}>
      <div className="k-shelf__head">
        <div className="k-shelf__titles">
          <Heading id={id} className="k-shelf__title">{title}</Heading>
          {sub && <span className="k-shelf__sub">{sub}</span>}
        </div>
        {action && <div className="k-shelf__action">{action}</div>}
      </div>
      {controls && <div className="k-shelf__controls">{controls}</div>}
      {items.length > 0 ? <div className="k-shelf__grid">{items}</div> : empty && <div className="k-shelf__empty">{empty}</div>}
    </section>
  );
}

export { Shelf };
