import React from "react";

// Kbd — a keyboard key, or a chord of them, set in the mono face at a small size.
//
//   <Kbd>Esc</Kbd>
//   <Kbd keys={["Ctrl", "K"]} />     keys drawn side by side with `separator` ("+") between them
//
// A chord is a `kbd` of `kbd` keys, so a screen reader announces each key and the separator as text.
// `size` is md (default) or sm, for a key that sits inside a button or a menu row.
/**
 * @typedef {object} KbdOwnProps
 * @property {string[]} [keys] The keys of a chord, in order. Without it `children` is the one key.
 * @property {import("react").ReactNode} [separator] Drawn between the keys of a chord. "+" by default.
 * @property {"sm" | "md"} [size] `sm` or `md`; md by default.
 * @property {string} [className] Class name added to the root element.
 * @property {import("react").ReactNode} [children] The key's label when there is no `keys`.
 * @typedef {KbdOwnProps & Omit<import("react").ComponentPropsWithoutRef<"kbd">, keyof KbdOwnProps>} KbdProps
 */
/** @param {KbdProps} props */
function Kbd({ keys, separator = "+", size = "md", className, children, ...rest }) {
  const cls = "k-kbd k-kbd--" + size + (className ? " " + className : "");
  if (!keys || keys.length === 0) return <kbd {...rest} className={cls}>{children}</kbd>;
  return (
    <kbd {...rest} className={"k-kbd-chord k-kbd-chord--" + size + (className ? " " + className : "")}>
      {keys.map((key, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="k-kbd-chord__sep">{separator}</span>}
          <kbd className={"k-kbd k-kbd--" + size}>{key}</kbd>
        </React.Fragment>
      ))}
    </kbd>
  );
}

export { Kbd };
