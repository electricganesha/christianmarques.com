// Optional browser regression check; see docs/electric-ganesha.md for setup.
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
(async () => {
  const b = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_EXECUTABLE,
  });
  const p = await b.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  });
  await p.addInitScript(() => {
    window.cursorFrames = [];
    window.interactionUniforms = {};
    function observe() {
      const state = document.querySelector("#canvas")?.ganeshaSnapshot?.();
      if (state) {
        window.interactionUniforms = state.uniforms;
        window.cursorFrames.push([performance.now(), ...state.pointer]);
      }
      requestAnimationFrame(observe);
    }
    requestAnimationFrame(observe);
  });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (message) => {
    if (/Texture ink unavailable|shader error/i.test(message.text()))
      errors.push(message.text());
  });
  await p.goto(
    process.env.GANESHA_PREVIEW_URL || "http://localhost:3000/#debug"
  );
  await p.waitForSelector("#canvas canvas");
  await p.addStyleTag({
    content: "[data-ganesha-debug] { display: none !important; }",
  });
  assert.equal(await p.locator("#canvas canvas").evaluate((c) => c.width), 585);
  const fps = await p.evaluate(
    () =>
      new Promise((resolve) => {
        const times = [];
        let last = performance.now();
        function frame(t) {
          times.push(t - last);
          last = t;
          if (times.length < 90) requestAnimationFrame(frame);
          else {
            times.shift();
            times.sort((a, b) => a - b);
            resolve({
              medianMs: times[Math.floor(times.length / 2)],
              p95Ms: times[Math.floor(times.length * 0.95)],
            });
          }
        }
        requestAnimationFrame(frame);
      })
  );
  await p.mouse.move(80, 280);
  await p.waitForTimeout(700);
  await p.evaluate(() => {
    window.cursorFrames = [];
  });
  for (let x = 80; x <= 310; x += 5) {
    await p.mouse.move(x, 280 + Math.sin(x / 60) * 60);
    await p.waitForTimeout(16);
  }
  const cursorMotion = await p.evaluate(() => {
    const frames = window.cursorFrames;
    let maxStep = 0;
    for (let i = 1; i < frames.length; i++) {
      maxStep = Math.max(
        maxStep,
        Math.hypot(
          frames[i][1] - frames[i - 1][1],
          frames[i][2] - frames[i - 1][2],
          frames[i][3] - frames[i - 1][3]
        )
      );
    }
    return { updates: frames.length, maxStep };
  });
  assert.ok(
    cursorMotion.updates > 30,
    "Pointer uniforms must update between throttled surface queries"
  );
  assert.ok(
    cursorMotion.maxStep < 0.14,
    "Pointer must not jump between surface hits"
  );
  await p.mouse.move(195, 280);
  await p.waitForTimeout(900);
  const hoverReveal = await p.evaluate(() => interactionUniforms.uReveal);
  await p.mouse.down();
  await p.waitForTimeout(4000);
  const held = await p.evaluate(() => ({
    hold: interactionUniforms.uHold,
    reveal: interactionUniforms.uReveal,
    pulse: interactionUniforms.uPulseStart,
  }));
  assert.ok(
    held.hold > 0.9 && held.reveal > hoverReveal + 0.1 && held.pulse > 0,
    "Holding must deliberately gather the form and launch a surface pulse"
  );
  await p.mouse.up();
  // Keep the cursor over the sculpture: inactivity itself must dissolve it.
  await p.waitForTimeout(1100);
  const released = await p.evaluate(() => ({
    hold: interactionUniforms.uHold,
    reveal: interactionUniforms.uReveal,
  }));
  assert.ok(
    released.hold > 0 && released.hold < held.hold,
    "Release must decay gradually"
  );
  await p.waitForTimeout(13000);
  const idle = await p.evaluate(() => ({
    reveal: interactionUniforms.uReveal,
    activity: interactionUniforms.uActivity,
  }));
  assert.ok(
    idle.reveal < 0.05 && idle.activity < 0.01,
    "A stationary cursor over the sculpture must return to the field"
  );
  await p.screenshot({ path: "/tmp/ganesha-returned-field.png" });
  const cdp = await p.context().newCDPSession(p);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 8, y: 600 }],
  });
  for (let y = 580; y >= 260; y -= 20) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: 8, y }],
    });
    await p.waitForTimeout(20);
  }
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await p.waitForTimeout(500);
  const scrollY = await p.evaluate(() => scrollY);
  assert.ok(scrollY > 100, "Touch in the side gutter must scroll the page");
  await p.evaluate(() => scrollTo(0, 0));
  await p.getByRole("link", { name: "Scroll to featured work" }).click();
  await p.waitForTimeout(1200);
  assert.ok((await p.evaluate(() => scrollY)) > 100);
  const reduced = await b.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  await reduced.goto(
    process.env.GANESHA_PREVIEW_URL || "http://localhost:3000/#debug"
  );
  await reduced.waitForSelector("#canvas canvas");
  await reduced.waitForTimeout(1500);
  const first = await reduced.locator("#canvas").screenshot();
  await reduced.waitForTimeout(1000);
  const second = await reduced.locator("#canvas").screenshot();
  assert.ok(first.equals(second), "Reduced motion should be static at rest");
  const desktop = await b.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 2,
  });
  desktop.on("pageerror", (error) => errors.push(error.message));
  desktop.on("console", (message) => {
    if (message.type() === "error" && /shader|webgl/i.test(message.text()))
      errors.push(message.text());
  });
  await desktop.goto(
    process.env.GANESHA_PREVIEW_URL || "http://localhost:3000/#debug"
  );
  await desktop.waitForSelector("#canvas canvas");
  assert.equal(
    await desktop.locator("#canvas canvas").evaluate((canvas) => canvas.width),
    2880
  );
  await desktop.mouse.move(720, 280);
  const desktopFrameTiming = await desktop.evaluate(
    () =>
      new Promise((resolve) => {
        const times = [];
        let last = performance.now();
        function frame(now) {
          times.push(now - last);
          last = now;
          if (times.length < 120) requestAnimationFrame(frame);
          else {
            times.shift();
            times.sort((a, b) => a - b);
            resolve({ medianMs: times[59], p95Ms: times[113] });
          }
        }
        requestAnimationFrame(frame);
      })
  );
  const fail = await b.newPage();
  await fail.route("**/electricganesha.glb", (r) =>
    r.fulfill({ status: 404, body: "missing" })
  );
  await fail.goto(
    process.env.GANESHA_PREVIEW_URL || "http://localhost:3000/#debug"
  );
  await fail.waitForTimeout(1500);
  assert.equal(await fail.locator("#canvas canvas").count(), 0);
  assert.equal(await fail.locator("h1").innerText(), "Christian Marques");
  console.log(
    JSON.stringify({
      errors,
      cursorMotion,
      holdReveal: held,
      release: released,
      stationaryField: idle,
      dprCap: true,
      touchScrollY: scrollY,
      buttonNavigation: true,
      reducedMotionStatic: true,
      modelFailureFallback: true,
      mobileEmulationFrameTiming: fps,
      desktopFrameTiming,
    })
  );
  const backend = await desktop
    .locator("#canvas")
    .getAttribute("data-renderer");
  assert.equal(backend, "webgpu", "Must exercise the real WebGPU backend");
  console.log({ backend });
  assert.deepEqual(errors, []);
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
