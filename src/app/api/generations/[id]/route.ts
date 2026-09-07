import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const { id } = await params;
  const generation = await db.generation.findUnique({ where: { id } });

  if (!generation || generation.userId !== session.userId) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({
    id: generation.id,
    type: generation.type,
    prompt: generation.prompt,
    status: generation.status,
    resultUrl: generation.resultUrl,
    errorMessage: generation.errorMessage,
  });
}
