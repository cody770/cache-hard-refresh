# Cache Clear & Hard Refresh

A Safari Web Extension (macOS) that adds a toolbar button to clear the active site's data and hard-reload the tab.

One click clears, for the current site only:

- localStorage
- sessionStorage
- Cache Storage
- Service worker registrations
- IndexedDB databases
- Cookies (including HttpOnly authentication cookies)

…then triggers a hard refresh that bypasses Safari's HTTP cache. A toast appears in the page summarising exactly what was cleared.

## Privacy

This extension collects no data. No analytics, no telemetry, no remote network calls. Everything happens locally in your browser.

The "all websites" permission Safari requests is a platform constraint — the WebExtension cookies API does not support per-site scope at install time. The extension code only ever runs on the tab whose toolbar button you've explicitly clicked. Read the source to verify.

Full privacy policy: [PRIVACY.md](PRIVACY.md)

## Trying it out

If you just want to install and use it (no paid Apple Developer account needed), see [TESTERS.md](TESTERS.md) for a step-by-step install guide using a free Apple ID. If you have Claude Code, point it at [TESTERS-CLAUDE.md](TESTERS-CLAUDE.md) and it can run most of the setup for you.

## Building

Requires macOS with Xcode installed.

```bash
# 1. Generate the Xcode project from the web extension source
/Applications/Xcode.app/Contents/Developer/usr/bin/safari-web-extension-converter ./extension \
  --project-location ./xcode \
  --app-name "Cache Hard Refresh" \
  --bundle-identifier "com.timmclay.cachehardrefresh" \
  --swift --macos-only --copy-resources --no-open --no-prompt --force

# 2. Fix the bundle ID mismatch the converter introduces (parent app vs extension)
sed -i '' 's/com\.timmclay\.Cache-Hard-Refresh/com.timmclay.cachehardrefresh/g' \
  "xcode/Cache Hard Refresh/Cache Hard Refresh.xcodeproj/project.pbxproj"

# 3. Apply the custom container app UI on top of the converter's defaults
./apply-container.sh

# 4. Open in Xcode, set your signing team on both targets, Cmd+R
open "xcode/Cache Hard Refresh/Cache Hard Refresh.xcodeproj"
```

See [CLAUDE.md](CLAUDE.md) for the full architecture overview, and [STORE-LISTING.md](STORE-LISTING.md) for App Store submission notes.

## License

[MIT](LICENSE)
