import React from "react";
import { Button } from "./Button.jsx";
import { EmptyState } from "./EmptyState.jsx";

// Catches what throws while its children render, and shows `fallback` in their place: a node, or a
// function given `(reset, error)` — `reset` renders the children again. Without one it is the whole
// screen saying the page failed, with the error and a reload. `resetKey` clears a caught error when
// it changes, so navigating away recovers a crashed page without remounting what holds it.
// `onError(error, info)` hears every catch.
//
// It catches rendering only. A request that fails is state, and the page that made it says so.
/**
 * @typedef {object} ErrorBoundaryProps
 * @property {import("react").ReactNode | ((reset: () => void, error: Error) => import("react").ReactNode)} [fallback]
 * @property {unknown} [resetKey] A change clears a caught error.
 * @property {(error: Error, info: import("react").ErrorInfo) => void} [onError]
 * @property {import("react").ReactNode} [children]
 */
/** @extends {React.Component<ErrorBoundaryProps, { error: Error | null }>} */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    try {
      console.error("UI crash caught by boundary:", error, info && info.componentStack);
    } catch { /* a console that throws has nothing to tell */ }
    if (this.props.onError) {
      try { this.props.onError(error, info); } catch { /* a reporter's failure is not the page's */ }
    }
  }

  componentDidUpdate(prev) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  reset() {
    this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    const fb = this.props.fallback;
    if (typeof fb === "function") return fb(this.reset, this.state.error);
    if (fb) return fb;
    return <CrashScreen error={this.state.error} />;
  }
}

/** @param {{ error?: Error | null }} props */
function CrashScreen({ error }) {
  return (
    <EmptyState page tone="danger" icon="bug" title="Something went wrong"
      detail={error && error.message ? String(error.message) : null}
      actions={<Button variant="primary" size="lg" icon="rotate-cw" onClick={() => window.location.reload()}>Reload</Button>}>
      <p>This page hit an unexpected error and couldn’t continue. Reloading usually clears it.</p>
    </EmptyState>
  );
}

export { ErrorBoundary };
