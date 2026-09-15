const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_EXECUTABLE,
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && /shader|webgl/i.test(m.text()))
      errors.push(m.text());
  });
  await page.addInitScript(() => {
    window.audioContexts = [];
    window.audioChecks = {
      oscillators: 0,
      peak: 0,
      maxPaths: 0,
      pulses: 0,
      glides: 0,
      inflections: 0,
    };
    const Original = window.AudioContext;
    window.AudioContext = new Proxy(Original, {
      construct(T, args) {
        const ctx = new T(...args);
        audioContexts.push(ctx);
        const create = ctx.createOscillator.bind(ctx);
        ctx.createOscillator = () => {
          audioChecks.oscillators++;
          const oscillator = create();
          for (const [param, key, method] of [
            [oscillator.frequency, "glides", "exponentialRampToValueAtTime"],
            [oscillator.detune, "inflections", "linearRampToValueAtTime"],
          ]) {
            const original = param[method].bind(param);
            param[method] = (...args) => {
              audioChecks[key]++;
              return original(...args);
            };
          }
          return oscillator;
        };
        const analyser = ctx.createAnalyser.bind(ctx);
        ctx.createAnalyser = () => {
          const a = analyser();
          ctx.testAnalyser = a;
          return a;
        };
        return ctx;
      },
    });
    setInterval(() => {
      const state = document.querySelector("#canvas")?.ganeshaSnapshot?.();
      if (state) {
        audioChecks.maxPaths = Math.max(
          audioChecks.maxPaths,
          state.musicPathCount
        );
        if (state.noteTimes.some((t) => t > 0)) audioChecks.pulses++;
      }
      const c = audioContexts[0];
      if (c?.testAnalyser && c.state === "running") {
        const a = new Float32Array(c.testAnalyser.fftSize);
        c.testAnalyser.getFloatTimeDomainData(a);
        let peak = 0;
        for (const v of a) peak = Math.max(peak, Math.abs(v));
        audioChecks.peak = Math.max(audioChecks.peak, peak);
      }
    }, 25);
  });
  await page.goto(
    process.env.GANESHA_PREVIEW_URL || "http://localhost:3000/#debug"
  );
  await page.waitForSelector("#canvas canvas");
  await page.addStyleTag({
    content: "[data-ganesha-debug] { display:none !important; }",
  });
  assert.equal(
    await page.evaluate(() => audioContexts.length),
    0,
    "Audio must be opt-in"
  );
  await page.getByRole("button", { name: "Enable sound", exact: true }).click();
  await page.getByRole("button", { name: "Mute sound", exact: true }).waitFor();
  assert.equal(await page.evaluate(() => audioContexts[0].state), "running");
  await page.mouse.move(600, 300);
  await page.mouse.down();
  for (let i = 0; i < 35; i++) {
    await page.mouse.move(600 + i * 7, 300 + Math.sin(i / 7) * 70);
    await page.waitForTimeout(70);
  }
  await page.mouse.up();
  await page.mouse.move(1100, 700);
  await page.waitForTimeout(1800);
  const live = await page.evaluate(() => ({ ...audioChecks }));
  assert.ok(live.oscillators > 0, "Spatial gestures must synthesize notes");
  assert.ok(
    live.peak > 0.0001 && live.peak < 0.9,
    "Audio output must be measurable and bounded"
  );
  assert.ok(live.maxPaths >= 3, "Drag release must create a resonant path");
  assert.ok(live.pulses > 0, "Scheduled notes must pulse particles");
  assert.ok(
    live.glides > 0,
    "Melodic gestures must schedule continuous pitch slides"
  );
  const before = live.oscillators;
  await page.waitForTimeout(11000);
  const expired = await page.evaluate(() => audioChecks.oscillators);
  await page.waitForTimeout(2000);
  assert.equal(
    await page.evaluate(() => audioChecks.oscillators),
    expired,
    "Expired paths and idle cursor must stop scheduling"
  );
  assert.ok(expired > before, "The released path must replay");
  await page.getByRole("button", { name: "Mute sound", exact: true }).click();
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => audioContexts[0].state), "closed");
  await page.getByRole("button", { name: "Enable sound", exact: true }).click();
  await page.getByRole("button", { name: "Mute sound", exact: true }).waitFor();
  assert.equal(
    await page.evaluate(() => audioContexts.length),
    2,
    "Re-enabling must create one fresh context"
  );
  await page.mouse.move(650, 300);
  await page.mouse.down();
  await page.mouse.move(800, 360, { steps: 20 });
  await page.mouse.up();
  await page.evaluate(() => scrollTo(0, innerHeight * 1.3));
  await page.waitForTimeout(1400);
  assert.equal(
    await page.getByRole("button", { name: "Mute sound", exact: true }).count(),
    0,
    "Sound controls follow hero visibility"
  );
  const hidden = await page.evaluate(() => audioChecks.oscillators);
  await page.waitForTimeout(600);
  assert.equal(
    await page.evaluate(() => audioChecks.oscillators),
    hidden,
    "No notes below the hero"
  );
  await page.goto("about:blank");
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      optIn: true,
      live,
      expiredPaths: true,
      muteClosesContext: true,
      reenable: true,
      hiddenSilence: true,
      errors,
    })
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
