export const mixerTracks = [
  { id: "rain", label: "柔和细雨" },
  { id: "fire", label: "柴火噼啪" },
  { id: "birds", label: "森林鸟鸣" },
  { id: "breeze", label: "深夜微风" },
] as const;

export type MixerTrackId = (typeof mixerTracks)[number]["id"];

export type MixerVolumes = Record<MixerTrackId, number>;

const mixerKey = "my-diary.mixer";

export function defaultMixerVolumes(): MixerVolumes {
  return { rain: 42, fire: 0, birds: 0, breeze: 18 };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function clampVolume(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function loadMixerVolumes(): MixerVolumes {
  const fallback = defaultMixerVolumes();
  try {
    const raw = localStorage.getItem(mixerKey);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return fallback;
    return {
      rain: clampVolume(parsed.rain ?? fallback.rain),
      fire: clampVolume(parsed.fire),
      birds: clampVolume(parsed.birds),
      breeze: clampVolume(parsed.breeze ?? fallback.breeze),
    };
  } catch {
    return fallback;
  }
}

export function saveMixerVolumes(volumes: MixerVolumes) {
  try {
    localStorage.setItem(mixerKey, JSON.stringify(volumes));
  } catch {
    /* Ignore quota and private-mode failures. */
  }
}
