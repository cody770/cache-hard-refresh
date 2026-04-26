# Privacy Policy — Cache Clear & Hard Refresh

_Last updated: 2026-04-25_

## Short version

This Safari extension does not collect, transmit, store, or share any personal data. It has no servers, no analytics, no telemetry, and no remote network calls of its own. Everything it does happens locally on your device.

## What the extension does

When you click its toolbar button, it operates only on the active tab:

- Reads counts of locally-stored data on that page (localStorage keys, sessionStorage keys, Cache Storage entries, service worker registrations, IndexedDB databases, cookies)
- Deletes that data from your local browser storage for that one site's origin
- Asks Safari to reload the tab, bypassing the HTTP cache
- Displays an in-page toast summarising what was cleared

All of this happens inside Safari on your machine. The extension never sends any of this information anywhere.

## Why the extension requests "all websites" access

Apple's WebExtension `cookies` API does not support per-site scoping at the manifest level — declaring access for any site requires declaring access for all sites. This is a platform constraint, not a design choice. The extension's code only ever reads or modifies storage on the specific tab whose toolbar button you clicked. It does not run continuously, does not observe browsing activity, and does not access pages you have not interacted with.

## Data we collect

None.

- No accounts, no sign-in, no identifiers
- No analytics or usage metrics
- No crash reporting
- No advertising identifiers
- No outbound network requests of any kind from the extension

## Data we share

None. There is no data to share.

## Permissions used (for transparency)

- `activeTab` — interact with the tab when its toolbar button is clicked
- `scripting` — inject the small storage-clearing routine and the result toast into that tab
- `cookies` — delete cookies for that site (including HttpOnly cookies)
- `host_permissions: http://*/*, https://*/*` — required for the `cookies` API to function (see "Why all websites access" above)

## Source code

The extension's source code is publicly available so you can verify these claims yourself: <https://github.com/cody770/cache-hard-refresh>

## Contact

Questions about this policy: tim.4@icloud.com

## Changes

If we ever change this policy in a way that affects what the extension does or what data it touches, we will update the "Last updated" date and explain the change in this document.
