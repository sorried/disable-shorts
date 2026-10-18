# disable shorts

[русский](README.md) | [english](README.en.md)

a browser extension that hides youtube shorts and built-in playables. no build step or background process for installation. version `1.0.0.1`.

developer: [github.com/sorried](https://github.com/sorried).

## browsers

| desktop browser | build and status |
| --- | --- |
| google chrome, chromium | `chromium.zip`, unpacked installation; automated integration test in chromium |
| microsoft edge | chromium build; not individually tested in edge |
| brave | chromium build; not individually tested in brave |
| opera, opera gx | chromium build; not individually tested in opera |
| vivaldi | chromium build; not individually tested in vivaldi |
| yandex browser | chromium build only where unpacked installation is available; installation is not guaranteed |
| firefox 142+ | separate firefox build and api support; unsigned, temporary installation only |
| safari | no installable build; requires a separate application packaged using xcode on macos |

use a current stable browser. the minimum chromium engine version is 105. shared engine compatibility does not mean every listed browser has been tested. managed browser policies may block sideloading. mobile browsers and the youtube app are outside this release's support.

## download and install

you need google chrome 105 or later on a computer. chrome on phones does not support installing this extension. you do not need node.js, npm or any development tools to install it.

1. open the [v1.0.0.1 release](https://github.com/sorried/disable-shorts/releases/tag/v1.0.0.1).
2. expand **assets** near the bottom of the page if needed. download `disable-shorts-v1.0.0.1-chromium.zip` for chrome, edge, brave, opera or vivaldi. choose `disable-shorts-v1.0.0.1-firefox.zip` for firefox. do not use the `Source code` archives.
3. find the downloaded zip in your downloads folder. right-click it and choose your system's extract option, such as "Extract All". opening the zip as a folder is not enough.
4. move the extracted folder somewhere permanent, such as your documents folder. do not delete it after installation: chrome loads the extension from that folder.
5. open a new chrome tab, type `chrome://extensions` in the address bar and press enter.
6. turn on "Developer mode" in the top-right corner.
7. click "Load unpacked". select the extracted folder containing `manifest.json` directly inside it, then confirm. select the folder, not the manifest file itself.
8. check that `disable shorts and playables`, version `1.0.0.1`, appears and its switch is on.
9. reload your open youtube tabs. shorts and built-in games should disappear.

if chrome says the manifest is missing, check the folder you selected. `manifest.json` must be directly inside it, not inside another nested folder.

## other chromium browsers

download and extract the chromium archive first. open the appropriate address in your browser:

| browser | address |
| --- | --- |
| microsoft edge | `edge://extensions` |
| brave | `brave://extensions` |
| opera and opera gx | `opera://extensions` |
| vivaldi | `vivaldi://extensions` |
| yandex browser | `browser://extensions` |

1. open the address listed above.
2. enable "Developer mode".
3. click "Load unpacked" and select the extracted folder containing `manifest.json`.
4. check that the extension is enabled and reload youtube tabs.

yandex's official installation guidance focuses on the chrome and opera catalogs and also documents crx3 packages. this release has neither a crx3 package nor a store listing. if your browser has no unpacked installation button or blocks the extension, this installation route is unavailable in your version. do not disable browser security to install it; use another browser from the table.

## firefox

1. download `disable-shorts-v1.0.0.1-firefox.zip` and extract it into a separate folder. do not use the chromium build.
2. in firefox 142 or later, open `about:debugging#/runtime/this-firefox`.
3. click "Load Temporary Add-on".
4. select `manifest.json` inside the extracted firefox folder.
5. allow access to youtube if requested. if needed, open `about:addons`, select the extension and check its website permissions.
6. reload youtube. open the popup through firefox's extensions button.

temporary add-ons are removed when firefox restarts; load it again after restarting. permanent installation in regular firefox requires mozilla signing, which is not included in this release. do not disable signature checks. scripts and css are tested in the firefox engine using fixtures, but the full firefox add-on installation is not covered by automated integration tests.

## safari

the release zip cannot be installed as a safari extension. apple requires packaging the web extension inside an application using xcode. no signed application is provided, so safari is currently unsupported. chromium and firefox installation steps do not apply.

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
npx playwright install chromium firefox
npm run check
npm test
npm run package
```

tests cover filtering, lazy loading, recycled cards, navigation, popup settings and icons. an integration test loads the actual unpacked extension in chromium. automated tests use local fixtures rather than a signed-in youtube account.

license: `GPL-3.0-only`. see `LICENSE`.

## installation references

- [edge sideloading](https://learn.microsoft.com/en-us/microsoft-edge/extensions/getting-started/extension-sideloading).
- [opera developer mode](https://dev.opera.com/extensions/testing/).
- [vivaldi extensions](https://help.vivaldi.com/desktop/appearance-customization/extensions/).
- [yandex extensions and installation restrictions](https://yandex.com/support/browser/en/personalization/extension.html).
- [firefox temporary installation](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/).
- [safari web extension packaging](https://developer.apple.com/documentation/safariservices/packaging-a-web-extension-for-safari).
