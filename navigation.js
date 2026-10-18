(() => {
  "use strict";

  function leaveBlockedPage() {
    if (!shortsSettings.enabled) return;
    if (/^\/(shorts|playables|playable)(\/|$)/i.test(location.pathname)
      || /^\/feed\/playables(\/|$)/i.test(location.pathname)
      || /^\/(?:@[^/]+|channel\/[^/]+|c\/[^/]+|user\/[^/]+)\/shorts\/?$/i.test(location.pathname)) {
      location.replace("/");
    }
  }

  shortsSettings.ready.then(leaveBlockedPage);
  document.addEventListener("disable-shorts-settings", leaveBlockedPage);
  document.addEventListener("yt-navigate-finish", leaveBlockedPage);
  document.addEventListener("yt-page-data-updated", leaveBlockedPage);
  window.addEventListener("popstate", leaveBlockedPage);
})();
