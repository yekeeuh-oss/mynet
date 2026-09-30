"use client";

import { useEffect, useRef, useState } from "react";
import { GlassCard } from "@/components/console/glass-card";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};

export function PlaygroundCard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [seed, setSeed] = useState(0);

  useEffect(() => {
    const surface = canvasRef.current;
    if (!surface) return;
    const drawing = surface.getContext("2d");
    if (!drawing) return;
    const canvas: HTMLCanvasElement = surface;
    const context: CanvasRenderingContext2D = drawing;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: 0, y: 0, inside: false };
    let particles: Particle[] = [];
    let frame = 0;
    let running = true;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (particles.length === 0) {
        particles = Array.from({ length: 32 }, () => ({
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: 1.2 + Math.random() * 1.4,
        }));
      }
    }

    function draw() {
      if (!running) return;
      const rect = canvas.getBoundingClientRect();
      context.clearRect(0, 0, rect.width, rect.height);
      if (!reduced && !document.hidden) {
        for (const particle of particles) {
          if (pointer.inside) {
            const dx = pointer.x - particle.x;
            const dy = pointer.y - particle.y;
            const distance = Math.hypot(dx, dy) || 1;
            const pull = Math.min(0.32, 26 / distance);
            particle.vx += (dx / distance) * pull;
            particle.vy += (dy / distance) * pull;
          }
          particle.vx *= 0.96;
          particle.vy *= 0.96;
          particle.x += particle.vx;
          particle.y += particle.vy;
          if (particle.x < 0 || particle.x > rect.width) particle.vx *= -1;
          if (particle.y < 0 || particle.y > rect.height) particle.vy *= -1;
          particle.x = Math.max(0, Math.min(rect.width, particle.x));
          particle.y = Math.max(0, Math.min(rect.height, particle.y));
        }
      }
      for (const particle of particles) {
        const glow = context.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.radius * 5,
        );
        glow.addColorStop(0, "rgba(30,107,72,0.9)");
        glow.addColorStop(1, "rgba(30,107,72,0)");
        context.fillStyle = glow;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius * 5, 0, Math.PI * 2);
        context.fill();
      }
      frame = window.requestAnimationFrame(draw);
    }

    function move(event: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.inside = true;
    }
    function leave() {
      pointer.inside = false;
    }

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerleave", leave);
    frame = window.requestAnimationFrame(draw);

    return () => {
      running = false;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
    };
  }, [seed]);

  return (
    <GlassCard id="playground" className="min-h-[260px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-[0.22em] text-[var(--accent)]">
            PLAY
          </p>
          <h2 className="mt-1 font-serif text-2xl leading-tight">微光</h2>
        </div>
        <button
          type="button"
          onClick={() => setSeed((value) => value + 1)}
          className="text-xs text-[var(--muted)] transition-all duration-300 hover:text-[var(--fg)]"
        >
          重置
        </button>
      </div>
      <div className="relative mt-3 min-h-36 flex-1">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full touch-none rounded-2xl"
          aria-label="跟随指针流动的微光粒子"
        />
      </div>
    </GlassCard>
  );
}
