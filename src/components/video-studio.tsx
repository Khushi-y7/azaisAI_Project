"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  VIDEO_MODEL,
  VIDEO_DURATIONS,
  VIDEO_ASPECT_RATIOS,
  MOTION_PRESETS,
  findVideoAspectRatio,
} from "@/lib/models";
import { addPendingGeneration, getPendingGenerations } from "@/lib/pending-generations";

const FRAME_MARGIN = 32;
const POLL_INTERVAL_MS = 4_000;

export function VideoStudio({ loggedIn }: { loggedIn: boolean }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState<number>(VIDEO_DURATIONS[0]);
  const [aspectRatioId, setAspectRatioId] = useState<string>("16:9");
  const [motionId, setMotionId] = useState<string | null>("arc-orbit");
  // Lazy initializer, not an effect: if a video from a previous visit is
  // still processing (see the resume effect below), start already showing
  // the loading state instead of flashing a blank form for a frame.
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "not-configured">(() =>
    typeof window !== "undefined" && getPendingGenerations().some((g) => g.type === "video")
      ? "loading"
      : "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const aspectRatio = findVideoAspectRatio(aspectRatioId);
  const ratio = aspectRatio.id === "16:9" ? 16 / 9 : 9 / 16;
  const cost = duration * VIDEO_MODEL.costPerSecond;

  const panelRef = useRef<HTMLDivElement>(null);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    function recompute() {
      const availableW = Math.max(panel!.clientWidth - FRAME_MARGIN, 0);
      const availableH = Math.max(panel!.clientHeight - FRAME_MARGIN, 0);
      if (availableW <= 0 || availableH <= 0) return;
      if (availableW / availableH > ratio) {
        setFrameSize({ width: availableH * ratio, height: availableH });
      } else {
        setFrameSize({ width: availableW, height: availableW / ratio });
      }
    }
    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [ratio]);

  // If a video was still processing the last time this page was open (the
  // user navigated away and came back, or reloaded), pick the loading
  // state back up instead of showing a blank form.
  useEffect(() => {
    const pending = getPendingGenerations().find((g) => g.type === "video");
    if (pending) {
      pollGeneration(pending.id);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pollGeneration(id: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/generations/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "succeeded") {
          if (pollRef.current) clearInterval(pollRef.current);
          setResultUrl(data.resultUrl);
          setStatus("idle");
          router.refresh();
        } else if (data.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          setError(data.errorMessage ?? "Generation failed.");
          setStatus("error");
          router.refresh();
        }
      } catch {
        // transient network hiccup, keep polling
      }
    }, POLL_INTERVAL_MS);
  }

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
    setResultUrl(null);
    try {
      const res = await fetch("/api/generate/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, duration, motionId, aspectRatioId }),
      });
      const data = await res.json();
      if (!res.ok) {
        const notConfigured = typeof data.error === "string" && data.error.includes("PIXAZO_API_KEY is missing");
        setError(data.error ?? "Generation failed.");
        setStatus(notConfigured ? "not-configured" : "error");
        return;
      }
      // The job now keeps running on the server (see the route's use of
      // `after`) no matter what happens to this tab. Track it so both this
      // page's own polling and the global toast watcher can find it.
      addPendingGeneration({ id: data.id, type: "video", startedAt: Date.now() });
      pollGeneration(data.id);
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
            {VIDEO_MODEL.label} · via {VIDEO_MODEL.provider} · real generation, not a mock
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
          <p className="text-xs font-mono uppercase tracking-wide text-text-muted mb-2">Aspect ratio</p>
          <div className="flex gap-2">
            {VIDEO_ASPECT_RATIOS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAspectRatioId(a.id)}
                className={`rounded-lg border px-3.5 py-2 text-xs font-mono transition-colors ${
                  aspectRatioId === a.id
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border text-text-muted hover:text-text"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
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

        {error && status === "error" && <p className="text-sm text-critical">{error}</p>}

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
        {status === "loading" && (
          <p className="text-xs text-text-muted text-center">
            Feel free to browse elsewhere. It keeps generating in the background and we will let you know when it is ready.
          </p>
        )}
      </div>

      {/* Right panel: backdrop, always fills the viewport height */}
      <div ref={panelRef} className="glass-card lg:h-full lg:min-h-0 min-h-[420px] flex items-center justify-center relative overflow-hidden">
        <div
          className="relative rounded-lg overflow-hidden bg-surface-2 border border-border transition-[width,height] duration-200"
          style={
            frameSize.width > 0
              ? { width: frameSize.width, height: frameSize.height }
              : { width: "90%", height: "90%" }
          }
        >
          {status === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-text-muted px-6 text-center">
              <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin" />
              <p className="text-sm">
                Generating with {VIDEO_MODEL.label}. Usually under a minute, sometimes longer.
              </p>
            </div>
          )}

          {status !== "loading" && resultUrl && (
            <video src={resultUrl} controls className="absolute inset-0 w-full h-full object-cover" />
          )}

          {status !== "loading" && !resultUrl && status === "not-configured" && (
            <div className="absolute inset-0 flex items-center justify-center px-8 text-center">
              <div>
                <p className="text-sm font-medium text-warn mb-2">Video generation isn&apos;t configured</p>
                <p className="text-xs text-text-muted max-w-sm mx-auto">
                  This server is missing <code className="font-mono">PIXAZO_API_KEY</code>. Get a free key at{" "}
                  <a href="https://www.pixazo.ai/api/free" target="_blank" rel="noreferrer" className="text-accent hover:underline">
                    pixazo.ai/api/free
                  </a>{" "}
                  and add it to the environment. No credits were charged for this attempt.
                </p>
              </div>
            </div>
          )}

          {status !== "loading" && !resultUrl && status === "error" && (
            <div className="absolute inset-0 flex items-center justify-center px-8 text-center">
              <p className="text-sm text-critical">{error}</p>
            </div>
          )}

          {status !== "loading" && !resultUrl && status === "idle" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-text-muted px-4 text-center">Your generation will appear here.</p>
            </div>
          )}
        </div>

        <span className="absolute bottom-3 right-3 text-[10px] font-mono text-text-muted">
          {aspectRatio.label}
        </span>
      </div>
    </div>
  );
}
