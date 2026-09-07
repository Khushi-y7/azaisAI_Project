# AzaisAi — Product Research Notes

Raw findings from using [azaisai.com](https://azaisai.com) as a logged-out visitor:
`WebFetch` for text content, a scratch Playwright script for screenshots (saved in
[`screenshots/`](screenshots/)). The authenticated screens (dashboard, history, account
settings, checkout, an actual generation) are not captured here — see the note at the
bottom.

## What it is

AzaisAi is a **unified AI video + image generation SaaS** — a thin, well-designed
frontend over three upstream providers (OpenAI Sora, Google Veo, Runway, plus GPT Image
for stills), sold as "every top model, one platform, one prompt." Dark theme, blue
accent, glassmorphism cards, a persistent "Sign in to unlock free credits" nudge card
bottom-right on every page for logged-out visitors.

## Sitemap (real paths, not hash routes)

| Route | Auth? | Screenshot |
|---|---|---|
| `/` | public | [landing-desktop.png](screenshots/landing-desktop.png), [landing-mobile.png](screenshots/landing-mobile.png) |
| `/generate/video` | public to view, sign-in to submit | [generate-video-studio.png](screenshots/generate-video-studio.png) |
| `/generate/image` | public to view, sign-in to submit | [generate-image-studio.png](screenshots/generate-image-studio.png) |
| `/upgrade` | public to view, sign-in to buy | [pricing.png](screenshots/pricing.png) |
| `/about` | public | [about.png](screenshots/about.png) |
| `/contact` | public | [contact.png](screenshots/contact.png) |
| `/faq` | public | (text captured below; page screenshot timed out on font-load, skipped) |
| `/auth/signup` | public | [auth-signup.png](screenshots/auth-signup.png) |
| `/auth/login` | public | [auth-login.png](screenshots/auth-login.png) |
| `/privacy` | public | [privacy.png](screenshots/privacy.png) |
| `/terms` | public | [terms.png](screenshots/terms.png) |
| `/history` | **gated** — redirects to `/auth/login?returnUrl=%2Fhistory` when logged out | [history-loggedout-redirect.png](screenshots/history-loggedout-redirect.png) |

Note: the bare domain `azaisai.com` 307-redirects to `www.azaisai.com`.

## Auth flow (important correction vs. the FAQ)

The actual `/auth/signup` and `/auth/login` screens are **passwordless, email +
one-time-code** ("Create account" / "Welcome back" → enter email → Cloudflare Turnstile
"Verify you are human" checkbox → "Send code"). There is no password field anywhere.

This **contradicts the FAQ**, which twice says the free trial requires **phone number**
verification ("verify your phone number to receive 8 free credits"). That's either
stale copy or a second, undocumented verification step later in the flow — a real
content bug in the original product, worth noting for the rebuild (don't copy it) and
worth designing our own copy to actually match our own implementation.

Signup could not be completed by the agent: no email inbox to receive the OTP code, and
a live Cloudflare Turnstile challenge on the form anyway (which will also resist
scripted automation). This is a "have the human complete the OTP step" limitation, not
a missed corner of the product.

## Pricing (`/upgrade`)

**Subscription plans** (monthly, all unlock the same model set — only credits differ):

| Plan | Price | Credits/mo | Notes |
|---|---|---|---|
| Starter | $16.90/mo | 60 | "Core", priority video+image queue, standard support |
| Pro | $32.90/mo | 180 | "Most Popular", priority rendering, dedicated support |
| Business | $65.90/mo | 420 | "Power", priority + commercial license (cut off in screenshot, confirm wording) |

**One-time credit top-ups** (no subscription needed, but purchase itself requires sign-in):

| Pack | Price | Credits |
|---|---|---|
| Starter Pack | $37.90 | 100 |
| Value Pack | $53.90 | 200 |
| Pro Pack | $62.90 | 300 |

Cancel anytime; plan stays active until end of billing period (per FAQ).

## Video generation (`/generate/video`)

Left panel: Text/Image mode toggle (image-to-video exists as a second tab), model grid,
prompt textarea with "Enhance" and "Variation" buttons, aspect ratio (16:9 / 9:16),
duration (4s / 6s / 8s), resolution (720p / 1080p / HD), live estimated-cost readout,
"Generate video" button. Right side is a large empty preview canvas (presumably fills
with the result player after a real generation).

**8 video models**, rate-based pricing (credits/second of output):

| Model | Provider | Rate | ~Time | Badge |
|---|---|---|---|---|
| Sora Standard | OpenAI | 1.0 cr/s | ~2m | Popular |
| Sora Pro | OpenAI | 2.0 cr/s | ~3m | Premium |
| Veo 2 | Google | 3.0 cr/s | ~45s | — |
| Veo 3 Fast | Google | 1.5 cr/s | ~35s | Fast |
| Veo 3 | Google | 3.0 cr/s | ~1m | New |
| Gen-4 Turbo | Runway | 1.0 cr/s | ~2m | Popular |
| Gen-4.5 | Runway | 1.2 cr/s | ~2m | Premium |
| Gen-3 Alpha Turbo | Runway | 1.0 cr/s | ~1m | Fast |

An 8s clip on a 1 cr/s model ≈ 8 credits, matching the homepage's "8 free credits → one
video" framing.

## Image generation (`/generate/image`)

Model grid, prompt textarea (Enhance/Variation), **Style presets**: None, Cinematic,
Anime, Photo, Illustration, Abstract (6 total — one was cut off in the screenshot crop).
**Aspect ratios**: 16:9, 1:1, 9:16, 4:3, 3:4. Flat per-image cost, no duration/resolution
axis like video has.

**4 image models**:

| Model | Provider | Cost | ~Time | Badge |
|---|---|---|---|---|
| GPT Image | OpenAI | 2 credits | ~10s | Premium |
| Nano Banana 2 | ? | 1 credit | ~8s | New |
| Nano Banana 2 4K | ? | 2 credits | ~15s | 4K |
| Gen-4 Image | Runway | 1 credit | ~20s | New |

## FAQ (`/faq`) — full text

1. **What is AzaisAi?** "AzaisAi is an AI video and image generation platform that gives
   you access to the world's best AI models — including Sora, Veo, and Runway — in one
   place."
2. **What AI models do you use?** Sora 2, Sora Pro, Veo 2, Veo 3, Veo 3 Fast, Gen-4
   Turbo, Gen-4.5, Gen-3 Alpha Turbo for video; GPT Image, Nano Banana 2, Gen-4 Image for
   images.
3. **What's the difference between the plans?** "All plans give you access to the same
   models. The difference is how many credits you get per month. Premium gives you 60
   credits, Pro gives you 180, and Business gives you 420." (Note: this names the tiers
   "Premium/Pro/Business"; the pricing page itself labels them "Starter/Pro/Business" —
   a second small copy inconsistency in the original.)
4. **How do credits work?** 1-3 credits/sec for video depending on model, 1-2
   credits/image. An 8s video ≈ 8-24 credits.
5. **Can I use generated videos commercially?** Yes on paid plans; free tier output is
   watermarked and personal-use only.
6. **How long does generation take?** "Most generations complete within 30-90 seconds
   depending on the model and current server load."
7. **Why did my generation fail?** Content filters, timeouts, or prompt complexity;
   credits aren't consumed on failure.
8. **Do credits expire?** Subscription credits reset monthly, no rollover; one-time
   purchases last 12 months.
9. **Can I cancel?** Anytime, active until end of billing period.
10. **Is there a free trial?** "Yes — new accounts receive a small one-time credit grant
    after verifying your account."
11. **What formats/resolutions?** MP4, 720p (1080p on Sora Pro).
12. **How do I download?** Immediately post-generation; paid outputs watermark-free.
13. **What is the free trial exactly?** "New users can verify their phone number to
    receive 8 free credits — no credit card required." *(see the auth-flow
    contradiction noted above — actual UI uses email+OTP, not phone)*
