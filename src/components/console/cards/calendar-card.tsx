"use client";

import { useMemo } from "react";
import { toDayKey } from "@/lib/dates";
import { countEntriesThisMonth } from "@/lib/storage";
import { useConsole } from "@/components/console/console-context";
import { GlassCard } from "@/components/console/glass-card";

const weekdays = ["一", "二", "三", "四", "五", "六", "日"];

export function CalendarCard() {
  const { ready, entries } = useConsole();
  const now = ready ? new Date() : null;
  const marked = useMemo(
    () => new Set(entries.map((entry) => toDayKey(entry.createdAt))),
    [entries],
  );

  const cells = useMemo(() => {
    if (!now) return [];
    const year = now.getFullYear();
    const month = now.getMonth();
    const first = new Date(year, month, 1).getDay();
    const offset = (first + 6) % 7;
    const days = new Date(year, month + 1, 0).getDate();
    const grid: Array<number | null> = [
      ...Array.from({ length: offset }, () => null),
    ];
    for (let day = 1; day <= days; day += 1) grid.push(day);
    return grid;
  }, [now]);

  const todayLabel = now
    ? new Intl.DateTimeFormat("zh-CN", {
        month: "long",
        day: "numeric",
        weekday: "long",
      }).format(now)
    : "读取日期";
  const monthCount = now ? countEntriesThisMonth(entries, now) : 0;

  return (
    <GlassCard id="calendar" className="min-h-[320px] lg:row-span-2">
      <p className="text-[11px] font-medium tracking-[0.22em] text-[var(--accent)]">
        CALENDAR
      </p>
      <h2 className="mt-1 font-serif text-2xl leading-tight">本月</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">今天 {todayLabel}</p>
      <p className="mt-1 text-sm text-[var(--muted)]">已写下 {monthCount} 篇</p>
      <div className="mt-5 grid grid-cols-7 gap-y-1 text-center text-[11px] tracking-widest text-[var(--muted)]">
        {weekdays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="mt-2 grid flex-1 grid-cols-7 place-items-center gap-y-1">
        {cells.map((day, index) => {
          if (!day || !now) {
            return <span key={`empty-${index}`} />;
          }
          const key = `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}-${`${day}`.padStart(2, "0")}`;
          const isToday = day === now.getDate();
          const hasEntry = marked.has(key);
          return (
            <span
              key={key}
              aria-current={isToday ? "date" : undefined}
              className={`relative grid h-8 w-8 place-items-center rounded-full text-sm transition-all duration-300 ${
                isToday ? "bg-[#1E6B48] text-white" : ""
              }`}
            >
              {day}
              {hasEntry ? (
                <span
                  className={`absolute bottom-0.5 h-1 w-1 rounded-full ${
                    isToday ? "bg-white" : "bg-[var(--accent)]"
                  }`}
                />
              ) : null}
            </span>
          );
        })}
      </div>
    </GlassCard>
  );
}
