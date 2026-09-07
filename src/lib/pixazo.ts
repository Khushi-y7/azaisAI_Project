import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

// Pixazo's free-tier LTX (Lightricks) text-to-video model.
// https://www.pixazo.ai/api/free - free, no card required, 60 req/min
// fair-use limit. Submit-then-poll API: POST returns a request_id and a
// polling_url; poll that until status is COMPLETED (or FAILED).
const PIXAZO_KEY = process.env.PIXAZO_API_KEY;
const SUBMIT_URL = "https://gateway.pixazo.ai/ltx-video/v1/text-to-video";
const GENERATED_DIR = path.join(process.cwd(), "public", "generated");

const POLL_INTERVAL_MS = 4_000;
const MAX_WAIT_MS = 180_000;

interface SubmitResponse {
  request_id: string;
  status: string;
  polling_url: string;
}

interface StatusResponse {
  request_id: string;
  status: "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | string;
  output?: { media_url: string[]; media_type: string };
  error?: { message?: string } | string;
}

function authHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(PIXAZO_KEY ? { "Ocp-Apim-Subscription-Key": PIXAZO_KEY } : {}),
  };
}

export interface GenerateVideoParams {
  prompt: string;
  duration: number;
  aspectRatio: "16:9" | "9:16";
}

export interface GenerateResult {
  ok: boolean;
  url?: string;
  error?: string;
}

export async function generateVideo(params: GenerateVideoParams): Promise<GenerateResult> {
  if (!PIXAZO_KEY) {
    return {
      ok: false,
      error: "Video generation isn't configured yet - PIXAZO_API_KEY is missing from the server environment.",
    };
  }

  let submitRes: Response;
  try {
    submitRes = await fetch(SUBMIT_URL, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        prompt: params.prompt,
        duration: params.duration,
        aspect_ratio: params.aspectRatio,
        resolution: "720p",
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Couldn't reach the video provider." };
  }

  if (!submitRes.ok) {
    const text = await submitRes.text().catch(() => "");
    return { ok: false, error: `Video request failed (${submitRes.status}): ${text.slice(0, 200)}` };
  }

  const submitted = (await submitRes.json()) as SubmitResponse;
  const pollingUrl = submitted.polling_url;
  if (!pollingUrl) {
    return { ok: false, error: "Video provider didn't return a job to track." };
  }

  const deadline = Date.now() + MAX_WAIT_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    let statusRes: Response;
    try {
      statusRes = await fetch(pollingUrl, {
        headers: authHeaders(),
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      continue; // transient network hiccup - keep polling until the deadline
    }
    if (!statusRes.ok) continue;

    const status = (await statusRes.json()) as StatusResponse;
    if (status.status === "COMPLETED") {
      const mediaUrl = status.output?.media_url?.[0];
      if (!mediaUrl) {
        return { ok: false, error: "Video finished but no output was returned." };
      }
      return downloadAndSave(mediaUrl);
    }
    if (status.status === "FAILED") {
      const message = typeof status.error === "string" ? status.error : status.error?.message;
      return { ok: false, error: message ?? "Video generation failed on the provider's side." };
    }
    // QUEUED / IN_PROGRESS - keep polling
  }

  return { ok: false, error: "Video generation is taking longer than expected. Try again in a bit." };
}

async function downloadAndSave(mediaUrl: string): Promise<GenerateResult> {
  try {
    const res = await fetch(mediaUrl, { signal: AbortSignal.timeout(60_000) });
    if (!res.ok) {
      return { ok: false, error: `Couldn't download the finished video (${res.status}).` };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.mkdir(GENERATED_DIR, { recursive: true });
    const filename = `${crypto.randomUUID()}.mp4`;
    await fs.writeFile(path.join(GENERATED_DIR, filename), buf);
    return { ok: true, url: `/generated/${filename}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Couldn't save the finished video." };
  }
}
