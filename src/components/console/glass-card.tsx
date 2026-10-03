"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { cssImage, sanitizeAssetUrl } from "@/lib/url";
import type { CardId } from "@/lib/types";
import {
  cardSkinMediaId,
  deleteMedia,
  getMedia,
  isMediaRef,
  mediaIdFromRef,
} from "@/lib/media-db";
import { imageFileFromClipboard, imageFileFromList, readImageFile } from "@/lib/read-image";
import { useAppChrome } from "@/components/console/app-chrome";
import { useConsole } from "@/components/console/console-context";

type GlassCardProps = {
  id: CardId;
  anchorId?: string;
  className?: string;
  children: React.ReactNode;
};

function isSkinImage(file: File) {
  return /^image\/(png|jpeg|webp)$/.test(file.type) || /\.(png|jpe?g|webp)$/i.test(file.name);
}

export function GlassCard({ id, anchorId, className, children }: GlassCardProps) {
  const { settings, setCardSkin } = useConsole();
  const { theme, toast } = useAppChrome();
  const skin = settings.cards[id];
  const rootRef = useRef<HTMLDivElement>(null);
  const dragDepth = useRef(0);
  const hotRef = useRef(false);
  const applyRef = useRef<(file: File) => Promise<void>>(async () => {});
  const [over, setOver] = useState(false);
  const [hot, setHot] = useState(false);
  const [picked, setPicked] = useState(false);
  const [panel, setPanel] = useState(false);
  const [resolvedImage, setResolvedImage] = useState("");
  hotRef.current = hot || picked;

  const transparency = skin.opacity;
  const hideFrame = skin.hideFrame === true;
  const clear = transparency >= 0.999;
  const whiteAlpha = 1 - transparency;
  const hasImage = Boolean(resolvedImage);
  const lightPage = theme === "light" && !hasImage && whiteAlpha < 0.45;
  const foreground = lightPage || (whiteAlpha >= 0.55 && !hasImage) ? "#241f1b" : "#f7f4ef";

  const tone = {
    "--fg": foreground,
    "--muted": foreground === "#241f1b" ? "#5c564e" : "rgba(247,244,239,0.82)",
    "--accent": foreground === "#241f1b" ? "#1e6b48" : "#b7ebc6",
    "--chip": foreground === "#241f1b" ? "rgba(36,31,27,0.06)" : "rgba(255,255,255,0.14)",
    "--line": foreground === "#241f1b" ? "rgba(36,31,27,0.12)" : "rgba(255,255,255,0.22)",
    backgroundColor: clear ? "rgba(0, 0, 0, 0)" : `rgba(255, 255, 255, ${whiteAlpha})`,
    borderColor: hideFrame ? "transparent" : clear ? "rgba(255, 255, 255, 0.16)" : undefined,
    boxShadow: hideFrame ? "none" : clear ? "0 0 12px rgba(255, 255, 255, 0.14)" : undefined,
  } as CSSProperties;

  useEffect(() => {
    let cancelled = false;
    const reference = skin.imageUrl;
    if (!reference) {
      setResolvedImage("");
      return () => {
        cancelled = true;
      };
    }
    if (reference.startsWith("data:image/")) {
      setResolvedImage(reference);
      return () => {
        cancelled = true;
      };
    }
    if (isMediaRef(reference)) {
      void getMedia(mediaIdFromRef(reference)).then((value) => {
        if (!cancelled) setResolvedImage(value ?? "");
      });
      return () => {
        cancelled = true;
      };
    }
    setResolvedImage(sanitizeAssetUrl(reference) || "");
    return () => {
      cancelled = true;
    };
  }, [skin.imageUrl]);

  async function applyFile(file: File) {
    if (!isSkinImage(file)) {
      toast("请使用 PNG、JPG 或 WEBP");
      return;
    }
    try {
      const dataUrl = await readImageFile(file);
      await deleteMedia(cardSkinMediaId(id));
      const saved = setCardSkin(id, {
        imageUrl: dataUrl,
        opacity: skin.opacity,
        hideFrame: skin.hideFrame,
      });
      if (!saved) toast("这张图太大，没有保存下来");
    } catch {
      toast("没有读出这张图片");
    }
  }

  applyRef.current = applyFile;

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      if (!hotRef.current) return;
      const file = imageFileFromClipboard(event.clipboardData);
      if (!file || !isSkinImage(file)) return;
      event.preventDefault();
      void applyRef.current(file);
    }
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setPicked(false);
        setPanel(false);
      }
    }
    window.addEventListener("paste", onPaste);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("paste", onPaste);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  function setTransparency(value: number) {
    const saved = setCardSkin(id, {
      imageUrl: skin.imageUrl,
      opacity: value,
      hideFrame: skin.hideFrame,
    });
    if (!saved) toast("透明度没有保存下来");
  }

  function resetSkin() {
    void deleteMedia(cardSkinMediaId(id));
    const saved = setCardSkin(id, { imageUrl: "", opacity: 0.4, hideFrame: false });
    if (!saved) toast("重置没有保存下来");
    setPanel(false);
  }

  return (
    <div
      id={anchorId}
      ref={rootRef}
      data-card={id}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onPointerDown={() => setPicked(true)}
      onDragEnter={(event) => {
        event.preventDefault();
        dragDepth.current += 1;
        setOver(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => {
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) {
          dragDepth.current = 0;
          setOver(false);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        dragDepth.current = 0;
        setOver(false);
        const file = imageFileFromList(event.dataTransfer.files);
        if (file) void applyFile(file);
      }}
      className={`relative h-full min-w-0 ${className ?? ""} ${
        over ? "motion-safe:animate-[edge-breathe_1.4s_ease-in-out_infinite] rounded-3xl" : ""
      }`}
    >
      {hasImage ? (
        <div
          className="absolute inset-0 rounded-3xl bg-cover bg-center"
          style={{ backgroundImage: cssImage(resolvedImage) }}
        />
      ) : null}
      <div
        style={tone}
        className={`card-face glass-shell relative flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border text-[var(--fg)] transition-all duration-300 ${
          hideFrame || clear ? "border-transparent" : "border-white/20 shadow-lg hover:shadow-2xl"
        }`}
      >
        <div className="flex min-h-0 flex-1 flex-col p-5 pr-12">{children}</div>
      </div>
      <button
        type="button"
        aria-label="卡片设置"
        aria-expanded={panel}
        onClick={(event) => {
          event.stopPropagation();
          setPanel((open) => !open);
        }}
        className="absolute top-3 right-3 z-20 grid h-7 w-7 place-items-center rounded-full border border-white/30 bg-black/35 text-white shadow-lg transition-all duration-300 hover:bg-black/50"
      >
        <GearIcon />
      </button>
      {panel ? (
        <div className="absolute top-12 right-3 z-30 w-52 rounded-2xl border border-white/20 bg-[#1c1917]/92 p-3 text-white shadow-2xl">
          <label className="block text-xs text-white/80">
            透明度 {Math.round(transparency * 100)}%
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={transparency}
              onChange={(event) => setTransparency(Number(event.target.value))}
              className="mt-2 w-full accent-[#1E6B48]"
            />
          </label>
          <p className="mt-1 text-[11px] leading-5 text-white/50">100% 纯透，0% 实体底色。</p>
          {hasImage ? (
            <button
              type="button"
              onClick={resetSkin}
              className="mt-3 inline-flex h-8 items-center gap-1 rounded-full px-2 text-xs text-white/80 transition-all duration-300 hover:bg-white/10"
            >
              <ResetIcon />
              重置
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function GearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="currentColor">
      <path d="M5.7 1.1h2.6l.3 1.4c.4.2.8.4 1.2.7l1.3-.6 1.3 2.1-1 1c.1.4.1.8 0 1.2l1 1-1.3 2.1-1.3-.6c-.4.3-.8.5-1.2.7l-.3 1.4H5.7l-.3-1.4a4 4 0 0 1-1.2-.7l-1.3.6-1.3-2.1 1-1a4 4 0 0 1 0-1.2l-1-1 1.3-2.1 1.3.6c.4-.3.8-.5 1.2-.7l.3-1.4Zm1.3 3.3a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2Z" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M2.2 6a3.8 3.8 0 1 0 1-2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M2 2.2V4.4h2.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
