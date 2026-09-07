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

Next.js (App Router) + TypeScript + Tailwind CSS, SQLite via Prisma, custom email +
one-time-code auth (no third-party auth service), Pollinations for image/video
generation. No Stripe, no Supabase — see [`docs/implementation-plan.md`](docs/implementation-plan.md)
for why and what that trades off.

## Running locally

```bash
npm install
cp .env.example .env.local   # fill in POLLINATIONS_API_KEY and SESSION_SECRET
npx prisma migrate dev
npm run dev
```

## Repo map

- [`docs/research/`](docs/research/) — product research: sitemap, pricing, models, FAQ,
  screenshots, notes on content bugs found in the live product.
- [`docs/implementation-plan.md`](docs/implementation-plan.md) — the plan this was built from.
- [`.agent-logs/`](.agent-logs/) — automatic, unedited prompt/response capture from the
  coding sessions that built this (see [`CAPTURE-TEST.md`](CAPTURE-TEST.md) for how it's wired).
