const extensionApi = typeof browser !== "undefined" ? browser : chrome;
const shortsSettings = {
  enabled: false,
  ready: null,
  blockedpath(pathname) {
    return /^\/(shorts|playables|playable)(\/|$)/i.test(pathname)
      || /^\/feed\/playables(\/|$)/i.test(pathname)
      || /^\/(?:@[^/]+|channel\/[^/]+|c\/[^/]+|user\/[^/]+)\/shorts\/?$/i.test(pathname);
  },
};

(() => {
  let revision = 0;
  function apply(enabled) {
    shortsSettings.enabled = enabled !== false;
    document.documentElement?.toggleAttribute("data-disable-shorts-enabled", shortsSettings.enabled);
    document.dispatchEvent(new Event("disable-shorts-settings"));
  }
  extensionApi.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.enabled) {
      revision++;
      apply(changes.enabled.newValue);
    }
  });
  shortsSettings.ready = extensionApi.storage.local.get({ enabled: true }).then((settings) => {
    if (revision === 0) apply(settings.enabled);
  }).catch((error) => {
    console.error("Could not load extension settings", error);
    if (revision === 0) apply(true);
  });
  document.addEventListener("DOMContentLoaded", () => {
    document.documentElement.toggleAttribute("data-disable-shorts-enabled", shortsSettings.enabled);
  }, { once: true });
})();
