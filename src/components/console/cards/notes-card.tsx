"use client";

import { useState } from "react";
import { useConsole } from "@/components/console/console-context";
import { GlassCard } from "@/components/console/glass-card";
import { fieldClass } from "@/components/console/modal";

export function NotesCard() {
  const { notes, addNote, removeNote } = useConsole();
  const [text, setText] = useState("");

  return (
    <GlassCard id="notes" className="min-h-[180px] md:col-span-2 lg:col-span-4">
      <p className="text-[11px] font-medium tracking-[0.22em] text-[var(--accent)]">
        NOTES
      </p>
      <h2 className="mt-1 font-serif text-2xl leading-tight">闪念胶囊</h2>
      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          if (!text.trim()) return;
          addNote(text);
          setText("");
        }}
      >
        <input
          value={text}
          maxLength={80}
          onChange={(event) => setText(event.target.value)}
          placeholder="随手记下一句"
          className={fieldClass}
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[#1E6B48] px-5 text-sm font-medium text-[#FAF9F6] transition-all duration-300 hover:bg-[#18583C] disabled:opacity-40"
        >
          贴上
        </button>
      </form>
      <ul className="mt-4 flex flex-wrap gap-2">
        {notes.map((note) => (
          <li
            key={note.id}
            className="inline-flex max-w-full items-center gap-2 rounded-full bg-[var(--chip)] px-3 py-1.5 text-sm leading-6 transition-all duration-300"
          >
            <span className="break-words">{note.text}</span>
            <button
              type="button"
              aria-label={`删除闪念：${note.text}`}
              onClick={() => removeNote(note.id)}
              className="text-[var(--muted)] transition-all duration-300 hover:text-[var(--fg)]"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
