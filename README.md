# AzaisAi Rebuild

A from-scratch rebuild of [azaisai.com](https://azaisai.com) — an AI video/image
generation product — built as a timed take-home exercise. Full research, the
implementation plan, and every prompt/response exchanged with the coding agent while
building this are committed in this repo (see below).

## What this is

Same sitemap, same generation UX, same credit economy as the original. The AI models
underneath are real, working, free-tier providers ([Pollinations](https://pollinations.ai))
rather than licensed Sora/Veo/Runway access — that swap is disclosed in the UI, not
hidden behind the original's branding.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS, Postgres via Prisma, custom email +
one-time-code auth (no third-party auth service), Pollinations for images and Pixazo
for video. No Stripe, no Supabase — see [`docs/implementation-plan.md`](docs/implementation-plan.md)
for why and what that trades off.

Video generation is submit-then-poll rather than one long request: a serverless
function can't hold a connection open for the 1-2 minutes a video takes, so the route
that starts a generation returns immediately, and `GET /api/generations/[id]` (already
polled by the client every few seconds) advances the job by one quick status check each
time it's called. No background task ever needs to outlive a single request.

## Running locally

```bash
npm install
cp .env.example .env.local   # fill in the API keys, SESSION_SECRET, and DATABASE_URL
npx prisma migrate deploy
npm run dev
```

`DATABASE_URL` needs a real Postgres connection string, there's no SQLite fallback
(SQLite's local file doesn't survive Vercel's serverless filesystem, so the whole app
targets Postgres from the start). The easiest source for one: deploy this to Vercel
first (see below), use the connection string it hands you for local dev too, one
database instead of two setups to keep in sync.

## Deploying to Vercel

1. Import this repo into a new Vercel project.
2. In the project's **Storage** tab, add **Postgres** (one click, same account, no
   separate signup) and connect it, this sets `DATABASE_URL` automatically.
3. Add the other env vars from `.env.example` in the project's **Environment
   Variables** settings: `POLLINATIONS_API_KEY`, `PIXAZO_API_KEY`, `SESSION_SECRET`.
4. Run `npx prisma migrate deploy` once against that same `DATABASE_URL` (locally,
   with it set in `.env.local`) to create the tables, then deploy.

## Repo map

- [`docs/research/`](docs/research/) — product research: sitemap, pricing, models, FAQ,
  screenshots, notes on content bugs found in the live product.
- [`docs/implementation-plan.md`](docs/implementation-plan.md) — the plan this was built from.
- [`.agent-logs/`](.agent-logs/) — automatic, unedited prompt/response capture from the
  coding sessions that built this (see [`CAPTURE-TEST.md`](CAPTURE-TEST.md) for how it's wired).
