(() => {
  "use strict";

  const hiddenAttribute = "data-disable-shorts-hidden";
  const containers = [
    "ytd-guide-entry-renderer", "ytd-mini-guide-entry-renderer",
    "ytd-video-renderer", "ytd-grid-video-renderer", "ytd-compact-video-renderer",
    "ytd-rich-grid-media", "yt-lockup-view-model", "yt-shorts-lockup-view-model",
    "ytm-shorts-lockup-view-model", "ytd-reel-item-renderer",
    "ytm-video-with-context-renderer", "ytm-compact-video-renderer",
    "ytm-pivot-bar-item-renderer", "yt-tab-shape", "tp-yt-paper-tab",
    "ytm-tab-renderer", "ytd-playable-item-renderer",
    "ytm-shorts-lockup-view-model-v2", "ytd-mini-game-card-view-model", "mini-game-card-view-model"
  ].join(",");
  const navigation = "ytd-guide-entry-renderer,ytd-mini-guide-entry-renderer,ytm-pivot-bar-item-renderer,yt-tab-shape,tp-yt-paper-tab,ytm-tab-renderer";
  const navigationLabel = /^(shorts|playables|шортсы|игры в браузере|мини-игры)$/i;

  function blockedLink(anchor) {
    let url;
    try {
      url = new URL(anchor.getAttribute("href"), location.href);
    } catch {
      return false;
    }
    if (!["www.youtube.com", "m.youtube.com", "youtube.com"].includes(url.hostname)) {
      return false;
    }
    return /^\/(shorts|playables|playable)(\/|$)/i.test(url.pathname)
      || /^\/feed\/playables(\/|$)/i.test(url.pathname)
      || /^\/(?:@[^/]+|channel\/[^/]+|c\/[^/]+|user\/[^/]+)\/shorts\/?$/i.test(url.pathname);
  }

  function clean(root) {
    if (!shortsSettings.enabled) return;
    const candidates = new Set(root.querySelectorAll(`[${hiddenAttribute}]`));
    for (const entry of root.querySelectorAll(navigation)) candidates.add(entry);
    if (root.matches?.(navigation)) candidates.add(root);
    const anchors = [...root.querySelectorAll("a[href]")];
    if (root.matches?.("a[href]")) anchors.push(root);
    if (root.hasAttribute?.(hiddenAttribute)) candidates.add(root);
    const parentCard = root.closest?.(containers);
    if (parentCard) candidates.add(parentCard.closest("ytd-rich-item-renderer") || parentCard);

    for (const anchor of anchors) {
      const card = anchor.closest(containers);
      candidates.add(card?.closest("ytd-rich-item-renderer") || card || anchor);
    }
    for (const candidate of candidates) {
      const links = candidate.matches("a[href]")
        ? [candidate] : candidate.querySelectorAll("a[href]");
      const blockedNavigation = candidate.matches(navigation) && (
        navigationLabel.test(candidate.textContent.trim())
        || [...candidate.querySelectorAll("[title],[aria-label]")].some((element) =>
          navigationLabel.test(element.getAttribute("title") || "")
          || navigationLabel.test(element.getAttribute("aria-label") || ""))
      );
      candidate.toggleAttribute(hiddenAttribute, blockedNavigation || [...links].some(blockedLink));
    }
  }

  const pending = new Set();
  let scheduled = false;
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "characterData") pending.add(mutation.target.parentElement);
      else if (mutation.type === "attributes") pending.add(mutation.target);
      else {
        pending.add(mutation.target);
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) pending.add(node);
        }
      }
    }
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        for (const root of pending) {
          if (root?.isConnected) clean(root);
        }
        pending.clear();
      });
    }
  });
  observer.observe(document, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["href", "title", "aria-label"] });
  clean(document);
  document.addEventListener("disable-shorts-settings", () => clean(document));
})();
