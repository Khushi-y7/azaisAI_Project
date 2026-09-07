import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashCode, SIGNUP_GRANT_CREDITS } from "@/lib/otp";
import { getSession } from "@/lib/session";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().trim().length(6),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });
  }
  const { email, code } = parsed.data;
  const codeHash = hashCode(code, email);

  const loginCode = await db.loginCode.findFirst({
    where: { email, codeHash, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!loginCode) {
    return NextResponse.json(
      { error: "That code is incorrect or has expired." },
      { status: 400 }
    );
  }

  await db.loginCode.update({
    where: { id: loginCode.id },
    data: { consumedAt: new Date() },
  });

  let user = await db.user.findUnique({ where: { email } });
  let isNewUser = false;
  if (!user) {
    isNewUser = true;
    user = await db.user.create({
      data: { email, creditsBalance: SIGNUP_GRANT_CREDITS },
    });
    await db.creditTransaction.create({
      data: {
        userId: user.id,
        delta: SIGNUP_GRANT_CREDITS,
        reason: "signup_grant",
      },
    });
  }

  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  await session.save();

  return NextResponse.json({ ok: true, isNewUser });
}
