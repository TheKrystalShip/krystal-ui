import { act } from "@testing-library/react";

// jsdom builds no PointerEvent and keeps no clock for one: a pointer event is a mouse event dressed
// with the pointer's id, its primary flag and the time the test says it happened.
export function pointer(el, type, { x = 0, y = 0, t = 1000, id = 1 } = {}) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 });
  Object.defineProperties(event, { pointerId: { value: id }, isPrimary: { value: true }, timeStamp: { value: t } });
  act(() => { el.dispatchEvent(event); });
}

// A touch event with one finger, for the listeners the body's pull-down reads.
export function touch(el, type, { x = 0, y = 0, t = 1000 } = {}) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  const list = type === "touchend" || type === "touchcancel" ? [] : [{ clientX: x, clientY: y }];
  Object.defineProperties(event, { touches: { value: list }, timeStamp: { value: t } });
  act(() => { el.dispatchEvent(event); });
}
