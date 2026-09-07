import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email(),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(2000),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Fill in every field." }, { status: 400 });
  }
  await db.contactMessage.create({ data: parsed.data });
  // No email service configured for this rebuild - the message is saved for
  // real, but nothing sends a notification or auto-reply. Disclosed in the UI.
  return NextResponse.json({ ok: true });
}
