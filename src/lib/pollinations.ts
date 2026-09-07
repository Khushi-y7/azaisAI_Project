const POLLINATIONS_KEY = process.env.POLLINATIONS_API_KEY;

function authHeaders(): HeadersInit {
  return POLLINATIONS_KEY ? { Authorization: `Bearer ${POLLINATIONS_KEY}` } : {};
}

export interface GenerateResult {
  ok: boolean;
  url?: string;
  error?: string;
  /** true if the failure means "try again later / not our fault" vs a hard error */
  retryable?: boolean;
}

export async function generateImage(params: {
  prompt: string;
  width: number;
  height: number;
}): Promise<GenerateResult> {
  const encoded = encodeURIComponent(params.prompt);
  const qs = new URLSearchParams({
    model: "sana",
    width: String(params.width),
    height: String(params.height),
    nologo: "true",
  });
  const url = `https://image.pollinations.ai/prompt/${encoded}?${qs.toString()}`;

  try {
    // Pollinations serves this URL as an immutable, cacheable resource
    // (cache-control: public, max-age=31536000, immutable) - the exact same
    // URL always returns the exact same image. So there's no need to
    // download and re-host it ourselves (which would need a writable
    // filesystem this app doesn't have once deployed to Vercel); we just
    // verify the generation succeeded, then store this URL itself as the
    // permanent result.
    const res = await fetch(url, {
      headers: authHeaders(),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 429) {
        return { ok: false, error: "The free tier is busy right now. Wait a few seconds and try again.", retryable: true };
      }
      return { ok: false, error: `Generation failed (${res.status}): ${text.slice(0, 200)}` };
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      return { ok: false, error: "The provider didn't return an image. Try a different prompt." };
    }
    return { ok: true, url };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error generating the image.",
      retryable: true,
    };
  }
}

// Video generation lives in lib/pixazo.ts (Pollinations' only real video
// model, Nova Reel, turned out to require a funded paid balance - see the
// commit history / docs/research/notes.md. Pixazo's LTX is actually free.
