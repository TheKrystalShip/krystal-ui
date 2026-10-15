import React from "react";
import { Icon } from "./Icon.jsx";

// The banner at the top of a detail page, in two variants. `art` is a CSS background-image value
// (`url(...)`, a gradient, or both layered).
//
//   cinematic (default)  the art full-bleed behind a scrim, and the page's own content over it. The
//                        content is laid out with the parts below: a HeroStatus pill floated
//                        top-left, a HeroBody for the bottom block, a HeroHeading with the HeroName
//                        and HeroTags on the art, and a HeroBar of HeroGroups and HeroButtons for
//                        the frosted control bar.
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

// The parts a Hero's content is drawn from, each the sheet's class and nothing else:
//
//   HeroStatus    a node floated at the top left (a status pill)
//   HeroBody      the bottom block of a cinematic hero
//   HeroHeading   a row holding the name and its tags
//   HeroName      the `h1` set on the art; its children are the name and any controls beside it
//   HeroTags      a wrapping row of HeroTags (a card hero's, under the name)
//   HeroTag       one small tag; `glass` frosts it over art, `verbatim` sets an id as written,
//                 `icon` is a Lucide name before it
//   HeroBar       the frosted control bar, holding HeroGroups and HeroDividers
//   HeroGroup     buttons in a row inside the bar
//   HeroDivider   a rule between two groups
//   HeroNote      a line set directly on the art, under the bar: an optional `icon`, a warning tone
//   HeroButton    a bar button: `icon` and its words, any button prop; `iconTone` colours the icon alone
//                 (ok, warn, danger, info or update), `armed` inverts the button while it waits for a
//                 second press
// Anything else placed directly on the art takes the class `k-hero__on-art` to keep the art's light
// palette.

/** @param {import("react").ComponentPropsWithoutRef<"div">} props */
function HeroStatus({ className, ...rest }) {
  return <div {...rest} className={"k-hero__statuspos" + (className ? " " + className : "")} />;
}

/** @param {import("react").ComponentPropsWithoutRef<"div">} props */
function HeroBody({ className, ...rest }) {
  return <div {...rest} className={"k-hero__body" + (className ? " " + className : "")} />;
}

/** @param {import("react").ComponentPropsWithoutRef<"div">} props */
function HeroHeading({ className, ...rest }) {
  return <div {...rest} className={"k-hero__heading" + (className ? " " + className : "")} />;
}

/** @param {import("react").ComponentPropsWithoutRef<"h1">} props */
function HeroName({ className, ...rest }) {
  return <h1 {...rest} className={"k-hero__name" + (className ? " " + className : "")} />;
}

/** @param {import("react").ComponentPropsWithoutRef<"div">} props */
function HeroTags({ className, ...rest }) {
  return <div {...rest} className={"k-hero__tags" + (className ? " " + className : "")} />;
}

/**
 * @typedef {object} HeroTagOwnProps
 * @property {string} [icon] A Lucide name before the words.
 * @property {boolean} [glass] Frosted backing, for a tag over art.
 * @property {boolean} [verbatim] Sets the words as written (an id), monospace and not capitalised.
 * @typedef {HeroTagOwnProps & Omit<import("react").ComponentPropsWithoutRef<"span">, keyof HeroTagOwnProps>} HeroTagProps
 */
/** @param {HeroTagProps} props */
function HeroTag({ icon, glass = false, verbatim = false, className, children, ...rest }) {
  return (
    <span {...rest}
      className={"k-hero__tag" + (glass ? " k-hero__tag--glass" : "") + (verbatim ? " k-hero__tag--verbatim" : "") + (className ? " " + className : "")}>
      {icon && <Icon name={icon} size={12} strokeWidth={2} />}
      {icon ? " " : null}{children}
    </span>
  );
}

/** @param {import("react").ComponentPropsWithoutRef<"div">} props */
function HeroBar({ className, ...rest }) {
  return <div {...rest} className={"k-hero__bar" + (className ? " " + className : "")} />;
}

/** @param {import("react").ComponentPropsWithoutRef<"div">} props */
function HeroGroup({ className, ...rest }) {
  return <div {...rest} className={"k-hero__group" + (className ? " " + className : "")} />;
}

/** @param {import("react").ComponentPropsWithoutRef<"span">} props */
function HeroDivider({ className, ...rest }) {
  return <span {...rest} className={"k-hero__bardiv" + (className ? " " + className : "")} aria-hidden="true" />;
}

/**
 * @typedef {object} HeroNoteOwnProps
 * @property {string} [icon] A Lucide name before the words.
 * @typedef {HeroNoteOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof HeroNoteOwnProps>} HeroNoteProps
 */
/** @param {HeroNoteProps} props */
function HeroNote({ icon, className, children, ...rest }) {
  return (
    <div {...rest} className={"k-hero__note k-hero__on-art" + (className ? " " + className : "")}>
      {icon && <Icon name={icon} size={13} />}
      {children}
    </div>
  );
}

/**
 * @typedef {object} HeroButtonOwnProps
 * @property {string} [icon] A Lucide name before the words.
 * @property {"ok" | "warn" | "danger" | "info" | "update"} [iconTone] Colours the icon alone, as a verb's consequence.
 * @property {boolean} [armed] Inverts the button while it waits for a second press.
 * @typedef {HeroButtonOwnProps & Omit<import("react").ComponentPropsWithoutRef<"button">, keyof HeroButtonOwnProps>} HeroButtonProps
 */
/** @type {import("react").ForwardRefExoticComponent<HeroButtonProps & import("react").RefAttributes<HTMLButtonElement>>} */
const HeroButton = React.forwardRef(function HeroButton({ icon, iconTone, armed = false, className, children, type = "button", ...rest }, ref) {
  return (
    <button {...rest} ref={ref} type={type}
      className={"k-hero-btn" + (iconTone ? " k-hero-btn--" + iconTone : "") + (armed ? " k-is-armed" : "") + (className ? " " + className : "")}>
      {icon && <Icon name={icon} size={13} strokeWidth={2.2} className="k-hero-btn__icon" />}
      {children}
    </button>
  );
});

export { Hero, HeroBar, HeroBody, HeroButton, HeroDivider, HeroGroup, HeroHeading, HeroName, HeroNote, HeroStatus, HeroTag, HeroTags };
