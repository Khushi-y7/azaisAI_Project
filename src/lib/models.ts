// Real backends only - verified directly against the live Pollinations API.
// No fake model SKUs: where the original product offered a grid of providers
// (Sora/Veo/Runway), we have exactly one real free image model and one real
// (paid-balance) video model, so the creative-choice UI leans on style
// presets and generation params instead of a model grid that would just be
// theater. See docs/research/notes.md for what was actually confirmed.

export const IMAGE_MODEL = {
  id: "sana",
  label: "Sana",
  provider: "Pollinations",
  costCredits: 1,
  etaSeconds: 10,
} as const;

export const IMAGE_STYLES = [
  { id: "none", label: "None", modifier: "" },
  { id: "cinematic", label: "Cinematic", modifier: "cinematic lighting, film still, dramatic composition" },
  { id: "anime", label: "Anime", modifier: "anime style, cel shaded, vibrant" },
  { id: "photo", label: "Photo", modifier: "photorealistic, shot on 35mm film, natural light" },
  { id: "illustration", label: "Illustration", modifier: "digital illustration, clean line art, flat colors" },
  { id: "abstract", label: "Abstract", modifier: "abstract art, geometric shapes, bold color fields" },
] as const;

export const IMAGE_ASPECT_RATIOS = [
  { id: "16:9", label: "16:9", width: 1024, height: 576 },
  { id: "1:1", label: "1:1", width: 1024, height: 1024 },
  { id: "9:16", label: "9:16", width: 576, height: 1024 },
  { id: "4:3", label: "4:3", width: 1024, height: 768 },
  { id: "3:4", label: "3:4", width: 768, height: 1024 },
] as const;

export const VIDEO_MODEL = {
  id: "nova-reel",
  label: "Nova Reel",
  provider: "Amazon (via Pollinations)",
  costPerSecond: 1,
  badge: "Requires funded balance",
} as const;

export const VIDEO_DURATIONS = [4, 6, 8] as const;

export const MOTION_PRESETS = [
  {
    group: "Camera",
    options: [
      { id: "slow-zoom-in", label: "Slow zoom in", description: "Steadily pulls the viewer toward the subject", modifier: "slow zoom in" },
      { id: "pull-back-reveal", label: "Pull back reveal", description: "Camera retreats to uncover the full environment", modifier: "pull back reveal shot" },
      { id: "arc-orbit", label: "Arc orbit", description: "Smooth 90° arc around the subject", modifier: "smooth arc orbit around the subject" },
      { id: "pan-across", label: "Pan across", description: "Sweeps horizontally left to right", modifier: "camera pans across the scene" },
      { id: "dolly-push-in", label: "Dolly push-in", description: "Camera moves physically forward into the scene", modifier: "dolly push-in shot" },
    ],
  },
  {
    group: "Atmosphere",
    options: [
      { id: "golden-light-shift", label: "Golden light shift", description: "Warm light drifts across the scene over time", modifier: "warm golden light shifting across the scene" },
    ],
  },
] as const;

export function findStyle(id: string) {
  return IMAGE_STYLES.find((s) => s.id === id) ?? IMAGE_STYLES[0];
}

export function findAspectRatio(id: string) {
  return IMAGE_ASPECT_RATIOS.find((a) => a.id === id) ?? IMAGE_ASPECT_RATIOS[1];
}

export function findMotionPreset(id: string | null) {
  if (!id) return null;
  for (const group of MOTION_PRESETS) {
    const found = group.options.find((o) => o.id === id);
    if (found) return found;
  }
  return null;
}
