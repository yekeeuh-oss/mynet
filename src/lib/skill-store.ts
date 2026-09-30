export const skillAxes = [
  { id: "visual", label: "视觉美学" },
  { id: "code", label: "代码逻辑" },
  { id: "story", label: "叙事构想" },
  { id: "intuition", label: "灵感直觉" },
  { id: "world", label: "世界观构建" },
] as const;

export type SkillId = (typeof skillAxes)[number]["id"];

export type SkillScores = Record<SkillId, number>;

const skillKey = "my-diary.skills";

export function defaultSkillScores(): SkillScores {
  return {
    visual: 72,
    code: 64,
    story: 80,
    intuition: 76,
    world: 70,
  };
}

function clampScore(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function loadSkillScores(): SkillScores {
  const fallback = defaultSkillScores();
  try {
    const raw = localStorage.getItem(skillKey);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return fallback;
    const record = parsed as Record<string, unknown>;
    return {
      visual: clampScore(record.visual, fallback.visual),
      code: clampScore(record.code, fallback.code),
      story: clampScore(record.story, fallback.story),
      intuition: clampScore(record.intuition, fallback.intuition),
      world: clampScore(record.world, fallback.world),
    };
  } catch {
    return fallback;
  }
}

export function saveSkillScores(scores: SkillScores) {
  try {
    localStorage.setItem(skillKey, JSON.stringify(scores));
  } catch {
    /* Ignore quota and private-mode failures. */
  }
}
