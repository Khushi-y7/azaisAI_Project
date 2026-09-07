import { NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { holdCredits, refundCredits, recordCharge, InsufficientCreditsError } from "@/lib/credits";
import { generateVideo } from "@/lib/pixazo";
import { VIDEO_MODEL, VIDEO_DURATIONS, findMotionPreset, findVideoAspectRatio } from "@/lib/models";

const bodySchema = z.object({
  prompt: z.string().trim().min(3).max(1000),
  duration: z.number().int().refine((d) => (VIDEO_DURATIONS as readonly number[]).includes(d)),
  motionId: z.string().nullable(),
  aspectRatioId: z.string(),
});

// Video generation takes 1-2 minutes. Instead of holding this request open
// the whole time (which dies the moment the tab closes or the request
// times out), this route just starts the job, records it, and returns
// right away. The actual provider call runs in `after()`, which keeps the
// server working past the response - the client separately polls
// GET /api/generations/[id] to find out when it's done, and a global
// watcher (see GenerationToastWatcher) keeps checking even if the user
// navigates elsewhere in the app.
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

  const generation = await db.generation.create({
    data: {
      userId,
      type: "video",
      model: VIDEO_MODEL.id,
      prompt,
      paramsJson: JSON.stringify({ duration, motionId, aspectRatioId }),
      status: "processing",
      costCredits: cost,
    },
  });

  const finalPrompt = motion ? `${prompt}, ${motion.modifier}` : prompt;

  after(async () => {
    const result = await generateVideo({ prompt: finalPrompt, duration, aspectRatio: aspectRatio.id });

    if (result.ok && result.url) {
      await db.generation.update({
        where: { id: generation.id },
        data: { status: "succeeded", resultUrl: result.url, completedAt: new Date() },
      });
      await recordCharge(userId, cost, generation.id);
      return;
    }

    await db.generation.update({
      where: { id: generation.id },
      data: { status: "failed", errorMessage: result.error, completedAt: new Date() },
    });
    await refundCredits(userId, cost, generation.id);
  });

  return NextResponse.json({ ok: true, id: generation.id, status: "processing" }, { status: 202 });
}
