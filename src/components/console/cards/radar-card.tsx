"use client";

import { useEffect, useState } from "react";
import {
  loadSkillScores,
  saveSkillScores,
  skillAxes,
  type SkillId,
  type SkillScores,
} from "@/lib/skill-store";
import { GlassCard } from "@/components/console/glass-card";

const center = 116;
const radius = 72;

function point(index: number, score: number) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / skillAxes.length;
  const distance = (score / 100) * radius;
  return {
    x: center + Math.cos(angle) * distance,
    y: center + Math.sin(angle) * distance,
  };
}

function ringPoints(scale: number) {
  return skillAxes
    .map((_, index) => {
      const spot = point(index, scale);
      return `${spot.x},${spot.y}`;
    })
    .join(" ");
}

export function RadarCard() {
  const [scores, setScores] = useState<SkillScores>({
    visual: 72,
    code: 64,
    story: 80,
    intuition: 76,
    world: 70,
  });
  const [hover, setHover] = useState<SkillId | null>(null);

  useEffect(() => {
    setScores(loadSkillScores());
  }, []);

  function update(id: SkillId, value: number) {
    const next = { ...scores, [id]: value };
    setScores(next);
    saveSkillScores(next);
  }

  const polygon = skillAxes
    .map((axis, index) => {
      const spot = point(index, scores[axis.id]);
      return `${spot.x},${spot.y}`;
    })
    .join(" ");

  return (
    <GlassCard id="radar" className="min-h-[320px]">
      <p className="text-[11px] font-medium tracking-[0.22em] text-[var(--accent)]">RADAR</p>
      <h2 className="mt-1 font-serif text-2xl leading-tight">技能雷达</h2>
      <svg viewBox="0 0 232 232" className="mx-auto mt-2 h-52 w-full" role="img" aria-label="创作维度雷达图">
        {[25, 50, 75, 100].map((scale) => (
          <polygon
            key={scale}
            points={ringPoints(scale)}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.18}
          />
        ))}
        {skillAxes.map((axis, index) => {
          const edge = point(index, 100);
          return (
            <line
              key={axis.id}
              x1={center}
              y1={center}
              x2={edge.x}
              y2={edge.y}
              stroke="currentColor"
              strokeOpacity={0.18}
            />
          );
        })}
        <polygon points={polygon} fill="rgba(30,107,72,0.28)" stroke="#1E6B48" strokeWidth="2" />
        {skillAxes.map((axis, index) => {
          const spot = point(index, scores[axis.id]);
          const label = point(index, 118);
          const active = hover === axis.id;
          return (
            <g key={axis.id}>
              <text
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-current text-[9px]"
              >
                {axis.label}
              </text>
              <circle
                cx={spot.x}
                cy={spot.y}
                r={active ? 8 : 4.5}
                fill="#1E6B48"
                className="transition-all duration-300"
                onMouseEnter={() => setHover(axis.id)}
                onMouseLeave={() => setHover(null)}
              />
              {active ? (
                <text
                  x={spot.x}
                  y={spot.y - 14}
                  textAnchor="middle"
                  className="fill-[#1E6B48] text-[11px] font-medium"
                >
                  {scores[axis.id]}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <div className="mt-2 space-y-1">
        {skillAxes.map((axis) => (
          <label key={axis.id} className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
            <span className="w-16 shrink-0">{axis.label}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={scores[axis.id]}
              onChange={(event) => update(axis.id, Number(event.target.value))}
              onMouseEnter={() => setHover(axis.id)}
              onMouseLeave={() => setHover(null)}
              className="w-full accent-[#1E6B48]"
            />
          </label>
        ))}
      </div>
    </GlassCard>
  );
}
