import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { recordCharge, refundCredits } from "@/lib/credits";
import { checkVideoJob } from "@/lib/pixazo";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const { id } = await params;
  let generation = await db.generation.findUnique({ where: { id } });

  if (!generation || generation.userId !== session.userId) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  // Video jobs are advanced here rather than by a long-running server
  // task: each poll (the client already polls every few seconds) does one
  // quick check against the provider and updates the row if it finished.
  if (generation.status === "processing" && generation.type === "video" && generation.externalRef) {
    const result = await checkVideoJob(generation.externalRef);

    if (result.status === "succeeded" && result.url) {
      generation = await db.generation.update({
        where: { id },
        data: { status: "succeeded", resultUrl: result.url, completedAt: new Date() },
      });
      await recordCharge(session.userId, generation.costCredits, generation.id);
    } else if (result.status === "failed") {
      generation = await db.generation.update({
        where: { id },
        data: { status: "failed", errorMessage: result.error, completedAt: new Date() },
      });
      await refundCredits(session.userId, generation.costCredits, generation.id);
    }
    // "processing" - nothing to update, the job's still running upstream.
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
