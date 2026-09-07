"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  getPendingGenerations,
  removePendingGeneration,
  type PendingGeneration,
} from "@/lib/pending-generations";

const POLL_INTERVAL_MS = 4_000;

interface Toast {
  id: string;
  kind: "succeeded" | "failed";
  type: "video" | "image";
}

export function GenerationToastWatcher() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const inFlightRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      const pending = getPendingGenerations();
      if (pending.length === 0) return;

      await Promise.all(
        pending.map(async (entry: PendingGeneration) => {
          if (inFlightRef.current.has(entry.id)) return;
          inFlightRef.current.add(entry.id);
          try {
            const res = await fetch(`/api/generations/${entry.id}`);
            if (!res.ok) return;
            const data = await res.json();
            if (cancelled) return;

            if (data.status === "succeeded") {
              removePendingGeneration(entry.id);
              setToasts((prev) => [...prev, { id: entry.id, kind: "succeeded", type: entry.type }]);
            } else if (data.status === "failed") {
              removePendingGeneration(entry.id);
              setToasts((prev) => [...prev, { id: entry.id, kind: "failed", type: entry.type }]);
            }
          } catch {
            // network hiccup - just try again next tick
          } finally {
            inFlightRef.current.delete(entry.id);
          }
        })
      );
    }

    tick();
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      setTimeout(() => dismiss(t.id), 10_000)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 w-[min(360px,calc(100vw-2.5rem))]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="glass-card p-4 shadow-lg flex items-start gap-3 animate-in"
        >
          <span className="text-lg leading-none mt-0.5">
            {toast.kind === "succeeded" ? "✨" : "⚠️"}
          </span>
          <div className="flex-1 min-w-0">
            {toast.kind === "succeeded" ? (
              <>
                <p className="text-sm font-medium">Hey, your {toast.type} is generated. Have a look.</p>
                <Link
                  href="/history"
                  onClick={() => dismiss(toast.id)}
                  className="text-xs text-accent hover:underline mt-1 inline-block"
                >
                  View in History
                </Link>
              </>
            ) : (
              <p className="text-sm text-text-muted">
                Your {toast.type} generation did not work out this time. No credits were charged.
              </p>
            )}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="text-text-muted hover:text-text text-sm leading-none"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
