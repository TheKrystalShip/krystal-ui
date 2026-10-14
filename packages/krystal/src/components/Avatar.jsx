import { forwardRef, useEffect, useState } from "react";

// Avatar — a person or a thing, as a picture or its initials: `src` draws the image, and without
// one (or when it fails to load) the first letters of `name` sit on a teal-gradient disc.
//
//   size    xs 20 | sm 24 | md 32 (default) | lg 40 | xl 56 pixels, or a number for another diameter
//   shape   circle (default) | rounded
//   status  a dot on the lower corner: ok | warn | danger | info | muted; `statusLabel` is what it says
//
// The avatar is decoration beside a name the page already writes, so it is hidden from assistive
// technology unless `label` names it. A `name` that gives no letters draws "?".
const SIZES = { xs: 20, sm: 24, md: 32, lg: 40, xl: 56 };

/** @param {string | undefined} name */
function initials(name) {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = Array.from(words[0])[0];
  const last = words.length > 1 ? Array.from(words[words.length - 1])[0] : "";
  return (first + last).toUpperCase();
}

/**
 * @typedef {object} AvatarOwnProps
 * @property {string} [src] An image; the initials draw while it is absent or failing.
 * @property {string} [name] Whose avatar it is; the initials come from it.
 * @property {"xs" | "sm" | "md" | "lg" | "xl" | number} [size]
 * @property {"circle" | "rounded"} [shape]
 * @property {"ok" | "warn" | "danger" | "info" | "muted"} [status]
 * @property {string} [statusLabel] What the status dot says, read aloud.
 * @property {string} [label] An accessible name; without it the avatar is hidden from assistive technology.
 * @property {string} [className]
 * @typedef {AvatarOwnProps & Omit<import("react").ComponentPropsWithoutRef<"span">, keyof AvatarOwnProps>} AvatarProps
 */
/** @type {import("react").ForwardRefExoticComponent<AvatarProps & import("react").RefAttributes<HTMLSpanElement>>} */
const Avatar = forwardRef(function Avatar({ src, name, size = "md", shape = "circle", status, statusLabel, label, className, style, ...rest }, ref) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const px = typeof size === "number" ? size : SIZES[size] || SIZES.md;
  const letters = initials(name);
  return (
    <span {...rest} ref={ref}
      className={"k-avatar k-avatar--" + shape + (className ? " " + className : "")}
      role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : "true"}
      style={{ width: px, height: px, fontSize: px * (letters.length > 1 ? 0.38 : 0.46), ...style }}>
      {src && !failed
        ? <img className="k-avatar__img" src={src} alt="" onError={() => setFailed(true)} />
        : <span className="k-avatar__initials">{letters}</span>}
      {status && (
        <span className={"k-avatar__status k-avatar__status--" + status} role={statusLabel ? "img" : undefined}
          aria-label={statusLabel} style={{ width: Math.max(8, px * 0.28), height: Math.max(8, px * 0.28) }} />
      )}
    </span>
  );
});

export { Avatar };
