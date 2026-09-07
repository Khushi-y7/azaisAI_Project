import Link from "next/link";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { NavLinks } from "@/components/nav-links";
import { Logo } from "@/components/logo";

export async function SiteHeader() {
  const session = await getSession();
  const loggedIn = Boolean(session.userId);

  let credits = 0;
  let initials = "";
  if (loggedIn && session.userId) {
    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (user) {
      credits = user.creditsBalance;
      initials = user.email.slice(0, 2).toUpperCase();
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/85 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Logo />
            <span className="font-semibold text-[15px] tracking-tight">
              AzaisAi
            </span>
          </Link>
          <NavLinks loggedIn={loggedIn} />
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/upgrade"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-accent border border-accent/30 bg-accent-soft hover:bg-accent/20 transition-colors"
          >
            Pricing
          </Link>

          {loggedIn ? (
            <>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono text-text-muted border border-border bg-surface">
                ⚡ {credits} cr
              </span>
              <Link
                href="/account"
                className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center text-xs font-mono font-medium"
                title={session.email}
              >
                {initials}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-text-muted hover:text-text transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-accent text-white hover:bg-accent-strong transition-colors"
              >
                Sign Up Free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
