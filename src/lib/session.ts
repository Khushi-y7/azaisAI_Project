import { cookies } from "next/headers";
import { getIronSession, type IronSession } from "iron-session";

export interface SessionData {
  userId?: string;
  email?: string;
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error(
    "SESSION_SECRET is missing or too short (need 32+ chars) - set it in .env.local"
  );
}

export const sessionOptions = {
  password: sessionSecret,
  cookieName: "azaisai_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

/**
 * Same as getSession(), but also confirms the signed-in user still exists
 * in the database - self-healing for a session cookie left over from a
 * different database (a fresh local dev DB, a migration, a restore from
 * backup). Without this, every route that assumes session.userId points to
 * a real row would crash instead of just treating the visitor as logged out.
 */
export async function getValidatedSession(): Promise<IronSession<SessionData>> {
  const session = await getSession();
  if (!session.userId) return session;

  const { db } = await import("@/lib/db");
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    // Can't write the cookie from here (pages/Server Components can't
    // modify cookies, only Route Handlers/Server Actions can) - clearing
    // it in memory is enough to make every caller treat this as logged
    // out; the stale cookie itself gets overwritten next real login.
    session.userId = undefined;
    session.email = undefined;
  }
  return session;
}
