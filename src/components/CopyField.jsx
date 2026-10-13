import React from "react";
import { IconButton } from "./Button.jsx";
import { Input } from "./fields.jsx";
import { copyText } from "../lib/clipboard.js";

// CopyField — a read-only Input holding a value, with a button in its suffix that copies it. The
// button shows a check for a moment once the text is on the clipboard; if the browser refuses, it
// stays a copy icon. `label` names the button; `onCopied(value)` runs after a copy that worked.
// Every other prop is Input's, and the ref reaches the input.
const CopyField = React.forwardRef(function CopyField(
  { value, label = "Copy", mono = true, onCopied, size = "md", wide = true, ...inputProps }, ref) {
  const [done, setDone] = React.useState(false);
  const timer = React.useRef(0);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    if (!(await copyText(value))) return;
    setDone(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(false), 1500);
    if (onCopied) onCopied(value);
  };
  return (
    <Input {...inputProps} ref={ref} value={value} readOnly mono={mono} size={size} wide={wide}
      onFocus={(e) => { e.target.select(); if (inputProps.onFocus) inputProps.onFocus(e); }}
      suffix={(
        <IconButton variant="ghost" size={size === "sm" ? "xs" : "sm"} icon={done ? "check" : "copy"}
          label={done ? "Copied" : label} onMouseDown={(e) => e.preventDefault()} onClick={copy} />
      )} />
  );
});

export { CopyField };
