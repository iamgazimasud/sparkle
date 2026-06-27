# 🌍 Deploy Sparkle to the world

This makes your app available at a real public URL (e.g. `sparkle.vercel.app`),
for free, in about 10 minutes. No credit card needed.

SQLite (used for local dev) can't run on Vercel's serverless servers, so production
uses **Postgres**. The steps below switch you over — it's one small change.

---

## Step 1 — Get a free Postgres database (Neon)

1. Go to **https://neon.tech** and sign up (free, no card).
2. Create a new project. Copy the **connection string** — it looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

> Alternatives that also work: Vercel Postgres, Supabase, Railway, Turso.

## Step 2 — Tell Prisma to use Postgres

In `prisma/schema.prisma`, change the datasource provider:

```prisma
datasource db {
  provider = "postgresql"   // was "sqlite"
  url      = env("DATABASE_URL")
}
```

Then regenerate the migration for Postgres:

```bash
rm -rf prisma/migrations          # remove the SQLite migration
# put your Neon URL in .env as DATABASE_URL, then:
npx prisma migrate dev --name init
npm run db:seed                   # optional: add demo content to production DB
```

## Step 3 — Push the code to GitHub

```bash
git add -A
git commit -m "Sparkle: kids project-sharing app"
# create a repo at https://github.com/new , then:
git remote add origin https://github.com/<you>/sparkle.git
git branch -M main
git push -u origin main
```

## Step 4 — Deploy on Vercel

1. Go to **https://vercel.com**, sign in with GitHub.
2. **Add New → Project** → import your `sparkle` repo.
3. Under **Environment Variables**, add:
   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | your Neon connection string |
   | `SESSION_SECRET` | a long random string (run `openssl rand -hex 32`) |
4. Click **Deploy**.

The `build` script already runs `prisma generate && prisma migrate deploy`, so your
database tables are created automatically on the first deploy. 🎉

Your app is now live at `https://<your-project>.vercel.app` — share it with the world!

---

## Notes

- **Images**: uploaded photos are compressed and stored in the database as data URLs.
  This keeps deployment simple (no separate file storage). For lots of large images
  later, switch to Vercel Blob or S3 and store a URL instead.
- **Custom domain**: add one for free in Vercel → Project → Settings → Domains.
- **Safety/moderation**: see the warning at the bottom of [README.md](README.md) before
  inviting real children. Consider holding new posts for review and adding report/block.
