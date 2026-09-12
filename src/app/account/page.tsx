import { redirect } from "next/navigation";
import { getValidatedSession } from "@/lib/session";
import { db } from "@/lib/db";
import { SignOutButton } from "@/components/sign-out-button";

export default async function AccountPage() {
  const session = await getValidatedSession();
  if (!session.userId) {
    redirect("/auth/login?next=/account");
  }
  const user = await db.user.findUniqueOrThrow({ where: { id: session.userId } });
  const generationCount = await db.generation.count({ where: { userId: user.id } });

  return (
    <div className="mx-auto max-w-lg px-4 sm:px-6 py-16">
      <h1 className="text-2xl font-bold mb-8">Account</h1>
      <div className="glass-card p-6 space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Email</span>
          <span className="font-mono">{user.email}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Credit balance</span>
          <span className="font-mono">⚡ {user.creditsBalance}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Total generations</span>
          <span className="font-mono">{generationCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Member since</span>
          <span className="font-mono">{user.createdAt.toISOString().slice(0, 10)}</span>
        </div>
      </div>
      <div className="mt-6">
        <SignOutButton />
      </div>
    </div>
  );
}
