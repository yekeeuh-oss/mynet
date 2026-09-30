"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { cssImage, sanitizeAssetUrl } from "@/lib/url";
import type { CardId } from "@/lib/types";
import { useConsole } from "@/components/console/console-context";
import { fieldClass, primaryButtonClass, quietButtonClass } from "@/components/console/modal";

type GlassCardProps = {
  id: CardId;
  className?: string;
  children: React.ReactNode;
};

export function GlassCard({ id, className, children }: GlassCardProps) {
  const { admin, settings, setCardSkin } = useConsole();
  const skin = settings.cards[id];
  const [open, setOpen] = useState(false);
  const [draftUrl, setDraftUrl] = useState(skin.imageUrl);
  const [draftOpacity, setDraftOpacity] = useState(skin.opacity);
  const [error, setError] = useState("");

  const savedImage = skin.imageUrl ? sanitizeAssetUrl(skin.imageUrl) || "" : "";
  let imageUrl = savedImage;
  let previewOpacity = skin.opacity;
  if (open) {
    previewOpacity = draftOpacity;
    const trimmed = draftUrl.trim();
    if (!trimmed) {
      imageUrl = "";
    } else {
      const safe = sanitizeAssetUrl(trimmed);
      if (safe) imageUrl = safe;
    }
  }
  const hasImage = Boolean(imageUrl);

  function openEditor() {
    setDraftUrl(skin.imageUrl);
    setDraftOpacity(skin.opacity);
    setError("");
    setOpen(true);
  }

  function saveSkin() {
    const trimmed = draftUrl.trim();
    if (!trimmed) {
      setCardSkin(id, { imageUrl: "", opacity: draftOpacity });
      setOpen(false);
      return;
    }
    const safe = sanitizeAssetUrl(trimmed);
    if (!safe) {
      setError("请输入 http(s) 图片地址，或以 / 开头的站内路径。");
      return;
    }
    setCardSkin(id, { imageUrl: safe, opacity: draftOpacity });
    setOpen(false);
  }

  const tone = {
    "--fg": hasImage ? "#f7f4ef" : "#241f1b",
    "--muted": hasImage ? "rgba(247,244,239,0.78)" : "#5c564e",
    "--accent": hasImage ? "#b7ebc6" : "#1e6b48",
    "--chip": hasImage ? "rgba(255,255,255,0.14)" : "rgba(36,31,27,0.06)",
    "--line": hasImage ? "rgba(255,255,255,0.22)" : "rgba(36,31,27,0.12)",
  } as CSSProperties;

  return (
    <div className={`relative h-full min-w-0 ${className ?? ""}`} data-card={id}>
      {hasImage ? (
        <>
          <div
            className="absolute inset-0 rounded-3xl bg-cover bg-center transition-all duration-300"
            style={{
              backgroundImage: cssImage(imageUrl),
              opacity: previewOpacity,
            }}
          />
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-black/30 via-black/45 to-black/70" />
        </>
      ) : null}
      <div
        style={tone}
        className={`relative flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-white/20 shadow-lg backdrop-blur-md transition-all duration-300 hover:shadow-2xl ${
          hasImage ? "bg-white/15 text-[var(--fg)]" : "bg-white/60 text-[var(--fg)]"
        }`}
      >
        {admin ? (
          <button
            type="button"
            aria-label="更换这张卡片的背景"
            onClick={() => (open ? setOpen(false) : openEditor())}
            className="absolute right-3 top-3 z-20 grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-black/25 text-white/80 shadow-lg transition-all duration-300 hover:bg-black/40 hover:text-white"
          >
            <SkinIcon />
          </button>
        ) : null}
        <div className={`flex min-h-0 flex-1 flex-col p-5 ${admin ? "pt-12" : ""}`}>
          {children}
        </div>
      </div>
      {open ? (
        <form
          className="absolute right-3 top-14 z-30 w-64 rounded-2xl border border-white/20 bg-[#1c1917]/88 p-3 text-white shadow-2xl backdrop-blur-md transition-all duration-300"
          onSubmit={(event) => {
            event.preventDefault();
            saveSkin();
          }}
        >
          <p className="text-[11px] tracking-[0.18em] text-white/70">卡片换肤</p>
          <input
            value={draftUrl}
            onChange={(event) => {
              setDraftUrl(event.target.value);
              setError("");
            }}
            placeholder="图片 URL"
            spellCheck={false}
            className={`${fieldClass} mt-2 bg-white/90`}
          />
          <label className="mt-3 block text-xs text-white/75">
            背景透明度 {Math.round(draftOpacity * 100)}%
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={draftOpacity}
              onChange={(event) => setDraftOpacity(Number(event.target.value))}
              className="mt-1 w-full accent-[#1E6B48]"
            />
          </label>
          {error ? <p className="mt-2 text-xs text-red-200">{error}</p> : null}
          <div className="mt-3 flex gap-2">
            <button type="submit" className={`${primaryButtonClass} h-9 px-3 text-xs`}>
              保存
            </button>
            <button
              type="button"
              className={`${quietButtonClass} h-9 text-xs text-white/80 hover:bg-white/10`}
              onClick={() => {
                setDraftUrl("");
                setCardSkin(id, { imageUrl: "", opacity: draftOpacity });
                setOpen(false);
              }}
            >
              清除
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function SkinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <rect x="1" y="1" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="8" y="1" width="5" height="5" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="1" y="8" width="5" height="5" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="8" y="8" width="5" height="5" rx="1" fill="currentColor" opacity="0.45" />
    </svg>
  );
}
