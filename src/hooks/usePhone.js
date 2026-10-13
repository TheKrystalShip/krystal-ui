import React from "react";

// Whether the window is a phone's: 768px wide or narrower, the width at which the tab bar replaces the
// sidebar and the dock fills the screen. Follows the window as it changes.
const PHONE = "(max-width: 768px)";

function usePhone() {
  const query = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(PHONE).matches;
  const [phone, setPhone] = React.useState(query);
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const list = window.matchMedia(PHONE);
    const change = () => setPhone(list.matches);
    change();
    list.addEventListener("change", change);
    return () => list.removeEventListener("change", change);
  }, []);
  return phone;
}

export { usePhone };
