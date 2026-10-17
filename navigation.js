(() => {
  "use strict";

  function leaveBlockedPage() {
    if (/^\/(shorts|playables|playable)(\/|$)/i.test(location.pathname)
      || /^\/feed\/playables(\/|$)/i.test(location.pathname)
      || /^\/(?:@[^/]+|channel\/[^/]+|c\/[^/]+|user\/[^/]+)\/shorts\/?$/i.test(location.pathname)) {
      location.replace("/");
    }
  }

  leaveBlockedPage();
  document.addEventListener("yt-navigate-finish", leaveBlockedPage);
  document.addEventListener("yt-page-data-updated", leaveBlockedPage);
  window.addEventListener("popstate", leaveBlockedPage);
})();