14. **Which models in the free trial?** Sora 2 for video, Nano Banana 2 for images;
    upgrade unlocks all models.
15. **Why do free outputs have a watermark?** Removed on paid upgrade.

## About (`/about`)

Tagline: "Built for Creators. Powered by the World's Best AI." Framed as a small,
independent team consolidating Sora/Veo/Runway/GPT Image behind one prompt box so users
don't need "a technical background, a developer team, or five separate subscriptions."
Four differentiator tiles (one platform / no setup / built for everyone / no watermarks
on paid plans), a "Supported models" grid mirroring the generation pages, a pull-quote,
and a 4-item commitments list (no watermarks on paid, private generations, no charge on
failure, cancel anytime).

## Contact (`/contact`)

Name / Email / Subject (dropdown) / Message (2000 char limit) form, Cloudflare
Turnstile, "Send Message" button, plus a direct fallback: `support@azaisai.com`.
24-48h response time stated.

## Authenticated walkthrough (screenshots from the user's own account, logged in)

The agent still can't complete the OTP flow itself (no inbox), so these came from the
user's real account. Five screenshots, not yet saved to `screenshots/` as files (only
seen inline in chat) — worth re-capturing as PNGs later if we want them alongside the
logged-out set.

**Header changes once logged in:** the nav gains a credit balance chip (`⚡ 0 cr`) and a
circular avatar with initials ("YD") between Pricing and the language selector. The
account in the screenshots shows **0 credits** despite being signed up — so either the
free grant needs a separate claim step, or this account hasn't triggered it yet. This
actually reconciles the email-vs-phone FAQ "contradiction" flagged earlier: **email+OTP
is for account creation/login; a phone-verification step may be a separate, optional
action specifically to claim the 8 bonus credits**, not the same gate. Treat as a
hypothesis, not confirmed — but it's more plausible than "the FAQ is just wrong."

