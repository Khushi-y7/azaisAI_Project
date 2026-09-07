import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { HistoryView, type HistoryItem } from "@/components/history-view";

export default async function HistoryPage() {
  const session = await getSession();
  if (!session.userId) {
    redirect("/auth/login?next=/history");
  }

  const generations = await db.generation.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  const items: HistoryItem[] = generations.map((g) => ({
    id: g.id,
    type: g.type as "image" | "video",
    model: g.model,
    prompt: g.prompt,
    status: g.status as "processing" | "succeeded" | "failed",
    costCredits: g.costCredits,
    resultUrl: g.resultUrl,
    errorMessage: g.errorMessage,
    createdAt: g.createdAt.toISOString(),
  }));

  return <HistoryView items={items} />;
}
