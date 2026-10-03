import { readPassageStyle } from "@/lib/passage-style";
import type { LoreItem } from "@/lib/types";

const loreKey = "my-diary.lore";
const categoryKey = "my-diary.lore-categories";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseItem(value: unknown): LoreItem | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.title !== "string" ||
    typeof value.prompt !== "string" ||
    typeof value.createdAt !== "string" ||
    typeof value.category !== "string"
  ) {
    return null;
  }
  const style = readPassageStyle(value);
  return {
    id: value.id,
    category: value.category,
    title: value.title,
    prompt: value.prompt,
    imageId: typeof value.imageId === "string" ? value.imageId : "",
    createdAt: value.createdAt,
    ...style,
  };
}

export function loadLore() {
  try {
    const raw = localStorage.getItem(loreKey);
    if (raw === null) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      const lore = parseItem(item);
      return lore ? [lore] : [];
    });
  } catch {
    return [];
  }
}

export function saveLore(items: LoreItem[]) {
  try {
    localStorage.setItem(loreKey, JSON.stringify(items));
  } catch {
    /* Ignore quota and private-mode failures. */
  }
}

export function loadLoreCategories(items: LoreItem[] = []) {
  try {
    const raw = localStorage.getItem(categoryKey);
    if (raw !== null) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string" && item.trim() !== "");
      }
    }
  } catch {
    /* Fall through and derive categories from saved notes. */
  }
  const derived = [...new Set(items.map((item) => item.category).filter(Boolean))];
  saveLoreCategories(derived);
  return derived;
}

export function saveLoreCategories(categories: string[]) {
  try {
    localStorage.setItem(categoryKey, JSON.stringify(categories));
  } catch {
    /* Ignore quota and private-mode failures. */
  }
}
