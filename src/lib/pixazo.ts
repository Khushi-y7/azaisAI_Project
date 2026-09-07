// Pixazo's free-tier LTX (Lightricks) text-to-video model.
// https://www.pixazo.ai/api/free - free, no card required, 60 req/min
// fair-use limit. Submit-then-poll API: POST returns a request_id and a
// polling_url; poll that until status is COMPLETED (or FAILED).
//
// This is deliberately split into submit() + checkStatus() rather than one
// call that submits-then-waits: a serverless function (Vercel) can't hold a
// connection open for the 1-2 minutes a video takes, so the "waiting" has
// to happen as repeated short checks driven by the client's own polling
// (see /api/generations/[id]), not a single long-running server task.
const PIXAZO_KEY = process.env.PIXAZO_API_KEY;
const SUBMIT_URL = "https://gateway.pixazo.ai/ltx-video/v1/text-to-video";

function authHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(PIXAZO_KEY ? { "Ocp-Apim-Subscription-Key": PIXAZO_KEY } : {}),
  };
}

interface SubmitResponse {
  request_id: string;
  status: string;
  polling_url: string;
}

interface StatusResponse {
  request_id: string;
  status: "QUEUED" | "IN_PROGRESS" | "PROCESSING" | "COMPLETED" | "FAILED" | string;
  output?: { media_url: string[]; media_type: string };
  error?: { message?: string } | string;
}

export interface SubmitResult {
  ok: boolean;
  pollingUrl?: string;
  error?: string;
}

export interface CheckResult {
  status: "processing" | "succeeded" | "failed";
  url?: string;
  error?: string;
}

export async function submitVideoJob(params: {
  prompt: string;
  duration: number;
  aspectRatio: "16:9" | "9:16";
}): Promise<SubmitResult> {
  if (!PIXAZO_KEY) {
    return { ok: false, error: "Video generation isn't configured yet - PIXAZO_API_KEY is missing from the server environment." };
  }

  let res: Response;
  try {
    res = await fetch(SUBMIT_URL, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        prompt: params.prompt,
        duration: params.duration,
        aspect_ratio: params.aspectRatio,
        resolution: "720p",
      }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Couldn't reach the video provider." };
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { ok: false, error: `Video request failed (${res.status}): ${text.slice(0, 200)}` };
  }

  const submitted = (await res.json()) as SubmitResponse;
  if (!submitted.polling_url) {
    return { ok: false, error: "Video provider didn't return a job to track." };
  }
  return { ok: true, pollingUrl: submitted.polling_url };
}

export async function checkVideoJob(pollingUrl: string): Promise<CheckResult> {
  let res: Response;
  try {
    res = await fetch(pollingUrl, {
      headers: authHeaders(),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    // Transient network hiccup - report "still processing" so the caller
    // just tries again on the next poll instead of failing the whole job.
    return { status: "processing", error: err instanceof Error ? err.message : "Status check failed." };
  }

  if (!res.ok) {
    return { status: "processing" };
  }

  const data = (await res.json()) as StatusResponse;
  if (data.status === "COMPLETED") {
    const mediaUrl = data.output?.media_url?.[0];
    if (!mediaUrl) {
      return { status: "failed", error: "Video finished but no output was returned." };
    }
    return { status: "succeeded", url: mediaUrl };
  }
  if (data.status === "FAILED") {
    const message = typeof data.error === "string" ? data.error : data.error?.message;
    return { status: "failed", error: message ?? "Video generation failed on the provider's side." };
  }
  return { status: "processing" };
}
