import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { holdCredits, InsufficientCreditsError } from "@/lib/credits";
import { submitVideoJob } from "@/lib/pixazo";
import { VIDEO_MODEL, VIDEO_DURATIONS, findMotionPreset, findVideoAspectRatio } from "@/lib/models";

const bodySchema = z.object({
  prompt: z.string().trim().min(3).max(1000),
  duration: z.number().int().refine((d) => (VIDEO_DURATIONS as readonly number[]).includes(d)),
  motionId: z.string().nullable(),
  aspectRatioId: z.string(),
});

// Video generation takes 1-2 minutes - far longer than a serverless
// function is allowed to run. So this route only submits the job to
// Pixazo (a fast, single request) and stores its polling URL. Nothing
// here waits for completion; GET /api/generations/[id] advances the job
// by one status check each time it's polled, which the client already
// does every few seconds. That keeps every request fast and Vercel-safe,
// and means the job can be checked on again at any point in the future,
// even if no one polled for a while - Pixazo does the actual work
// independently of whether we're watching it.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Sign in to generate." }, { status: 401 });
  }
  const userId = session.userId;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Describe what you want to see first." }, { status: 400 });
  }
  const { prompt, duration, motionId, aspectRatioId } = parsed.data;
  const motion = findMotionPreset(motionId);
  const aspectRatio = findVideoAspectRatio(aspectRatioId);
  const cost = duration * VIDEO_MODEL.costPerSecond;

  try {
    await holdCredits(userId, cost);
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json({ error: "Not enough credits for this generation." }, { status: 402 });
    }
    throw err;
  }

  const finalPrompt = motion ? `${prompt}, ${motion.modifier}` : prompt;
  const submitted = await submitVideoJob({ prompt: finalPrompt, duration, aspectRatio: aspectRatio.id });

  if (!submitted.ok || !submitted.pollingUrl) {
    // Nothing was actually queued, so refund immediately rather than
    // create a generation row that could never succeed.
    const { refundCredits } = await import("@/lib/credits");
    const failedRecord = await db.generation.create({
      data: {
        userId,
        type: "video",
        model: VIDEO_MODEL.id,
        prompt,
        paramsJson: JSON.stringify({ duration, motionId, aspectRatioId }),
        status: "failed",
        costCredits: cost,
        errorMessage: submitted.error,
        completedAt: new Date(),
      },
    });
    await refundCredits(userId, cost, failedRecord.id);
    return NextResponse.json({ error: submitted.error ?? "Generation failed." }, { status: 502 });
  }

  const generation = await db.generation.create({
    data: {
      userId,
      type: "video",
      model: VIDEO_MODEL.id,
      prompt,
      paramsJson: JSON.stringify({ duration, motionId, aspectRatioId }),
      status: "processing",
      costCredits: cost,
      externalRef: submitted.pollingUrl,
    },
  });

  return NextResponse.json({ ok: true, id: generation.id, status: "processing" }, { status: 202 });
}
