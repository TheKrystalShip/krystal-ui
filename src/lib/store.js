import React from "react";

// store.js — the reactive container every Krystal site keeps its state in.
//
// A store holds a value and notifies subscribers on change. Components never
// read a backend directly — they subscribe to a store slice with useStore and
// call store actions.
//
// Framework-agnostic core (createStore) + React binding (useStore via
// useSyncExternalStore, the canonical React 18 external-store hook).

/**
 * @template S
 * @typedef {object} Store
 * @property {() => S} getState
 * @property {(next: S | Partial<S> | ((prev: S) => S)) => void} setState An object patch is merged; an array or primitive replaces; a function maps the previous state.
 * @property {(listener: () => void) => () => void} subscribe Returns the unsubscribe.
 */
/**
 * @template S
 * @param {S} initial
 * @returns {Store<S>}
 */
function createStore(initial) {
  let state = initial;
  const subs = new Set();
  const emit = () => subs.forEach(fn => fn());
  return {
    getState() { return state; },
    // Object patch (merged), array (replaced), or updater fn (prev => next).
    /** @param {any} next */
    setState(next) {
      if (typeof next === "function") state = next(state);
      else if (Array.isArray(next) || typeof next !== "object" || next === null) state = next;
      else state = { ...state, ...next };
      emit();
    },
    subscribe(fn) { subs.add(fn); return () => { subs.delete(fn); }; },
  };
}

// useStore(store) -> whole state; useStore(store, s => s.slice) -> a slice.
// The selector MUST return a stable reference when nothing changed (return a
// state slice, don't build a new array/object inline) — derive with useMemo in
// the component if you need to transform.
/**
 * @template S
 * @template [R=S]
 * @param {Store<S>} store
 * @param {(state: S) => R} [selector] Must return a stable reference while nothing changed.
 * @returns {R}
 */
function useStore(store, selector) {
  // Same snapshot for client + server (getServerSnapshot) so the hook is safe
  // under renderToString / prerender as well as in the browser.
  const snapshot = () => /** @type {R} */ (selector ? selector(store.getState()) : store.getState());
  return React.useSyncExternalStore(store.subscribe, snapshot, snapshot);
}

export { createStore, useStore };
