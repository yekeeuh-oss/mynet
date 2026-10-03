import type { CSSProperties } from "react";
import { fontFamilyFor, type DiaryFont } from "@/lib/font-store";

export const inkColors = [
  { name: "深灰", hex: "#2C2825" },
  { name: "墨绿", hex: "#1E6B48" },
  { name: "暖棕", hex: "#8F6B4A" },
  { name: "深蓝", hex: "#1E3A5F" },
  { name: "暗红", hex: "#7A2E2E" },
] as const;

export type PassageSize = "md" | "lg";

export type PassageStyle = {
  font: string;
  color: string;
  size: PassageSize;
  bold: boolean;
  italic: boolean;
};

export function defaultPassageStyle(): PassageStyle {
  return {
    font: "serif",
    color: "#2C2825",
    size: "md",
    bold: false,
    italic: false,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function readPassageStyle(value: unknown): PassageStyle {
  const fallback = defaultPassageStyle();
  if (!isRecord(value)) return fallback;
  const size = value.size === "lg" ? "lg" : "md";
  return {
    font: typeof value.font === "string" ? value.font : fallback.font,
    color: typeof value.color === "string" ? value.color : fallback.color,
    size,
    bold: value.bold === true,
    italic: value.italic === true,
  };
}

export function passageCss(style: PassageStyle, fonts: DiaryFont[], large = false): CSSProperties {
  return {
    fontFamily: fontFamilyFor(style.font, fonts),
    color: style.color,
    fontWeight: style.bold ? 700 : 400,
    fontStyle: style.italic ? "italic" : "normal",
    fontSize: large || style.size === "lg" ? "1.125rem" : undefined,
  };
}
