# Implementation Plan — AzaisAi Rebuild

Based on [`docs/research/notes.md`](research/notes.md). This is the plan before writing
application code; it will be revised once the authenticated-flow screenshots come in
(dashboard, history, checkout, a real generation) — those sections are marked below.

## Goal

Rebuild the product experience faithfully — same sitemap, same generation UX, same
credit economy, same information architecture — deployed live. The AI models
underneath are swapped for free/cheap real providers rather than licensed Sora/Veo/
Runway access, and that swap is disclosed in the UI copy, not hidden.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | One codebase for pages + API routes, fast to scaffold, deploys cleanly to Vercel |
| Styling | Tailwind CSS | Matches the dark/glassmorphism look quickly, no design-system build cost |
| Auth + DB + Storage | Supabase (free tier) | Built-in **email OTP auth** maps directly onto the observed passwordless flow; Postgres for the credit ledger; Storage bucket for generated media |
| Payments | Stripe, **test mode** | Real checkout UI/flow without real charges; clearly labeled as a demo in the UI |
| Image generation | Pollinations `image.pollinations.ai` | Free, no key needed for basic use, reliable |
| Video generation | Pollinations `gen.pollinations.ai` (Seedance / Veo-alpha / Wan-Fast) | Only realistic free path to actual text-to-video; treated as best-effort (alpha), with a graceful failure state — not a hard dependency for the demo to "work" |
| Hosting | Vercel | Instant public URL, env vars for secrets, GitHub-connected auto-deploy |

**Secrets:** Pollinations key, Supabase service-role key, Stripe secret key all live in
Vercel/Supabase env vars only — never in the repo. `.env.example` documents the required
names with placeholder values. (Note: the key shared in chat during planning is treated
as burned — asked the user to rotate it — and is not used for real calls.)

## Sitemap (matches the original 1:1 for direct comparability)

`/`, `/generate/video`, `/generate/image`, `/upgrade`, `/about`, `/contact`, `/faq`,
`/history`, `/auth/signup`, `/auth/login`, `/privacy`, `/terms`.

## Data model (Postgres via Supabase)

- `auth.users` — Supabase-managed.
- `profiles` (user_id pk/fk, credits_balance, created_at)
- `credit_transactions` (id, user_id, delta, reason: `signup_grant | generation | refund | purchase | subscription_renewal`, ref_generation_id nullable, created_at)
- `generations` (id, user_id, type: `image|video`, model, prompt, params jsonb, status: `queued|processing|succeeded|failed`, cost_credits, result_url, error_message, created_at, completed_at)
- `plans` (id, name, price_cents, credits_per_month) — seeded: Starter/Pro/Business at the researched price points
- `credit_packs` (id, name, price_cents, credits) — seeded: Starter/Value/Pro packs

Credits are **reserved, not charged, until the generation succeeds** — matching the
original's "credits aren't consumed on failure" FAQ claim, and it's the right behavior
regardless.

## Model roster for our build

Keep the *shape* (multiple models, visible cost/time per model, a picker grid) but be
honest about what's actually running:

- **Image:** 2-3 Pollinations models/styles, badged plainly (e.g. "Flux — via
  Pollinations") rather than pretending to be GPT Image.
- **Video:** Seedance / Veo-alpha / Wan-Fast via the Pollinations gateway, badged
  "alpha" where the upstream calls it that. If a given model proves too unreliable
  during build, cut it rather than ship a broken option — functionality over SKU count.

## Feature priority

**P0 — must work for the demo to be a real product:**
email-OTP signup/login · landing page · video studio (model picker, prompt, params,
live cost estimate, real generation, progress state, result playback) · image studio
(same pattern) · credit balance visible in the header · history page (past generations,
thumbnails, download) · pricing/upgrade page UI · about/contact/faq/privacy/terms ·
responsive layout, dark theme matching the research screenshots.

**P1 — do if time allows:**
Stripe test-mode checkout actually granting credits via webhook · account
settings/cancel-plan · image-to-video mode · free-tier watermarking · prompt
"Enhance" button (via a cheap text model).

**P2 — explicitly out of scope for the 12h window:**
Admin dashboard, real SMS/phone, full 8-model video parity, multi-currency, custom
content-moderation pipeline (rely on upstream providers' own filters).

## Generation flow

1. Client submits prompt + params to a server route.
2. Server checks auth + credit balance, creates a `generations` row (`processing`),
   places a credit hold.
3. Server calls Pollinations (image: fast, synchronous; video: same call shape but
   slow — UI shows the model's stated ETA as a countdown, matching the original's
   "~45s" style copy).
4. On success: download the result, re-upload to Supabase Storage (Pollinations URLs
   aren't guaranteed permanent), mark `succeeded`, finalize the credit charge, return
   the stored URL to the client.
5. On failure/timeout: mark `failed`, release the hold (no charge), show a retry state.

## Still open (pending your screenshots)

Dashboard/home distinct from `/generate/video`? Exact `/history` layout (grid vs list,
delete affordance)? Real checkout flow shape? These get folded in once shared — plan
above is built to not need them to start P0 work.

## Build phases (rough time budget, generous 12h window)

| Phase | Work | Est. |
|---|---|---|
| 0 | Capture setup + research (done) | ~1.5h |
| 1 | Scaffold Next.js+TS+Tailwind, design tokens, deploy "hello world" to Vercel immediately (lock in the live link early) | ~1h |
| 2 | Supabase project, schema migration, email-OTP auth wired to signup/login pages | ~1h |
| 3 | Landing + static pages (about/contact/faq/pricing UI/privacy/terms) | ~2h |
| 4 | Generation studios: image first (simpler), then video, both end-to-end with credits + storage | ~3h |
| 5 | History page, header credit balance, Stripe test-mode checkout | ~1.5h |
| 6 | Polish: responsive pass, empty/error/loading states, sign-in nudge card, favicon/meta | ~1h |
| 7 | Final deploy, end-to-end smoke test, README, final commit/push | ~0.5h |

**Total ≈ 10.5h**, leaving buffer inside the 12h window.

## What "better than the original" means here

Fix the two content bugs found in research (email vs phone in the FAQ; consistent tier
naming), reserve-then-charge credits so failed generations are provably free, visible
loading/ETA states instead of a dead button, and honest model-provenance labeling
instead of implying direct Sora/Veo/Runway partnerships we don't have.
