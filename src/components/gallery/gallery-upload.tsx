"use client";

import { useEffect, useState } from "react";
import { putMedia } from "@/lib/media-db";
import { readImageFile } from "@/lib/read-image";
import type { CaptionFont, GalleryCategory, GalleryPhoto, GalleryPrefs } from "@/lib/types";
import { galleryCategories } from "@/lib/types";
import {
  Modal,
  fieldClass,
  primaryButtonClass,
  quietButtonClass,
} from "@/components/console/modal";

const fontOptions: { id: CaptionFont; label: string }[] = [
  { id: "sans", label: "现代无衬线" },
  { id: "serif", label: "优雅衬线" },
  { id: "script", label: "手写花体" },
];

type GalleryUploadProps = {
  file: File;
  prefs: GalleryPrefs;
  onClose: () => void;
  onPublish: (photo: GalleryPhoto, prefs: GalleryPrefs) => void;
};

export function GalleryUpload({ file, prefs, onClose, onPublish }: GalleryUploadProps) {
  const [preview, setPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [color, setColor] = useState(prefs.saveAsDefault ? prefs.color : "#f7f4ef");
  const [font, setFont] = useState<CaptionFont>(prefs.saveAsDefault ? prefs.font : "sans");
  const [category, setCategory] = useState<GalleryCategory>("生活");
  const [saveAsDefault, setSaveAsDefault] = useState(prefs.saveAsDefault);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <Modal title="上传相片" onClose={onClose} wide>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (saving) return;
          setSaving(true);
          void (async () => {
            try {
              const mediaId = crypto.randomUUID();
              const dataUrl = await readImageFile(file);
              await putMedia(mediaId, dataUrl);
              const photo: GalleryPhoto = {
                id: crypto.randomUUID(),
                mediaId,
                caption: caption.trim(),
                color,
                font,
                category,
                createdAt: new Date().toISOString(),
                likes: [],
                comments: [],
              };
              onPublish(photo, {
                ...prefs,
                saveAsDefault,
                color: saveAsDefault ? color : prefs.color,
                font: saveAsDefault ? font : prefs.font,
              });
            } catch {
              setError("这张照片没有保存下来。");
              setSaving(false);
            }
          })();
        }}
      >
        <p className="text-[11px] font-medium tracking-[0.22em] text-[#1E6B48]">
          FRAME
        </p>
        <h2 className="mt-2 font-serif text-3xl">随手拍</h2>
        {preview ? (
          <img src={preview} alt="" className="mt-4 max-h-56 w-full rounded-2xl object-cover" />
        ) : null}
        <label htmlFor="caption" className="mt-4 block text-xs text-[#5c564e]">
          摄影感想
        </label>
        <textarea
          id="caption"
          value={caption}
          maxLength={120}
          rows={3}
          onChange={(event) => setCaption(event.target.value)}
          className={`${fieldClass} mt-1.5 resize-none leading-7`}
          placeholder="这一眼看见了什么"
        />
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <label className="text-xs text-[#5c564e]">
            文字颜色
            <input
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="mt-1.5 block h-10 w-16 cursor-pointer rounded-xl border border-black/10 bg-white"
            />
          </label>
          <label className="min-w-40 flex-1 text-xs text-[#5c564e]">
            字体
            <select
              value={font}
              onChange={(event) => setFont(event.target.value as CaptionFont)}
              className={`${fieldClass} mt-1.5`}
            >
              {fontOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p
          className="mt-3 text-lg leading-8"
          style={{
            color,
            fontFamily:
              font === "script"
                ? '"Ma Shan Zheng", cursive'
                : font === "serif"
                  ? "var(--font-serif), serif"
                  : "var(--font-sans), sans-serif",
          }}
        >
          {caption || "感想会压在照片下方"}
        </p>
        <p className="mt-3 text-xs text-[#5c564e]">分类</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {galleryCategories.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
              className={`rounded-full px-3 py-1.5 text-sm transition-all duration-300 ${
                category === item
                  ? "bg-[#1E6B48] text-white"
                  : "border border-black/10 bg-white/70"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm text-[#5c564e]">
          <input
            type="checkbox"
            checked={saveAsDefault}
            onChange={(event) => setSaveAsDefault(event.target.checked)}
            className="accent-[#1E6B48]"
          />
          保存为默认排版
        </label>
        {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={quietButtonClass}>
            取消
          </button>
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving ? "保存中" : "放入画廊"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
