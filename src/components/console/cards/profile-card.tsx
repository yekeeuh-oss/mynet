"use client";

import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/lib/config";
import { useConsole } from "@/components/console/console-context";
import { GlassCard } from "@/components/console/glass-card";

type ProfileCardProps = {
  onSecret: () => void;
};

export function ProfileCard({ onSecret }: ProfileCardProps) {
  const { ready } = useConsole();
  const [now, setNow] = useState<Date | null>(null);
  const clicks = useRef<number[]>([]);

  useEffect(() => {
    if (!ready) return;
    const tick = () => setNow(new Date());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [ready]);

  const clock = now
    ? new Intl.DateTimeFormat("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }).format(now)
    : "--:--:--";

  function onTitleClick() {
    const time = Date.now();
    clicks.current = [...clicks.current.filter((stamp) => time - stamp < 700), time];
    if (clicks.current.length >= 3) {
      clicks.current = [];
      onSecret();
    }
  }

  return (
    <GlassCard id="profile" className="min-h-[240px]">
      <p className="text-[11px] font-medium tracking-[0.22em] text-[var(--accent)]">
        PROFILE
      </p>
      <h1
        onClick={onTitleClick}
        className="mt-2 cursor-default select-none font-serif text-4xl leading-none tracking-tight"
      >
        {siteConfig.title}
      </h1>
      <p className="mt-3 text-sm tracking-wide text-[var(--muted)]">
        {siteConfig.displayName}
      </p>
      <p className="mt-4 font-mono text-3xl tabular-nums tracking-wide">{clock}</p>
      <p className="mt-3 font-serif text-sm leading-7 text-[var(--muted)]">
        {siteConfig.signature}
      </p>
      <p className="mt-auto flex items-center gap-2 pt-4 text-sm">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70 motion-reduce:animate-none" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
        </span>
        在线书写
      </p>
    </GlassCard>
  );
}
