"use client";

import { useEffect, useState } from "react";
import { notifyDiaryRefresh } from "@/lib/events";
import { ensureDiaryFonts, loadDiaryFonts, type DiaryFont } from "@/lib/font-store";
import { loadLore, loadLoreCategories, saveLore, saveLoreCategories } from "@/lib/lore-store";
import { deleteMedia, getMedia } from "@/lib/media-db";
import { defaultPassageStyle, passageCss, type PassageStyle } from "@/lib/passage-style";
import type { LoreItem } from "@/lib/types";
import { FormatBar } from "@/components/console/format-bar";
import { useAppChrome } from "@/components/console/app-chrome";
import { GlassCard } from "@/components/console/glass-card";
import { Modal, fieldClass, primaryButtonClass, quietButtonClass } from "@/components/console/modal";

export function LoreCard() {
  const { toast } = useAppChrome();
  const [items, setItems] = useState<LoreItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [fonts, setFonts] = useState<DiaryFont[]>([]);
  const [filter, setFilter] = useState("全部");
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draftCategory, setDraftCategory] = useState("");

  useEffect(() => {
    const saved = loadLore();
    setItems(saved);
    setCategories(loadLoreCategories(saved));
    const storedFonts = loadDiaryFonts();
    void ensureDiaryFonts(storedFonts).then(() => setFonts(storedFonts));
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
  }

  function addCategory(name: string) {
    const trimmed = name.trim();
    if (!trimmed || categories.includes(trimmed)) return trimmed;
    const next = [...categories, trimmed];
    setCategories(next);
    saveLoreCategories(next);
    return trimmed;
  }

  function removeCategory(name: string) {
    const nextCategories = categories.filter((item) => item !== name);
    const nextItems = items.map((item) =>
      item.category === name ? { ...item, category: "" } : item,
    );
    setCategories(nextCategories);
    setItems(nextItems);
    saveLoreCategories(nextCategories);
    saveLore(nextItems);
    if (filter === name) setFilter("全部");
  }

  return (
    <GlassCard id="lore" className="min-h-[260px] md:col-span-1 lg:col-span-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-[0.22em] text-[var(--accent)]">LORE</p>
          <h2 className="mt-1 font-serif text-2xl leading-tight">灵感橱窗</h2>
        </div>
        <button type="button" onClick={() => setOpen(true)} className={primaryButtonClass}>
          记下
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {["全部", ...categories].map((category) => (
          <span key={category} className="inline-flex items-center">
            <button
              type="button"
              aria-pressed={filter === category}
              onClick={() => setFilter(category)}
              className={`rounded-full px-3 py-1 text-xs transition-all duration-300 ${
                filter === category ? "bg-[#1E6B48] text-white" : "bg-[var(--chip)]"
              }`}
            >
              {category}
            </button>
            {category !== "全部" ? (
              <button
                type="button"
                aria-label={`删除分类 ${category}`}
                onClick={() => removeCategory(category)}
                className="ml-0.5 px-1 text-xs text-[var(--muted)] transition-all duration-300 hover:text-red-600"
              >
                ×
              </button>
            ) : null}
          </span>
        ))}
        {adding ? (
          <form
            className="flex items-center gap-1"
            onSubmit={(event) => {
              event.preventDefault();
              addCategory(draftCategory);
              setDraftCategory("");
              setAdding(false);
            }}
          >
            <input
              autoFocus
              value={draftCategory}
              maxLength={16}
              onChange={(event) => setDraftCategory(event.target.value)}
              placeholder="新分类"
              className="h-7 w-24 rounded-full border border-black/10 bg-white/80 px-2 text-xs text-[#241f1b] outline-none"
            />
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-full px-2 py-1 text-xs text-[var(--accent)] transition-all duration-300 hover:bg-[var(--chip)]"
          >
            + 新增分类
          </button>
        )}
      </div>
      <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
        {visible.map((item) => (
          <li key={item.id} className="flex gap-3 rounded-2xl bg-[var(--chip)] p-3">
            <LoreThumb item={item} />
            <div className="min-w-0 flex-1">
              {item.category ? (
                <p className="text-[11px] tracking-wide text-[var(--accent)]">{item.category}</p>
              ) : null}
              <h3 className="truncate text-lg leading-snug" style={passageCss(item, fonts, true)}>
                {item.title}
              </h3>
              <p className="mt-1 line-clamp-3 leading-7" style={passageCss(item, fonts)}>
                {item.prompt}
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
          categories={categories}
          fonts={fonts}
          onFonts={setFonts}
          onAddCategory={addCategory}
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
    if (!item.imageId) return () => {
      cancelled = true;
    };
    void getMedia(item.imageId).then((value) => {
      if (!cancelled) setSource(value ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, [item.imageId]);

  if (!item.imageId) return null;
  if (!source) return null;
  return <img src={source} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />;
}

function LoreDialog({
  categories,
  fonts,
  onFonts,
  onAddCategory,
  onClose,
  onSave,
}: {
  categories: string[];
  fonts: DiaryFont[];
  onFonts: (fonts: DiaryFont[]) => void;
  onAddCategory: (name: string) => string;
  onClose: () => void;
  onSave: (item: LoreItem) => void;
}) {
  const [category, setCategory] = useState(categories[0] ?? "");
  const [custom, setCustom] = useState("");
  const [showCustom, setShowCustom] = useState(categories.length === 0);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<PassageStyle>(defaultPassageStyle());

  return (
    <Modal title="记下灵感" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const chosen = showCustom ? onAddCategory(custom) : category;
          if (!title.trim() || !prompt.trim() || !chosen) return;
          onSave({
            id: crypto.randomUUID(),
            category: chosen,
            title: title.trim(),
            prompt: prompt.trim(),
            imageId: "",
            createdAt: new Date().toISOString(),
            ...style,
          });
        }}
      >
        <p className="text-[11px] font-medium tracking-[0.22em] text-[#1E6B48]">LORE</p>
        <h2 className="mt-2 font-serif text-3xl">记下灵感</h2>
        <label className="mt-4 block text-xs text-[#5c564e]">分类</label>
        <div className="mt-1.5 flex gap-2">
          <select
            value={showCustom ? "__new" : category}
            onChange={(event) => {
              if (event.target.value === "__new") {
                setShowCustom(true);
                return;
              }
              setShowCustom(false);
              setCategory(event.target.value);
            }}
            className={fieldClass}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
            <option value="__new">+ 自定义分类</option>
          </select>
        </div>
        {showCustom ? (
          <input
            value={custom}
            maxLength={16}
            onChange={(event) => setCustom(event.target.value)}
            placeholder="新分类名称"
            className={`${fieldClass} mt-2`}
          />
        ) : null}
        <label className="mt-4 block text-xs text-[#5c564e]">标题</label>
        <input
          value={title}
          maxLength={40}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="标题"
          className={`${fieldClass} mt-1.5`}
        />
        <label className="mt-4 block text-xs text-[#5c564e]">正文</label>
        <div className="mt-1.5">
          <FormatBar fonts={fonts} value={style} onChange={setStyle} onFonts={onFonts} />
        </div>
        <textarea
          value={prompt}
          maxLength={2000}
          rows={5}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="灵感正文"
          className={`${fieldClass} mt-2 resize-none leading-7`}
          style={passageCss(style, fonts)}
        />
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={quietButtonClass}>
            取消
          </button>
          <button
            type="submit"
            disabled={!title.trim() || !prompt.trim() || (showCustom ? !custom.trim() : !category)}
            className={primaryButtonClass}
          >
            放入橱窗
          </button>
        </div>
      </form>
    </Modal>
  );
}
