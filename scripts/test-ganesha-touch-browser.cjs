const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_EXECUTABLE,
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(
      (process.env.GANESHA_PREVIEW_URL || "http://localhost:3000") + "/#debug"
    );
    await page.waitForSelector("#canvas canvas");
    await page.addStyleTag({
      content: "[data-ganesha-debug]{display:none!important}",
    });
    await page.locator("[data-ganesha-touch]").waitFor({ state: "visible" });
    assert.equal(
      await page
        .locator("[data-ganesha-touch]")
        .evaluate((e) => getComputedStyle(e).touchAction),
      "pinch-zoom"
    );
    const cdp = await page.context().newCDPSession(page);
    const touch = (type, x, y) =>
      cdp.send("Input.dispatchTouchEvent", {
        type,
        touchPoints: x === undefined ? [] : [{ x, y }],
      });
    await touch("touchStart", 195, 490);
    await page.waitForTimeout(180);
    const start = await page.evaluate(
      () => document.querySelector("#canvas").ganeshaSnapshot().pointer
    );
    for (let y = 480; y >= 270; y -= 10) {
      await touch("touchMove", 195, y);
      await page.waitForTimeout(45);
    }
    const active = await page.evaluate(() => ({
      scroll: scrollY,
      state: document.querySelector("#canvas").ganeshaSnapshot(),
    }));
    assert.ok(active.scroll < 2, "Playing the hero must not pan the page");
    assert.ok(
      Math.abs(active.state.pointer[1] - start[1]) > 0.2,
      "Finger movement must continuously reach the shader"
    );
    assert.ok(
      active.state.hold > 0.2,
      "Touch interaction must remain active instead of pointercancel"
    );
    // Pointer capture keeps a gesture alive when it crosses the play area's edge.
    await touch("touchMove", 15, 300);
    await page.waitForTimeout(180);
    assert.ok(
      (await page.evaluate(
        () =>
          document.querySelector("#canvas").ganeshaSnapshot().uniforms
            .uFieldHover
      )) > 0.8
    );
    await touch("touchEnd");
    await page.waitForTimeout(400);
    assert.ok(
      (await page.evaluate(
        () =>
          document.querySelector("#canvas").ganeshaSnapshot().uniforms
            .uFieldHover
      )) < 0.05,
      "Release must clear touch hover"
    );
    await page.screenshot({ path: "/tmp/ganesha-touch-mobile.png" });
    // Starting below the play area still scrolls, even when the finger moves into it.
    await touch("touchStart", 310, 715);
    for (let y = 700; y >= 390; y -= 15) {
      await touch("touchMove", 310, y);
      await page.waitForTimeout(20);
    }
    await touch("touchEnd");
    await page.waitForTimeout(500);
    const scrolled = await page.evaluate(() => scrollY);
    assert.ok(scrolled > 100, "The lower hero must remain scrollable");
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.getByRole("link", { name: "Scroll to featured work" }).tap();
    await page.waitForTimeout(1000);
    assert.ok(
      (await page.evaluate(() => scrollY)) > 100,
      "Explore remains tappable"
    );
    assert.deepEqual(errors, []);
    console.log({
      touchDragScroll: active.scroll,
      continuousPointer: true,
      pointerCapture: true,
      lowerHeroScroll: scrolled,
      explore: true,
      errors,
    });
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
