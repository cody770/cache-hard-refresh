# App Store Connect submission notes

This file documents what to enter for each App Store Connect field when submitting *Cache Clear & Hard Refresh* to the Mac App Store. It exists so the submission story stays consistent with `PRIVACY.md` and the in-app explainer.

## App Privacy ("nutrition label")

Apple asks "Do you or your third-party partners collect data from this app?"

Answer: **No, we do not collect data from this app.**

That single answer skips the entire questionnaire. It is honest because the extension genuinely makes no network calls and stores no user data outside the user's own browser. If a future version ever adds telemetry, this answer must change.

## Privacy Policy URL (required)

Live at: **https://cody770.github.io/cache-hard-refresh/PRIVACY**

This is what goes in App Store Connect → App Information → Privacy Policy URL. The page is rendered from `PRIVACY.md` at the repo root via GitHub Pages with the minimal Jekyll theme (`_config.yml`). To regenerate after edits: commit + push to `main`, Pages rebuilds automatically (~1 min).

## Description (suggested)

> A toolbar button for Safari that clears the current site's data and hard-reloads the tab — in one click.
>
> Click the button on any page. The extension clears that site's storage (localStorage, sessionStorage, Cache Storage, service workers, IndexedDB) and all of its cookies — including HttpOnly authentication cookies that pages can't normally clear themselves — then hard-reloads the tab. A small toast on the page tells you exactly what was cleared.
>
> Useful for: web developers debugging cache issues, anyone troubleshooting a site that's stuck on stale content, signing out of a site cleanly, or verifying a fresh-visitor experience.
>
> Privacy: the extension collects nothing. No analytics, no telemetry, no servers, no network calls. Everything happens locally in Safari on your Mac. The "all websites" permission Safari prompts for is required by Apple's cookies API at the manifest level — the code only ever touches the tab whose toolbar button you click. The full source is published; you can verify this yourself.

## Why the user sees an "all websites" permission prompt — script for the review notes

App Review reviewers occasionally flag broad host permissions. Pre-empt by adding this to **App Review Information → Notes**:

> The `host_permissions: ["http://*/*", "https://*/*"]` declaration is required because Apple's `chrome.cookies` / `browser.cookies` API does not support per-site scope at manifest declaration time. The extension only invokes the cookies API on the URL of the tab the user has explicitly clicked the toolbar button on (see `extension/background.js`, `action.onClicked` handler). It does not enumerate cookies for other sites, observe browsing activity, or run any code in tabs the user has not interacted with. There is no background or content-script activity outside of the click handler.

## Categories / keywords

- Primary category: Developer Tools
- Secondary: Utilities
- Keywords: cache, hard refresh, clear cookies, web developer, safari extension, storage, devtools

## Screenshots

App Store requires Mac app screenshots (1280×800 or 1440×900). Capture:
1. The container app window showing the explainer and "Extension is on" status
2. A web page with the toast visible after a click (use a real site so reviewers can see authentic counts)
3. Optional: Safari's toolbar with the extension icon visible

## Pricing

Free, no in-app purchases. Anything else would contradict the "no servers, no data" story.
