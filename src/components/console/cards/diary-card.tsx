"use client";

import { useEffect, useRef, useState } from "react";
import { moods } from "@/lib/config";
import { formatEntryTime } from "@/lib/dates";
import {
  ensureDiaryFonts,
  fontFamilyFor,
  fontNameFromFile,
  importDiaryFont,
  isFontFile,
  loadDiaryFonts,
  type DiaryFont,
} from "@/lib/font-store";
import { getMedia, putMedia } from "@/lib/media-db";
import { readImageFile } from "@/lib/read-image";
import { useConsole } from "@/components/console/console-context";
import { GlassCard } from "@/components/console/glass-card";
import {
  Modal,
  fieldClass,
  primaryButtonClass,
  quietButtonClass,
} from "@/components/console/modal";

export function DiaryCard() {
  const { admin, entries, addEntry, removeEntry } = useConsole();
  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [fonts, setFonts] = useState<DiaryFont[]>([]);

  useEffect(() => {
    let cancelled = false;
    const saved = loadDiaryFonts();
    void ensureDiaryFonts(saved).then(() => {
      if (!cancelled) setFonts(saved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <GlassCard
      id="diary"
      anchorId="diary-hall"
      className="min-h-[420px] md:col-span-2 lg:col-span-2 lg:row-span-2"
    >
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-[0.22em] text-[var(--accent)]">
            JOURNAL
          </p>
          <h2 className="mt-1 font-serif text-2xl leading-tight">日记展厅</h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={primaryButtonClass}
        >
          写日记
        </button>
      </div>
      {entries.length === 0 ? (
        <p className="mt-8 text-sm leading-7 text-[var(--muted)]">
          这一页还是空的。从今天的天气，或一句没说完的话开始。
        </p>
      ) : (
        <ol className="mt-5 min-h-0 flex-1 space-y-5 overflow-y-auto border-l border-[var(--line)] pl-5 pr-1 max-h-[420px] lg:max-h-none">
          {entries.map((entry) => (
            <li key={entry.id} className="relative">
              <span className="absolute -left-[1.45rem] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs tracking-wide text-[var(--muted)]">
                  {formatEntryTime(entry.createdAt)}
                </p>
                {admin ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (pendingId === entry.id) {
                        removeEntry(entry.id);
                        setPendingId(null);
                        return;
                      }
                      setPendingId(entry.id);
                    }}
                    className="text-xs text-red-600 transition-all duration-300 hover:text-red-700"
                  >
                    {pendingId === entry.id ? "确认删除" : "删除"}
                  </button>
                ) : null}
              </div>
              <div
                className="mt-2"
                style={{ fontFamily: fontFamilyFor(entry.font, fonts) }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--chip)] px-2 py-0.5 text-xs">
                    {entry.mood}
                  </span>
                  <h3 className="text-lg leading-snug">{entry.title}</h3>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--muted)]">
                  {entry.content}
                </p>
              </div>
              <EntryImages ids={entry.images} />
            </li>
          ))}
        </ol>
      )}
      {open ? (
        <DiaryDialog
          fonts={fonts}
          onFonts={setFonts}
          onClose={() => setOpen(false)}
          onSave={(input) => {
            addEntry(input);
            setOpen(false);
          }}
        />
      ) : null}
    </GlassCard>
  );
}

