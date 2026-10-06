"use client";

import { useEffect, useRef, useState } from "react";
import { deleteFile, getFile, putFile } from "@/lib/media-db";
import {
  isAudioFile,
  loadPlayerVolume,
  loadPlaylist,
  modeLabel,
  nextMode,
  savePlayerVolume,
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
  const volumeRef = useRef(30);
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [currentId, setCurrentId] = useState("");
  const [mode, setMode] = useState<PlayMode>("order");
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(30);
  const [muted, setMuted] = useState(false);
  const rememberedVolume = useRef(30);

  tracksRef.current = tracks;
  modeRef.current = mode;
  currentRef.current = currentId;
  volumeRef.current = muted ? 0 : volume;

  useEffect(() => {
    const saved = loadPlaylist();
    const savedVolume = loadPlayerVolume();
    setTracks(saved.tracks);
    setMode(saved.mode);
    setCurrentId(saved.currentId);
    setVolume(savedVolume);
    rememberedVolume.current = savedVolume > 0 ? savedVolume : 30;
    if (audioRef.current) audioRef.current.volume = savedVolume / 100;
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
        void audio.play().catch(() => setPlaying(false));
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
    if (!file) return;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(file);
    urlRef.current = url;
    audio.src = url;
    audio.volume = volumeRef.current / 100;
    setCurrentId(id);
    setProgress(0);
    const next = {
      tracks: tracksRef.current,
      mode: modeRef.current,
      currentId: id,
    };
    savePlaylist(next);
    if (!autoplay) return;
    try {
      await audio.play();
      setPlaying(true);
    } catch (error) {
      setPlaying(false);
      if (error instanceof DOMException && error.name === "NotAllowedError") return;
    }
  }

  async function addFiles(list: FileList | null) {
    const files = [...(list ?? [])].filter(isAudioFile);
    if (files.length === 0) return;
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
      } catch (error) {
        setPlaying(false);
        if (error instanceof DOMException && error.name === "NotAllowedError") return;
      }
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  function applyVolume(next: number) {
    const level = Math.min(100, Math.max(0, Math.round(next)));
    setVolume(level);
    savePlayerVolume(level);
    if (level > 0) {
      setMuted(false);
      rememberedVolume.current = level;
    } else {
      setMuted(true);
    }
    if (audioRef.current) audioRef.current.volume = level / 100;
  }

  function toggleMute() {
    if (muted || volume === 0) {
      applyVolume(rememberedVolume.current || 30);
      return;
    }
    rememberedVolume.current = volume;
    setMuted(true);
    if (audioRef.current) audioRef.current.volume = 0;
  }

  function cycleMode() {
    const mode = nextMode(modeRef.current);
    setMode(mode);
    savePlaylist({ tracks: tracksRef.current, mode, currentId: currentRef.current });
  }

  const current = tracks.find((track) => track.id === currentId);

  return (
    <GlassCard id="vinyl" className="min-h-[460px] md:col-span-2 lg:col-span-2">
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
      <div className="mt-5 flex flex-row flex-nowrap items-center gap-3 whitespace-nowrap text-xs tabular-nums text-[var(--muted)]">
        <span className="w-10 shrink-0">{formatTime(progress)}</span>
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
          className="min-w-0 flex-1 accent-[#1E6B48]"
        />
        <span className="w-10 shrink-0 text-right">{formatTime(duration)}</span>
      </div>
      <div className="mt-4 flex flex-row flex-nowrap items-center justify-center gap-2 whitespace-nowrap">
        <button type="button" aria-label="上一曲" onClick={() => step(-1)} className={controlClass}>
          <SkipIcon direction="prev" />
        </button>
        <button type="button" aria-label={playing ? "暂停" : "播放"} aria-pressed={playing} onClick={() => void toggle()} className={controlClass}>
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button type="button" aria-label="下一曲" onClick={() => step(1)} className={controlClass}>
          <SkipIcon direction="next" />
        </button>
        <button
          type="button"
          aria-label={modeLabel(mode)}
          title={modeLabel(mode)}
          onClick={cycleMode}
          className={`${controlClass} ml-2`}
        >
          <ModeIcon mode={mode} />
        </button>
        <div className="ml-2 flex shrink-0 flex-row flex-nowrap items-center gap-2 whitespace-nowrap">
          <button
            type="button"
            aria-label={muted || volume === 0 ? "恢复音量" : "静音"}
            aria-pressed={muted || volume === 0}
            onClick={toggleMute}
            className={controlClass}
          >
            {muted || volume === 0 ? <VolumeOffIcon /> : <VolumeIcon />}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={muted ? 0 : volume}
            aria-label="音量"
            onChange={(event) => applyVolume(Number(event.target.value))}
            className="w-24 shrink-0 accent-[#1E6B48]"
          />
        </div>
      </div>
      <ul className="song-scroll mt-5 max-h-52 min-h-28 flex-1 space-y-1 overflow-y-auto text-sm">
        {tracks.length === 0 ? (
          <li className="text-[var(--muted)]">还没有歌曲。可一次选多首 mp3、wav 或 flac。</li>
        ) : (
          tracks.map((track) => (
            <li key={track.id} className="flex flex-row flex-nowrap items-center gap-3 whitespace-nowrap">
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
                className="ml-auto shrink-0 text-xs whitespace-nowrap text-[var(--muted)] transition-all duration-300 hover:text-red-600"
              >
                移除
              </button>
            </li>
          ))
        )}
      </ul>
    </GlassCard>
  );
}

const controlClass =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-[var(--chip)] transition-all duration-300 hover:opacity-80";

function VolumeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.5 6.2h2.2L8 3.4v9.2L4.7 9.8H2.5V6.2z" fill="currentColor" />
      <path
        d="M10 6.1a2.6 2.6 0 0 1 0 3.8M11.6 4.6a4.6 4.6 0 0 1 0 6.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function VolumeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.5 6.2h2.2L8 3.4v9.2L4.7 9.8H2.5V6.2z" fill="currentColor" />
      <path d="M10.2 6.2 13.8 9.8M13.8 6.2 10.2 9.8" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M5 3.2v9.6L13 8 5 3.2z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 3h3v10H4zM9 3h3v10H9z" fill="currentColor" />
    </svg>
  );
}

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
