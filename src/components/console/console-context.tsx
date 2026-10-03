"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { isAdminPassword } from "@/lib/config";
import { diaryRefreshEvent } from "@/lib/events";
import { deleteMedia } from "@/lib/media-db";
import {
  defaultSettings,
  loadConsole,
  saveAdmin,
  saveEntries,
  saveNotes,
  saveSettings,
} from "@/lib/storage";
import type {
  AmbienceId,
  CardId,
  CardSkin,
  DiaryEntry,
  QuickNote,
  Settings,
} from "@/lib/types";

type NewEntry = {
  title: string;
  content: string;
  mood: string;
  images?: string[];
  font?: string;
};

type ConsoleContextValue = {
  ready: boolean;
  admin: boolean;
  entries: DiaryEntry[];
  notes: QuickNote[];
  settings: Settings;
  addEntry: (input: NewEntry) => void;
  removeEntry: (id: string) => void;
  addNote: (text: string) => void;
  removeNote: (id: string) => void;
  setGlobalBackground: (url: string) => void;
  setCardSkin: (id: CardId, skin: CardSkin) => void;
  setAmbience: (id: AmbienceId) => void;
  setCustomAudioUrl: (url: string) => void;
  unlock: (password: string) => boolean;
  lock: () => void;
};

const ConsoleContext = createContext<ConsoleContextValue | null>(null);

export function ConsoleProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    const loaded = loadConsole();
    setEntries(loaded.entries);
    setNotes(loaded.notes);
    setSettings(loaded.settings);
    setAdmin(loaded.admin);
    setReady(true);
    function onRefresh() {
      const next = loadConsole();
      setEntries(next.entries);
      setNotes(next.notes);
      setSettings(next.settings);
    }
    window.addEventListener(diaryRefreshEvent, onRefresh);
    return () => window.removeEventListener(diaryRefreshEvent, onRefresh);
  }, []);

  const addEntry = useCallback((input: NewEntry) => {
    const entry: DiaryEntry = {
      id: crypto.randomUUID(),
      title: input.title.trim(),
      content: input.content.trim(),
      mood: input.mood,
      createdAt: new Date().toISOString(),
      images: (input.images ?? []).slice(0, 3),
      font: input.font || "serif",
    };
    setEntries((current) => {
      const next = [entry, ...current].slice(0, 100);
      saveEntries(next);
      return next;
    });
  }, []);

  const removeEntry = useCallback(
    (id: string) => {
      if (!admin) return;
      setEntries((current) => {
        const target = current.find((entry) => entry.id === id);
        target?.images.forEach((mediaId) => {
          void deleteMedia(mediaId);
        });
        const next = current.filter((entry) => entry.id !== id);
        saveEntries(next);
        return next;
      });
    },
    [admin],
  );

  const addNote = useCallback((text: string) => {
    const note: QuickNote = {
      id: crypto.randomUUID(),
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setNotes((current) => {
      const next = [note, ...current].slice(0, 30);
      saveNotes(next);
      return next;
    });
  }, []);

  const removeNote = useCallback((id: string) => {
    setNotes((current) => {
      const next = current.filter((note) => note.id !== id);
      saveNotes(next);
      return next;
    });
  }, []);

  const setGlobalBackground = useCallback(
    (url: string) => {
      if (!admin) return;
      setSettings((current) => {
        const next = { ...current, globalBackgroundUrl: url };
        saveSettings(next);
        return next;
      });
    },
    [admin],
  );

  const setCardSkin = useCallback(
    (id: CardId, skin: CardSkin) => {
      if (!admin) return;
      setSettings((current) => {
        const next = {
          ...current,
          cards: { ...current.cards, [id]: skin },
        };
        saveSettings(next);
        return next;
      });
    },
    [admin],
  );

  const setAmbience = useCallback((id: AmbienceId) => {
    setSettings((current) => {
      const next = { ...current, ambience: id };
      saveSettings(next);
      return next;
    });
  }, []);

  const setCustomAudioUrl = useCallback((url: string) => {
    setSettings((current) => {
      const next = { ...current, customAudioUrl: url };
      saveSettings(next);
      return next;
    });
  }, []);

  const unlock = useCallback((password: string) => {
    if (!isAdminPassword(password)) return false;
    setAdmin(true);
    saveAdmin(true);
    return true;
  }, []);

  const lock = useCallback(() => {
    setAdmin(false);
    saveAdmin(false);
  }, []);

  const value = useMemo<ConsoleContextValue>(
    () => ({
      ready,
      admin,
      entries,
      notes,
      settings,
      addEntry,
      removeEntry,
      addNote,
      removeNote,
      setGlobalBackground,
      setCardSkin,
      setAmbience,
      setCustomAudioUrl,
      unlock,
      lock,
    }),
    [
      ready,
      admin,
      entries,
      notes,
      settings,
      addEntry,
      removeEntry,
      addNote,
      removeNote,
      setGlobalBackground,
      setCardSkin,
      setAmbience,
      setCustomAudioUrl,
      unlock,
      lock,
    ],
  );

  return (
    <ConsoleContext.Provider value={value}>{children}</ConsoleContext.Provider>
  );
}

export function useConsole() {
  const value = useContext(ConsoleContext);
  if (!value) {
    throw new Error("useConsole must be used within ConsoleProvider");
  }
  return value;
}
