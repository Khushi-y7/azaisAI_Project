const PLANS = [
  { name: "Starter", tag: "Core", price: "16.90", credits: 60, features: ["60 credits / month", "Standard support"] },
  { name: "Pro", tag: "Popular", price: "32.90", credits: 180, features: ["180 credits / month", "Priority rendering", "Priority support"], popular: true },
  { name: "Business", tag: "Power", price: "65.90", credits: 420, features: ["420 credits / month", "Priority everything"] },
];

const PACKS = [
  { name: "Starter Pack", price: "37.90", credits: 100 },
  { name: "Value Pack", price: "53.90", credits: 200 },
  { name: "Pro Pack", price: "62.90", credits: 300 },
];

export default function UpgradePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 text-center">
      <h1 className="text-3xl sm:text-5xl font-bold text-balance">
        Unlock <span className="text-accent">everything</span>
      </h1>
      <p className="text-text-muted mt-3">Get unlimited access to all features. Cancel anytime.</p>
      <div className="mt-3 inline-block text-xs font-mono text-warn bg-warn-soft border border-warn/30 rounded-full px-3 py-1">
        Demo pricing — no payment processor connected, nothing is actually charged
      </div>

      <div className="mt-12 text-left">
        <h2 className="text-sm font-semibold mb-4">Subscription plans</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`glass-card p-6 relative ${plan.popular ? "border-accent" : ""}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-mono bg-accent text-white px-2.5 py-0.5 rounded-full">
                  Most Popular
                </span>
              )}
              <div className="flex items-center justify-between">
                <span className="font-semibold">{plan.name}</span>
                <span className="text-[10px] font-mono text-text-muted border border-border rounded-full px-2 py-0.5">{plan.tag}</span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold">${plan.price}</span>
                <span className="text-text-muted text-sm">/month</span>
              </div>
              <ul className="mt-4 space-y-1.5 text-sm text-text-muted">
                {plan.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
              <button
                disabled
                title="Demo — no checkout connected"
                className={`mt-6 w-full rounded-lg py-2.5 text-sm font-medium cursor-not-allowed ${
                  plan.popular ? "bg-accent/50 text-white" : "bg-surface-2 text-text-muted"
                }`}
              >
                Subscribe (demo)
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-14 text-left">
        <h2 className="text-sm font-semibold mb-1">Credit top-ups</h2>
        <p className="text-xs text-text-muted mb-4">Buy extra credits whenever you need them.</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {PACKS.map((pack) => (
            <div key={pack.name} className="glass-card p-6">
              <div className="flex items-center justify-between">
                <span className="font-medium">{pack.name}</span>
                <span className="text-[10px] font-mono text-text-muted border border-border rounded-full px-2 py-0.5">One-time</span>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-bold">${pack.price}</span>
              </div>
              <p className="text-sm text-text-muted mt-1">{pack.credits} credits</p>
              <button
                disabled
                title="Demo — no checkout connected"
                className="mt-6 w-full rounded-lg bg-surface-2 text-text-muted py-2.5 text-sm font-medium cursor-not-allowed"
              >
                Sign in to purchase
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
