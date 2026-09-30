"use client";

import { useState } from "react";
import { ambienceTracks } from "@/lib/config";
import { sanitizeAssetUrl } from "@/lib/url";
import type { AmbienceId } from "@/lib/types";
import { useConsole } from "@/components/console/console-context";
import { GlassCard } from "@/components/console/glass-card";
import { fieldClass } from "@/components/console/modal";
import { useAmbience } from "@/components/console/use-ambience";

export function VinylCard() {
  const { settings, setAmbience, setCustomAudioUrl } = useConsole();
  const { play, stop } = useAmbience();
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    if (playing) {
      stop();
      setPlaying(false);
      setError("");
      return;
    }
    try {
      await play(settings.ambience, settings.customAudioUrl);
      setPlaying(true);
      setError("");
    } catch {
      stop();
      setPlaying(false);
      setError(
        settings.ambience === "link"
          ? "这条外链暂时无法播放。"
          : "当前浏览器无法播放氛围声。",
      );
    }
  }

  async function choose(id: AmbienceId) {
    setAmbience(id);
    setError("");
    if (!playing) return;
    if (id === "link" && !sanitizeAssetUrl(settings.customAudioUrl)) {
      stop();
      setPlaying(false);
      return;
    }
    try {
      await play(id, settings.customAudioUrl);
    } catch {
      stop();
      setPlaying(false);
      setError(
        id === "link" ? "这条外链暂时无法播放。" : "当前浏览器无法播放氛围声。",
      );
    }
  }

  const linkReady = Boolean(sanitizeAssetUrl(settings.customAudioUrl));

  return (
    <GlassCard id="vinyl" className="min-h-[240px] md:col-span-2 lg:col-span-1">
      <p className="text-[11px] font-medium tracking-[0.22em] text-[var(--accent)]">
        AMBIENCE
      </p>
      <h2 className="mt-1 font-serif text-2xl leading-tight">氛围唱片</h2>
      <div className="mt-4 flex items-center gap-4">
        <div
          className={`relative h-24 w-24 shrink-0 rounded-full bg-[radial-gradient(circle_at_center,#1E6B48_0_16%,#141414_18%_22%,#2a2a2a_23%_100%)] shadow-inner ${
            playing ? "animate-spin [animation-duration:8s] motion-reduce:animate-none" : ""
          }`}
        >
          <span className="absolute inset-[18%] rounded-full border border-white/15" />
          <span className="absolute inset-[32%] rounded-full border border-white/10" />
          <span className="absolute inset-[42%] rounded-full bg-[#d7efe1]" />
        </div>
        <button
          type="button"
          aria-pressed={playing}
          onClick={() => void toggle()}
          disabled={settings.ambience === "link" && !linkReady}
          className="inline-flex h-11 items-center justify-center rounded-full bg-[#1E6B48] px-5 text-sm font-medium text-[#FAF9F6] transition-all duration-300 hover:bg-[#18583C] disabled:opacity-40"
        >
          {playing ? "暂停" : "播放"}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {ambienceTracks.map((track) => (
          <button
            key={track.id}
            type="button"
            aria-pressed={settings.ambience === track.id}
            onClick={() => void choose(track.id)}
            className={`rounded-full px-3 py-1 text-xs transition-all duration-300 ${
              settings.ambience === track.id
                ? "bg-[#1E6B48] text-white"
                : "bg-[var(--chip)]"
            }`}
          >
            {track.label}
          </button>
        ))}
      </div>
      {settings.ambience === "link" ? (
        <input
          value={settings.customAudioUrl}
          onChange={(event) => setCustomAudioUrl(event.target.value)}
          placeholder="https:// 音频链接"
          spellCheck={false}
          className={`${fieldClass} mt-3 h-10`}
        />
      ) : null}
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </GlassCard>
  );
}
