import type { LoreCategory, LoreItem } from "@/lib/types";
import { loreCategories } from "@/lib/types";

const loreKey = "my-diary.lore";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function seedLore(): LoreItem[] {
  return [
    {
      id: "lore-keeper",
      category: "角色设定",
      title: "守窗人",
      summary: "住在纸页边缘的人，负责把散掉的句子收回来。",
      prompt:
        "一位安静的守窗人，墨绿色长外套，暖白窗光，电影感肖像，细腻胶片颗粒，浅景深",
      imageId: "",
      createdAt: new Date().toISOString(),
    },
    {
      id: "lore-prompt",
      category: "Midjourney 提示词",
      title: "雨后窗台",
      summary: "给静物照片用的一段光影提示。",
      prompt:
        "rain-wet windowsill, ceramic cup, soft morning light, moss green and warm paper tones, editorial still life, 35mm --stylize 180",
      imageId: "",
      createdAt: new Date().toISOString(),
    },
    {
      id: "lore-world",
      category: "世界观随笔",
      title: "纸间的气候",
      summary: "这座城里的雨只会落在还没写完的那一页。",
      prompt: "纸间的雨不打湿街道，只打湿未完成的句子。写到句号，天就晴了。",
      imageId: "",
      createdAt: new Date().toISOString(),
    },
  ];
}

function parseItem(value: unknown): LoreItem | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.title !== "string" ||
    typeof value.summary !== "string" ||
    typeof value.prompt !== "string" ||
    typeof value.createdAt !== "string" ||
    !loreCategories.includes(value.category as LoreCategory)
  ) {
    return null;
  }
  return {
    id: value.id,
    category: value.category as LoreCategory,
    title: value.title,
    summary: value.summary,
    prompt: value.prompt,
    imageId: typeof value.imageId === "string" ? value.imageId : "",
    createdAt: value.createdAt,
  };
}

export function loadLore() {
  try {
    const raw = localStorage.getItem(loreKey);
    if (raw === null) {
      const seeded = seedLore();
      localStorage.setItem(loreKey, JSON.stringify(seeded));
      return seeded;
    }
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
