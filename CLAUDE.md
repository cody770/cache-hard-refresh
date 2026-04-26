# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A Safari Web Extension (macOS) that adds a toolbar button. Click → clears all per-origin site data for the active tab (localStorage, sessionStorage, Cache Storage, service worker registrations, IndexedDB databases, all cookies including HttpOnly via the `cookies` API), hard-reloads via `tabs.reload({ bypassCache: true })`, and after reload injects a Shadow-DOM toast with per-category counts. Manifest V3, Swift host app, http/https only.

## Three-layer architecture

The repo has three distinct source layers; edits to one don't automatically reach the build:

1. **`extension/`** — canonical web extension source (manifest.json, background.js, icons/). This is what you edit when changing extension behavior.
2. **`container/`** — canonical host-app UI source (Main.html, Style.css, Script.js, ViewController.swift). The host app is the macOS app the user installs from the App Store; opening it is what enables the extension in Safari. Our version is a privacy/permissions explainer screen, not the default Xcode template. `ViewController.swift` adds a `data-external` link handler that opens `http(s)://` links via `NSWorkspace` instead of inside the WKWebView.
3. **`xcode/Cache Hard Refresh/`** — generated Xcode project. Two targets: `Cache Hard Refresh` (container app) and `Cache Hard Refresh Extension` (the actual extension; `SafariWebExtensionHandler.swift` is the Safari↔WebExtension bridge).

**Source-of-truth flow:** the converter generates the Xcode project and copies `extension/` into the extension target's resources. It does NOT know about `container/` — it lays down its own default container UI which `apply-container.sh` then overwrites with our canonical version. Order matters:

```
1. edit extension/ and/or container/
2. ./safari-web-extension-converter ... --force        (regenerates xcode/)
3. sed bundle-id fix                                    (see "Known converter quirks")
4. ./apply-container.sh                                 (overlays container/ files)
5. xcodebuild ...                                       (verify) or open in Xcode
```

If you only edited `container/` and didn't touch `extension/` or `manifest.json`, you can skip 2 and 3 and just run 4.

## Common commands

Regenerate icons (after editing `make_icons.py`):
```bash
python3 make_icons.py
```

Rebuild the Xcode project from `extension/` (overwrites `xcode/`):
```bash
/Applications/Xcode.app/Contents/Developer/usr/bin/safari-web-extension-converter ./extension \
  --project-location ./xcode \
  --app-name "Cache Hard Refresh" \
  --bundle-identifier "com.timmclay.cachehardrefresh" \
  --swift --macos-only --copy-resources --no-open --no-prompt --force
```
Note: `xcrun safari-web-extension-converter` does not resolve on this machine — call the binary by full path.

Build without signing (sanity-check that it compiles):
```bash
cd "xcode/Cache Hard Refresh" && \
xcodebuild -project "Cache Hard Refresh.xcodeproj" -scheme "Cache Hard Refresh" \
  -configuration Debug -destination 'platform=macOS' \
  CODE_SIGN_IDENTITY="-" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO build
```

Apply the canonical container UI after running the converter:
```bash
./apply-container.sh
```

Open in Xcode for signed builds / running:
```bash
open "xcode/Cache Hard Refresh/Cache Hard Refresh.xcodeproj"
```

## App Store submission

`PRIVACY.md` is the privacy policy text — must be hosted at a public URL before submission. `STORE-LISTING.md` is the playbook for the App Store Connect form (App Privacy answer is "Data Not Collected", description copy, App Review notes pre-empting the broad host-permission concern, etc.). The `data-external` placeholder URLs in `container/Main.html` need updating to the real hosted URLs and `apply-container.sh` re-run before submission.

## Known converter quirks

**Bundle ID mismatch on every re-run.** The converter sets the parent app's `PRODUCT_BUNDLE_IDENTIFIER` from the *app name* (→ `com.timmclay.Cache-Hard-Refresh`) but the extension target from `--bundle-identifier` (→ `com.timmclay.cachehardrefresh.Extension`). The extension's bundle ID must be prefixed with the parent app's, so the build fails with *"Embedded binary's bundle identifier is not prefixed with the parent app's bundle identifier"*. Fix after every re-run:
```bash
sed -i '' 's/com\.timmclay\.Cache-Hard-Refresh/com.timmclay.cachehardrefresh/g' \
  "xcode/Cache Hard Refresh/Cache Hard Refresh.xcodeproj/project.pbxproj"
```

**`browsingData` is genuinely unsupported in Safari MV3 service workers.** The converter's warning is correct — verified 2026-04-25. `browser.browsingData` and `chrome.browsingData` are both `undefined` inside the SW; calling `removeCache()` throws `undefined is not an object`. Don't use the `browsingData` API at all in this codebase. The current implementation does per-origin clearing via `scripting.executeScript` (storage / caches / service workers / IndexedDB) plus the `cookies` API for HttpOnly cookies, then `tabs.reload({bypassCache:true})` for the HTTP cache bust. This needs `host_permissions: ["http://*/*", "https://*/*"]` because the `cookies` API doesn't honor `activeTab`.

## iCloud caveat

`~/claude` is a symlink into iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/claude`). The `extension/` source is fine in iCloud, but Xcode's build artifacts (DerivedData lives outside the repo by default — good) and the `.xcodeproj` itself can occasionally churn under iCloud sync. If builds start behaving oddly, move `xcode/` outside iCloud and re-open.

## Running it in Safari

Set the signing team on **both** targets in Xcode → Signing & Capabilities, then Cmd+R to build and launch the host app once (this registers the extension with Safari). Then in Safari: enable Develop menu → Settings → Extensions → enable *Cache Hard Refresh*. Unsigned builds also work if Develop → Allow Unsigned Extensions is on.
