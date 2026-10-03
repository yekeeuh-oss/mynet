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
  putMedia,
} from "@/lib/media-db";
import { imageFileFromClipboard, imageFileFromList, readImageFile } from "@/lib/read-image";
import { useAppChrome } from "@/components/console/app-chrome";
import { useConsole } from "@/components/console/console-context";
import { fieldClass, primaryButtonClass, quietButtonClass } from "@/components/console/modal";

type GlassCardProps = {
  id: CardId;
  anchorId?: string;
  className?: string;
  children: React.ReactNode;
};

export function GlassCard({ id, anchorId, className, children }: GlassCardProps) {
  const { admin, settings, setCardSkin } = useConsole();
  const { theme } = useAppChrome();
  const skin = settings.cards[id];
  const [open, setOpen] = useState(false);
  const [draftUrl, setDraftUrl] = useState(skin.imageUrl);
  const [draftOpacity, setDraftOpacity] = useState(skin.opacity);
  const [draftFrame, setDraftFrame] = useState(skin.hideFrame === true);
  const [resolvedImage, setResolvedImage] = useState("");
  const [liveImage, setLiveImage] = useState("");
  const [error, setError] = useState("");
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const imageRef = useRef(skin.imageUrl);
  const applyRef = useRef<(file: File) => Promise<void>>(async () => {});
  imageRef.current = skin.imageUrl;

  const transparency = open ? draftOpacity : skin.opacity;
  const hideFrame = open ? draftFrame : skin.hideFrame === true;
  const clear = transparency >= 0.999;
  const whiteAlpha = 1 - transparency;

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

  const imageUrl = liveImage || resolvedImage;
  const hasImage = Boolean(imageUrl);
  const lightPage = theme === "light" && !hasImage && whiteAlpha < 0.45;
  const foreground = lightPage || (whiteAlpha >= 0.55 && !hasImage) ? "#241f1b" : "#f7f4ef";
  const muted = foreground === "#241f1b" ? "#5c564e" : "rgba(247,244,239,0.82)";
  const accent = foreground === "#241f1b" ? "#1e6b48" : "#b7ebc6";

  const tone = {
    "--fg": foreground,
    "--muted": muted,
    "--accent": accent,
    "--chip": foreground === "#241f1b" ? "rgba(36,31,27,0.06)" : "rgba(255,255,255,0.14)",
    "--line": foreground === "#241f1b" ? "rgba(36,31,27,0.12)" : "rgba(255,255,255,0.22)",
    backgroundColor: clear ? "rgba(0, 0, 0, 0)" : `rgba(255, 255, 255, ${whiteAlpha})`,
    borderColor: hideFrame ? "transparent" : clear ? "rgba(255, 255, 255, 0.16)" : undefined,
    boxShadow: hideFrame ? "none" : clear ? "0 0 12px rgba(255, 255, 255, 0.14)" : undefined,
  } as CSSProperties;

  function openEditor() {
    setDraftUrl(skin.imageUrl.startsWith("idb:") || skin.imageUrl.startsWith("data:") ? "" : skin.imageUrl);
    setDraftOpacity(skin.opacity);
    setDraftFrame(skin.hideFrame === true);
    setError("");
    setOpen(true);
  }

  async function applyFile(file: File) {
    setBusy(true);
    setError("");
    try {
      const dataUrl = await readImageFile(file);
      const mediaId = cardSkinMediaId(id);
      const reference = `idb:${mediaId}`;
      await putMedia(mediaId, dataUrl);
      imageRef.current = reference;
      setLiveImage(dataUrl);
      setDraftUrl("");
      setCardSkin(id, { imageUrl: reference, opacity: draftOpacity, hideFrame: draftFrame });
    } catch (reason) {
      setError(
        reason instanceof Error && reason.message === "too-large"
          ? "图片超过 15MB，请换一张小一些的。"
          : "没有读出图片。请拖入图片，或粘贴截图。",
      );
    } finally {
      setBusy(false);
    }
  }

  applyRef.current = applyFile;

  useEffect(() => {
    if (!open) return;
    function onPaste(event: ClipboardEvent) {
      const file = imageFileFromClipboard(event.clipboardData);
      if (!file) return;
      event.preventDefault();
      void applyRef.current(file);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [open]);

  function commitOpacity(value: number) {
    setDraftOpacity(value);
    setCardSkin(id, {
      imageUrl: imageRef.current,
      opacity: value,
      hideFrame: draftFrame,
    });
  }

  function commitFrame(hidden: boolean) {
    setDraftFrame(hidden);
    setCardSkin(id, {
      imageUrl: imageRef.current,
      opacity: draftOpacity,
      hideFrame: hidden,
    });
  }

  function saveUrl() {
    const trimmed = draftUrl.trim();
    if (!trimmed) {
      void resetSkin();
      return;
    }
    const safe = sanitizeAssetUrl(trimmed);
    if (!safe) {
      setError("请输入 http(s) 图片地址，或以 / 开头的站内路径。");
      return;
    }
    imageRef.current = safe;
    setLiveImage("");
    setCardSkin(id, { imageUrl: safe, opacity: draftOpacity, hideFrame: draftFrame });
    setOpen(false);
  }

  async function resetSkin() {
    await deleteMedia(cardSkinMediaId(id));
    imageRef.current = "";
    setLiveImage("");
    setDraftUrl("");
    setDraftOpacity(0.4);
    setDraftFrame(false);
    setResolvedImage("");
    setCardSkin(id, { imageUrl: "", opacity: 0.4, hideFrame: false });
    setOpen(false);
  }

  return (
    <div
      id={anchorId}
      className={`relative h-full min-w-0 ${className ?? ""}`}
      data-card={id}
    >
      {hasImage ? (
        <div
          className="absolute inset-0 rounded-3xl bg-cover bg-center transition-all duration-300"
          style={{ backgroundImage: cssImage(imageUrl) }}
        />
      ) : null}
      <div
        style={tone}
        className={`card-face glass-shell relative flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border text-[var(--fg)] transition-all duration-300 ${
          hideFrame || clear ? "border-transparent" : "border-white/20 shadow-lg hover:shadow-2xl"
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
          className="absolute right-3 top-14 z-30 w-72 rounded-2xl border border-white/20 bg-[#1c1917]/92 p-3 text-white shadow-2xl transition-all duration-300"
          onSubmit={(event) => {
            event.preventDefault();
            saveUrl();
          }}
        >
          <p className="text-[11px] tracking-[0.18em] text-white/70">卡片换肤</p>
          <div
            data-card-dropzone={id}
            onDragOver={(event) => {
              event.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setOver(false);
              const file = imageFileFromList(event.dataTransfer.files);
              if (!file) {
                setError("请拖入图片文件。");
                return;
              }
              void applyFile(file);
            }}
            className={`mt-2 grid min-h-24 place-items-center rounded-2xl border border-dashed px-3 py-4 text-center text-xs leading-6 transition-all duration-300 ${
              over ? "border-[#9ddec0] bg-white/10" : "border-white/25"
            }`}
          >
            <div>
              <p>{busy ? "正在读取…" : "拖入图片，或按 Ctrl+V 粘贴截图"}</p>
              <label className="mt-2 inline-flex h-8 cursor-pointer items-center rounded-full bg-[#1E6B48] px-3 text-xs text-[#FAF9F6]">
                选择图片
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = imageFileFromList(event.target.files);
                    event.target.value = "";
                    if (file) void applyFile(file);
                  }}
                />
              </label>
            </div>
          </div>
          <input
            value={draftUrl}
            onChange={(event) => {
              setDraftUrl(event.target.value);
              setError("");
            }}
            placeholder="或填写图片 URL"
            spellCheck={false}
            className={`${fieldClass} mt-2 bg-white/90`}
          />
          <label className="mt-3 block text-xs text-white/75">
            背景透明度 {Math.round(transparency * 100)}%
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={transparency}
              onChange={(event) => commitOpacity(Number(event.target.value))}
              className="mt-1 w-full accent-[#1E6B48]"
            />
          </label>
          <p className="mt-1 text-[11px] leading-5 text-white/55">
            100% 时底色完全透明，壁纸保持清晰。
          </p>
          <button
            type="button"
            onClick={() => commitFrame(!hideFrame)}
            className={`${quietButtonClass} mt-2 h-9 w-full text-xs text-white/80 hover:bg-white/10`}
          >
            {hideFrame ? "显示边框" : "隐藏边框"}
          </button>
          {error ? <p className="mt-2 text-xs text-red-200">{error}</p> : null}
          <div className="mt-3 flex gap-2">
            <button type="submit" className={`${primaryButtonClass} h-9 px-3 text-xs`}>
              保存地址
            </button>
            <button
              type="button"
              className={`${quietButtonClass} h-9 items-center text-xs text-white/80 hover:bg-white/10`}
              aria-label="重置"
              onClick={() => void resetSkin()}
            >
              <ResetIcon />
              重置
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function ResetIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="mr-1">
      <path
        d="M2 6a4 4 0 1 0 1.1-2.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path d="M2 1.8V4.2h2.4" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
