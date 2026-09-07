import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Logo size={20} />
            <span className="font-semibold text-sm">AzaisAi</span>
          </div>
          <p className="text-sm text-text-muted max-w-sm">
            Generate cinematic videos and stunning images from a single
            prompt. Built on real, working generation providers — not a
            simulation.
          </p>
          <div className="flex gap-2 mt-4">
            {["Sana", "LTX"].map((m) => (
              <span
                key={m}
                className="text-[11px] font-mono text-text-muted border border-border rounded-full px-2 py-1"
              >
                {m}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-mono uppercase tracking-wide text-accent mb-3">
            Product
          </h3>
          <ul className="space-y-2 text-sm text-text-muted">
            <li><Link href="/generate/video" className="hover:text-text">Video Generation</Link></li>
            <li><Link href="/generate/image" className="hover:text-text">Image Generation</Link></li>
            <li><Link href="/upgrade" className="hover:text-text">Pricing</Link></li>
            <li><Link href="/history" className="hover:text-text">History</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-mono uppercase tracking-wide text-accent mb-3">
            Company
          </h3>
          <ul className="space-y-2 text-sm text-text-muted">
            <li><Link href="/about" className="hover:text-text">About</Link></li>
            <li><Link href="/contact" className="hover:text-text">Contact</Link></li>
            <li><Link href="/faq" className="hover:text-text">FAQ</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex flex-wrap gap-3 justify-between text-xs text-text-muted">
          <span>© 2026 AzaisAi. Rebuild project — not affiliated with the original.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-text">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-text">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
