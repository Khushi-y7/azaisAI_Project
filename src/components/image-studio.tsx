"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  IMAGE_MODEL,
  IMAGE_STYLES,
  IMAGE_ASPECT_RATIOS,
} from "@/lib/models";

const EXAMPLE = {
  url: "/examples/a-portrait.jpg",
  caption: "Cinematic portrait of a woman with golden light, film grain, shallow depth of field",
};

export function ImageStudio({ loggedIn }: { loggedIn: boolean }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [styleId, setStyleId] = useState<string>("cinematic");
  const [aspectRatioId, setAspectRatioId] = useState<string>("1:1");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [showExample, setShowExample] = useState(true);

  const aspectRatio = IMAGE_ASPECT_RATIOS.find((a) => a.id === aspectRatioId)!;

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
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 grid lg:grid-cols-[380px_1fr] gap-6">
      {/* Left panel */}
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold">Text to image</h1>
          <p className="text-xs text-text-muted mt-1">
            {IMAGE_MODEL.label} · via {IMAGE_MODEL.provider} · real generation, not a mock
          </p>
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

      {/* Right panel: preview */}
      <div className="glass-card min-h-[420px] flex items-center justify-center relative overflow-hidden">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-3 text-text-muted">
            <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin" />
            <p className="text-sm">
              Generating with {IMAGE_MODEL.label} — usually ~{IMAGE_MODEL.etaSeconds}s
            </p>
          </div>
        )}

        {status !== "loading" && resultUrl && (
          <Image
            src={resultUrl}
            alt={prompt}
            width={aspectRatio.width}
            height={aspectRatio.height}
            className="w-full h-auto max-h-[70vh] object-contain"
          />
        )}

        {status !== "loading" && !resultUrl && showExample && (
          <div className="relative w-full">
            <button
              onClick={() => setShowExample(false)}
              className="absolute top-3 left-3 z-10 text-xs bg-black/50 backdrop-blur px-2.5 py-1 rounded-full text-white/80 hover:text-white"
            >
              Hide example
            </button>
            <Image
              src={EXAMPLE.url}
              alt={EXAMPLE.caption}
              width={800}
              height={800}
              className="w-full h-auto max-h-[70vh] object-contain opacity-90"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-[10px] font-mono uppercase tracking-wide text-white/60 mb-1">Example</p>
              <p className="text-xs text-white/90 leading-snug">{EXAMPLE.caption}</p>
            </div>
          </div>
        )}

        {status !== "loading" && !resultUrl && !showExample && (
          <p className="text-sm text-text-muted">Your generation will appear here.</p>
        )}
      </div>
    </div>
  );
}
