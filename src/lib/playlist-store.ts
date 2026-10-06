export type PlayMode = "single" | "order" | "shuffle";

export type PlaylistTrack = {
  id: string;
  name: string;
};

export type PlaylistState = {
  tracks: PlaylistTrack[];
  mode: PlayMode;
  currentId: string;
};

const playlistKey = "my-diary.playlist";
const volumeKey = "my-diary.player-volume";

const modes: PlayMode[] = ["single", "order", "shuffle"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function emptyPlaylist(): PlaylistState {
  return { tracks: [], mode: "order", currentId: "" };
}

export function loadPlaylist(): PlaylistState {
  const fallback = emptyPlaylist();
  try {
    const raw = localStorage.getItem(playlistKey);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed) || !Array.isArray(parsed.tracks)) return fallback;
    const tracks = parsed.tracks.flatMap((item) => {
      if (!isRecord(item) || typeof item.id !== "string" || typeof item.name !== "string") {
        return [];
      }
      return [{ id: item.id, name: item.name }];
    });
    const mode = modes.includes(parsed.mode as PlayMode) ? (parsed.mode as PlayMode) : "order";
    const currentId =
      typeof parsed.currentId === "string" && tracks.some((track) => track.id === parsed.currentId)
        ? parsed.currentId
        : (tracks[0]?.id ?? "");
    return { tracks, mode, currentId };
  } catch {
    return fallback;
  }
}

export function savePlaylist(state: PlaylistState) {
  try {
    localStorage.setItem(playlistKey, JSON.stringify(state));
  } catch {
    /* Ignore quota and private-mode failures. */
  }
}

export function isAudioFile(file: File) {
  return /\.(mp3|wav|flac)$/i.test(file.name) || file.type.startsWith("audio/");
}

export function nextMode(mode: PlayMode): PlayMode {
  if (mode === "single") return "order";
  if (mode === "order") return "shuffle";
  return "single";
}

export function loadPlayerVolume() {
  try {
    const raw = localStorage.getItem(volumeKey);
    if (raw === null) return 30;
    const value = Number(raw);
    if (!Number.isFinite(value)) return 30;
    return Math.min(100, Math.max(0, Math.round(value)));
  } catch {
    return 30;
  }
}

export function savePlayerVolume(volume: number) {
  try {
    localStorage.setItem(volumeKey, String(Math.min(100, Math.max(0, Math.round(volume)))));
  } catch {
    /* Ignore quota and private-mode failures. */
  }
}

export function modeLabel(mode: PlayMode) {
  if (mode === "single") return "单曲循环";
  if (mode === "order") return "顺序播放";
  return "随机播放";
}
