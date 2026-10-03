import { siteConfig } from "@/lib/config";
import type {
  AmbienceId,
  CardId,
  CardSkin,
  DiaryEntry,
  QuickNote,
  Settings,
} from "@/lib/types";
import { cardIds } from "@/lib/types";

const keys = {
  entries: "my-diary.entries",
  notes: "my-diary.notes",
  settings: "my-diary.settings",
  admin: "my-diary.admin",
} as const;

const ambienceIds: AmbienceId[] = ["rain", "hearth", "tide", "link"];

function emptySkin(): CardSkin {
  return { imageUrl: "", opacity: 0.4, hideFrame: false };
}

export function defaultSettings(): Settings {
  return {
    globalBackgroundUrl: "",
    cards: {
      diary: emptySkin(),
      calendar: emptySkin(),
      profile: emptySkin(),
      notes: emptySkin(),
      vinyl: emptySkin(),
      lore: emptySkin(),
      playground: emptySkin(),
      oracle: emptySkin(),
      capsule: emptySkin(),
      radar: emptySkin(),
    },
    ambience: "rain",
    customAudioUrl: "",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readRaw(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Ignore quota and private-mode failures. */
  }
}

function parseJson(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function parseEntries(value: unknown): DiaryEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    if (
      typeof item.id !== "string" ||
      typeof item.title !== "string" ||
      typeof item.content !== "string" ||
      typeof item.mood !== "string" ||
      typeof item.createdAt !== "string"
    ) {
      return [];
    }
    const images = Array.isArray(item.images)
      ? item.images
          .filter((image): image is string => typeof image === "string")
          .slice(0, 3)
      : [];
    return [
      {
        id: item.id,
        title: item.title,
        content: item.content,
        mood: item.mood,
        createdAt: item.createdAt,
        images,
      },
    ];
  });
}

function parseNotes(value: unknown): QuickNote[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    if (
      typeof item.id !== "string" ||
      typeof item.text !== "string" ||
      typeof item.createdAt !== "string"
    ) {
      return [];
    }
    return [{ id: item.id, text: item.text, createdAt: item.createdAt }];
  });
}

function parseSkin(value: unknown): CardSkin {
  const fallback = emptySkin();
  if (!isRecord(value)) return fallback;
  const opacity =
    typeof value.opacity === "number" && Number.isFinite(value.opacity)
      ? Math.min(1, Math.max(0, value.opacity))
      : fallback.opacity;
  const imageUrl = typeof value.imageUrl === "string" ? value.imageUrl : "";
  return { imageUrl, opacity, hideFrame: value.hideFrame === true };
}

function parseSettings(value: unknown): Settings {
  const fallback = defaultSettings();
  if (!isRecord(value)) return fallback;
  const cards = { ...fallback.cards };
  if (isRecord(value.cards)) {
    for (const id of cardIds) {
      cards[id as CardId] = parseSkin(value.cards[id]);
    }
  }
  const ambience = ambienceIds.includes(value.ambience as AmbienceId)
    ? (value.ambience as AmbienceId)
    : fallback.ambience;
  return {
    globalBackgroundUrl:
      typeof value.globalBackgroundUrl === "string"
        ? value.globalBackgroundUrl
        : "",
    cards,
    ambience,
    customAudioUrl:
      typeof value.customAudioUrl === "string" ? value.customAudioUrl : "",
  };
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function seedEntries(): DiaryEntry[] {
  return [
    {
      id: "seed-light",
      title: "把光留在句子里",
      content:
        "今天的风很轻。我把早晨的茶、未回的信，和那一小段突然安静下来的时间，都折进这一页。",
      mood: "🌿",
      createdAt: daysAgo(1),
      images: [],
    },
    {
      id: "seed-soup",
      title: "一锅慢慢滚着的汤",
      content: "火开得很小。葱花最后才落下，像一句迟到、但刚好赶上的话。",
      mood: "☕️",
      createdAt: daysAgo(3),
      images: [],
    },
    {
      id: "seed-train",
      title: "末班车窗外的灯",
      content: "城市一格一格往后移。我把没说完的句子，留到了下一站。",
      mood: "🌙",
      createdAt: daysAgo(6),
      images: [],
    },
  ];
}

function seedNotes(): QuickNote[] {
  return [
    {
      id: "seed-note-window",
      text: "雨停之后，窗台是干的。",
      createdAt: daysAgo(2),
    },
    {
      id: "seed-note-next",
      text: "把没说完的话留到下一站。",
      createdAt: daysAgo(4),
    },
  ];
}

export function loadConsole() {
  const entryRaw = readRaw(keys.entries);
  const noteRaw = readRaw(keys.notes);
  const entries =
    entryRaw === null ? seedEntries() : parseEntries(parseJson(entryRaw));
  const notes = noteRaw === null ? seedNotes() : parseNotes(parseJson(noteRaw));
  if (entryRaw === null) writeRaw(keys.entries, JSON.stringify(entries));
  if (noteRaw === null) writeRaw(keys.notes, JSON.stringify(notes));

  const settings = parseSettings(parseJson(readRaw(keys.settings)));
  return { entries, notes, settings, admin: readAdmin() };
}

export function readAdmin() {
  const adminRecord = parseJson(readRaw(keys.admin));
  return isRecord(adminRecord) && adminRecord.unlocked === true;
}

export function saveEntries(entries: DiaryEntry[]) {
  writeRaw(keys.entries, JSON.stringify(entries));
}

export function saveNotes(notes: QuickNote[]) {
  writeRaw(keys.notes, JSON.stringify(notes));
}

export function saveSettings(settings: Settings) {
  writeRaw(keys.settings, JSON.stringify(settings));
}

export function saveAdmin(unlocked: boolean) {
  writeRaw(keys.admin, JSON.stringify({ unlocked }));
}

export function countEntriesThisMonth(entries: DiaryEntry[], now = new Date()) {
  return entries.filter((entry) => {
    const date = new Date(entry.createdAt);
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }).length;
}

export function backgroundSource(url: string) {
  return url || siteConfig.defaultBackground;
}
