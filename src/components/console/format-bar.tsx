"use client";

import { inkColors, type PassageStyle } from "@/lib/passage-style";
import {
  fontNameFromFile,
  importDiaryFont,
  isFontFile,
  type DiaryFont,
} from "@/lib/font-store";

type FormatBarProps = {
  fonts: DiaryFont[];
  value: PassageStyle;
  onChange: (next: PassageStyle) => void;
  onFonts: (fonts: DiaryFont[]) => void;
};

export function FormatBar({ fonts, value, onChange, onFonts }: FormatBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <select
        aria-label="字体"
        value={value.font}
        onChange={(event) => onChange({ ...value, font: event.target.value })}
        className="h-8 max-w-36 rounded-full border border-black/10 bg-white/80 px-2 text-xs text-[#241f1b] outline-none"
      >
        <option value="sans">无衬线</option>
        <option value="serif">衬线</option>
        <option value="script">手写花体</option>
        {fonts.map((font) => (
          <option key={font.id} value={font.id}>
            {font.name}
          </option>
        ))}
      </select>
      <label className="inline-flex h-8 cursor-pointer items-center rounded-full border border-black/10 px-2 text-[11px] text-[#5c564e]">
        导入
        <input
          type="file"
          accept=".ttf,.otf,.woff,.woff2"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file || !isFontFile(file)) return;
            void importDiaryFont(file, fontNameFromFile(file)).then((imported) => {
              onFonts([...fonts, imported]);
              onChange({ ...value, font: imported.id });
            });
          }}
        />
      </label>
      <span className="mx-0.5 h-4 w-px bg-black/10" />
      {inkColors.map((ink) => (
        <button
          key={ink.hex}
          type="button"
          aria-label={ink.name}
          aria-pressed={value.color.toLowerCase() === ink.hex.toLowerCase()}
          onClick={() => onChange({ ...value, color: ink.hex })}
          className={`h-4 w-4 rounded-full border transition-all duration-300 ${
            value.color.toLowerCase() === ink.hex.toLowerCase()
              ? "border-[#241f1b] ring-2 ring-[#1E6B48]/40"
              : "border-black/10"
          }`}
          style={{ backgroundColor: ink.hex }}
        />
      ))}
      <input
        type="color"
        aria-label="自定义颜色"
        value={safeColor(value.color)}
        onChange={(event) => onChange({ ...value, color: event.target.value })}
        className="h-6 w-6 cursor-pointer rounded-full border border-black/10 bg-transparent p-0"
      />
      <span className="mx-0.5 h-4 w-px bg-black/10" />
      <button
        type="button"
        aria-pressed={value.size === "lg"}
        onClick={() => onChange({ ...value, size: value.size === "lg" ? "md" : "lg" })}
        className={toggleClass(value.size === "lg")}
      >
        {value.size === "lg" ? "加大" : "标准"}
      </button>
      <button
        type="button"
        aria-pressed={value.bold}
        onClick={() => onChange({ ...value, bold: !value.bold })}
        className={`${toggleClass(value.bold)} font-bold`}
      >
        B
      </button>
      <button
        type="button"
        aria-pressed={value.italic}
        onClick={() => onChange({ ...value, italic: !value.italic })}
        className={`${toggleClass(value.italic)} italic`}
      >
        I
      </button>
    </div>
  );
}

function toggleClass(active: boolean) {
  return `inline-flex h-8 items-center rounded-full px-2 text-xs transition-all duration-300 ${
    active ? "bg-[#1E6B48] text-white" : "border border-black/10 bg-white/70 text-[#241f1b]"
  }`;
}

function safeColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#2C2825";
}
