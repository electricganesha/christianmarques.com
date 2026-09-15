const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
(async () => {
  const b = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_EXECUTABLE,
  });
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("console", (m) => {
      if (m.type() === "error" && /shader|webgpu|wgsl/i.test(m.text()))
        errors.push(m.text());
    });
    await p.addInitScript(() => {
      window.fieldOscillators = 0;
      const Original = window.AudioContext;
      window.AudioContext = new Proxy(Original, {
        construct(T, args) {
          const c = new T(...args);
          const make = c.createOscillator.bind(c);
          c.createOscillator = () => {
            fieldOscillators++;
            return make();
          };
          return c;
        },
      });
    });
    await p.goto(
      (process.env.GANESHA_PREVIEW_URL || "http://localhost:3000") + "/#debug"
    );
    await p.waitForSelector("#canvas canvas");
    await p.addStyleTag({
      content: "[data-ganesha-debug]{display:none!important}",
    });
    await p.waitForTimeout(200);
    const distantBefore = await p.evaluate(() =>
      document
        .querySelector("#canvas")
        .ganeshaSnapshot()
        .fieldPoints.find((p) => p.position[0] < -0.8)
    );
    const target = await p.evaluate(() => {
      const points = document
        .querySelector("#canvas")
        .ganeshaSnapshot().fieldPoints;
      return points
        .map((p) => {
          const [x, y, z] = p.position;
          const f = 1 / Math.tan(Math.PI / 12);
          return {
            ...p,
            x: ((x * f) / (4.8 - z) / 1.44 + 1) * 720,
            y: (1 - (y * f) / (4.8 - z)) * 500,
          };
        })
        .find((p) => p.x > 1100 && p.x < 1320 && p.y > 180 && p.y < 650);
    });
    assert.ok(target, "Need a real field circle outside the sculpture");
    await p.mouse.move(target.x + 25, target.y);
    await p.waitForTimeout(450);
    let state = await p.evaluate(() =>
      document.querySelector("#canvas").ganeshaSnapshot()
    );
    const distantAfter = state.fieldPoints.find(
      (p) => p.id === distantBefore.id
    );
    assert.ok(
      Math.abs(distantAfter.position[0] - distantBefore.position[0]) < 0.025,
      "Distant circles should only drift; there must be no global mouse-follow motion"
    );
    const repelled = state.fieldPoints.find((p) => p.id === target.id);
    assert.ok(
      repelled.position[0] < repelled.restPosition[0] - 0.02,
      "The hovered circle must move away from the pointer"
    );
    assert.ok(
      state.fieldHit !== null && state.uniforms.uFieldHover > 0.8,
      "Field hover updates on WebGPU"
    );
    assert.equal(
      await p.evaluate(() => fieldOscillators),
      0,
      "Hover must remain silent before opt-in"
    );
    await p.getByRole("button", { name: "Enable sound", exact: true }).click();
    await p.getByRole("button", { name: "Mute sound", exact: true }).waitFor();
    await p.mouse.move(target.x, target.y, { steps: 8 });
    await p.waitForTimeout(700);
    state = await p.evaluate(() =>
      document.querySelector("#canvas").ganeshaSnapshot()
    );
    assert.ok(
      state.fieldNoteCount > 0,
      "An off-sculpture field circle must emit a note and pulse"
    );
    const count = state.fieldNoteCount;
    await p.waitForTimeout(2000);
    assert.equal(
      await p.evaluate(
        () => document.querySelector("#canvas").ganeshaSnapshot().fieldNoteCount
      ),
      count,
      "Stationary field hover must not retrigger"
    );
    await p.mouse.move(720, 25);
    await p.waitForTimeout(500);
    assert.ok(
      (await p.evaluate(
        () =>
          document.querySelector("#canvas").ganeshaSnapshot().uniforms
            .uFieldHover
      )) < 0.05,
      "Navigation leaves the field inactive"
    );
    const returned = await p.evaluate(
      () => document.querySelector("#canvas").ganeshaSnapshot().fieldPoints
    );
    assert.ok(
      returned.every(
        (p) =>
          Math.hypot(...p.position.map((v, i) => v - p.restPosition[i])) < 0.01
      ),
      "After hover ends, circles return to their drifting rest positions"
    );
    await p.getByRole("button", { name: "Mute sound", exact: true }).click();
    // Reduced motion freezes ambient drift, so changed crop pixels must come
    // from the actual hover rendering rather than an advancing noise clock.
    await p.emulateMedia({ reducedMotion: "reduce" });
    await p.mouse.move(720, 25);
    await p.waitForTimeout(700);
    const visualTarget = await p.evaluate(() =>
      document
        .querySelector("#canvas")
        .ganeshaSnapshot()
        .fieldPoints.map((p) => {
          const [x, y, z] = p.position;
          const f = 1 / Math.tan(Math.PI / 12);
          return {
            x: ((x * f) / (4.8 - z) / 1.44 + 1) * 720,
            y: (1 - (y * f) / (4.8 - z)) * 500,
          };
        })
        .find((p) => p.x > 1100 && p.x < 1300 && p.y > 200 && p.y < 600)
    );
    const crop = {
      x: Math.floor(visualTarget.x) - 30,
      y: Math.floor(visualTarget.y) - 30,
      width: 60,
      height: 60,
    };
    const beforeHover = await p.screenshot({
      clip: crop,
      path: "/tmp/ganesha-field-before.png",
    });
    await p.mouse.move(visualTarget.x, visualTarget.y);
    await p.waitForTimeout(450);
    const afterHover = await p.screenshot({
      clip: crop,
      path: "/tmp/ganesha-field-after.png",
    });
    assert.ok(
      !beforeHover.equals(afterHover),
      "Visible field pixels must react to hover, even in reduced motion"
    );
    const mobile = await b.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    mobile.on("pageerror", (e) => errors.push(e.message));
    await mobile.goto(
      (process.env.GANESHA_PREVIEW_URL || "http://localhost:3000") + "/#debug"
    );
    await mobile.locator("[data-ganesha-touch]").waitFor({ state: "visible" });
    await mobile.addStyleTag({
      content: "[data-ganesha-debug]{display:none!important}",
    });
    await mobile
      .getByRole("button", { name: "Enable sound", exact: true })
      .tap();
    await mobile.waitForTimeout(250);
    const candidates = await mobile.evaluate(() =>
      document
        .querySelector("#canvas")
        .ganeshaSnapshot()
        .fieldPoints.map((p) => {
          const [x, y, z] = p.position;
          const f = 1 / Math.tan(Math.PI / 12);
          return {
            x: ((x * f) / (6.6 - z) / (390 / 844) + 1) * 195,
            y: (1 - (y * f) / (6.6 - z)) * 422,
          };
        })
        .filter((p) => p.x > 140 && p.x < 250 && p.y > 230 && p.y < 600)
    );
    const cdp = await mobile.context().newCDPSession(mobile);
    let centralField = false;
    for (const point of candidates) {
      const before = await mobile.evaluate(
        () => document.querySelector("#canvas").ganeshaSnapshot().fieldNoteCount
      );
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [point],
      });
      await mobile.waitForTimeout(300);
      const hit = await mobile.evaluate(() =>
        document.querySelector("#canvas").ganeshaSnapshot()
      );
      centralField =
        hit.surfaceHit && hit.fieldHit !== null && hit.fieldNoteCount > before;
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      if (centralField) break;
      await mobile.waitForTimeout(220);
    }
    assert.ok(
      centralField,
      "A visible mobile field circle over the hidden GLB must own the note"
    );
    assert.equal(
      await mobile.evaluate(() => scrollY),
      0,
      "Playing the central field must not scroll"
    );
    assert.deepEqual(errors, []);
    console.log({
      backend: state.backend,
      fieldNotes: count,
      optIn: true,
      stationarySilence: true,
      visibleHoverChange: true,
      localRepulsion: true,
      mobileFieldOverHiddenSurface: centralField,
      errors,
    });
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
