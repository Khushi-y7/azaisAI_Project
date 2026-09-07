import { db } from "@/lib/db";

export class InsufficientCreditsError extends Error {
  constructor() {
    super("Insufficient credits.");
  }
}

/**
 * Atomically deducts `amount` credits from a user, but only if their balance
 * covers it. This is the "hold" - if the generation later fails, call
 * refundCredits with the same amount so nothing was ever really charged.
 */
export async function holdCredits(userId: string, amount: number) {
  await db.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.creditsBalance < amount) {
      throw new InsufficientCreditsError();
    }
    await tx.user.update({
      where: { id: userId },
      data: { creditsBalance: { decrement: amount } },
    });
  });
}

export async function refundCredits(
  userId: string,
  amount: number,
  refGenerationId: string
) {
  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { creditsBalance: { increment: amount } },
    }),
    db.creditTransaction.create({
      data: {
        userId,
        delta: amount,
        reason: "generation_refund",
        refGenerationId,
      },
    }),
  ]);
}

export async function recordCharge(
  userId: string,
  amount: number,
  refGenerationId: string
) {
  await db.creditTransaction.create({
    data: {
      userId,
      delta: -amount,
      reason: "generation_charge",
      refGenerationId,
    },
  });
}
