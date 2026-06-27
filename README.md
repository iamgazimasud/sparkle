# ✨ Sparkle

**Where kids show off the cool things they make — and inspire each other to make more.**

Sparkle is a friendly, safe community where kids can share their projects (art,
YouTube videos, games & code, videos, and music), cheer each other on, and — most
importantly — get *inspired* to create their own. Every project has a big
**"This inspired me — I'll make one too!"** button that turns watchers into makers.

**Stack:** Next.js 15 (App Router) · React 19 · Prisma · **Clerk** (auth) ·
**Supabase/Postgres** (prod DB, SQLite for local) · **Stripe** (payments) ·
**Resend** (email) · deployed on **Vercel**.

---

## ✨ Features

- 🎨 **Share 5 kinds of projects** — Art, YouTube (embeds & plays in-app), Code/Games, Videos, Music
- 📷 **Real uploads** — add a photo of your project (auto-compressed) or pick a fun emoji cover
- 💬 **Kind communication** — comment with one-tap stickers or your own words; a built-in kindness filter blocks mean words
- 🌟 **Likes / stars** to cheer each other on
- ✨ **The inspiration engine** — "This inspired me!" opens the create screen pre-set to that project type
- ⚡ **Sparks, Levels & Badges** — earn points for posting (+10), commenting (+2) and reacting (+1); climb from 🌱 Sprout to 🌟 Superstar; unlock badges
- 🔐 **Real accounts via Clerk** — sign in with email/social; then pick an anonymous emoji avatar + nickname (kids never show real names to each other)
- 💳 **Stripe "Sparkle Pro"** subscription + **Resend** welcome emails
- 🛡️ **Kid-safety first** — anonymous emoji avatars (no photos of kids), nickname display only, safety reminders, kindness filter
- 📱 Fully responsive with a mobile bottom-nav

## 🚀 Run it locally

```bash
npm install
npm run db:push     # set up the database (first time)
npm run db:seed     # add demo makers & projects
npm run dev         # http://localhost:4321
```

> If you cloned this repo, the migration is already created — run
> `npx prisma migrate dev` instead of `db:push` to apply it.

### 🔑 Turn on logins (Clerk)
Auth is handled by **Clerk**. Until you add keys, the app boots and shows a
"finish setup" screen. Create a free app at [clerk.com](https://clerk.com), then put
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in `.env` and restart.
The 6 demo makers (DragonGirl, PixelPete, …) are content authors so the feed looks
alive — you create your own profile by signing up.

## 🌍 Put it online (free)

See **[DEPLOY.md](DEPLOY.md)** for step-by-step instructions to deploy to Vercel
with a free Postgres database — about 10 minutes, no credit card.

## 📁 Project structure

```
app/
  page.tsx              Server page — loads user + projects, renders the app
  layout.tsx            Fonts, metadata, background
  globals.css           All the playful styling
  api/
    auth/route.ts       Who am I? (Clerk-aware)
    profile/route.ts    Create a Sparkle profile (onboarding)
    projects/route.ts   List + create projects
    projects/[id]/like/route.ts      Toggle a like
    projects/[id]/comments/route.ts  Add a comment
    stripe/checkout, stripe/webhook  Sparkle Pro subscription
components/             Client UI (SparkleApp gate, MainApp, Feed, Profile, modals)
lib/                    db, auth (Clerk), clerk, stripe, email, constants, helpers
middleware.ts           Clerk middleware (gated)
prisma/                 schema + migration + seed
```

## ⚠️ Before real kids use it (important)

This is a complete, working app — but a public community for children has legal and
safety duties (COPPA in the US, GDPR-K in the EU). Before launching to real kids, add:
**human moderation** of posts/comments, **parental consent**, a **report/block**
system, and a clear **privacy policy**. The kindness filter here is a helpful start,
not a substitute for human review.
