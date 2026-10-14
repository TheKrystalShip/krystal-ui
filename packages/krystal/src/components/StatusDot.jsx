import React from "react";

// A small lit dot that says a state by tone and, always, in words: `label` is the state's name for
// assistive technology and the hover title ("Live", "No signal"), and a colour is never drawn without
// one. `tone` is neutral, ok, warn, danger, info or accent; `pulse` breathes a ring out of the dot
// for something live or in progress (still under reduced motion); `size` is sm, md or lg.
//
// `caption` draws visible text beside the dot, before it by default ("3m ago ●") or after it with
// `captionSide="end"` ("● Online"). The dot then sits in a `k-dot-group` and the caption is the
// group's readout; `label` still names the state.
/**
 * @typedef {object} StatusDotOwnProps
 * @property {"neutral" | "ok" | "warn" | "danger" | "info" | "accent"} [tone]
 * @property {string} label The state in words, for assistive technology and the title.
 * @property {boolean} [pulse] A ring breathing out of the dot; off under reduced motion.
 * @property {"sm" | "md" | "lg"} [size]
 * @property {import("react").ReactNode} [caption] Visible text beside the dot.
 * @property {"start" | "end"} [captionSide] Which side of the dot the caption sits.
 * @property {string} [className]
 * @typedef {StatusDotOwnProps & Omit<import("react").ComponentPropsWithoutRef<"span">, keyof StatusDotOwnProps>} StatusDotProps
 */
/** @type {import("react").ForwardRefExoticComponent<StatusDotProps & import("react").RefAttributes<HTMLSpanElement>>} */
const StatusDot = React.forwardRef(function StatusDot({
  tone = "neutral", label, pulse = false, size = "md", caption, captionSide = "start", className, ...rest
}, ref) {
  const dotCls = "k-dot k-dot--" + tone + " k-dot--" + size + (pulse ? " k-is-pulsing" : "");
  if (caption == null || caption === false) {
    return <span ref={ref} className={dotCls + (className ? " " + className : "")} role="img" aria-label={label} title={label} {...rest} />;
  }
  const dot = <span className={dotCls} role="img" aria-label={label} />;
  const text = <span className="k-dot-group__caption">{caption}</span>;
  return (
    <span ref={ref} className={"k-dot-group" + (className ? " " + className : "")} title={label} {...rest}>
      {captionSide === "end" ? <>{dot}{text}</> : <>{text}{dot}</>}
    </span>
  );
});

export { StatusDot };
