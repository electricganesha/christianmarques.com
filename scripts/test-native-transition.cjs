const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_EXECUTABLE,
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 900 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(() => {
      window.transitions = 0;
      const start = document.startViewTransition.bind(document);
      document.startViewTransition = (...args) => {
        window.transitions++;
        const t = start(...args);
        window.transition = t;
        return t;
      };
    });
    await page.goto("http://localhost:3000/projects/");
    await page.waitForSelector('[data-testid="webgl-transition"] canvas', {
      state: "attached",
    });
    for (const path of ["/lab/", "/about/", "/projects/"]) {
      await page.locator(`a[href="${path}"]`).first().click();
      await page.waitForURL("**" + path);
      await page.evaluate(() => window.transition.ready);
      await page.waitForTimeout(300);
      await page.screenshot({
        path: "/tmp/native-" + path.split("/")[1] + ".png",
      });
      await page.evaluate(() => window.transition.finished);
    }
    assert.equal(await page.evaluate(() => window.transitions), 3);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator('a[href="/about/"]').first().click();
    await page.waitForURL("**/about/");
    assert.equal(await page.evaluate(() => window.transitions), 3);
    assert.deepEqual(errors, []);
    console.log(
      "Native transitions complete across three routes; reduced motion bypasses animation; no page errors."
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
