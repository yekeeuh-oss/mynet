import { dayKeyFromDate } from "@/lib/dates";

export type ActivityLevel = 0 | 1 | 2 | 3 | 4;

export type YearCell = {
  key: string | null;
  label: string;
  count: number;
};

export function activityLevel(count: number): ActivityLevel {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

export function daysInYear(year: number) {
  return new Date(year, 1, 29).getMonth() === 1 ? 366 : 365;
}

export function buildYearCells(year: number, counts: Map<string, number>): YearCell[] {
  const start = new Date(year, 0, 1);
  const pad = (start.getDay() + 6) % 7;
  const cells: YearCell[] = [];
  for (let index = 0; index < pad; index += 1) {
    cells.push({ key: null, label: "", count: 0 });
  }
  const total = daysInYear(year);
  for (let offset = 0; offset < total; offset += 1) {
    const date = new Date(year, 0, 1 + offset);
    const key = dayKeyFromDate(date);
    const label = new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    }).format(date);
    cells.push({ key, label, count: counts.get(key) ?? 0 });
  }
  return cells;
}

export function searchScore(query: string, text: string) {
  const needle = query.trim().toLowerCase();
  const haystack = text.toLowerCase();
  if (!needle) return 1;
  const index = haystack.indexOf(needle);
  if (index >= 0) return 200 - index;
  let cursor = 0;
  for (const character of haystack) {
    if (character === needle[cursor]) cursor += 1;
    if (cursor === needle.length) return 20;
  }
  return 0;
}
