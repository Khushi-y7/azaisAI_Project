"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";

type Mode = "signup" | "login";

const copy = {
  signup: {
    heading: "Create account",
    switchLabel: "Already have an account?",
    switchHref: "/auth/login",
    switchCta: "Sign in",
  },
  login: {
    heading: "Welcome back",
    switchLabel: "Don't have an account?",
    switchHref: "/auth/signup",
    switchCta: "Sign up",
  },
};

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/generate/video";

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const c = copy[mode];

  async function sendCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setDemoCode(data.demoCode);
      setStep("code");
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md w-full px-4">
      <div className="glass-card p-8">
        <div className="flex items-center gap-2 mb-6">
          <Logo />
          <span className="font-semibold text-sm">AzaisAi</span>
        </div>

        <div className="flex gap-1.5 mb-6">
          <div className={`h-0.5 flex-1 rounded-full ${step === "email" ? "bg-accent" : "bg-accent/40"}`} />
          <div className={`h-0.5 flex-1 rounded-full ${step === "code" ? "bg-accent" : "bg-surface-2"}`} />
        </div>

        <h1 className="text-2xl font-semibold">{c.heading}</h1>
        <p className="text-sm text-text-muted mt-1 mb-6">
          {step === "email"
            ? "Enter your email to receive a sign-in code."
            : `Enter the code — since this demo has no email service wired up, it's shown below instead of sent.`}
        </p>

        {step === "email" ? (
          <form onSubmit={sendCode} className="space-y-4">
            <div>
              <label htmlFor="email" className="text-xs font-medium text-text-muted">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-lg bg-surface-2 border border-border px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors"
              />
            </div>
            {error && <p className="text-sm text-critical">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-accent hover:bg-accent-strong transition-colors text-white font-medium text-sm py-2.5 disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-4">
            {demoCode && (
              <div className="rounded-lg border border-accent/30 bg-accent-soft px-3.5 py-3 text-sm">
                <p className="text-text-muted text-xs mb-1">Demo mode — your code:</p>
                <p className="font-mono text-lg tracking-[0.3em] text-accent">{demoCode}</p>
              </div>
            )}
            <div>
              <label htmlFor="code" className="text-xs font-medium text-text-muted">
                6-digit code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="mt-1.5 w-full rounded-lg bg-surface-2 border border-border px-3.5 py-2.5 text-sm font-mono tracking-[0.3em] outline-none focus:border-accent transition-colors"
              />
            </div>
            {error && <p className="text-sm text-critical">{error}</p>}
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full rounded-lg bg-accent hover:bg-accent-strong transition-colors text-white font-medium text-sm py-2.5 disabled:opacity-60"
            >
              {loading ? "Verifying…" : "Verify & continue"}
            </button>
            <button
              type="button"
              onClick={() => setStep("email")}
              className="w-full text-xs text-text-muted hover:text-text"
            >
              Use a different email
            </button>
          </form>
        )}

        <p className="text-center text-sm text-text-muted mt-6">
          {c.switchLabel}{" "}
          <Link href={c.switchHref} className="text-accent hover:underline">
            {c.switchCta}
          </Link>
        </p>
      </div>
    </div>
  );
}
