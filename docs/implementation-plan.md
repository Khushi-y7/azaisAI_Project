# Implementation Plan — AzaisAi Rebuild

Based on [`docs/research/notes.md`](research/notes.md). This is the plan before writing
application code; it will be revised once the authenticated-flow screenshots come in
(dashboard, history, checkout, a real generation) — those sections are marked below.

## The feel, not just the spec

Screenshots of the authenticated app (from the user's own account — see
[`research/notes.md`](research/notes.md#authenticated-walkthrough-screenshots-from-the-users-own-account-logged-in))
changed how I'd describe this product. It isn't "form with a submit button that calls
an API" — the details that make it feel like a real creative tool:

- **The output panel is never empty.** Logged out or before your first generation, it
  shows a real, captioned example ("EXAMPLE" + the prompt that made it) for whatever
  model/style is currently selected, muted-autoplay if video, with a one-tap
  hide/show. You always see what you're about to pay credits for.
- **A second creative layer sits below the model picker** — cinematographic Motion
  presets (Slow zoom in, Arc orbit, Dolly push-in...) grouped by Camera/Atmosphere, each
  with a plain-English one-liner. It turns "describe your video" from a blank-page
  problem into a menu problem, which is a big perceived-effort reduction for very little
  build cost (they're just prompt-steering strings).
- **The model grid is context-aware**, not a static list: switching Text→Image mode on
  the video studio silently drops Sora and adds a "Start frame" upload slot. Constraints
  are enforced by what's *offered*, not by disabling buttons and showing an error.
- **Empty states are designed, not blank.** History's zero-state has an icon, a
  sentence, and a CTA back into the exact studio you'd use next — never a bare "no data."
- **Every top-level page keeps the same chrome** (nav, credit chip once logged in,
  avatar, language selector) so nothing ever feels like a separate app bolted on.

None of this is hard to build; it's just easy to *skip* under time pressure because it's
not in any single API contract. Treating it as part of P0 (below), not polish, is the
main plan change from the first draft.

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
| Database | **SQLite via Prisma** (Postgres at deploy time) | Zero signup, zero keys, runs immediately for local dev. Swaps to Vercel's one-click Storage → Postgres (connection string auto-filled, same account used to deploy) when we go live — user asked to avoid Supabase account/key setup |
| Auth | **Custom email + one-time code**, no third-party auth service | Matches the observed passwordless flow's *shape*; no email-sending key available, so the code is shown on-screen rather than emailed — disclosed as a demo shortcut, not hidden. Session = signed cookie, secret generated locally into `.env.local` |
| Storage | Keep the URL Pollinations returns | No blob/object storage service to configure; documented tradeoff (see Generation flow) |
| Payments | **Dropped** — user asked to skip Stripe | `/upgrade` is a real pricing page with working buttons that say "demo — no checkout" rather than faking a charge |
| Image generation | Pollinations `image.pollinations.ai` | Free, no key needed for basic use, reliable |
| Video generation | Pixazo `gateway.pixazo.ai/ltx-video` (LTX by Lightricks) | Actually free on Pixazo's preview tier (unlike Pollinations' video gateway, which turned out to require a funded paid balance despite looking free — see below). Submit-then-poll REST API, ~1-2 min per clip |
| Hosting | Vercel | Instant public URL, env vars for secrets, GitHub-connected auto-deploy |

**Secrets:** `POLLINATIONS_API_KEY`, `PIXAZO_API_KEY`, and a locally-generated session
secret, all in a
gitignored `.env.local` — never in the repo or in chat. [`.env.example`](../.env.example)
documents the variable names with no values. (Note: the key shared in chat during
planning is treated as burned — asked the user to rotate it — and is not used for real
calls.)

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

Verified directly against the live API (not docs/search, which turned out to list
models that don't actually exist on this gateway):

- **Image:** exactly one real free-tier model, `sana`. Badged honestly as "Sana — via
  Pollinations." No model *grid* to fake, so the creative-choice UI leans on style
  presets (prompt modifiers) instead, which is what the original's style picker
  amounted to anyway.
- **Video:** first tried Pollinations' `nova-reel` (Amazon Nova Reel) — reachable
  without a paid Pollinations plan, but a live call returned `402 Insufficient balance`,
  meaning it needs a funded pollen balance despite looking free. Swapped to **Pixazo**
  (`gateway.pixazo.ai/ltx-video/v1/text-to-video`), whose LTX model is genuinely free
  on its preview tier. Getting the exact endpoint right took real trial and error —
  docs/search results confidently listed models (`ltx`, `ltx-2-5`) and paths that
  returned 404; the actual working slug (`ltx-video`, under a `/v1/` path) was found by
  testing directly against the live API until a real job queued, then polling it to
  completion end-to-end before wiring it into the app.

## Feature priority

**P0 — must work for the demo to be a real product:**
email-OTP signup/login · landing page · video studio (model picker filtered by
text/image mode, Start-frame upload in image mode, Motion preset picker, prompt, params,
live cost estimate, captioned example preview before generating, real generation,
progress state, result playback) · image studio (same pattern, style presets) · credit
balance chip + avatar in the header · history page (filter tabs, designed empty state,
past generations with thumbnails, download) · pricing/upgrade page UI · FAQ as an
accordion · about/contact/privacy/terms · responsive layout, dark theme matching the
research screenshots.

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
3. Server calls the provider. Image (Pollinations/Sana) is synchronous - one request,
   one response. Video (Pixazo/LTX) is submit-then-poll: the server posts the job, then
   polls its status endpoint every few seconds (up to ~3 min) until `COMPLETED` or
   `FAILED` - the client just sees one long-pending request with a loading state.
4. On success: download the result and save it under `public/generated/` (provider
   URLs aren't guaranteed permanent), mark `succeeded`, finalize the credit charge,
   return the stored URL to the client.
5. On failure/timeout: mark `failed`, release the hold (no charge), show the error.

## Still open

Account/profile settings and plan management, the real `/upgrade` checkout shape, and a
full real-generation flow (progress → result, and what failure looks like) are still
unseen — see [`research/notes.md`](research/notes.md#still-open). None of these block
starting P0 work.

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
