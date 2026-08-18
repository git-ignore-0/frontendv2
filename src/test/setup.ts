import "@testing-library/jest-dom/vitest";

if (typeof window.PointerEvent === "undefined") {
  class PointerEvent extends Event {
    pointerId: number;
    pointerType: string;
    button: number;
    clientX: number;
    clientY: number;

    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? "";
      this.button = init.button ?? 0;
      this.clientX = init.clientX ?? 0;
      this.clientY = init.clientY ?? 0;
    }
  }
  (window as unknown as { PointerEvent: typeof PointerEvent }).PointerEvent =
    PointerEvent;
}

if (typeof window.Element.prototype.setPointerCapture === "undefined") {
  window.Element.prototype.setPointerCapture = () => {};
  window.Element.prototype.hasPointerCapture = () => true;
  window.Element.prototype.releasePointerCapture = () => {};
}
