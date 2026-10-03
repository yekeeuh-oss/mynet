import { deleteFile, getFile, putFile } from "@/lib/media-db";

export type DiaryFont = {
  id: string;
  name: string;
  family: string;
};

const fontKey = "my-diary.fonts";
const loadedFamilies = new Set<string>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isFontFile(file: File) {
  return /\.(ttf|otf|woff2?)$/i.test(file.name);
}

export function fontNameFromFile(file: File) {
  return file.name.replace(/\.(ttf|otf|woff2?)$/i, "") || "自定义字体";
}

export function loadDiaryFonts(): DiaryFont[] {
  try {
    const raw = localStorage.getItem(fontKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (
        !isRecord(item) ||
        typeof item.id !== "string" ||
        typeof item.name !== "string" ||
        typeof item.family !== "string"
      ) {
        return [];
      }
      return [{ id: item.id, name: item.name, family: item.family }];
    });
  } catch {
    return [];
  }
}

function saveDiaryFonts(fonts: DiaryFont[]) {
  try {
    localStorage.setItem(fontKey, JSON.stringify(fonts));
  } catch {
    /* Ignore quota and private-mode failures. */
  }
}

export function fontFamilyFor(fontId: string, fonts: DiaryFont[]) {
  if (fontId === "sans") return "var(--font-sans), sans-serif";
  if (fontId === "serif" || !fontId) return "var(--font-serif), serif";
  const match = fonts.find((font) => font.id === fontId);
  return match ? `"${match.family}", serif` : "var(--font-serif), serif";
}

export async function ensureDiaryFont(font: DiaryFont) {
  if (typeof document === "undefined") return;
  if (loadedFamilies.has(font.family) || document.fonts.check(`16px "${font.family}"`)) {
    loadedFamilies.add(font.family);
    return;
  }
  const file = await getFile(font.id);
  if (!file) return;
  const face = new FontFace(font.family, await file.arrayBuffer());
  await face.load();
  document.fonts.add(face);
  loadedFamilies.add(font.family);
}

export async function ensureDiaryFonts(fonts: DiaryFont[]) {
  await Promise.all(fonts.map((font) => ensureDiaryFont(font)));
}

export async function importDiaryFont(file: File, name: string) {
  if (!isFontFile(file)) throw new Error("bad-type");
  if (file.size > 12 * 1024 * 1024) throw new Error("too-large");
  const id = crypto.randomUUID();
  const family = `diary-font-${id}`;
  await putFile(id, file);
  const font: DiaryFont = { id, name: name.trim() || fontNameFromFile(file), family };
  const next = [...loadDiaryFonts(), font];
  saveDiaryFonts(next);
  await ensureDiaryFont(font);
  return font;
}

export async function removeDiaryFont(id: string) {
  await deleteFile(id);
  const next = loadDiaryFonts().filter((font) => font.id !== id);
  saveDiaryFonts(next);
}
