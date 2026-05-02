# For Sonya's Claude Code — Helping Install Cache Hard Refresh

You are helping Sonya install a Safari Web Extension on her Mac (M1, free Apple ID, no paid Developer account). The full human-facing guide is in `TESTERS.md`. This file tells you what you can do for her, what you can't, and what to watch out for.

## What this project is

A Safari Web Extension that clears per-site browser data (cookies, localStorage, IndexedDB, Cache Storage, service workers) and hard-reloads the active tab. Manifest V3, Swift host app, macOS only. Detailed architecture is in `CLAUDE.md`.

## What you can do for Sonya

You can run all the build/setup commands in `TESTERS.md` steps 1–4 directly:

1. Clone the repo into a sensible location (ask her where, default `~/cache-hard-refresh`)
2. Run the `safari-web-extension-converter` command (it's a CLI tool inside Xcode at `/Applications/Xcode.app/Contents/Developer/usr/bin/safari-web-extension-converter`)
3. Run the `sed` bundle-ID fix
4. Run `./apply-container.sh`
5. Open the `.xcodeproj` in Xcode for her

You can also do a sanity-check unsigned build to confirm it compiles before she touches Xcode:

```bash
cd "xcode/Cache Hard Refresh" && \
xcodebuild -project "Cache Hard Refresh.xcodeproj" -scheme "Cache Hard Refresh" \
  -configuration Debug -destination 'platform=macOS' \
  CODE_SIGN_IDENTITY="-" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO build
```

If that succeeds, the project is healthy and the only remaining steps are signing (her Apple ID in Xcode) and Safari toggling — both of which require her hands on the GUI.

## What you can NOT do

- **Set the signing team** — that's an Xcode GUI dropdown that needs her Apple ID. Walk her through step 6 of `TESTERS.md`.
- **Click Cmd+R in Xcode** — has to be her, will trigger an Apple ID password prompt the first time.
- **Toggle anything in Safari Settings** — she has to enable Develop menu, Allow Unsigned Extensions, and tick the extension in the Extensions tab herself.
- **Accept the "Open Anyway" Gatekeeper prompt** — System Settings GUI, her hands.

## Common failure modes & fixes

**`safari-web-extension-converter: command not found`**
She doesn't have Xcode (full app) installed, only Command Line Tools. Tell her to install Xcode from the App Store.

**Build fails with "Embedded binary's bundle identifier is not prefixed with the parent app's"**
She skipped or mis-ran the `sed` step. Re-run step 3 of `TESTERS.md`.

**Build fails with "Failed to register bundle identifier"**
The bundle ID `com.timmclay.cachehardrefresh` is taken on Apple's developer servers (because Tim already used it). She needs to change both targets' bundle IDs to use her own name, e.g. `com.sonya.cachehardrefresh` and `com.sonya.cachehardrefresh.Extension`. The extension target's ID **must** be prefixed with the parent app's ID.

To do this from the command line you can edit `xcode/Cache Hard Refresh/Cache Hard Refresh.xcodeproj/project.pbxproj` and replace both bundle IDs (parent app first, then extension), but it's safer for her to do it in Xcode's Signing & Capabilities tab so Xcode can register the new IDs with her Apple ID.

**`xcodebuild` complains about iCloud / file moved while building**
The repo is sometimes cloned into iCloud Drive. Move the clone to `~/Sites/` or `~/Developer/` (somewhere outside iCloud) and try again.

**Extension installed but button doesn't appear**
Right-click Safari toolbar → Customize Toolbar → drag the icon onto the toolbar.

**Worked yesterday, doesn't work today (specifically after 7 days)**
Free Apple ID signing certs expire after 7 days. Re-open the Xcode project and Cmd+R to re-sign. No re-clone needed.

## Reporting back to Tim

If you hit a bug in the extension itself (not the install), capture:

- Output of `git rev-parse HEAD` (which commit she's on)
- Safari version (`Safari → About Safari`)
- macOS version (`sw_vers`)
- Console errors from Safari → Develop → Web Inspector → Console
- What URL, what she clicked, what happened

Send those to Tim along with a one-paragraph description.

## Don't

- Don't modify files in `extension/`, `container/`, or anywhere else in the repo unless Sonya explicitly asks you to fix something. This is Tim's code.
- Don't create a git commit, push, or open a PR. She doesn't have write access and shouldn't.
- Don't delete `xcode/` and re-run the converter once she's already signed and built it — that wipes her signing config. Only re-run the converter if `extension/` source actually changed (e.g. Tim sends an update).
- Don't run `./apply-container.sh` after she's signed and built — same reason. Container changes require re-applying signing config.

## If Tim ships an update

She'll `git pull`, then re-run steps 2–4 of `TESTERS.md`, then re-open Xcode, re-set the signing team on both targets (it gets reset), and Cmd+R.
