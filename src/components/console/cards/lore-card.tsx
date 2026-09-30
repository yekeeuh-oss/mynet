"use client";

import { useEffect, useState } from "react";
import { notifyDiaryRefresh } from "@/lib/events";
import { loadLore, saveLore } from "@/lib/lore-store";
import { deleteMedia, getMedia, putMedia } from "@/lib/media-db";
import { readImageFile } from "@/lib/read-image";
import type { LoreCategory, LoreItem } from "@/lib/types";
import { loreCategories } from "@/lib/types";
import { useAppChrome } from "@/components/console/app-chrome";
import { GlassCard } from "@/components/console/glass-card";
import {
  Modal,
  fieldClass,
  primaryButtonClass,
  quietButtonClass,
} from "@/components/console/modal";

export function LoreCard() {
  const { toast } = useAppChrome();
  const [items, setItems] = useState<LoreItem[]>([]);
  const [filter, setFilter] = useState<LoreCategory | "全部">("全部");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setItems(loadLore());
  }, []);

  const visible = filter === "全部" ? items : items.filter((item) => item.category === filter);

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    toast("已复制");
  }

  function removeItem(item: LoreItem) {
    if (item.imageId) void deleteMedia(item.imageId);
    const next = items.filter((entry) => entry.id !== item.id);
    setItems(next);
    saveLore(next);
    notifyDiaryRefresh();
  }

  return (
    <GlassCard id="lore" className="min-h-[260px] md:col-span-1 lg:col-span-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-[0.22em] text-[var(--accent)]">
            LORE
          </p>
          <h2 className="mt-1 font-serif text-2xl leading-tight">灵感橱窗</h2>
        </div>
        <button type="button" onClick={() => setOpen(true)} className={primaryButtonClass}>
          记下
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(["全部", ...loreCategories] as const).map((category) => (
          <button
            key={category}
            type="button"
            aria-pressed={filter === category}
            onClick={() => setFilter(category)}
            className={`rounded-full px-3 py-1 text-xs transition-all duration-300 ${
              filter === category ? "bg-[#1E6B48] text-white" : "bg-[var(--chip)]"
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
        {visible.map((item) => (
          <li key={item.id} className="flex gap-3 rounded-2xl bg-[var(--chip)] p-3">
            <LoreThumb item={item} />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] tracking-wide text-[var(--accent)]">{item.category}</p>
              <h3 className="truncate font-serif text-lg leading-snug">{item.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                {item.summary}
              </p>
              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => void copyText(item.prompt)}
                  className="text-xs font-medium text-[var(--accent)] transition-all duration-300 hover:opacity-70"
                >
                  复制文本
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(item)}
                  className="text-xs text-[var(--muted)] transition-all duration-300 hover:text-red-600"
                >
                  移除
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {open ? (
        <LoreDialog
          onClose={() => setOpen(false)}
          onSave={(item) => {
            const next = [item, ...items];
            setItems(next);
            saveLore(next);
            notifyDiaryRefresh();
            setOpen(false);
          }}
        />
      ) : null}
    </GlassCard>
  );
}

function LoreThumb({ item }: { item: LoreItem }) {
  const [source, setSource] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!item.imageId) {
      setSource("");
      return () => {
        cancelled = true;
      };
    }
    void getMedia(item.imageId).then((value) => {
      if (!cancelled) setSource(value ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, [item.imageId]);

  if (source) {
    return (
      <img src={source} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
    );
  }

  return (
    <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#1E6B48] font-serif text-xl text-[#FAF9F6]">
      {item.title.slice(0, 1)}
    </span>
  );
}

function LoreDialog({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (item: LoreItem) => void;
}) {
  const [category, setCategory] = useState<LoreCategory>(loreCategories[0]);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <Modal title="记下灵感" onClose={onClose} wide>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim() || !prompt.trim() || saving) return;
          setSaving(true);
          void (async () => {
            let imageId = "";
            if (file) {
              imageId = crypto.randomUUID();
              const dataUrl = await readImageFile(file);
              await putMedia(imageId, dataUrl);
            }
            onSave({
              id: crypto.randomUUID(),
              category,
              title: title.trim(),
              summary: summary.trim(),
              prompt: prompt.trim(),
              imageId,
              createdAt: new Date().toISOString(),
            });
          })();
        }}
      >
        <p className="text-[11px] font-medium tracking-[0.22em] text-[#1E6B48]">LORE</p>
        <h2 className="mt-2 font-serif text-3xl">记下灵感</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {loreCategories.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
              className={`rounded-full px-3 py-1.5 text-sm transition-all duration-300 ${
                category === item ? "bg-[#1E6B48] text-white" : "border border-black/10 bg-white/70"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <input
          value={title}
          maxLength={40}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="标题"
          className={`${fieldClass} mt-4`}
        />
        <input
          value={summary}
          maxLength={80}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="摘要"
          className={`${fieldClass} mt-3`}
        />
        <textarea
          value={prompt}
          maxLength={800}
          rows={4}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="提示词或灵感原文"
          className={`${fieldClass} mt-3 resize-none leading-7`}
        />
        <label className="mt-3 inline-flex h-10 cursor-pointer items-center rounded-full border border-black/10 px-4 text-sm transition-all duration-300 hover:bg-black/5">
          {file ? "已选缩略图" : "添加缩略图"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
        {preview ? (
          <img src={preview} alt="" className="mt-3 h-24 w-24 rounded-2xl object-cover" />
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={quietButtonClass}>
            取消
          </button>
          <button
            type="submit"
            disabled={!title.trim() || !prompt.trim() || saving}
            className={primaryButtonClass}
          >
            {saving ? "保存中" : "放入橱窗"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
