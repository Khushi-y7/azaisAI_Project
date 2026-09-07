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
