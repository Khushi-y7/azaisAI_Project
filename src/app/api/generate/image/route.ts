import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { holdCredits, refundCredits, recordCharge, InsufficientCreditsError } from "@/lib/credits";
import { generateImage } from "@/lib/pollinations";
import { IMAGE_MODEL, findStyle, findAspectRatio } from "@/lib/models";

const bodySchema = z.object({
  prompt: z.string().trim().min(3).max(1000),
  styleId: z.string(),
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
  const { prompt, styleId, aspectRatioId } = parsed.data;
  const style = findStyle(styleId);
  const aspectRatio = findAspectRatio(aspectRatioId);
  const cost = IMAGE_MODEL.costCredits;

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
      type: "image",
      model: IMAGE_MODEL.id,
      prompt,
      paramsJson: JSON.stringify({ styleId, aspectRatioId }),
      status: "processing",
      costCredits: cost,
    },
  });

  const finalPrompt = style.modifier ? `${prompt}, ${style.modifier}` : prompt;
  const result = await generateImage({
    prompt: finalPrompt,
    width: aspectRatio.width,
    height: aspectRatio.height,
  });

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
