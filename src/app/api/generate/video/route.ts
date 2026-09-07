import { NextResponse } from "next/server";
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

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Sign in to generate." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Describe what you want to see first." }, { status: 400 });
  }
  const { prompt, duration, motionId, aspectRatioId } = parsed.data;
  const motion = findMotionPreset(motionId);
  const aspectRatio = findVideoAspectRatio(aspectRatioId);
  const cost = duration * VIDEO_MODEL.costPerSecond;

  try {
    await holdCredits(session.userId, cost);
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json({ error: "Not enough credits for this generation." }, { status: 402 });
    }
    throw err;
  }

  const generation = await db.generation.create({
    data: {
      userId: session.userId,
      type: "video",
      model: VIDEO_MODEL.id,
      prompt,
      paramsJson: JSON.stringify({ duration, motionId, aspectRatioId }),
      status: "processing",
      costCredits: cost,
    },
  });

  const finalPrompt = motion ? `${prompt}, ${motion.modifier}` : prompt;
  const result = await generateVideo({ prompt: finalPrompt, duration, aspectRatio: aspectRatio.id });

  if (result.ok && result.url) {
    await db.generation.update({
      where: { id: generation.id },
      data: { status: "succeeded", resultUrl: result.url, completedAt: new Date() },
    });
    await recordCharge(session.userId, cost, generation.id);
    return NextResponse.json({ ok: true, id: generation.id, url: result.url });
  }

  await db.generation.update({
    where: { id: generation.id },
    data: { status: "failed", errorMessage: result.error, completedAt: new Date() },
  });
  await refundCredits(session.userId, cost, generation.id);
  return NextResponse.json({ error: result.error ?? "Generation failed." }, { status: 502 });
}
