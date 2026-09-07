"use client";

import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();
  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }
  return (
    <button
      onClick={signOut}
      className="rounded-lg border border-border px-4 py-2 text-sm text-text-muted hover:text-text hover:border-text-muted transition-colors"
    >
      Sign out
    </button>
  );
}
