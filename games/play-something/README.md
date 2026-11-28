# Games Hub

260+ free card, casino, puzzle, word and arcade games in a single offline app. No sign-up, no ads, no tracking — data stays on the device.

## Publish (5 minutes)
1. Create a GitHub repo named **games-hub** (if you pick another name, search for `jackrose2029/games-hub` in `index.html` and replace it with `YOUR-USER/YOUR-REPO`; it appears once, in the Download links).
2. Upload everything in this folder (keep `.github/` and `.nojekyll`).
3. **Settings → Pages → Source: GitHub Actions.** The *Deploy site* workflow publishes `https://YOUR-USER.github.io/games-hub/`.
4. iPhone and Android users can install straight from that page (PWA, works offline).

## Build the downloadable apps
Push a version tag — GitHub builds everything and attaches it to a Release:
```
git tag v1.0.0 && git push origin v1.0.0
```
(or run **Build apps and release** manually from the Actions tab).

| Platform | Release file | How |
|---|---|---|
| Windows | `GamesHub-Windows.exe` | Electron + NSIS |
| macOS | `GamesHub-Mac.dmg` | Electron (unsigned) |
| Linux | `GamesHub-Linux.AppImage` | Electron |
| Android | `GamesHub-Android.apk` | Capacitor (debug-signed, installable) |
| iPhone / iPad | — | Safari → Share → Add to Home Screen (PWA) |

The in-app **ℹ️ → Get the app** tab (also **Settings → Download apps**) links to those exact file names under `releases/latest/download/`.

## Honest notes
- Unsigned builds: Windows SmartScreen and macOS Gatekeeper show a warning the first time (Windows: More info → Run anyway; macOS: right-click → Open). Code-signing certificates are needed to remove it.
- A native iOS app needs an Apple Developer account ($99/yr) and Xcode; this repo uses the home-screen web app instead.
- Android release for Google Play needs a proper signing key; the APK here is for direct install.
- The workflows were written without being able to run them; if a build step fails, the Actions log shows which — most likely a version bump to `electron`/Android SDK.
- The bundled MIDI music library: confirm you have the right to distribute it publicly before launch.

## Updating the games
Replace `index.html` with the new build, bump the version in `app/package.json` and `sw.js`, push, tag.
