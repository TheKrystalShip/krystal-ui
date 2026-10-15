import { forwardRef, useEffect, useState } from "react";

// Avatar — a person or a thing, as a picture or its initials: `src` draws the image, and without
// one (or when it fails to load) the first letters of `name` sit on a teal-gradient disc.
//
//   size    xs 20 | sm 24 | md 32 (default) | lg 40 | xl 56 pixels, or a number for another diameter
//   size    `"css"` leaves the diameter to the site's CSS (a width and height on the avatar or its
//           class); the letters scale with it
//   shape   circle (default) | rounded
//   tone    accent (default, the teal gradient) | teal | info | ok | warn | danger | muted: a soft tint
//           of that colour, for telling people apart by a colour that stays theirs
//   letters 2 (default: first and last word) | 1 (the first letter only)
//   imagePosition  where the picture is cropped from, as CSS `object-position` ("center 20%" keeps a face
//           in a portrait that is cropped square); centred by default
//   status  a dot on the lower corner: ok | warn | danger | info | muted; `statusLabel` is what it says
//
// The avatar is decoration beside a name the page already writes, so it is hidden from assistive
// technology unless `label` names it. Initials are letters only: a word with none ("(agent)" is a
// word with letters, "-" is not) is skipped, digits stand in only for a name with no letters at all,
// and a `name` with neither draws "?".
const SIZES = { xs: 20, sm: 24, md: 32, lg: 40, xl: 56 };

/** @param {string | undefined} name @param {number} count */
function initials(name, count) {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  const lead = (/** @type {string} */ word, /** @type {RegExp} */ kind) => (word.match(kind) || [""])[0];
  let spelled = words.filter((w) => /\p{L}/u.test(w));
  let kind = /\p{L}/u;
  if (spelled.length === 0) {
    spelled = words.filter((w) => /\p{N}/u.test(w));
    kind = /\p{N}/u;
  }
  if (spelled.length === 0) return "?";
  const first = lead(spelled[0], kind);
  const last = count === 1 || spelled.length < 2 ? "" : lead(spelled[spelled.length - 1], kind);
  return (first + last).toUpperCase();
}

/**
 * @typedef {object} AvatarOwnProps
 * @property {string} [src] An image; the initials draw while it is absent or failing.
 * @property {string} [name] Whose avatar it is; the initials come from it.
 * @property {"xs" | "sm" | "md" | "lg" | "xl" | "css" | number} [size] Diameter: `xs`, `sm`, `md`, `lg`, `xl`, a number of pixels, or `css` to leave it to the site's stylesheet.
 * @property {"accent" | "teal" | "info" | "ok" | "warn" | "danger" | "muted"} [tone] The disc's colour: the teal gradient (`accent`) or a soft tint of a tone.
 * @property {string} [imagePosition] The picture's `object-position`, for a crop that keeps a face ("center 20%"); centred by default.
 * @property {1 | 2} [letters] How many initials: `1` draws the first letter only; `2` the first and last words' by default.
 * @property {"circle" | "rounded"} [shape] `circle` or `rounded` corners.
 * @property {"ok" | "warn" | "danger" | "info" | "muted"} [status] A dot on the lower corner that says a state by tone.
 * @property {string} [statusLabel] What the status dot says, read aloud.
 * @property {string} [label] An accessible name; without it the avatar is hidden from assistive technology.
 * @property {string} [className] Extra classes on the root.
 * @typedef {AvatarOwnProps & Omit<import("react").ComponentPropsWithoutRef<"span">, keyof AvatarOwnProps>} AvatarProps
 */
/** @type {import("react").ForwardRefExoticComponent<AvatarProps & import("react").RefAttributes<HTMLSpanElement>>} */
const Avatar = forwardRef(function Avatar({ src, name, size = "md", shape = "circle", tone = "accent", letters: count = 2, imagePosition, status, statusLabel, label, className, style, ...rest }, ref) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const fluid = size === "css";
  const px = typeof size === "number" ? size : SIZES[size] || SIZES.md;
  const letters = initials(name, count);
  return (
    <span {...rest} ref={ref}
      className={"k-avatar k-avatar--" + shape + (tone !== "accent" ? " k-avatar--" + tone : "") + (fluid ? " k-avatar--fluid" : "")
        + (letters.length > 1 ? "" : " k-avatar--single") + (className ? " " + className : "")}
      role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : "true"}
      style={fluid ? style : { width: px, height: px, fontSize: px * (letters.length > 1 ? 0.38 : 0.46), ...style }}>
      {src && !failed
        ? <img className="k-avatar__img" src={src} alt="" style={imagePosition ? { objectPosition: imagePosition } : undefined} onError={() => setFailed(true)} />
        : <span className="k-avatar__initials">{letters}</span>}
      {status && (
        <span className={"k-avatar__status k-avatar__status--" + status} role={statusLabel ? "img" : undefined}
          aria-label={statusLabel}
          style={fluid ? undefined : { width: Math.max(8, px * 0.28), height: Math.max(8, px * 0.28) }} />
      )}
    </span>
  );
});

export { Avatar };
