# disable shorts

[русский](README.md) | [english](README.en.md)

a chrome extension that hides youtube shorts and built-in playables. no build step or background process. version `1.0.0`.

developer: [github.com/sorried](https://github.com/sorried).

## download and install

you need google chrome 105 or later on a computer. chrome on phones does not support installing this extension. you do not need node.js, npm or any development tools to install it.

1. open the [v1.0.0 release](https://github.com/sorried/disable-shorts/releases/tag/v1.0.0).
2. expand **assets** near the bottom of the page if needed. click `disable-shorts-v1.0.0.zip`, not either of the `Source code` archives.
3. find the downloaded zip in your downloads folder. right-click it and choose your system's extract option, such as "Extract All". opening the zip as a folder is not enough.
4. move the extracted folder somewhere permanent, such as your documents folder. do not delete it after installation: chrome loads the extension from that folder.
5. open a new chrome tab, type `chrome://extensions` in the address bar and press enter.
6. turn on "Developer mode" in the top-right corner.
7. click "Load unpacked". select the extracted folder containing `manifest.json` directly inside it, then confirm. select the folder, not the manifest file itself.
8. check that `disable shorts and playables`, version `1.0.0`, appears and its switch is on.
9. reload your open youtube tabs. shorts and built-in games should disappear.

if chrome says the manifest is missing, check the folder you selected. `manifest.json` must be directly inside it, not inside another nested folder.

## turn it on or off

click the puzzle icon next to chrome's address bar, then select `disable shorts and playables`. click the pin beside its name to keep its icon visible in the toolbar.

the black-and-white popup has one switch labeled «скрывать shorts и игры» (hide shorts and games). «включено» means on; «выключено» means off. blocking is on by default. your choice is stored locally and applies to open youtube tabs without reloading.

turning it off restores hidden elements and disables redirects. it cannot take you back to a page that has already redirected to youtube's homepage.

## what it hides

- shorts and playables shelves, including supported search shelves and game libraries.
- entries in expanded and compact navigation menus.
- supported cards in search, recommendations, subscriptions and channel tabs.
- content loaded while scrolling or navigating without a full page reload.

direct visits to `/shorts`, `/playables`, `/playable`, `/feed/playables` and channel shorts tabs redirect to the homepage when blocking is enabled.

regular videos, including videos about games, stay visible. a short video using a `/watch` link is not hidden just because of its duration or title. link matching works across languages; navigation entries without links have additional english and russian label matching.

youtube changes its markup and runs experiments. new layouts may need selector updates. not every layout or signed-in account variant has been tested.

## update or remove

download a newer release, extract it and replace the files in the same installation folder. open `chrome://extensions`, click the reload icon on the extension's card and reload youtube tabs. replacing files alone does not restart scripts already running in a tab.

to uninstall, click "Remove" on the extension's card at `chrome://extensions`.

## privacy

the extension runs only on `youtube.com`, `www.youtube.com` and `m.youtube.com` over https. it sends no requests and collects no analytics. the `storage` permission saves only the on/off setting locally. chrome gives its content scripts access to these sites so they can hide elements.

## development

node.js 20 or later is required for development only:

```sh
npm ci
npx playwright install chromium
npm run check
npm test
```

tests cover filtering, lazy loading, recycled cards, navigation, popup settings and icons. an integration test loads the actual unpacked extension in chromium. automated tests use local fixtures rather than a signed-in youtube account.

license: `GPL-3.0-only`. see `LICENSE`.
