const DIFFERENTIATORS = [
  {
    title: "One real model, honestly labeled",
    body: "No grid of provider logos we don't actually have access to — Sana (via Pollinations) and LTX (via Pixazo), disclosed plainly.",
  },
  {
    title: "No technical setup",
    body: "Write a prompt, pick a style or motion preset, download your result. That's the entire workflow.",
  },
  {
    title: "Credits that mean something",
    body: "A failed generation refunds itself automatically — checked in code, not just claimed in an FAQ.",
  },
  {
    title: "Built as an exercise, not a business",
    body: "This is a timed take-home rebuild. It's a real, working product, not a company.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <p className="text-xs font-mono uppercase tracking-wide text-accent mb-2">About</p>
      <h1 className="text-3xl sm:text-4xl font-bold text-balance">
        Built for Creators. <span className="text-text-muted italic">Rebuilt from scratch.</span>
      </h1>
      <p className="text-sm sm:text-base text-text-muted mt-5 leading-relaxed max-w-2xl">
        AzaisAi (the original) put several AI generation providers behind one
        prompt box and one subscription. This version keeps that idea — same
        sitemap, same generation flow, same credit economy — but rebuilds the
        implementation from nothing, on real, free-tier providers instead of
        licensed access to Sora, Veo, and Runway.
      </p>

      <h2 className="text-xl font-semibold mt-14 mb-6">What makes this build different</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {DIFFERENTIATORS.map((d) => (
          <div key={d.title} className="glass-card p-5">
            <h3 className="font-medium text-sm">{d.title}</h3>
            <p className="text-sm text-text-muted mt-1.5">{d.body}</p>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-semibold mt-14 mb-4">Supported models</h2>
      <div className="glass-card p-5 grid sm:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-mono uppercase text-accent mb-2">Image</p>
          <p className="text-sm">Sana <span className="text-text-muted">— via Pollinations</span></p>
        </div>
        <div>
          <p className="text-xs font-mono uppercase text-accent mb-2">Video</p>
          <p className="text-sm">LTX <span className="text-text-muted">— via Pixazo, free tier</span></p>
        </div>
      </div>

      <blockquote className="mt-14 border-l-2 border-accent pl-5 italic text-text-muted">
        The goal of this rebuild was never to imitate the original&apos;s model
        access — it was to reproduce the product experience faithfully, and
        be honest about the one part that can&apos;t be reproduced for free.
      </blockquote>
    </div>
  );
}
