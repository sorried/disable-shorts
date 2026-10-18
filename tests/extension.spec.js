const { test, expect, chromium } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const os = require("node:os");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));

async function openFixture(page, markup) {
  await page.route("https://www.youtube.com/**", (route) => route.fulfill({
    contentType: "text/html; charset=utf-8", body: `<!doctype html><html><head><meta charset="utf-8"></head><body>${markup}</body></html>`,
  }));
  await page.goto("https://www.youtube.com/");
  await page.evaluate(() => {
    const listeners = [];
    window.chrome = { storage: {
      local: { get: async () => ({ enabled: true }) },
      onChanged: { addListener: (listener) => listeners.push(listener) },
    } };
    window.setBlocking = (enabled) => listeners.forEach((listener) => listener({ enabled: { newValue: enabled } }, "local"));
  });
  for (const stylesheet of manifest.content_scripts[0].css) {
    await page.addStyleTag({ path: path.join(root, stylesheet) });
  }
  for (const script of manifest.content_scripts[0].js) {
    await page.addScriptTag({ path: path.join(root, script) });
  }
}

test("manifest uses local scripts without extra permissions", () => {
  expect(manifest.manifest_version).toBe(3);
  expect(manifest.permissions).toEqual(["storage"]);
  expect(manifest.author).toBe("github.com/sorried");
  expect(manifest.homepage_url).toBe("https://github.com/sorried");
  expect(manifest.content_scripts[0].run_at).toBe("document_start");
  for (const filename of [...manifest.content_scripts[0].css, ...manifest.content_scripts[0].js]) {
    expect(fs.existsSync(path.join(root, filename))).toBe(true);
  }
});

test("loads the unpacked extension and injects scripts automatically", async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "disable-shorts-"));
  let context;
  try {
    context = await chromium.launchPersistentContext(profile, {
      channel: "chromium",
      headless: true,
      args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`],
    });
    await context.route("https://www.youtube.com/**", (route) => route.fulfill({
      contentType: "text/html",
      body: '<!doctype html><ytd-video-renderer id="blocked"><a href="/shorts/123">clip</a></ytd-video-renderer><a id="normal" href="/watch?v=123">video</a>',
    }));
    const page = await context.newPage();
    await page.goto("https://www.youtube.com/");
    await expect(page.locator("#blocked")).toBeHidden();
    await expect(page.locator("#normal")).toBeVisible();
    await page.goto("https://www.youtube.com/playables/123");
    await page.waitForURL("https://www.youtube.com/");
  } finally {
    if (context) await context.close();
    fs.rmSync(profile, { recursive: true, force: true });
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
    vm.runInNewContext(source, { location, document: events, window: events, shortsSettings: { enabled: true, ready: { then: (callback) => callback() } } });
    expect(redirects).toEqual(["/watch", "/gaming", "/shortstory"].includes(pathname) ? [] : ["/"]);
    location.pathname = "/shorts/next";
    for (const event of ["yt-navigate-finish", "yt-page-data-updated", "popstate"]) {
      const before = redirects.length;
      listeners[event]();
      expect(redirects.length).toBe(before + 1);
    }
  }
});

test("toggle restores content and filters new content when enabled again", async ({ page }) => {
  await openFixture(page, '<ytd-video-renderer id="clip"><a href="/shorts/1">clip</a></ytd-video-renderer><ytd-reel-shelf-renderer id="shelf">shorts</ytd-reel-shelf-renderer>');
  await expect(page.locator("#clip")).toBeHidden();
  await page.evaluate(() => window.setBlocking(false));
  await expect(page.locator("#clip")).toBeVisible();
  await expect(page.locator("#shelf")).toBeVisible();
  await page.evaluate(() => document.body.insertAdjacentHTML("beforeend", '<ytd-video-renderer id="new"><a href="/playables/1">game</a></ytd-video-renderer>'));
  await expect(page.locator("#new")).toBeVisible();
  await page.evaluate(() => window.setBlocking(true));
  await expect(page.locator("#clip")).toBeHidden();
  await expect(page.locator("#new")).toBeHidden();
  await expect(page.locator("#shelf")).toBeHidden();
});

test("hides modern search shelves and playable libraries without hiding regular results", async ({ page }) => {
  await openFixture(page, `
    <grid-shelf-view-model id="shorts-shelf"><h2>Shorts</h2><ytm-shorts-lockup-view-model-v2><ytm-shorts-lockup-view-model><a href="/shorts/1">clip</a></ytm-shorts-lockup-view-model></ytm-shorts-lockup-view-model-v2></grid-shelf-view-model>
    <ytd-rich-section-renderer id="games-shelf"><ytd-rich-shelf-renderer><h2>Игры в браузере</h2><ytd-rich-item-renderer><ytd-mini-game-card-view-model><mini-game-card-view-model><a href="/playables/1">Играть</a></mini-game-card-view-model></ytd-mini-game-card-view-model></ytd-rich-item-renderer></ytd-rich-shelf-renderer></ytd-rich-section-renderer>
    <ytd-shelf-renderer id="library"><h2>Ваша библиотека</h2><mini-game-card-view-model><button>Играть</button></mini-game-card-view-model></ytd-shelf-renderer>
    <ytd-rich-item-renderer id="game-card"><ytd-mini-game-card-view-model><mini-game-card-view-model><a href="/playables/2">game</a></mini-game-card-view-model></ytd-mini-game-card-view-model></ytd-rich-item-renderer>
    <ytd-guide-entry-renderer id="text-menu"><a role="link"><span>Shorts</span></a></ytd-guide-entry-renderer>
    <ytd-mini-guide-entry-renderer id="aria-menu"><a aria-label="Shorts" role="link"></a></ytd-mini-guide-entry-renderer>
    <ytd-video-renderer id="ordinary"><a href="/watch?v=1">Shorts</a></ytd-video-renderer>
    <ytd-shelf-renderer id="ordinary-shelf"><h2>Ваша библиотека</h2><ytd-video-renderer><a href="/watch?v=2">games review</a></ytd-video-renderer></ytd-shelf-renderer>
  `);
  for (const id of ["shorts-shelf", "games-shelf", "library", "game-card", "text-menu", "aria-menu"]) {
    await expect(page.locator(`#${id}`)).toBeHidden();
  }
  await expect(page.locator("#ordinary")).toBeVisible();
  await expect(page.locator("#ordinary-shelf")).toBeVisible();
});
