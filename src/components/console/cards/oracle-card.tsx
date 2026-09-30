"use client";

import { useState } from "react";
import { oracleForDate, paintOracleCard } from "@/lib/oracle";
import { useAppChrome } from "@/components/console/app-chrome";
import { GlassCard } from "@/components/console/glass-card";

export function OracleCard() {
  const oracle = oracleForDate();
  const { toast } = useAppChrome();
  const [flipped, setFlipped] = useState(false);

  async function shareCard() {
    const canvas = paintOracleCard(oracle);
    if (!canvas) return;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return;
    const file = new File([blob], `纸间-${oracle.key}.png`, { type: "image/png" });
    const canShare = typeof navigator.share === "function" && navigator.canShare?.({ files: [file] });
    if (canShare) {
      try {
        await navigator.share({ files: [file], title: `今日灵感 · ${oracle.word}` });
        toast("已打开分享");
        return;
      } catch {
        /* Fall through to a local download when sharing is dismissed. */
      }
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
    toast("卡片已保存");
  }

  return (
    <GlassCard id="oracle" className="min-h-[320px]">
      <p className="text-[11px] font-medium tracking-[0.22em] text-[var(--accent)]">ORACLE</p>
      <h2 className="mt-1 font-serif text-2xl leading-tight">今日灵感</h2>
      <button
        type="button"
        onClick={() => setFlipped((value) => !value)}
        className="mt-4 block w-full text-left motion-safe:animate-[float-y_4.5s_ease-in-out_infinite] motion-reduce:animate-none"
        aria-label={flipped ? "翻回卡背" : "翻转抽取今日灵感"}
      >
        <span className="block [perspective:1000px]">
          <span
            className={`relative block h-52 transition-transform duration-700 [transform-style:preserve-3d] ${
              flipped ? "[transform:rotateY(180deg)]" : ""
            }`}
          >
            <span className="absolute inset-0 grid place-items-center rounded-3xl border border-white/30 bg-[#1E6B48] text-[#FAF9F6] shadow-lg [backface-visibility:hidden]">
              <span className="text-center">
                <span className="block font-serif text-3xl">纸间</span>
                <span className="mt-2 block text-xs tracking-[0.22em]">点击翻开</span>
              </span>
            </span>
            <span className="absolute inset-0 flex flex-col justify-between rounded-3xl border border-white/30 bg-[#FAF9F6] p-4 text-[#241f1b] shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <span>
                <span className="text-[11px] tracking-[0.18em] text-[#1E6B48]">{oracle.key}</span>
                <span className="mt-2 block font-serif text-4xl leading-none">{oracle.word}</span>
                <span className="mt-3 flex items-center gap-2 text-sm">
                  <span
                    className="inline-block h-4 w-4 rounded-full border border-black/10"
                    style={{ backgroundColor: oracle.color }}
                  />
                  幸运色 {oracle.colorName}
                </span>
                <span className="mt-3 block text-sm leading-7">{oracle.line}</span>
              </span>
            </span>
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => void shareCard()}
        className="mt-3 text-xs font-medium text-[var(--accent)] transition-all duration-300 hover:opacity-70"
      >
        生成分享卡片
      </button>
    </GlassCard>
  );
}
