import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateCode, hashCode, codeExpiry } from "@/lib/otp";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 }
    );
  }
  const { email } = parsed.data;

  // Basic throttle: don't allow more than one unconsumed code request per
  // email within the last 30 seconds - keeps the demo from being spammed.
  const recent = await db.loginCode.findFirst({
    where: { email, createdAt: { gt: new Date(Date.now() - 30_000) } },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    return NextResponse.json(
      { error: "A code was just sent. Wait a few seconds and try again." },
      { status: 429 }
    );
  }

  const code = generateCode();
  await db.loginCode.create({
    data: {
      email,
      codeHash: hashCode(code, email),
      expiresAt: codeExpiry(),
    },
  });

  // No email-sending service is configured for this rebuild - see
  // docs/implementation-plan.md. The code is returned directly instead of
  // emailed, clearly labeled in the UI as a demo shortcut.
  return NextResponse.json({ ok: true, demoCode: code });
}
