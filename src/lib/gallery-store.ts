import type {
  CaptionFont,
  GalleryCategory,
  GalleryComment,
  GalleryLike,
  GalleryPhoto,
  GalleryPrefs,
} from "@/lib/types";
import { galleryCategories } from "@/lib/types";

const photoKey = "my-diary.gallery";
const prefsKey = "my-diary.gallery-prefs";
const visitorKey = "my-diary.visitor";

const fonts: CaptionFont[] = ["sans", "serif", "script"];

export function defaultGalleryPrefs(): GalleryPrefs {
  return {
    saveAsDefault: false,
    color: "#f7f4ef",
    font: "sans",
    backgroundRef: "",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readJson(key: string) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Ignore quota and private-mode failures. */
  }
}

function parseLike(value: unknown): GalleryLike | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.visitorId !== "string" ||
    typeof value.createdAt !== "string"
  ) {
    return null;
  }
  return {
    id: value.id,
    visitorId: value.visitorId,
    createdAt: value.createdAt,
  };
}

function parseComment(value: unknown): GalleryComment | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.nickname !== "string" ||
    typeof value.content !== "string" ||
    typeof value.createdAt !== "string"
  ) {
    return null;
  }
  return {
    id: value.id,
    nickname: value.nickname,
    content: value.content,
    createdAt: value.createdAt,
  };
}

function parsePhoto(value: unknown): GalleryPhoto | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.mediaId !== "string" ||
    typeof value.caption !== "string" ||
    typeof value.color !== "string" ||
    typeof value.createdAt !== "string" ||
    !fonts.includes(value.font as CaptionFont) ||
    !galleryCategories.includes(value.category as GalleryCategory)
  ) {
    return null;
  }
  const likes = Array.isArray(value.likes)
    ? value.likes.flatMap((item) => {
        const like = parseLike(item);
        return like ? [like] : [];
      })
    : [];
  const comments = Array.isArray(value.comments)
    ? value.comments.flatMap((item) => {
        const comment = parseComment(item);
        return comment ? [comment] : [];
      })
    : [];
  return {
    id: value.id,
    mediaId: value.mediaId,
    caption: value.caption,
    color: value.color,
    font: value.font as CaptionFont,
    category: value.category as GalleryCategory,
    createdAt: value.createdAt,
    likes,
    comments,
  };
}

export function loadGalleryPhotos() {
  const parsed = readJson(photoKey);
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((item) => {
    const photo = parsePhoto(item);
    return photo ? [photo] : [];
  });
}

export function saveGalleryPhotos(photos: GalleryPhoto[]) {
  writeJson(photoKey, photos);
}

export function loadGalleryPrefs(): GalleryPrefs {
  const fallback = defaultGalleryPrefs();
  const parsed = readJson(prefsKey);
  if (!isRecord(parsed)) return fallback;
  return {
    saveAsDefault: parsed.saveAsDefault === true,
    color: typeof parsed.color === "string" ? parsed.color : fallback.color,
    font: fonts.includes(parsed.font as CaptionFont)
      ? (parsed.font as CaptionFont)
      : fallback.font,
    backgroundRef:
      typeof parsed.backgroundRef === "string" ? parsed.backgroundRef : "",
  };
}

export function saveGalleryPrefs(prefs: GalleryPrefs) {
  writeJson(prefsKey, prefs);
}

export function getVisitorId() {
  try {
    const existing = localStorage.getItem(visitorKey);
    if (existing) return existing;
    const created = crypto.randomUUID();
    localStorage.setItem(visitorKey, created);
    return created;
  } catch {
    return "visitor";
  }
}
