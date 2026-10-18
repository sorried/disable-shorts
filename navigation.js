(() => {
  "use strict";

  function redirect() {
    if (shortsSettings.enabled && shortsSettings.blockedpath(location.pathname)) {
      location.replace("/");
    }
  }

  shortsSettings.ready.then(redirect);
  document.addEventListener("disable-shorts-settings", redirect);
  document.addEventListener("yt-navigate-finish", redirect);
  document.addEventListener("yt-page-data-updated", redirect);
  window.addEventListener("popstate", redirect);
})();
