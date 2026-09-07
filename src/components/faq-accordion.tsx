"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "What is AzaisAi?",
    a: "AzaisAi is a rebuild of the original azaisai.com product — an AI video and image generation platform. This version runs on real, working, free-tier providers (Sana for images, Nova Reel for video, both via Pollinations) instead of the original's licensed Sora/Veo/Runway access.",
  },
  {
    q: "What AI models do you use?",
    a: "One image model (Sana) and one video model (Nova Reel). That's genuinely what's available on the free tier of the underlying provider — we'd rather show one real model honestly than a grid of names that don't actually run.",
  },
  {
    q: "Why is video generation sometimes unavailable?",
    a: "Nova Reel requires a funded balance on the provider side. The free API key this demo runs on doesn't have one, so video generation will show a clear \"needs a funded balance\" message instead of a fake result. Image generation is fully free and always works.",
  },
  {
    q: "How do credits work?",
    a: "Images cost 1 credit flat. Video costs 1 credit per second of requested duration (4-8s). New accounts get 8 free credits on signup — enough for 8 images, or one short video once video is funded.",
  },
  {
    q: "Why did my generation fail?",
    a: "Usually a provider-side timeout, rate limit, or content filter. Credits are only charged on success — a failed generation refunds itself automatically, you can check the exact reason on the History page.",
  },
  {
    q: "Do credits expire, and can I subscribe?",
    a: "This build doesn't process real payments (no Stripe, by design — see the implementation plan in the repo). The Pricing page shows what a real subscription would look like, but the buttons are clearly marked as a demo rather than pretending to charge you.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes — every new account gets 8 credits immediately after signing up with just an email and a one-time code. No phone number, no card, unlike some confusing copy on the original product's own FAQ (which said phone verification, while its actual UI only ever asked for email).",
  },
  {
    q: "How do I download what I generate?",
    a: "Every successful generation has a Download link, on the result panel and again on your History page.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {FAQS.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.q} className="glass-card overflow-hidden">
            <button
              onClick={() => setOpenIndex(open ? null : i)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-medium text-sm">{item.q}</span>
              <span className={`text-text-muted transition-transform shrink-0 ${open ? "rotate-180" : ""}`}>
                ⌄
              </span>
            </button>
            {open && (
              <div className="px-5 pb-4 text-sm text-text-muted leading-relaxed border-t border-border pt-3">
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
