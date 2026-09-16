import assert from "assert";
import { startWebGLTransition } from "../components/PageTransition/WebGLTransition.jsx";

console.log("Testing startWebGLTransition in SSR/Node...");
let executed = false;
startWebGLTransition(() => {
  executed = true;
});
assert.strictEqual(executed, true, "startWebGLTransition must call callback synchronously in SSR/non-browser");
console.log("PASS: SSR fallback verified!");

console.log("Testing simulated browser environment with startViewTransition...");
let eventDispatched = false;
let capturedDetail = null;

global.window = {
  dispatchEvent: (event) => {
    eventDispatched = true;
    capturedDetail = event.detail;
  },
};
global.CustomEvent = class CustomEvent {
  constructor(name, options) {
    this.name = name;
    this.detail = options?.detail;
  }
};
global.document = {
  startViewTransition: (callback) => {
    return {
      ready: Promise.resolve(),
      finished: Promise.resolve(),
      updateCallbackDone: Promise.resolve(),
    };
  },
};

let clientExecuted = false;
startWebGLTransition(() => {
  clientExecuted = true;
});

assert.strictEqual(eventDispatched, true, "CustomEvent should be dispatched when in browser");
assert.strictEqual(typeof capturedDetail?.update, "function", "detail.update should be a function");
capturedDetail.update();
assert.strictEqual(clientExecuted, true, "Captured update callback should execute successfully");

console.log("PASS: Client-side event dispatch and callback execution verified!");
