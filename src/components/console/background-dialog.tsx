"use client";

import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/lib/config";
import {
  deleteMedia,
  getMedia,
  isMediaRef,
  mediaIdFromRef,
  putMedia,
} from "@/lib/media-db";
import { imageFileFromClipboard, imageFileFromList, readImageFile } from "@/lib/read-image";
import { cssImage, sanitizeAssetUrl } from "@/lib/url";
import {
  Modal,
  fieldClass,
  primaryButtonClass,
  quietButtonClass,
} from "@/components/console/modal";

type BackgroundDialogProps = {
  title: string;
  description: string;
  mediaId: string;
  initialRef: string;
  onClose: () => void;
  onPreview: (url: string | undefined) => void;
  onApply: (reference: string) => void;
};

export function BackgroundDialog({
  title,
  description,
  mediaId,
  initialRef,
  onClose,
  onPreview,
  onApply,
}: BackgroundDialogProps) {
  const [draft, setDraft] = useState(
    initialRef.startsWith("http") || initialRef.startsWith("/") ? initialRef : "",
  );
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const applyRef = useRef<(file: File) => Promise<void>>(async () => {});

  useEffect(() => {
    let cancelled = false;
    if (isMediaRef(initialRef)) {
      void getMedia(mediaIdFromRef(initialRef)).then((value) => {
        if (!cancelled && value) setPreview(value);
      });
    } else if (initialRef) {
      setPreview(initialRef);
    }
    return () => {
      cancelled = true;
    };
  }, [initialRef]);

  async function applyFile(file: File) {
    setBusy(true);
    setError("");
    try {
      const dataUrl = await readImageFile(file);
      await putMedia(mediaId, dataUrl);
      setDraft("");
      setPreview(dataUrl);
      onPreview(dataUrl);
      onApply(`idb:${mediaId}`);
    } catch (reason) {
      setError(
        reason instanceof Error && reason.message === "too-large"
          ? "图片超过 15MB，请换一张小一些的。"
          : "没有读出图片。请拖入图片文件，或粘贴截图。",
      );
    } finally {
      setBusy(false);
    }
  }

  applyRef.current = applyFile;

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const file = imageFileFromClipboard(event.clipboardData);
      if (!file) return;
      event.preventDefault();
      void applyRef.current(file);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  async function clearBackground() {
    setBusy(true);
    setError("");
    await deleteMedia(mediaId);
    setDraft("");
    setPreview("");
    onPreview("");
    onApply("");
    setBusy(false);
  }

  function saveUrl() {
    const trimmed = draft.trim();
    if (!trimmed) {
      void clearBackground();
      return;
    }
    const safe = sanitizeAssetUrl(trimmed);
    if (!safe) {
      setError("请输入 http(s) 图片地址，或以 / 开头的站内路径。");
      return;
    }
    void deleteMedia(mediaId);
    setPreview(safe);
    onPreview(undefined);
    onApply(safe);
  }

  const shown = preview || siteConfig.defaultBackground;

  return (
    <Modal title={title} onClose={onClose} wide>
      <p className="text-[11px] font-medium tracking-[0.22em] text-[#1E6B48]">
        WALLPAPER
      </p>
      <h2 className="mt-2 font-serif text-3xl">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-[#5c564e]">{description}</p>
      <div
        data-dropzone
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
        className={`mt-4 grid min-h-32 place-items-center rounded-2xl border border-dashed px-4 py-6 text-center text-sm leading-7 transition-all duration-300 ${
          over ? "border-[#1E6B48] bg-[#1E6B48]/10" : "border-black/15 bg-white/50"
        }`}
      >
        <div>
          <p>{busy ? "正在读取图片…" : "把图片拖到这里"}</p>
          <p className="mt-1 text-[#5c564e]">或在此面板按 Ctrl+V 粘贴剪贴板图片</p>
          <label className="mt-3 inline-flex h-10 cursor-pointer items-center rounded-full bg-[#1E6B48] px-4 text-sm font-medium text-[#FAF9F6] transition-all duration-300 hover:bg-[#18583C]">
            选择本地图片
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
      <div
        className="mt-3 h-28 rounded-2xl border border-black/10 bg-cover bg-center"
        style={{ backgroundImage: cssImage(shown) }}
      />
      <label htmlFor={`${mediaId}-url`} className="mt-4 block text-xs text-[#5c564e]">
        或使用图片地址
      </label>
      <input
        id={`${mediaId}-url`}
        value={draft}
        spellCheck={false}
        onChange={(event) => {
          const value = event.target.value;
          setDraft(value);
          const trimmed = value.trim();
          if (!trimmed) {
            setError("");
            return;
          }
          const safe = sanitizeAssetUrl(trimmed);
          if (!safe) {
            setError("请输入 http(s) 图片地址，或以 / 开头的站内路径。");
            return;
          }
          setError("");
          setPreview(safe);
          onPreview(safe);
        }}
        placeholder={siteConfig.defaultBackground}
        className={`${fieldClass} mt-1.5`}
      />
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={() => void clearBackground()} className={quietButtonClass}>
          清除背景
        </button>
        <button type="button" onClick={saveUrl} className={quietButtonClass}>
          保存地址
        </button>
        <button type="button" onClick={onClose} className={primaryButtonClass}>
          完成
        </button>
      </div>
    </Modal>
  );
}
