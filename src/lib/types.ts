import type { ambienceTracks } from "@/lib/config";

export type AmbienceId = (typeof ambienceTracks)[number]["id"];

export type CardId = "diary" | "calendar" | "profile" | "notes" | "vinyl";

export type CardSkin = {
  imageUrl: string;
  opacity: number;
};

export type DiaryEntry = {
  id: string;
  title: string;
  content: string;
  mood: string;
  createdAt: string;
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

export const cardIds: CardId[] = [
  "diary",
  "calendar",
  "profile",
  "notes",
  "vinyl",
];
