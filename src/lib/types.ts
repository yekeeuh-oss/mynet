import type { ambienceTracks } from "@/lib/config";

export type AmbienceId = (typeof ambienceTracks)[number]["id"];

export type CardId =
  | "diary"
  | "calendar"
  | "profile"
  | "notes"
  | "vinyl"
  | "lore"
  | "playground"
  | "oracle"
  | "capsule"
  | "radar";

export type CardSkin = {
  imageUrl: string;
  opacity: number;
  hideFrame?: boolean;
};

export type DiaryEntry = {
  id: string;
  title: string;
  content: string;
  mood: string;
  createdAt: string;
  images: string[];
  font: string;
};

export const galleryCategories = ["生活", "灵感", "创作"] as const;

export type GalleryCategory = (typeof galleryCategories)[number];

export type CaptionFont = "sans" | "serif" | "script";

export type GalleryLike = {
  id: string;
  visitorId: string;
  createdAt: string;
};

export type GalleryComment = {
  id: string;
  nickname: string;
  content: string;
  createdAt: string;
};

export type GalleryPhoto = {
  id: string;
  mediaId: string;
  caption: string;
  color: string;
  font: CaptionFont;
  category: GalleryCategory;
  createdAt: string;
  likes: GalleryLike[];
  comments: GalleryComment[];
};

export type GalleryPrefs = {
  saveAsDefault: boolean;
  color: string;
  font: CaptionFont;
  backgroundRef: string;
};

export type QuickNote = {
  id: string;
  text: string;
  createdAt: string;
};

export type Settings = {
  globalBackgroundUrl: string;
  cards: Record<CardId, CardSkin>;
  ambience: AmbienceId;
  customAudioUrl: string;
};

export const loreCategories = ["角色设定", "Midjourney 提示词", "世界观随笔"] as const;

export type LoreCategory = (typeof loreCategories)[number];

export type LoreItem = {
  id: string;
  category: LoreCategory;
  title: string;
  summary: string;
  prompt: string;
  imageId: string;
  createdAt: string;
};

export type ThemeMode = "dark" | "light";

export const cardIds: CardId[] = [
  "diary",
  "calendar",
  "profile",
  "notes",
  "vinyl",
  "lore",
  "playground",
  "oracle",
  "capsule",
  "radar",
];
