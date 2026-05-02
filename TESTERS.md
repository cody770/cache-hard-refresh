# Cache Hard Refresh — Tester Install Guide

Hi Sonya. This is a Safari extension that adds a toolbar button: click it on any tab and it nukes that site's cache, cookies, localStorage, IndexedDB, service workers, etc., then hard-reloads the page. A toast pops up showing what was cleared.

You don't have a paid Apple Developer account, and that's fine — Apple lets you sign and run extensions locally with a **free Apple ID**. The only catch is the signing certificate expires every 7 days, so you'll need to re-build in Xcode roughly once a week to keep it working. (No re-clone needed, just hit Cmd+R in Xcode again.)

## What you need

- M1 (or any Apple Silicon / Intel) Mac
- macOS recent enough to run current Xcode (Ventura or later is fine)
- **Xcode installed** (from the App Store, free) — not just Command Line Tools, the full Xcode app
- A **free Apple ID** signed into Xcode (Xcode → Settings → Accounts → `+` → Apple ID)
- Git installed (comes with Xcode Command Line Tools)

## Install

### 1. Clone the repo

```bash
cd ~  # or wherever you want it
git clone https://github.com/cody770/cache-hard-refresh.git
cd cache-hard-refresh
```

### 2. Generate the Xcode project

The repo contains the web extension source, but the Xcode project has to be generated from it by Apple's converter tool (which ships inside Xcode):

```bash
/Applications/Xcode.app/Contents/Developer/usr/bin/safari-web-extension-converter ./extension \
  --project-location ./xcode \
  --app-name "Cache Hard Refresh" \
  --bundle-identifier "com.timmclay.cachehardrefresh" \
  --swift --macos-only --copy-resources --no-open --no-prompt --force
```

### 3. Fix a known converter quirk

The converter writes inconsistent bundle IDs which makes the build fail. One sed fixes it:

```bash
sed -i '' 's/com\.timmclay\.Cache-Hard-Refresh/com.timmclay.cachehardrefresh/g' \
  "xcode/Cache Hard Refresh/Cache Hard Refresh.xcodeproj/project.pbxproj"
```

### 4. Apply the custom container app UI

The converter generates a default placeholder UI for the host app. We have our own:

```bash
./apply-container.sh
```

### 5. Open in Xcode

```bash
open "xcode/Cache Hard Refresh/Cache Hard Refresh.xcodeproj"
```

### 6. Set signing to your Apple ID — on BOTH targets

In Xcode's left sidebar, click the blue project icon at the top ("Cache Hard Refresh"). Then in the middle pane:

1. Select the target **Cache Hard Refresh** (the host app) → tab **Signing & Capabilities**
   - **Team:** pick your name (Personal Team) from the dropdown
   - "Automatically manage signing" should already be ticked

2. Now select the target **Cache Hard Refresh Extension** → tab **Signing & Capabilities**
   - **Team:** same Personal Team
   - You may need to change the **Bundle Identifier** if Xcode complains it's taken — try `com.yourname.cachehardrefresh.Extension` and then update the parent app's bundle ID to `com.yourname.cachehardrefresh` to match.

If Xcode says "Failed to register bundle identifier", that just means someone (probably me) already used that ID on the Apple developer servers. Change both bundle IDs to use your own name as above.

### 7. Build and run

Hit **Cmd+R**. Xcode builds the host app and launches it. A small window will appear explaining what the extension does. You can close it.

### 8. Enable the extension in Safari

1. Open Safari
2. **Safari menu → Settings → Advanced** → tick **"Show Develop menu in menu bar"** (if not already)
3. **Develop menu → Allow Unsigned Extensions** (you'll need to do this every time you restart Safari — it's a security thing)
4. **Safari → Settings → Extensions** → tick **Cache Hard Refresh**
5. It'll ask about permissions ("can read and modify all webpages"). Allow it. The extension only actually does anything when you explicitly click its button, but Safari has to ask up front because the cookies API needs broad permission.

You should now see a small refresh icon in Safari's toolbar. If you don't, right-click the toolbar → Customize Toolbar → drag it on.

### 9. Try it

- Visit any site you want to clear (gmail, your bank, a dev site, whatever)
- Click the toolbar icon
- The page hard-reloads and a dark toast slides in from the top showing what got cleared
- Confirm you got logged out (cookies cleared) or that a stale cached file is now fresh

## When things go wrong

**"Could not launch — operation not permitted"** on first run: System Settings → Privacy & Security → scroll down → click "Open Anyway" next to the blocked app.

**Extension shows in Safari but button does nothing:** check the "Allow Unsigned Extensions" toggle is still on — Safari resets it on every relaunch.

**After 7 days, button stops working / Safari won't load it:** the free signing cert has expired. Just open the Xcode project again and Cmd+R. That re-signs and re-installs.

**Bundle ID errors during build:** mentioned above — pick unique IDs using your own name.

## Reporting issues

Please send Tim:
- What site you were on
- What you clicked
- What happened vs. what you expected
- A screenshot if there's anything visible
- If you're feeling thorough: Safari → Develop → Web Inspector → Console (any red errors?)

## What's actually in this folder

- `extension/` — the web extension itself (the JavaScript that does the clearing)
- `container/` — the small "host app" UI that wraps the extension
- `xcode/` — generated Xcode project (gets recreated by step 2 above)
- `CLAUDE.md` — architecture notes, mostly for Claude Code
- `TESTERS-CLAUDE.md` — instructions for **your** Claude Code if you want it to help with any of this

If you have Claude Code installed and want it to walk you through this or troubleshoot, point it at `TESTERS-CLAUDE.md`.
