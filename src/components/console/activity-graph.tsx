"use client";

import { useEffect, useState } from "react";
import { activityLevel, buildYearCells, type ActivityLevel } from "@/lib/activity";
import { dayKeyFromDate } from "@/lib/dates";
import { diaryRefreshEvent } from "@/lib/events";
import { loadGalleryPhotos } from "@/lib/gallery-store";
import { useConsole } from "@/components/console/console-context";

const levelClass: Record<ActivityLevel, string> = {
  0: "bg-[#241f1b]/10",
  1: "bg-[#c9eadb]",
  2: "bg-[#7dcaa6]",
  3: "bg-[#3d9a6c]",
  4: "bg-[#1E6B48]",
};

export function ActivityGraph() {
  const { entries } = useConsole();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [galleryCounts, setGalleryCounts] = useState<Map<string, number>>(new Map());
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);

  useEffect(() => {
    function load() {
      const counts = new Map<string, number>();
      for (const photo of loadGalleryPhotos()) {
        const key = dayKeyFromDate(new Date(photo.createdAt));
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      setGalleryCounts(counts);
    }
    load();
    window.addEventListener(diaryRefreshEvent, load);
    return () => window.removeEventListener(diaryRefreshEvent, load);
  }, []);

  const counts = new Map(galleryCounts);
  for (const entry of entries) {
    const key = dayKeyFromDate(new Date(entry.createdAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const cells = buildYearCells(year, counts);

  return (
    <section className="glass-shell mt-4 rounded-3xl border border-white/20 bg-white/60 p-5 text-[#241f1b] shadow-lg backdrop-blur-md transition-all duration-300 hover:shadow-2xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-[0.22em] text-[#1E6B48]">YEAR</p>
          <h2 className="mt-1 font-serif text-2xl">年度足迹</h2>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => setYear((value) => value - 1)}
            className="grid h-8 w-8 place-items-center rounded-full transition-all duration-300 hover:bg-black/5"
            aria-label="上一年"
          >
            ‹
          </button>
          <span>{year}</span>
          <button
            type="button"
            onClick={() => setYear((value) => value + 1)}
            className="grid h-8 w-8 place-items-center rounded-full transition-all duration-300 hover:bg-black/5"
            aria-label="下一年"
          >
            ›
          </button>
        </div>
      </div>
      <p className="mt-2 text-sm text-[#5c564e]">日记和画廊合在一起，这一年记下了 {yearTotal(cells)} 条。</p>
      <div className="mt-4 overflow-x-auto pb-2">
        <div className="flex gap-2">
          <div className="grid grid-rows-7 gap-[3px] pt-0 text-[10px] leading-3 text-[#5c564e]">
            <span />
            <span className="flex items-center">一</span>
            <span />
            <span className="flex items-center">三</span>
            <span />
            <span className="flex items-center">五</span>
            <span />
          </div>
          <div className="grid grid-flow-col grid-rows-7 gap-[3px]">
            {cells.map((cell, index) =>
              cell.key ? (
                <span
                  key={cell.key}
                  className={`h-3 w-3 rounded-[3px] ${levelClass[activityLevel(cell.count)]}`}
                  onMouseEnter={(event) =>
                    setTip({
                      x: event.clientX,
                      y: event.clientY,
                      text: `${cell.label} · ${cell.count} 条记录`,
                    })
                  }
                  onMouseLeave={() => setTip(null)}
                />
              ) : (
                <span key={`pad-${index}`} className="h-3 w-3" />
              ),
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 text-xs text-[#5c564e]">
        <span>少</span>
        {([0, 1, 2, 3, 4] as ActivityLevel[]).map((level) => (
          <span key={level} className={`h-3 w-3 rounded-[3px] ${levelClass[level]}`} />
        ))}
        <span>多</span>
      </div>
      {tip ? (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-xl border border-white/20 bg-[#1c1917]/85 px-2.5 py-1.5 text-xs text-white shadow-lg backdrop-blur-md"
          style={{ left: tip.x, top: tip.y - 10 }}
        >
          {tip.text}
        </div>
      ) : null}
    </section>
  );
}

function yearTotal(cells: { count: number }[]) {
  return cells.reduce((sum, cell) => sum + cell.count, 0);
}
