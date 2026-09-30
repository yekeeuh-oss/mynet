"use client";

import { useCallback, useEffect, useRef } from "react";
import type { AmbienceId } from "@/lib/types";
import { sanitizeAssetUrl } from "@/lib/url";

type Stopper = () => void;

function startAmbience(ctx: AudioContext, id: Exclude<AmbienceId, "link">) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) {
    data[index] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  if (id === "rain") {
    filter.type = "highpass";
    filter.frequency.value = 900;
    gain.gain.value = 0.04;
  } else if (id === "hearth") {
    filter.type = "lowpass";
    filter.frequency.value = 380;
    gain.gain.value = 0.11;
  } else {
    filter.type = "lowpass";
    filter.frequency.value = 260;
    gain.gain.value = 0.07;
  }

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  let oscillator: OscillatorNode | null = null;
  let oscillatorGain: GainNode | null = null;
  if (id === "tide") {
    oscillator = ctx.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = 78;
    oscillatorGain = ctx.createGain();
    oscillatorGain.gain.value = 0.025;
    oscillator.connect(oscillatorGain);
    oscillatorGain.connect(ctx.destination);
    oscillator.start();
  }

  return () => {
    source.stop();
    source.disconnect();
    filter.disconnect();
    gain.disconnect();
    oscillator?.stop();
    oscillator?.disconnect();
    oscillatorGain?.disconnect();
  };
}

export function useAmbience() {
  const contextRef = useRef<AudioContext | null>(null);
  const stopRef = useRef<Stopper | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
  }, []);

  useEffect(() => stop, [stop]);

  const play = useCallback(
    async (id: AmbienceId, customUrl: string) => {
      stop();
      if (id === "link") {
        const safe = sanitizeAssetUrl(customUrl);
        if (!safe) throw new Error("invalid-url");
        const audio = new Audio(safe);
        audio.loop = true;
        audio.volume = 0.65;
        audioRef.current = audio;
        await audio.play();
        return;
      }

      const AudioCtor = window.AudioContext;
      const ctx = contextRef.current ?? new AudioCtor();
      contextRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();
      stopRef.current = startAmbience(ctx, id);
    },
    [stop],
  );

  return { play, stop };
}
