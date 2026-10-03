"use client";

import { useEffect, useRef, useState } from "react";
import { deleteFile, getFile, putFile } from "@/lib/media-db";
import {
  isAudioFile,
  loadPlaylist,
  modeLabel,
  nextMode,
  savePlaylist,
  type PlayMode,
  type PlaylistTrack,
} from "@/lib/playlist-store";
import { GlassCard } from "@/components/console/glass-card";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const remain = `${whole % 60}`.padStart(2, "0");
  return `${minutes}:${remain}`;
}

export function VinylCard() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const urlRef = useRef("");
  const seekingRef = useRef(false);
  const tracksRef = useRef<PlaylistTrack[]>([]);
  const modeRef = useRef<PlayMode>("order");
  const currentRef = useRef("");
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [currentId, setCurrentId] = useState("");
  const [mode, setMode] = useState<PlayMode>("order");
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");

  tracksRef.current = tracks;
  modeRef.current = mode;
  currentRef.current = currentId;

  useEffect(() => {
    const saved = loadPlaylist();
    setTracks(saved.tracks);
    setMode(saved.mode);
    setCurrentId(saved.currentId);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    function onTime() {
      if (!seekingRef.current && audio) setProgress(audio.currentTime);
    }
    function onMeta() {
      if (audio) setDuration(audio.duration || 0);
    }
    function onEnded() {
      const list = tracksRef.current;
      const current = currentRef.current;
      const index = list.findIndex((track) => track.id === current);
      if (modeRef.current === "single") {
        if (!audio) return;
        audio.currentTime = 0;
        void audio.play();
        return;
      }
      if (list.length === 0) return;
      if (modeRef.current === "shuffle") {
        const pool = list.filter((track) => track.id !== current);
        const pick = pool[Math.floor(Math.random() * pool.length)] ?? list[0];
        if (pick) void loadTrack(pick.id, true);
        return;
      }
      const next = list[(index + 1) % list.length];
      if (next) void loadTrack(next.id, true);
    }
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  async function loadTrack(id: string, autoplay: boolean) {
    const audio = audioRef.current;
    if (!audio) return;
    const file = await getFile(id);
    if (!file) {
      setError("这首的文件找不到了。");
      return;
    }
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(file);
    urlRef.current = url;
    audio.src = url;
    setCurrentId(id);
    setProgress(0);
    setError("");
    const next = {
      tracks: tracksRef.current,
      mode: modeRef.current,
      currentId: id,
    };
    savePlaylist(next);
    if (autoplay) {
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
        setError("这首暂时无法播放。");
      }
    }
  }

  async function addFiles(list: FileList | null) {
    const files = [...(list ?? [])].filter(isAudioFile);
    if (files.length === 0) {
      setError("请选择 mp3、wav 或 flac 文件。");
      return;
    }
    const added: PlaylistTrack[] = [];
    for (const file of files) {
      const id = crypto.randomUUID();
      await putFile(id, file);
      added.push({ id, name: file.name.replace(/\.(mp3|wav|flac)$/i, "") });
    }
    const nextTracks = [...tracksRef.current, ...added];
    const nextId = currentRef.current || added[0]?.id || "";
    const next = { tracks: nextTracks, mode: modeRef.current, currentId: nextId };
    setTracks(nextTracks);
    setCurrentId(nextId);
    savePlaylist(next);
    setError("");
    if (!currentRef.current && added[0]) await loadTrack(added[0].id, false);
  }

  async function removeTrack(id: string) {
    await deleteFile(id);
    const nextTracks = tracksRef.current.filter((track) => track.id !== id);
    const nextId = currentRef.current === id ? (nextTracks[0]?.id ?? "") : currentRef.current;
    const next = { tracks: nextTracks, mode: modeRef.current, currentId: nextId };
    setTracks(nextTracks);
    setCurrentId(nextId);
    savePlaylist(next);
    if (currentRef.current === id) {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = "";
      if (audioRef.current) audioRef.current.src = "";
      setPlaying(false);
      setProgress(0);
      setDuration(0);
      if (nextId) await loadTrack(nextId, false);
    }
  }

  function step(direction: -1 | 1) {
    const list = tracksRef.current;
    if (list.length === 0) return;
    if (modeRef.current === "shuffle") {
      const pool = list.filter((track) => track.id !== currentRef.current);
      const pick = pool[Math.floor(Math.random() * pool.length)] ?? list[0];
      if (pick) void loadTrack(pick.id, true);
      return;
    }
    const index = Math.max(0, list.findIndex((track) => track.id === currentRef.current));
    const next = list[(index + direction + list.length) % list.length];
    if (next) void loadTrack(next.id, true);
  }

  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.src && currentId) {
      await loadTrack(currentId, true);
      return;
    }
    if (!audio.src) return;
    if (audio.paused) {
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setError("播放被浏览器拦住了。");
      }
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  function cycleMode() {
    const mode = nextMode(modeRef.current);
    setMode(mode);
    savePlaylist({ tracks: tracksRef.current, mode, currentId: currentRef.current });
  }

  const current = tracks.find((track) => track.id === currentId);

  return (
    <GlassCard id="vinyl" className="min-h-[320px] md:col-span-2 lg:col-span-1">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-[0.22em] text-[var(--accent)]">PLAYER</p>
          <h2 className="mt-1 truncate font-serif text-2xl leading-tight">
            {current?.name || "本地音乐"}
          </h2>
        </div>
        <label className="inline-flex h-10 shrink-0 cursor-pointer items-center rounded-full bg-[#1E6B48] px-4 text-sm font-medium text-[#FAF9F6] transition-all duration-300 hover:bg-[#18583C]">
          添加
          <input
            type="file"
            accept=".mp3,.wav,.flac,audio/mpeg,audio/wav,audio/flac,audio/x-flac"
            multiple
            className="sr-only"
            onChange={(event) => {
              void addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
      </div>
      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <div className="mt-3 flex items-center gap-2 text-xs tabular-nums text-[var(--muted)]">
        <span>{formatTime(progress)}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(progress, duration || 0)}
          aria-label="播放进度"
          onPointerDown={() => {
            seekingRef.current = true;
          }}
          onPointerUp={() => {
            seekingRef.current = false;
          }}
          onChange={(event) => {
            const value = Number(event.target.value);
            setProgress(value);
            if (audioRef.current) audioRef.current.currentTime = value;
          }}
          className="w-full accent-[#1E6B48]"
        />
        <span>{formatTime(duration)}</span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button type="button" aria-label="上一曲" onClick={() => step(-1)} className={controlClass}>
          <SkipIcon direction="prev" />
        </button>
        <button type="button" aria-pressed={playing} onClick={() => void toggle()} className={controlClass}>
          {playing ? "暂停" : "播放"}
        </button>
        <button type="button" aria-label="下一曲" onClick={() => step(1)} className={controlClass}>
          <SkipIcon direction="next" />
        </button>
        <button
          type="button"
          aria-label={modeLabel(mode)}
          onClick={cycleMode}
          className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--chip)] px-3 text-xs transition-all duration-300 hover:opacity-80"
        >
          <ModeIcon mode={mode} />
          {modeLabel(mode)}
        </button>
      </div>
      <ul className="mt-3 max-h-36 space-y-1 overflow-y-auto pr-1 text-sm">
        {tracks.length === 0 ? (
          <li className="text-[var(--muted)]">还没有歌曲。可一次选多首 mp3、wav 或 flac。</li>
        ) : (
          tracks.map((track) => (
            <li key={track.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void loadTrack(track.id, true)}
                className={`min-w-0 flex-1 truncate text-left transition-all duration-300 ${
                  track.id === currentId ? "text-[var(--accent)]" : ""
                }`}
              >
                {track.name}
              </button>
              <button
                type="button"
                aria-label={`移除 ${track.name}`}
                onClick={() => void removeTrack(track.id)}
                className="text-xs text-[var(--muted)] transition-all duration-300 hover:text-red-600"
              >
                移除
              </button>
            </li>
          ))
        )}
      </ul>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </GlassCard>
  );
}

const controlClass =
  "inline-flex h-10 items-center justify-center rounded-full bg-[var(--chip)] px-3 text-sm transition-all duration-300 hover:opacity-80";

function SkipIcon({ direction }: { direction: "prev" | "next" }) {
  const transform = direction === "prev" ? "scale(-1, 1)" : undefined;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style={{ transform }}>
      <path d="M3 3h2v10H3zM6 8l7-5v10L6 8z" fill="currentColor" />
    </svg>
  );
}

function ModeIcon({ mode }: { mode: PlayMode }) {
  if (mode === "shuffle") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M2 4h2.2l7.2 8H14M14 4h-2.6L4.2 12H2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path d="M12 2.5 14.2 4 12 5.5M12 10.5 14.2 12 12 13.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3 5h8.2a2.2 2.2 0 0 1 0 4.4H4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M10.2 3.2 12.4 5 10.2 6.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      {mode === "single" ? (
        <text x="6.2" y="14" fontSize="7" fill="currentColor">
          1
        </text>
      ) : (
        <path d="M12.2 9.2 10 11l2.2 1.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}
