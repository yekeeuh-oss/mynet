"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { searchScore } from "@/lib/activity";
import { notifyDiaryRefresh } from "@/lib/events";
import { loadGalleryPhotos, loadGalleryPrefs, saveGalleryPrefs } from "@/lib/gallery-store";
import { deleteMedia, mediaKeys } from "@/lib/media-db";
import { loadConsole, saveSettings } from "@/lib/storage";
import type { ThemeMode } from "@/lib/types";

type PaletteItem = {
  id: string;
  title: string;
  hint: string;
  run: () => void;
};

type AppChromeContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toast: (message: string) => void;
  openPalette: () => void;
};

const AppChromeContext = createContext<AppChromeContextValue | null>(null);
const themeKey = "my-diary.theme";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [message, setMessage] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const timer = useRef<number>(0);

  useEffect(() => {
    try {
      if (localStorage.getItem(themeKey) === "light") setThemeState("light");
    } catch {
      /* Keep the default dark wallpaper theme. */
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    try {
      localStorage.setItem(themeKey, next);
    } catch {
      /* Theme still changes for this visit. */
    }
  }, []);

  const toast = useCallback((text: string) => {
    setMessage(text);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(""), 1600);
  }, []);

  const openPalette = useCallback(() => setPaletteOpen(true), []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toast, openPalette }),
    [theme, setTheme, toast, openPalette],
  );

  return (
    <AppChromeContext.Provider value={value}>
      {children}
      <button
        type="button"
        aria-label="搜索"
        onClick={openPalette}
        className="glass-shell fixed top-5 right-5 z-40 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/55 text-[#241f1b] shadow-lg backdrop-blur-md transition-all duration-300 hover:shadow-2xl"
      >
        <SearchIcon />
      </button>
      {message ? (
        <div
          role="status"
          className="fixed bottom-20 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-white/20 bg-[#1c1917]/80 px-4 py-2 text-sm text-white shadow-lg backdrop-blur-md transition-all duration-300"
        >
          {message}
        </div>
      ) : null}
      {paletteOpen ? (
        <CommandPalette
          theme={theme}
          onClose={() => setPaletteOpen(false)}
          onTheme={setTheme}
          onToast={toast}
        />
      ) : null}
    </AppChromeContext.Provider>
  );
}

export function useAppChrome() {
  const value = useContext(AppChromeContext);
  if (!value) throw new Error("useAppChrome must be used within AppChrome");
  return value;
}

function CommandPalette({
  theme,
  onClose,
  onTheme,
  onToast,
}: {
  theme: ThemeMode;
  onClose: () => void;
  onTheme: (theme: ThemeMode) => void;
  onToast: (message: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [shortcut, setShortcut] = useState("Ctrl K");

  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.userAgent)) setShortcut("⌘K");
  }, []);

  const items = useMemo(() => {
    const loaded = loadConsole();
    const photos = loadGalleryPhotos();
    const commands: PaletteItem[] = [
      {
        id: "theme-light",
        title: "切换为浅色纸页",
        hint: "主题",
        run: () => {
          onTheme("light");
          onToast("已换成浅色纸页");
        },
      },
      {
        id: "theme-dark",
        title: "切换为深色壁纸",
        hint: "主题",
        run: () => {
          onTheme("dark");
          onToast("已换成深色壁纸");
        },
      },
      {
        id: "reset-diary-bg",
        title: "恢复日记默认壁纸",
        hint: "背景",
        run: () => {
          const current = loadConsole().settings;
          saveSettings({ ...current, globalBackgroundUrl: "" });
          void deleteMedia(mediaKeys.diaryBackground);
          notifyDiaryRefresh();
          onToast("日记壁纸已恢复默认");
        },
      },
      {
        id: "reset-gallery-bg",
        title: "恢复画廊默认壁纸",
        hint: "背景",
        run: () => {
          const prefs = loadGalleryPrefs();
          saveGalleryPrefs({ ...prefs, backgroundRef: "" });
          void deleteMedia(mediaKeys.galleryBackground);
          notifyDiaryRefresh();
          onToast("画廊壁纸已恢复默认");
        },
      },
      {
        id: "go-diary",
        title: "回到日记",
        hint: "前往",
        run: () => router.push("/"),
      },
      {
        id: "go-gallery",
        title: "打开光影画廊",
        hint: "前往",
        run: () => router.push("/gallery"),
      },
    ];
    const diaries: PaletteItem[] = loaded.entries.map((entry) => ({
      id: `diary-${entry.id}`,
      title: entry.title,
      hint: "日记",
      run: () => {
        if (pathname === "/") {
          document.getElementById("diary-hall")?.scrollIntoView({ behavior: "smooth" });
        } else {
          router.push("/#diary-hall");
        }
      },
    }));
    const gallery: PaletteItem[] = photos
      .filter((photo) => photo.caption)
      .map((photo) => ({
        id: `gallery-${photo.id}`,
        title: photo.caption,
        hint: "画廊感想",
        run: () => router.push("/gallery"),
      }));
    return [...commands, ...diaries, ...gallery]
      .map((item) => ({ item, score: searchScore(query, `${item.title} ${item.hint}`) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((row) => row.item);
  }, [onTheme, onToast, pathname, query, router]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  function choose(index: number) {
    const item = items[index];
    if (!item) return;
    item.run();
    onClose();
  }

  return (
    <div
      className={`fixed inset-0 z-50 p-4 backdrop-blur-md transition-all duration-300 ${
        theme === "light" ? "bg-[#241f1b]/25" : "bg-[#10241f]/55"
      }`}
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="搜索"
        className="glass-shell mx-auto mt-[10vh] w-full max-w-xl overflow-hidden rounded-3xl border border-white/20 bg-white/75 text-[#241f1b] shadow-2xl backdrop-blur-md"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") onClose();
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((current) =>
                items.length === 0 ? 0 : Math.min(items.length - 1, current + 1),
              );
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((current) => Math.max(0, current - 1));
            }
            if (event.key === "Enter") choose(active);
          }}
          placeholder="搜索日记、感想，或输入主题"
          className="w-full bg-transparent px-5 py-4 text-base outline-none placeholder:text-[#241f1b]/35"
        />
        <ul className="max-h-80 overflow-y-auto border-t border-black/5 px-2 py-2">
          {items.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-[#5c564e]">没有匹配的结果</li>
          ) : (
            items.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(index)}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition-all duration-300 ${
                    index === active ? "bg-[#1E6B48] text-white" : "hover:bg-black/5"
                  }`}
                >
                  <span className="truncate">{item.title}</span>
                  <span className={index === active ? "text-white/75" : "text-[#5c564e]"}>
                    {item.hint}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
        <p className="border-t border-black/5 px-5 py-3 text-xs text-[#5c564e]">
          {shortcut} 打开 · Esc 关闭 · 当前是{theme === "light" ? "浅色" : "深色"}
        </p>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true" fill="none">
      <circle cx="6.5" cy="6.5" r="4.25" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9.5 9.5 13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
