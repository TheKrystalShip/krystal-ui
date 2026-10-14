import React from "react";
import { createSpatialFocus } from "../lib/spatialFocus.js";

/**
 * Takes the arrow keys for the document while the component is mounted (lib/spatialFocus.js). The
 * navigator is made once; `onBack` and `onMenu` are read through a ref, so a new callback identity each
 * render never remakes it. `root` and `pageKey` are read when it is made.
 * @param {import("../lib/spatialFocus.js").SpatialFocusOptions} [options]
 * @returns {import("../lib/spatialFocus.js").SpatialFocus}
 */
function useSpatialFocus(options = {}) {
  const live = React.useRef(options);
  live.current = options;
  const [navigator] = React.useState(() => createSpatialFocus({
    root: options.root,
    pageKey: options.pageKey,
    onBack: () => live.current.onBack && live.current.onBack(),
    onMenu: () => live.current.onMenu && live.current.onMenu(),
  }));
  React.useEffect(() => {
    navigator.start();
    return navigator.destroy;
  }, [navigator]);
  return navigator;
}

export { useSpatialFocus };
