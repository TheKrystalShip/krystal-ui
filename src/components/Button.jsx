import React from "react";
import { Icon } from "./Icon.jsx";
import { Spinner } from "./Spinner.jsx";

// Button — the one push button every site draws. Variants say how loud it is, never what it does:
//
//   primary    the action the surface is for; the accent fill
//   secondary  an ordinary action; a raised neutral fill that lifts on hover (the default)
//   outline    an alternative beside a primary (Cancel); no fill until hover
//   ghost      the quietest — no fill, no border until hover (Dismiss, Give up)
//   accent     a tinted accent, for an action that is on or is the suggested one
//   danger     destroys something; the danger fill
//   warning    a primary action that goes ahead despite a caution; the warning fill
//   link       text that acts, inline with prose
//
// `tone` keeps a neutral variant's weight and takes a consequence's colour on hover — "danger" for
// a destructive row action that should not shout before it is pointed at, "warning" for one that
// interrupts somebody, "success" for one that restores something.
//
// Sizes share their heights with `Input` so a field and its button sit on one line: xs 26, sm 30,
// md 34, lg 38, xl 46. Phones raise `md` to a 40px touch target.
//
// `icon` is a Lucide name or a node. `busy` swaps the icon for a spinner and holds the button
// disabled while keeping it readable, because its label is still saying what is happening.
// `pressed` makes it a two-state button (aria-pressed). `armed` is a confirm-first button waiting
// for its second press: it reads as a different state, not a hover. `href` renders a link that
// looks like a button. Every other prop reaches the element, and the ref reaches it too (a menu
// anchors to its trigger by it).
const ICON_SIZE = { xs: 12, sm: 13, md: 14, lg: 15, xl: 16 };

function glyph(icon, size, className) {
  if (!icon) return null;
  return typeof icon === "string" ? <Icon name={icon} size={size} className={className} /> : icon;
}

const Button = React.forwardRef(function Button({
  variant = "secondary", size = "md", tone, icon, iconRight, busy = false, pressed, armed = false,
  wide = false, href, type = "button", disabled, className, children, ...rest
}, ref) {
  const s = ICON_SIZE[size] || ICON_SIZE.md;
  const cls = "k-btn k-btn--" + variant + " k-btn--" + size
    + (tone ? " k-btn--tone-" + tone : "")
    + (wide ? " k-btn--wide" : "")
    + (armed ? " is-armed" : "")
    + (children == null || children === false ? " k-btn--bare" : "")
    + (className ? " " + className : "");
  const body = (
    <>
      {busy ? <Spinner size={s} /> : glyph(icon, s)}
      {children}
      {glyph(iconRight, s)}
    </>
  );
  if (href != null) {
    return <a ref={ref} className={cls} href={href} aria-disabled={disabled || undefined} {...rest}>{body}</a>;
  }
  return (
    <button ref={ref} type={type} className={cls} disabled={disabled || busy}
      aria-busy={busy || undefined}
      aria-pressed={pressed === undefined ? undefined : !!pressed}
      {...rest}>
      {body}
    </button>
  );
});

// IconButton — a square button holding one icon. It has no visible words, so `label` is required:
// it is the accessible name and the tooltip. Variants: outline (a hairline square, the default),
// ghost (no border until hover), secondary (the raised neutral fill). Sizes are Button's heights,
// square: xs 26, sm 30, md 34, lg 38.
// `tone` and `armed` are Button's; an armed button reads in the danger tint, or the success one when
// its tone is success.
const ICON_BTN_GLYPH = { xs: 13, sm: 14, md: 15, lg: 17 };

const IconButton = React.forwardRef(function IconButton({
  icon, label, variant = "outline", size = "md", tone, busy = false, pressed, armed = false,
  type = "button", disabled, title, className, ...rest
}, ref) {
  const s = ICON_BTN_GLYPH[size] || ICON_BTN_GLYPH.md;
  return (
    <button ref={ref} type={type}
      className={"k-iconbtn k-iconbtn--" + variant + " k-iconbtn--" + size
        + (tone ? " k-iconbtn--tone-" + tone : "")
        + (armed ? " is-armed" : "")
        + (className ? " " + className : "")}
      disabled={disabled || busy}
      aria-label={label}
      title={title === undefined ? label : title}
      aria-busy={busy || undefined}
      aria-pressed={pressed === undefined ? undefined : !!pressed}
      {...rest}>
      {busy ? <Spinner size={s} /> : glyph(icon, s)}
    </button>
  );
});

export { Button, IconButton };
export default Button;
