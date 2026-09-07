"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { VIDEO_MODEL, VIDEO_DURATIONS, MOTION_PRESETS } from "@/lib/models";

export function VideoStudio({ loggedIn }: { loggedIn: boolean }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState<number>(6);
  const [motionId, setMotionId] = useState<string | null>("arc-orbit");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "unavailable">("idle");
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const cost = duration * VIDEO_MODEL.costPerSecond;

  async function handleGenerate() {
    if (!loggedIn) {
      router.push("/auth/signup?next=/generate/video");
      return;
    }
    if (prompt.trim().length < 3) {
      setError("Describe your video first.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/generate/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, duration, motionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        const unavailable = typeof data.error === "string" && data.error.includes("funded Pollinations balance");
        setError(data.error ?? "Generation failed.");
        setStatus(unavailable ? "unavailable" : "error");
        return;
      }
      setResultUrl(data.url);
      setStatus("idle");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Try again.");
      setStatus("error");
    }
  }

  return (
    <div className="w-full mx-auto max-w-6xl px-4 sm:px-6 py-6 grid lg:grid-cols-[380px_1fr] gap-6 lg:h-[calc(100vh_-_7rem)] lg:min-h-[560px]">
      {/* Left panel */}
      <div className="space-y-6 lg:h-full lg:overflow-y-auto lg:pr-2">
        <div>
          <h1 className="text-lg font-semibold">Video Studio</h1>
          <p className="text-xs text-text-muted mt-1">
            {VIDEO_MODEL.label} · via {VIDEO_MODEL.provider}
          </p>
        </div>

        <div>
          <p className="text-xs font-mono uppercase tracking-wide text-text-muted mb-2">
            Describe your video
          </p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="A neon-lit city drone shot with slow cinematic movement and bold typography overlays."
            className="w-full rounded-lg bg-surface-2 border border-border px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors resize-none"
          />
        </div>

        <div>
          <p className="text-xs font-mono uppercase tracking-wide text-text-muted mb-2">Duration</p>
          <div className="flex gap-2">
            {VIDEO_DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`rounded-lg border px-3.5 py-2 text-xs font-mono transition-colors ${
                  duration === d
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border text-text-muted hover:text-text"
                }`}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-mono uppercase tracking-wide text-text-muted mb-2">Motion</p>
          <div className="space-y-3">
            {MOTION_PRESETS.map((group) => (
              <div key={group.group}>
                <p className="text-[10px] uppercase tracking-wide text-text-muted mb-1.5">{group.group}</p>
                <div className="space-y-1.5">
                  {group.options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setMotionId(motionId === opt.id ? null : opt.id)}
                      className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                        motionId === opt.id
                          ? "border-accent bg-accent-soft"
                          : "border-border hover:border-text-muted"
                      }`}
                    >
                      <p className={`text-xs font-medium ${motionId === opt.id ? "text-accent" : "text-text"}`}>
                        {opt.label}
                      </p>
                      <p className="text-[11px] text-text-muted mt-0.5">{opt.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && status !== "unavailable" && <p className="text-sm text-critical">{error}</p>}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm text-text-muted">Estimated cost</span>
          <span className="inline-flex items-center gap-1.5 text-sm font-mono">
            ⚡ {cost} credits
          </span>
        </div>
        <button
          onClick={handleGenerate}
          disabled={status === "loading"}
          className="w-full rounded-lg bg-accent hover:bg-accent-strong transition-colors text-white font-medium text-sm py-2.5 disabled:opacity-60"
        >
          {status === "loading" ? "Generating…" : loggedIn ? "Generate video" : "Sign up to generate"}
        </button>
      </div>

      {/* Right panel */}
      <div className="glass-card min-h-[420px] lg:h-full lg:min-h-0 flex items-center justify-center relative overflow-hidden">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-3 text-text-muted px-6 text-center">
            <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin" />
            <p className="text-sm">Generating with {VIDEO_MODEL.label} — this can take a while</p>
          </div>
        )}

        {status !== "loading" && resultUrl && (
          <video src={resultUrl} controls className="w-full h-full object-contain" />
        )}

        {status !== "loading" && !resultUrl && status === "unavailable" && (
          <div className="px-8 text-center">
            <p className="text-sm font-medium text-warn mb-2">Video generation needs a funded balance</p>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              {VIDEO_MODEL.label} runs on Pollinations&apos; paid tier — the free key
              this demo uses doesn&apos;t cover it. This is a real, working
              integration, just gated behind a small top-up at{" "}
              <a href="https://enter.pollinations.ai/pollen" target="_blank" rel="noreferrer" className="text-accent hover:underline">
                enter.pollinations.ai/pollen
              </a>. No credits were charged for this attempt.
            </p>
            <Link href="/generate/image" className="inline-block mt-4 text-xs text-accent hover:underline">
              Try Image Generation instead — fully free →
            </Link>
          </div>
        )}

        {status !== "loading" && !resultUrl && status !== "unavailable" && (
          <p className="text-sm text-text-muted px-8 text-center">
            Your generation will appear here.
          </p>
        )}
      </div>
    </div>
  );
}