function EntryImages({ ids }: { ids: string[] }) {
  const [sources, setSources] = useState<string[]>([]);
  const idList = ids.join("|");

  useEffect(() => {
    let cancelled = false;
    if (!idList) {
      setSources([]);
      return () => {
        cancelled = true;
      };
    }
    void Promise.all(idList.split("|").map((id) => getMedia(id))).then((values) => {
      if (!cancelled) {
        setSources(values.flatMap((value) => (value ? [value] : [])));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [idList]);

  if (sources.length === 0) return null;

  return (
    <div
      className={`mt-3 grid gap-2 ${sources.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
    >
      {sources.map((source, index) => (
        <img
          key={`${idList}-${index}`}
          src={source}
          alt=""
          className="max-h-48 w-full rounded-2xl object-cover"
        />
      ))}
    </div>
  );
}

function DiaryDialog({
  fonts,
  onFonts,
  onClose,
  onSave,
}: {
  fonts: DiaryFont[];
  onFonts: (fonts: DiaryFont[]) => void;
  onClose: () => void;
  onSave: (input: {
    title: string;
    content: string;
    mood: string;
    images: string[];
    font: string;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string>(moods[0].emoji);
  const [font, setFont] = useState("serif");
  const [fontError, setFontError] = useState("");
  const [pictures, setPictures] = useState<{ id: string; url: string; file: File }[]>([]);
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const titleId = "diary-title";
  const contentId = "diary-content";

  function addPictures(list: FileList | null) {
    const files = [...(list ?? [])].filter((file) => file.type.startsWith("image/"));
    if (files.length === 0) return;
    setPictures((current) => {
      const room = 3 - current.length;
      const next = files.slice(0, room).map((file) => ({
        id: crypto.randomUUID(),
        url: URL.createObjectURL(file),
        file,
      }));
      return [...current, ...next];
    });
    if (pictures.length + files.length > 3) {
      setImageError("最多三张配图。");
    } else {
      setImageError("");
    }
  }

  return (
    <Modal title="写日记" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim() || !content.trim() || saving) return;
          setSaving(true);
          void (async () => {
            try {
              const images: string[] = [];
              for (const picture of pictures) {
                const dataUrl = await readImageFile(picture.file);
                await putMedia(picture.id, dataUrl);
                images.push(picture.id);
              }
              pictures.forEach((picture) => URL.revokeObjectURL(picture.url));
              onSave({ title, content, mood, images, font });
            } catch {
              setImageError("配图没有保存成功。");
              setSaving(false);
            }
          })();
        }}
      >
        <p className="text-[11px] font-medium tracking-[0.22em] text-[#1E6B48]">
          NEW ENTRY
        </p>
        <h2 className="mt-2 font-serif text-3xl">写下今天</h2>
        <label htmlFor={titleId} className="mt-5 block text-xs text-[#5c564e]">
          标题
        </label>
        <input
          id={titleId}
          value={title}
          maxLength={40}
          onChange={(event) => setTitle(event.target.value)}
          className={`${fieldClass} mt-1.5`}
          placeholder="给这一页起个名字"
        />
        <label htmlFor={contentId} className="mt-4 block text-xs text-[#5c564e]">
          内容
        </label>
        <textarea
          id={contentId}
          value={content}
          maxLength={2000}
          rows={5}
          onChange={(event) => setContent(event.target.value)}
          className={`${fieldClass} mt-1.5 resize-none leading-7`}
          style={{ fontFamily: fontFamilyFor(font, fonts) }}
          placeholder="从天气，或一句没说完的话开始"
        />
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label htmlFor="diary-font" className="min-w-40 flex-1 text-xs text-[#5c564e]">
            字体样式
            <select
              id="diary-font"
              value={font}
              onChange={(event) => setFont(event.target.value)}
              className={`${fieldClass} mt-1.5`}
            >
              <option value="sans">无衬线体</option>
              <option value="serif">经典衬线体</option>
              {fonts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className={`${quietButtonClass} cursor-pointer`}>
            导入字体
            <input
              type="file"
              accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                if (!isFontFile(file)) {
                  setFontError("请选择 ttf、otf、woff 或 woff2 文件。");
                  return;
                }
                setFontError("");
                void importDiaryFont(file, fontNameFromFile(file))
                  .then((imported) => {
                    onFonts([...fonts, imported]);
                    setFont(imported.id);
                  })
                  .catch((reason: unknown) => {
                    setFontError(
                      reason instanceof Error && reason.message === "too-large"
                        ? "字体文件超过 12MB。"
                        : "这个字体没有导入成功。",
                    );
                  });
              }}
            />
          </label>
        </div>
        {fontError ? <p className="mt-2 text-sm text-red-700">{fontError}</p> : null}
        <p className="mt-4 text-xs text-[#5c564e]">心情</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {moods.map((item) => (
            <button
              key={item.label}
              type="button"
              aria-pressed={mood === item.emoji}
              onClick={() => setMood(item.emoji)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-all duration-300 ${
                mood === item.emoji
                  ? "border-[#1E6B48] bg-[#1E6B48] text-white"
                  : "border-black/10 bg-white/70"
              }`}
            >
              {item.emoji} {item.label}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={pictures.length >= 3}
            className={quietButtonClass}
          >
            📷 添加配图
          </button>
          <span className="text-xs text-[#5c564e]">{pictures.length}/3</span>
          <input
            ref={fileRef}
            data-diary-images
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(event) => {
              addPictures(event.target.files);
              event.target.value = "";
            }}
          />
        </div>
        {pictures.length > 0 ? (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {pictures.map((picture) => (
              <div key={picture.id} className="relative">
                <img
                  src={picture.url}
                  alt=""
                  className="h-20 w-full rounded-2xl object-cover"
                />
                <button
                  type="button"
                  aria-label="移除配图"
                  onClick={() => {
                    URL.revokeObjectURL(picture.url);
                    setPictures((current) =>
                      current.filter((item) => item.id !== picture.id),
                    );
                  }}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-xs text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}
        {imageError ? <p className="mt-2 text-sm text-red-700">{imageError}</p> : null}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={quietButtonClass}>
            取消
          </button>
          <button
            type="submit"
            disabled={!title.trim() || !content.trim() || saving}
            className={primaryButtonClass}
          >
            {saving ? "保存中" : "收入纸页"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
