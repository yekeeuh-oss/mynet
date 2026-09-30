"use client";

import { useCallback, useEffect, useRef } from "react";
import type { MixerTrackId, MixerVolumes } from "@/lib/mixer-store";

const trackScale: Record<MixerTrackId, number> = {
  rain: 0.22,
  fire: 0.16,
  birds: 0.2,
  breeze: 0.18,
};

type TrackNodes = {
  gain: GainNode;
  stop: () => void;
};

function makeNoise(ctx: AudioContext) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) {
    data[index] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

function connectNoise(
  ctx: AudioContext,
  destination: AudioNode,
  shape: (filter: BiquadFilterNode) => void,
) {
  const source = makeNoise(ctx);
  const filter = ctx.createBiquadFilter();
  shape(filter);
  source.connect(filter);
  filter.connect(destination);
  source.start();
  return () => {
    source.stop();
    source.disconnect();
    filter.disconnect();
  };
}

function startBirds(ctx: AudioContext, destination: AudioNode) {
  let timer = 0;
  let stopped = false;
  const chirp = () => {
    if (stopped) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const base = 1200 + Math.random() * 1600;
    osc.frequency.setValueAtTime(base, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, base * 0.72), ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
    timer = window.setTimeout(chirp, 900 + Math.random() * 2200);
  };
  timer = window.setTimeout(chirp, 500);
  return () => {
    stopped = true;
    window.clearTimeout(timer);
  };
}

export function useMixer() {
  const contextRef = useRef<AudioContext | null>(null);
  const tracksRef = useRef<Record<MixerTrackId, TrackNodes> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const stop = useCallback(() => {
    const tracks = tracksRef.current;
    if (tracks) {
      (Object.keys(tracks) as MixerTrackId[]).forEach((id) => tracks[id].stop());
    }
    tracksRef.current = null;
    analyserRef.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const setVolumes = useCallback((volumes: MixerVolumes) => {
    const ctx = contextRef.current;
    const tracks = tracksRef.current;
    if (!ctx || !tracks) return;
    (Object.keys(volumes) as MixerTrackId[]).forEach((id) => {
      const level = (volumes[id] / 100) * trackScale[id];
      tracks[id].gain.gain.setTargetAtTime(level, ctx.currentTime, 0.04);
    });
  }, []);

  const start = useCallback(
    async (volumes: MixerVolumes) => {
      stop();
      const ctx = contextRef.current ?? new AudioContext();
      contextRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();

      const master = ctx.createGain();
      master.gain.value = 0.9;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.78;
      master.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;

      const makeGain = (id: MixerTrackId) => {
        const gain = ctx.createGain();
        gain.gain.value = (volumes[id] / 100) * trackScale[id];
        gain.connect(master);
        return gain;
      };

      const rainGain = makeGain("rain");
      const fireGain = makeGain("fire");
      const birdGain = makeGain("birds");
      const breezeGain = makeGain("breeze");

      const stopRain = connectNoise(ctx, rainGain, (filter) => {
        filter.type = "highpass";
        filter.frequency.value = 900;
      });
      const stopFire = connectNoise(ctx, fireGain, (filter) => {
        filter.type = "lowpass";
        filter.frequency.value = 420;
      });
      const stopBreeze = connectNoise(ctx, breezeGain, (filter) => {
        filter.type = "bandpass";
        filter.frequency.value = 280;
        filter.Q.value = 0.7;
      });
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.12;
      lfoGain.gain.value = 0.03;
      lfo.connect(lfoGain);
      lfoGain.connect(breezeGain.gain);
      lfo.start();
      const stopBirds = startBirds(ctx, birdGain);

      tracksRef.current = {
        rain: {
          gain: rainGain,
          stop: () => {
            stopRain();
            rainGain.disconnect();
          },
        },
        fire: {
          gain: fireGain,
          stop: () => {
            stopFire();
            fireGain.disconnect();
          },
        },
        birds: {
          gain: birdGain,
          stop: () => {
            stopBirds();
            birdGain.disconnect();
          },
        },
        breeze: {
          gain: breezeGain,
          stop: () => {
            lfo.stop();
            lfo.disconnect();
            lfoGain.disconnect();
            stopBreeze();
            breezeGain.disconnect();
          },
        },
      };
    },
    [stop],
  );

  return { start, stop, setVolumes, analyserRef };
}
