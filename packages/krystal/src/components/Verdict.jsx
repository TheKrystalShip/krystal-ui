import { Button } from "./Button.jsx";

// Verdict — a two-option verdict: a thumbs-up and a thumbs-down, frameless, quieter than the actions
// beside them. The value says which is lit (1 liked, -1 disliked, 0 neither); a lit option draws its
// icon filled and no frame. Pressing the lit option clears the verdict (`onChange(0)`) and pressing the
// other moves it (`onChange(1)` or `onChange(-1)`). The caller keeps the value; the control only reports
// the next one. A value of `undefined` is a verdict not yet known: both options are drawn unlit and
// disabled. `size` is Button's, so the pair sits at the height of what it stands beside. A focused option
// keeps the focus ring every button has, and on a television the light pill.
/**
 * @typedef {object} VerdictOwnProps
 * @property {1 | 0 | -1} [value] `1` liked, `-1` disliked, `0` neither; `undefined` is not known, and draws both options unlit and disabled.
 * @property {(next: 1 | 0 | -1) => void} [onChange] Called with the next value: `0` when the lit option is pressed, the pressed option's value otherwise.
 * @property {"xs" | "sm" | "md" | "lg" | "xl"} [size] Button's height step; `md` by default.
 * @property {boolean} [grow] The pair fills its container's width and the two options split it equally, each as tall as `size`.
 * @property {boolean} [onArt] The pair lies over artwork: light ink at rest and lit, and a veil that reads over imagery under a hovered option.
 * @property {boolean} [disabled] Blocks both options.
 * @property {string} [label] The group's accessible name.
 * @property {string} [likeLabel] The like option's name while unlit; "Like" by default.
 * @property {string} [likedLabel] The like option's name while lit; "Liked" by default.
 * @property {string} [dislikeLabel] The dislike option's name while unlit; "Dislike" by default.
 * @property {string} [dislikedLabel] The dislike option's name while lit; "Disliked" by default.
 * @property {string} [className] Extra classes on the group.
 * @typedef {VerdictOwnProps & Omit<import("react").ComponentPropsWithoutRef<"span">, keyof VerdictOwnProps>} VerdictProps
 */
/** @param {VerdictProps} props */
function Verdict({
  value, onChange, size = "md", grow = false, onArt = false, disabled = false, label,
  likeLabel = "Like", likedLabel = "Liked", dislikeLabel = "Dislike", dislikedLabel = "Disliked",
  className, ...rest
}) {
  const off = disabled || value === undefined;
  const press = (pick) => onChange?.(value === pick ? 0 : pick);
  const option = (pick, icon, unlit, lit) => {
    const on = value === pick;
    const name = on ? lit : unlit;
    return (
      <Button variant="ghost" size={size} icon={icon} pressed={on} disabled={off}
        className={"k-verdict__option" + (on ? " k-is-on" : "")}
        aria-label={name} title={name} onClick={() => press(pick)} />
    );
  };
  return (
    <span {...rest} className={"k-verdict" + (grow ? " k-verdict--grow" : "") + (onArt ? " k-verdict--on-art" : "") + (className ? " " + className : "")} role="group" aria-label={label}>
      {option(1, "thumbs-up", likeLabel, likedLabel)}
      {option(-1, "thumbs-down", dislikeLabel, dislikedLabel)}
    </span>
  );
}

export { Verdict };
