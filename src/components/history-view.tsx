"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export interface HistoryItem {
  id: string;
  type: "image" | "video";
  model: string;
  prompt: string;
  status: "processing" | "succeeded" | "failed";
  costCredits: number;
  resultUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
}

const TABS = ["All", "Video", "Image", "Processing"] as const;

const statusStyles: Record<HistoryItem["status"], string> = {
  succeeded: "text-ok bg-ok-soft",
  failed: "text-critical bg-critical-soft",
  processing: "text-warn bg-warn-soft",
};

export function HistoryView({ items }: { items: HistoryItem[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (tab === "Video" && item.type !== "video") return false;
      if (tab === "Image" && item.type !== "image") return false;
      if (tab === "Processing" && item.status !== "processing") return false;
      if (query && !item.prompt.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [items, tab, query]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <p className="text-xs font-mono uppercase tracking-wide text-accent mb-2">Workspace</p>
      <h1 className="text-3xl font-bold">History</h1>
      <p className="text-sm text-text-muted mt-1">
        Review every generation, track status, and revisit past prompts.
      </p>

      <div className="mt-8 flex items-center justify-between border-b border-border pb-3">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? "bg-surface-2 text-text" : "text-text-muted hover:text-text"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search prompts…"
          className="w-48 rounded-lg bg-surface-2 border border-border px-3 py-1.5 text-sm outline-none focus:border-accent transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-24">
          <div className="w-14 h-14 rounded-full bg-surface-2 border border-border flex items-center justify-center text-2xl mb-4">
            ✨
          </div>
          <p className="font-semibold">No generations yet</p>
          <p className="text-sm text-text-muted mt-1">
            Start creating to see history here.
          </p>
          <Link
            href="/generate/video"
            className="mt-5 inline-flex items-center gap-2 bg-accent hover:bg-accent-strong transition-colors text-white font-medium text-sm px-4 py-2 rounded-lg"
          >
            Create your first video
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="glass-card overflow-hidden flex flex-col">
              <div className="aspect-square bg-surface-2 flex items-center justify-center relative">
                {item.status === "succeeded" && item.resultUrl ? (
                  item.type === "image" ? (
                    <Image src={item.resultUrl} alt={item.prompt} fill className="object-cover" />
                  ) : (
                    <video src={item.resultUrl} className="w-full h-full object-cover" muted controls />
                  )
                ) : item.status === "processing" ? (
                  <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
                ) : (
                  <span className="text-text-muted text-xs px-4 text-center">{item.errorMessage ?? "Failed"}</span>
                )}
                <span className={`absolute top-2 left-2 text-[10px] font-mono px-2 py-0.5 rounded-full ${statusStyles[item.status]}`}>
                  {item.status}
                </span>
              </div>
              <div className="p-3 flex-1 flex flex-col gap-2">
                <p className="text-sm line-clamp-2">{item.prompt}</p>
                <div className="mt-auto flex items-center justify-between text-[11px] text-text-muted font-mono">
                  <span>{item.type} · {item.model}</span>
                  <span>⚡ {item.costCredits}</span>
                </div>
                {item.status === "succeeded" && item.resultUrl && (
                  <a
                    href={item.resultUrl}
                    download
                    className="text-xs text-accent hover:underline"
                  >
                    Download
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
