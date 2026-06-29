# 📱 Publishing Sparkle to the Google Play Store

A Next.js web app goes to Play Store as a **TWA** (Trusted Web Activity) — a thin
Android wrapper around your live website, built with Google's **Bubblewrap** tool.
The app *is* your live site, running full-screen with no browser bar.

> **Order matters:** you must finish **[DEPLOY.md](DEPLOY.md)** first (the app must be
> live on HTTPS) before you can wrap it for Play Store.

---

## ✅ What you need (only you can create these)

| # | Thing | Cost | Notes |
|---|-------|------|-------|
| 1 | **Live HTTPS site** | — | From DEPLOY.md (e.g. `https://sparkle.vercel.app` or your domain) |
| 2 | **Google Play Developer account** | **$25 once** | https://play.google.com/console — identity verification can take a few days |
| 3 | **A computer with JDK 17 + Android tools** | free | Bubblewrap installs most of it; needs Java |
| 4 | **A privacy policy URL** | — | We have `/privacy` live; Play requires a public link |

---

## ⚠️ Read this first: Sparkle is a "kids" app

Google applies its strict **Families / Designed for Families** policy to apps aimed at
children. For approval you'll need:

- **Content moderation** for user posts & comments — ✅ we built reports, blocking, an
  admin queue, and a kindness filter.
- **Verifiable parental consent** for under-13 — ✅ we built the consent gate (you may
  need to strengthen it to a Google-accepted method, e.g. a small charge or ID, for
  full COPPA compliance — talk to a lawyer).
- **No behavioral ads**, a complete **Data safety** form, and a **privacy policy** — ✅
  `/privacy` exists (have a lawyer review it).
- Accurate **target age group** in the Play Console.

This review is stricter and slower than a normal app. Budget time for back-and-forth.

---

## 🛠️ Build the Android app (after the site is live)

```bash
# 1. Install Bubblewrap
npm install -g @bubblewrap/cli

# 2. Initialise from your live manifest (uses our PWA manifest + icons)
bubblewrap init --manifest https://YOUR-LIVE-URL/manifest.webmanifest
#   - It downloads JDK/Android SDK on first run if needed.
#   - App name: Sparkle | Package id: e.g. com.sparkle.app
#   - It generates a signing key — BACK IT UP, you need the same key for every update.

# 3. Build the release bundle
bubblewrap build
#   -> produces app-release-bundle.aab (upload this) and a signed APK (for testing)
```

### Verify your domain owns the app (removes the URL bar)
Bubblewrap prints a **SHA-256 fingerprint**. Add a Digital Asset Links file to the site:

`public/.well-known/assetlinks.json`
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.sparkle.app",
    "sha256_cert_fingerprints": ["<PASTE FINGERPRINT FROM BUBBLEWRAP>"]
  }
}]
```
Redeploy so it's live at `https://YOUR-URL/.well-known/assetlinks.json`.

> Tip: Play's **App Signing** will re-sign your app and give you a *different* fingerprint
> to add as well — copy it from Play Console → Setup → App signing after your first upload.

---

## 🚀 Submit in Play Console

1. **Create app** → name "Sparkle", category, default language.
2. **Upload** the `.aab` to a testing track first (Internal testing), then Production.
3. Fill in: **Store listing** (icon — use `public/icon-512.png`, screenshots, description),
   **Data safety**, **Content rating** questionnaire, **Target audience = children**,
   **Privacy policy URL** = `https://YOUR-URL/privacy`.
4. Submit for review.

---

## When you're ready
Tell me your live URL and chosen package id (e.g. `com.sparkle.app`) and I'll:
- add the `.well-known/assetlinks.json` to the repo,
- walk you through each Bubblewrap prompt,
- and prep the store-listing text + screenshots checklist.
