import React from "react";

// A boolean kept in this browser's storage under `key` as "1" or "0" — a per-viewer convenience
// such as whether the sidebar is collapsed. Storage that is missing or refuses reads as `initial`.
/**
 * @param {string} key
 * @param {boolean} [initial]
 * @returns {[boolean, import("react").Dispatch<import("react").SetStateAction<boolean>>]}
 */
function useStoredFlag(key, initial = false) {
  const [value, setValue] = React.useState(() => {
    try {
      const v = localStorage.getItem(key);
      return v === "1" ? true : v === "0" ? false : initial;
    } catch { return initial; }
  });
  React.useEffect(() => {
    try { localStorage.setItem(key, value ? "1" : "0"); } catch { /* storage refused */ }
  }, [key, value]);
  return [value, setValue];
}

export { useStoredFlag };
