# DSA Placement Tracker

A premium personal command center for DSA placement preparation. Track problems, streaks, reattempts, and analytics — built to feel like a serious developer tool.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS** + custom dark design system
- **Prisma ORM** + PostgreSQL (Neon)
- **Recharts** for analytics
- **TanStack Query** for data fetching + optimistic updates
- Deployable to **Vercel** in minutes

---

## Deploy to Vercel (5 minutes)

### 1. Get a free PostgreSQL database

Go to [neon.tech](https://neon.tech) → **New Project** → copy the two connection strings:
- **Pooled connection** → `DATABASE_URL`
- **Direct connection** → `DIRECT_URL`

> Alternatively use Vercel Postgres (Dashboard → Storage → Create Database) or Supabase.

### 2. Set environment variables

Create a `.env` file locally (copy from `.env.example`):

```env
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://user:pass@host/db?sslmode=require"
```

### 3. Push schema + seed demo data

```bash
npm run db:migrate     # creates all tables
npm run db:seed        # populates ~60 demo problems
```

### 4. Deploy

```bash
npx vercel --prod
```

Add the same `DATABASE_URL` and `DIRECT_URL` env vars in the Vercel Dashboard → Settings → Environment Variables.

---

## Local Development

```bash
npm install
# add .env with your DATABASE_URL and DIRECT_URL
npm run db:migrate
npm run db:seed
npm run dev
```

Visit http://localhost:3000

---

## Features

- Dashboard with streak, focus time, daily grind progress bars, GitHub-style activity heatmap
- Add Problem in under 15 seconds (Cmd+Enter to save, remembers last source)
- Problems table with combined filters (platform, source, result, topic, difficulty)
- Reattempt queue with Due Today / Overdue / Upcoming + Weakness Vault
- Analytics: problems/day, focus time, independent rate trend (weekly), topic mastery
- Progress: NeetCode 150 by category, Striver SDE, CP-31 by rating band
- Command palette (Ctrl+K) for navigation
- Settings: daily time targets, deployment guide, data reset

---

## Reset Demo Data

Go to **Settings → Danger Zone → Clear All Data** to wipe everything and start fresh.
