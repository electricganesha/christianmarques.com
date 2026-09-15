const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_EXECUTABLE,
  });
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(process.env.GANESHA_PREVIEW_URL || "http://localhost:3000");
  await p.waitForSelector("#canvas canvas");
  assert.equal(await p.locator("[data-ganesha-debug]").count(), 0);
  await p.evaluate(() => (location.hash = "debug"));
  await p.getByRole("complementary", { name: "Ganesha debugger" }).waitFor();
  await p.getByLabel("textureInkBlend value", { exact: true }).fill("0.2");
  await p.waitForTimeout(200);
  assert.equal(
    await p.evaluate(
      () =>
        document.querySelector("#canvas").ganeshaSnapshot().uniforms
          .uTextureInkBlend
    ),
    0.2
  );
  await p.getByText("Performance", { exact: true }).click();
  await p
    .getByLabel("particleCountDesktop value", { exact: true })
    .fill("32000");
  assert.equal(
    await p
      .getByRole("button", { name: "Apply particle settings" })
      .isEnabled(),
    true
  );
  await p.getByRole("button", { name: "Apply particle settings" }).click();
  await p.getByRole("button", { name: "Copy config" }).click();
  let values = JSON.parse(
    await p.getByLabel("Exported configuration").inputValue()
  );
  assert.equal(values.particleCountDesktop, 32000);
  await p.getByLabel("Preview state").selectOption("held");
  await p.waitForTimeout(4000);
  assert.ok(
    (await p.evaluate(
      () => document.querySelector("#canvas").ganeshaSnapshot().reveal
    )) > 0.9
  );
  await p.screenshot({ path: "/tmp/ganesha-debug.png" });
  await p.getByRole("button", { name: "Reset", exact: true }).click();
  assert.equal(
    await p.getByLabel("textureInkBlend value", { exact: true }).inputValue(),
    "0.65"
  );
  await p.setViewportSize({ width: 390, height: 844 });
  await p.screenshot({ path: "/tmp/ganesha-debug-mobile.png" });
  assert.ok(
    await p
      .locator("[data-ganesha-debug]")
      .evaluate((e) => e.getBoundingClientRect().right <= innerWidth)
  );
  await p.getByRole("button", { name: "Close debugger" }).click();
  assert.equal(await p.locator("[data-ganesha-debug]").count(), 0);
  await p.evaluate(() => (location.hash = "debug"));
  await p.getByRole("complementary", { name: "Ganesha debugger" }).waitFor();
  assert.equal(
    await p.getByLabel("textureInkBlend value", { exact: true }).inputValue(),
    "0.65"
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS debugger: opt-in hash, live TSL uniform, staged sampling, export/reset, full-reveal preview, mobile bounds, close/reopen."
  );
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
