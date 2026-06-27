# 🚀 Going live — your checklist

Everything in the app is **already built and wired up**. To switch it on for the world,
you just need to create a few free accounts and paste their keys into Vercel. Nothing
in this list requires code — it's all copy-paste.

---

## ✅ Things only YOU can do (create accounts & get keys)

Do these in order. The whole thing is ~30–45 minutes.

### 1. Code hosting — **GitHub** (free)
- Create an account at https://github.com and a new empty repo (e.g. `sparkle`).
- I'll give you the 3 commands to push the code (see "Deploy" below).

### 2. Hosting — **Vercel** (free)
- Sign up at https://vercel.com with your GitHub account.
- This is where the live site runs. You'll paste all the keys below into its dashboard
  (Project → Settings → Environment Variables).

### 3. Database — **Supabase Postgres** (free)
- Sign up at https://supabase.com, create a project.
- Go to Project Settings → Database → **Connection string** (URI). Use the
  **"Transaction" pooler** string for serverless. Copy it → this is your **`DATABASE_URL`**.

### 4. Auth — **Clerk** (free tier)
- Create a free app at https://dashboard.clerk.com.
- Choose the sign-in methods you want (email, Google, etc.).
- Copy **Publishable key** → **`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`**
  and **Secret key** → **`CLERK_SECRET_KEY`** (API Keys page).

### 5. Payments — **Stripe** (free to start; takes a cut per sale)
- Sign up at https://stripe.com.
- **API key:** Developers → API keys → copy the **Secret key** → **`STRIPE_SECRET_KEY`**.
- **Price:** Products → add a product "Sparkle Pro", set a recurring monthly price →
  copy the **Price ID** (`price_...`) → **`STRIPE_PRICE_ID`**.
- **Webhook:** Developers → Webhooks → Add endpoint →
  URL = `https://YOUR-SITE.vercel.app/api/stripe/webhook`, select events
  `checkout.session.completed` + `customer.subscription.*` → copy the
  **Signing secret** (`whsec_...`) → **`STRIPE_WEBHOOK_SECRET`**.
- Stripe will also ask for your business details & bank account to receive payouts.

### 6. Email — **Resend** (free tier)
- Sign up at https://resend.com → API Keys → create one → **`RESEND_API_KEY`**.
- To send from your own domain, verify it in Resend and set **`EMAIL_FROM`**
  (e.g. `Sparkle <hi@yourdomain.com>`). You can start with `onboarding@resend.dev`.

### 7. (Optional) **Domain name**
- Buy one (Namecheap, Cloudflare, etc.) and add it in Vercel → Settings → Domains.
- Then set **`NEXT_PUBLIC_APP_URL`** to `https://yourdomain.com`.

### 8. ⚠️ **Legal & safety — REQUIRED for a kids' app**
This is not optional once real children use it:
- **Parental consent** before kids under 13 sign up (COPPA in the US, GDPR-K in the EU).
- A reviewed **Privacy Policy** & **Terms** (drafts are live at `/privacy` and `/terms` —
  have a lawyer check them).
- **Human moderation** of posts/comments + a **report/block** button.
- I can build the moderation tools and a parent-consent step next — just ask.

---

## 📋 The keys you'll paste into Vercel

| Variable | From step | Required? |
|---|---|---|
| `DATABASE_URL` | 3 (Supabase) | ✅ yes |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | 4 (Clerk) | ✅ yes |
| `CLERK_SECRET_KEY` | 4 (Clerk) | ✅ yes |
| `NEXT_PUBLIC_APP_URL` | 2 or 7 | ✅ yes |
| `STRIPE_SECRET_KEY` | 5 | for payments |
| `STRIPE_PRICE_ID` | 5 | for payments |
| `STRIPE_WEBHOOK_SECRET` | 5 | for payments |
| `RESEND_API_KEY` | 6 | for emails |
| `EMAIL_FROM` | 6 | for emails |

> The app boots **without** Clerk keys too — it just shows a "finish setup" screen
> until you add them. Stripe/Resend stay off until their keys are added.

> The app runs fine **without** the Stripe/Resend keys — those features just stay off
> until you add them. So you can launch first and turn on payments later.

---

## 🛠️ Deploy (after you have the keys)

```bash
# 1. Switch Prisma to Postgres for production:
#    in prisma/schema.prisma change  provider = "sqlite"  ->  "postgresql"
rm -rf prisma/migrations
# put your Neon DATABASE_URL in .env, then:
npx prisma migrate dev --name init
npm run db:seed          # optional demo content

# 2. Push to GitHub
git add -A && git commit -m "Ready to launch"
git remote add origin https://github.com/<you>/sparkle.git
git push -u origin main

# 3. In Vercel: import the repo, paste the env vars from the table above, Deploy.
```

The build step automatically creates your database tables. Your site goes live at
`https://<project>.vercel.app`. 🎉

See **[DEPLOY.md](DEPLOY.md)** for the same steps with more detail.
