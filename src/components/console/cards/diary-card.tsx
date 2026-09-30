"use client";

import { useState } from "react";
import { moods } from "@/lib/config";
import { formatEntryTime } from "@/lib/dates";
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

  return (
    <GlassCard id="diary" className="min-h-[420px] md:col-span-2 lg:col-span-2 lg:row-span-2">
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
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--chip)] px-2 py-0.5 text-xs">
                  {entry.mood}
                </span>
                <h3 className="font-serif text-lg leading-snug">{entry.title}</h3>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--muted)]">
                {entry.content}
              </p>
            </li>
          ))}
        </ol>
      )}
      {open ? (
        <DiaryDialog
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

function DiaryDialog({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (input: { title: string; content: string; mood: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string>(moods[0].emoji);
  const titleId = "diary-title";
  const contentId = "diary-content";

  return (
    <Modal title="写日记" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim() || !content.trim()) return;
          onSave({ title, content, mood });
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
          placeholder="从天气，或一句没说完的话开始"
        />
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
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={quietButtonClass}>
            取消
          </button>
          <button
            type="submit"
            disabled={!title.trim() || !content.trim()}
            className={primaryButtonClass}
          >
            收入纸页
          </button>
        </div>
      </form>
    </Modal>
  );
}