**Video studio has a whole feature not visible logged out — Motion presets.** Below the
model grid there's a second picker, collapsible, with its own categories:
- **Camera:** Slow zoom in, Pull back reveal, Arc orbit ("Smooth 90° arc around the
  subject"), Pan across, Dolly push-in — each with a one-line description, radio-select,
  a clear-selection (×) affordance.
- **Atmosphere:** Golden light shift ("Warm light drifts across the scene over time"),
  and presumably more below the fold.

This is a meaningful UX layer we hadn't seen: it's not just "pick model → type prompt,"
it's model → prompt → *cinematographic intent*, which is a nice, cheap-to-build,
high-perceived-value feature (a fixed list of prompt-modifier presets, each just
appends/steers the underlying prompt sent to the model).

**Text vs. Image mode changes which models are offered.** In Image mode (image-to-video)
the model grid drops both Sora options entirely, leaving only Veo 2/3/3 Fast and the
three Runway Gen models — Sora apparently only supports text-to-video in this product.
Image mode adds a **"Start frame"** upload slot (shown with a photo of a person at a
laptop) — a real image-to-video parameter, not just a toggle.

**Right-hand panel is a live example viewer, not just an empty canvas.** It shows a
muted, autoplaying example video/image with a caption overlay (`EXAMPLE` + the prompt
that produced it), a mute toggle, and a "Hide example" pill top-left. The example shown
changes per model/style selected (waterfall for Veo 3 Fast, a portrait scene for the
default). This is doing real work: it sets expectations for what a given model/style
actually produces before you spend credits. Worth building — even a handful of static
example clips/images per model gets most of the value.

**FAQ is an accordion**, not the flat list the text-only fetch implied — one question
open at a time (chevron up/down), first question expanded by default.

**History page** (`/history`, confirmed via the browser chrome in the screenshot):
eyebrow "WORKSPACE", H1 "History", subtitle "Review every generation, track status, and
revisit past prompts." Filter tabs: All / Video / Image / Processing, a search icon
top-right. Empty state: centered sparkle icon, "No generations yet" / "Start creating to
see history here.", a "Create your first video" button. Clean, standard empty-state
pattern — easy to replicate exactly.

## Still open

- Account/profile settings, plan management, invoice history
- The `/upgrade` checkout flow once "Subscribe" is actually clickable (Stripe? custom?)
- A real generation end-to-end — does the right panel swap from "example" to an actual
  progress state, then the real result? What does failure look like?
- Whether/how the 8 free credits actually get claimed (see hypothesis above)
