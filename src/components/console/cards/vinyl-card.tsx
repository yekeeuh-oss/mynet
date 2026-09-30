"use client";

import { useEffect, useRef, useState } from "react";
import {
  loadMixerVolumes,
  mixerTracks,
  saveMixerVolumes,
  type MixerTrackId,
  type MixerVolumes,
} from "@/lib/mixer-store";
import { GlassCard } from "@/components/console/glass-card";
import { useMixer } from "@/components/console/use-mixer";

export function VinylCard() {
  const { start, stop, setVolumes, analyserRef } = useMixer();
  const [volumes, setVolumeState] = useState<MixerVolumes>({
    rain: 42,
    fire: 0,
    birds: 0,
    breeze: 18,
  });
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  const spectrumRef = useRef<HTMLCanvasElement>(null);
  const volumesRef = useRef(volumes);
  volumesRef.current = volumes;

  useEffect(() => {
    setVolumeState(loadMixerVolumes());
  }, []);

  useEffect(() => {
    if (playing) setVolumes(volumes);
  }, [playing, setVolumes, volumes]);

  useEffect(() => {
    if (!playing) return;
    const canvas = spectrumRef.current;
    const node = analyserRef.current;
    if (!canvas || !node) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const surface: HTMLCanvasElement = canvas;
    const pen: CanvasRenderingContext2D = context;
    const analyser: AnalyserNode = node;
    const bins = new Uint8Array(analyser.frequencyBinCount);
    let frame = 0;
    let running = true;

    function resize() {
      const rect = surface.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      surface.width = Math.max(1, Math.floor(rect.width * dpr));
      surface.height = Math.max(1, Math.floor(rect.height * dpr));
      pen.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      if (!running) return;
      const rect = surface.getBoundingClientRect();
      analyser.getByteFrequencyData(bins);
      pen.clearRect(0, 0, rect.width, rect.height);
      const count = 24;
      const gap = 3;
      const barWidth = (rect.width - gap * (count - 1)) / count;
      for (let index = 0; index < count; index += 1) {
        const value = bins[index] ?? 0;
        const height = Math.max(2, (value / 255) * rect.height);
        pen.fillStyle = "rgba(30,107,72,0.85)";
        pen.fillRect(index * (barWidth + gap), rect.height - height, barWidth, height);
      }
      frame = window.requestAnimationFrame(draw);
    }

    resize();
    frame = window.requestAnimationFrame(draw);
    return () => {
      running = false;
      window.cancelAnimationFrame(frame);
    };
  }, [analyserRef, playing]);

  function updateVolume(id: MixerTrackId, value: number) {
    const next = { ...volumesRef.current, [id]: value };
    setVolumeState(next);
    saveMixerVolumes(next);
    if (playing) setVolumes(next);
  }

  async function toggle() {
    if (playing) {
      stop();
      setPlaying(false);
      setError("");
      return;
    }
    try {
      await start(volumesRef.current);
      setPlaying(true);
      setError("");
    } catch {
      stop();
      setPlaying(false);
      setError("当前浏览器无法播放氛围声。");
    }
  }

  return (
    <GlassCard id="vinyl" className="min-h-[280px] md:col-span-2 lg:col-span-1">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-[0.22em] text-[var(--accent)]">
            MIXER
          </p>
          <h2 className="mt-1 font-serif text-2xl leading-tight">氛围混音</h2>
        </div>
        <button
          type="button"
          aria-pressed={playing}
          onClick={() => void toggle()}
          className="inline-flex h-10 items-center rounded-full bg-[#1E6B48] px-4 text-sm font-medium text-[#FAF9F6] transition-all duration-300 hover:bg-[#18583C]"
        >
          {playing ? "暂停" : "播放"}
        </button>
      </div>
      <canvas
        ref={spectrumRef}
        className="mt-3 h-14 w-full rounded-2xl bg-[var(--chip)]"
        aria-hidden="true"
      />
      <div className="mt-3 space-y-2">
        {mixerTracks.map((track) => (
          <label key={track.id} className="block text-xs text-[var(--muted)]">
            <span className="flex items-center justify-between">
              <span>{track.label}</span>
              <span className="tabular-nums">{volumes[track.id]}</span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={volumes[track.id]}
              onChange={(event) => updateVolume(track.id, Number(event.target.value))}
              className="mt-1 w-full accent-[#1E6B48]"
            />
          </label>
        ))}
      </div>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </GlassCard>
  );
}
