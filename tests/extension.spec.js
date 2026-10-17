const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));

async function openFixture(page, markup) {
  await page.route("https://www.youtube.com/**", (route) => route.fulfill({
    contentType: "text/html; charset=utf-8", body: `<!doctype html><html><head><meta charset="utf-8"></head><body>${markup}</body></html>`,
  }));
  await page.goto("https://www.youtube.com/");
  for (const stylesheet of manifest.content_scripts[0].css) {
    await page.addStyleTag({ path: path.join(root, stylesheet) });
  }
  for (const script of manifest.content_scripts[0].js) {
    await page.addScriptTag({ path: path.join(root, script) });
  }
}

test("manifest uses local scripts without extra permissions", () => {
  expect(manifest.manifest_version).toBe(3);
  expect(manifest.permissions).toBeUndefined();
  expect(manifest.content_scripts[0].run_at).toBe("document_start");
  for (const filename of [...manifest.content_scripts[0].css, ...manifest.content_scripts[0].js]) {
    expect(fs.existsSync(path.join(root, filename))).toBe(true);
  }
});

test("hides shelves, navigation, search cards and channel tabs", async ({ page }) => {
  await openFixture(page, `
    <ytd-guide-entry-renderer id="shorts"><a href="/shorts">shorts</a></ytd-guide-entry-renderer>
    <ytd-mini-guide-entry-renderer id="games"><a href="/feed/playables">games</a></ytd-mini-guide-entry-renderer>
    <ytd-rich-section-renderer id="shelf"><ytd-reel-shelf-renderer>shorts</ytd-reel-shelf-renderer></ytd-rich-section-renderer>
    <ytd-video-renderer id="result"><a href="/shorts/123">clip</a></ytd-video-renderer>
    <ytd-rich-item-renderer id="card"><yt-lockup-view-model><a href="https://www.youtube.com/playables/123">game</a></yt-lockup-view-model></ytd-rich-item-renderer>
    <yt-tab-shape id="tab"><a href="/@channel/shorts">shorts</a></yt-tab-shape>
    <ytm-pivot-bar-item-renderer id="mobile"><a href="/shorts">shorts</a></ytm-pivot-bar-item-renderer>
    <ytd-video-renderer id="regular"><a href="/watch?v=123">shorts and games review</a></ytd-video-renderer>
    <ytd-guide-entry-renderer id="gaming"><a href="/gaming">gaming videos</a></ytd-guide-entry-renderer>
    <a id="external" href="https://example.com/shorts/123">external</a>
    <a id="similar" href="/shortstory">similar path</a>
  `);
  for (const id of ["shorts", "games", "shelf", "result", "card", "tab", "mobile"]) {
    await expect(page.locator(`#${id}`)).toBeHidden();
  }
  for (const id of ["regular", "gaming", "external", "similar"]) {
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
});

test("filters lazy content and restores recycled cards", async ({ page }) => {
  await openFixture(page, '<ytd-video-renderer id="card"><a href="/watch?v=1">video</a></ytd-video-renderer>');
  await page.locator("#card a").evaluate((anchor) => anchor.setAttribute("href", "/shorts/123"));
  await expect(page.locator("#card")).toBeHidden();
  await page.locator("#card a").evaluate((anchor) => anchor.setAttribute("href", "/watch?v=2"));
  await expect(page.locator("#card")).toBeVisible();
  await page.evaluate(() => {
    document.body.insertAdjacentHTML("beforeend", '<ytd-video-renderer id="lazy"><a href="/playables/42">game</a></ytd-video-renderer>');
  });
  await expect(page.locator("#lazy")).toBeHidden();
  await page.locator("#lazy").evaluate((card) => {
    card.innerHTML = '<a href="/watch?v=3">normal video</a>';
  });
  await expect(page.locator("#lazy")).toBeVisible();
});

test("hides navigation entries without href in English and Russian", async ({ page }) => {
  await openFixture(page, `
    <ytd-guide-entry-renderer id="shorts"><a title="Shorts" role="link">shorts</a></ytd-guide-entry-renderer>
    <ytd-mini-guide-entry-renderer id="playables"><a title="Playables">playables</a></ytd-mini-guide-entry-renderer>
    <ytd-guide-entry-renderer id="russian"><a title="Игры">игры</a></ytd-guide-entry-renderer>
    <ytd-video-renderer id="video"><a href="/watch?v=1" title="Shorts">review</a></ytd-video-renderer>
  `);
  for (const id of ["shorts", "playables", "russian"]) {
    await expect(page.locator(`#${id}`)).toBeHidden();
  }
  await expect(page.locator("#video")).toBeVisible();
});

test("navigation redirects only blocked routes, including internal transitions", () => {
  const source = fs.readFileSync(path.join(root, "navigation.js"), "utf8");
  for (const pathname of ["/shorts/123", "/shorts", "/playables", "/playable/42", "/feed/playables", "/@name/shorts", "/channel/abc/shorts", "/watch", "/gaming", "/shortstory"]) {
    const redirects = [];
    const listeners = {};
    const location = { pathname, replace: (url) => redirects.push(url) };
    const events = { addEventListener: (event, callback) => { listeners[event] = callback; } };
    vm.runInNewContext(source, { location, document: events, window: events });
    expect(redirects).toEqual(["/watch", "/gaming", "/shortstory"].includes(pathname) ? [] : ["/"]);
    location.pathname = "/shorts/next";
    for (const event of ["yt-navigate-finish", "yt-page-data-updated", "popstate"]) {
      const before = redirects.length;
      listeners[event]();
      expect(redirects.length).toBe(before + 1);
    }
  }
});
