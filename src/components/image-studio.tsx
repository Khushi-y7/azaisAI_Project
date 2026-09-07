"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  IMAGE_MODEL,
  IMAGE_STYLES,
  IMAGE_ASPECT_RATIOS,
  findAspectRatio,
} from "@/lib/models";

const EXAMPLE = {
  url: "/examples/a-portrait.jpg",
  caption: "Cinematic portrait of a woman with golden light, film grain, shallow depth of field",
};

const FRAME_MARGIN = 32; // breathing room between the frame and the panel edge, px

export function ImageStudio({ loggedIn }: { loggedIn: boolean }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [styleId, setStyleId] = useState<string>("cinematic");
  const [aspectRatioId, setAspectRatioId] = useState<string>("1:1");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [showExample, setShowExample] = useState(true);

  const aspectRatio = findAspectRatio(aspectRatioId);
  const ratio = aspectRatio.width / aspectRatio.height;

  // The frame's box (in px) is recomputed to be the largest rectangle of
  // the selected aspect ratio that fits inside the panel - the same math
  // as object-fit: contain, but for a real element, so buttons/captions
  // inside it stay anchored to the frame's actual edges, not the panel's.
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

  async function handleGenerate() {
    if (!loggedIn) {
      router.push("/auth/signup?next=/generate/image");
      return;
    }
    if (prompt.trim().length < 3) {
      setError("Describe your image first.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setError(null);
    setShowExample(false);
    try {
      const res = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, styleId, aspectRatioId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Generation failed.");
        setStatus("error");
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
          <h1 className="text-lg font-semibold">Text to image</h1>
          <p className="text-[11px] text-text-muted uppercase tracking-wide mt-1.5">Generate image</p>
          <p className="text-base font-semibold text-glow mt-0.5">tokens on me, spam it.</p>
        </div>

        <div>
          <p className="text-xs font-mono uppercase tracking-wide text-text-muted mb-2">Style</p>
          <div className="grid grid-cols-3 gap-2">
            {IMAGE_STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyleId(s.id)}
                className={`rounded-lg border px-2 py-3 text-xs font-medium transition-colors ${
                  styleId === s.id
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border text-text-muted hover:text-text hover:border-text-muted"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-mono uppercase tracking-wide text-text-muted">
              Describe your image
            </p>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="A majestic mountain landscape at golden hour with dramatic clouds and a serene lake reflection..."
            className="w-full rounded-lg bg-surface-2 border border-border px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors resize-none"
          />
        </div>

        <div>
          <p className="text-xs font-mono uppercase tracking-wide text-text-muted mb-2">Aspect ratio</p>
          <div className="flex gap-2 flex-wrap">
            {IMAGE_ASPECT_RATIOS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAspectRatioId(a.id)}
                className={`rounded-lg border px-3 py-2 text-xs font-mono transition-colors ${
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

        {error && <p className="text-sm text-critical">{error}</p>}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm text-text-muted">Cost</span>
          <span className="inline-flex items-center gap-1.5 text-sm font-mono">
            ⚡ {IMAGE_MODEL.costCredits} credit{IMAGE_MODEL.costCredits > 1 ? "s" : ""}
          </span>
        </div>
        <button
          onClick={handleGenerate}
          disabled={status === "loading"}
          className="w-full rounded-lg bg-accent hover:bg-accent-strong transition-colors text-white font-medium text-sm py-2.5 disabled:opacity-60"
        >
          {status === "loading" ? "Generating…" : loggedIn ? "Generate image" : "Sign up to generate"}
        </button>
      </div>

      {/* Right panel: backdrop, always fills the viewport height */}
      <div ref={panelRef} className="glass-card lg:h-full lg:min-h-0 min-h-[420px] flex items-center justify-center relative overflow-hidden">
        {/* Frame: reshapes to the selected aspect ratio, so you can see
            exactly how a generation will be cropped before spending credits. */}
        <div
          className="relative rounded-lg overflow-hidden bg-surface-2 border border-border transition-[width,height] duration-200"
          style={
            frameSize.width > 0
              ? { width: frameSize.width, height: frameSize.height }
              : { width: "90%", height: "90%" }
          }
        >
          {status === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-text-muted">
              <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin" />
              <p className="text-sm px-4 text-center">
                Generating with {IMAGE_MODEL.label}, usually about {IMAGE_MODEL.etaSeconds}s
              </p>
            </div>
          )}

          {status !== "loading" && resultUrl && (
            <Image
              src={resultUrl}
              alt={prompt}
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover"
            />
          )}

          {status !== "loading" && !resultUrl && showExample && (
            <>
              <button
                onClick={() => setShowExample(false)}
                className="absolute top-3 left-3 z-10 text-xs bg-black/50 backdrop-blur px-2.5 py-1 rounded-full text-white/80 hover:text-white"
              >
                Hide example
              </button>
              <Image
                src={EXAMPLE.url}
                alt={EXAMPLE.caption}
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="object-cover opacity-90"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <p className="text-[10px] font-mono uppercase tracking-wide text-white/60 mb-1">Example</p>
                <p className="text-xs text-white/90 leading-snug">{EXAMPLE.caption}</p>
              </div>
            </>
          )}

          {status !== "loading" && !resultUrl && !showExample && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <p className="text-sm text-text-muted px-4 text-center">Your generation will appear here.</p>
              <button
                onClick={() => setShowExample(true)}
                className="text-xs text-accent hover:underline"
              >
                Show example
              </button>
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
