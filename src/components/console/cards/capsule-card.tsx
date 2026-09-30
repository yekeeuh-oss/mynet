"use client";

import { useEffect, useState } from "react";
import {
  countdownLabel,
  loadCapsules,
  openLetter,
  saveCapsules,
  sealLetter,
  type CapsuleLetter,
} from "@/lib/capsule-store";
import { GlassCard } from "@/components/console/glass-card";
import { fieldClass, primaryButtonClass, quietButtonClass } from "@/components/console/modal";

type UnlockChoice = "90" | "365" | "custom";

export function CapsuleCard() {
  const [letters, setLetters] = useState<CapsuleLetter[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [password, setPassword] = useState("");
  const [choice, setChoice] = useState<UnlockChoice>("90");
  const [customDate, setCustomDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [plain, setPlain] = useState("");

  useEffect(() => {
    setLetters(loadCapsules());
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  function unlockDate() {
    if (choice === "custom") {
      if (!customDate) return null;
      const date = new Date(`${customDate}T09:00:00`);
      if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) return null;
      return date.toISOString();
    }
    const date = new Date();
    date.setDate(date.getDate() + (choice === "90" ? 90 : 365));
    return date.toISOString();
  }

  return (
    <GlassCard id="capsule" className="min-h-[320px] md:col-span-2 lg:col-span-2">
      <p className="text-[11px] font-medium tracking-[0.22em] text-[var(--accent)]">CAPSULE</p>
      <h2 className="mt-1 font-serif text-2xl leading-tight">慢递信箱</h2>
      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
        写给以后的自己。不到日期，信封保持蜡封。
      </p>
      <form
        className="mt-4 space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          const when = unlockDate();
          if (!title.trim() || !body.trim() || password.trim().length < 4 || !when) {
            setError("需要标题、正文、至少 4 位密码，以及一个未来的日期。");
            return;
          }
          setBusy(true);
          setError("");
          void sealLetter(title, body, when, password.trim())
            .then((letter) => {
              const next = [letter, ...letters];
              setLetters(next);
              saveCapsules(next);
              setTitle("");
              setBody("");
              setPassword("");
              setPlain("");
              setOpenId(null);
            })
            .catch(() => setError("这封信没有封好。"))
            .finally(() => setBusy(false));
        }}
      >
        <input
          value={title}
          maxLength={40}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="信的标题"
          className={fieldClass}
        />
        <textarea
          value={body}
          maxLength={2000}
          rows={3}
          onChange={(event) => setBody(event.target.value)}
          placeholder="想对那时的自己说的话"
          className={`${fieldClass} resize-none leading-7`}
        />
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["90", "三个月后"],
              ["365", "一年后"],
              ["custom", "指定日期"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={choice === id}
              onClick={() => setChoice(id)}
              className={`rounded-full px-3 py-1 text-xs transition-all duration-300 ${
                choice === id ? "bg-[#1E6B48] text-white" : "bg-[var(--chip)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {choice === "custom" ? (
          <input
            type="date"
            value={customDate}
            onChange={(event) => setCustomDate(event.target.value)}
            className={fieldClass}
          />
        ) : null}
        <input
          type="password"
          value={password}
          autoComplete="new-password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="锁信密码"
          className={fieldClass}
        />
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? "封存中" : "蜡封这封信"}
        </button>
      </form>
      <ul className="mt-4 space-y-3">
        {letters.map((letter) => {
          const ready = new Date(letter.unlockAt).getTime() <= now;
          return (
            <li key={letter.id} className="rounded-2xl bg-[var(--chip)] p-3">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#9c3b32] font-serif text-lg text-[#FAF9F6] motion-safe:animate-[seal-glow_2.8s_ease-in-out_infinite] motion-reduce:animate-none">
                  封
                </span>
                <div className="min-w-0">
                  <p className="truncate font-serif text-lg">{letter.title}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {ready ? "封蜡可以揭开" : `还有 ${countdownLabel(letter.unlockAt, now)}`}
                  </p>
                </div>
              </div>
              {ready ? (
                <form
                  className="mt-3 flex flex-col gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void openLetter(letter, unlockPassword)
                      .then((text) => {
                        setOpenId(letter.id);
                        setPlain(text);
                        setError("");
                      })
                      .catch(() => {
                        setOpenId(null);
                        setPlain("");
                        setError("密码不对，信还合着。");
                      });
                  }}
                >
                  <input
                    type="password"
                    value={openId === letter.id ? unlockPassword : unlockPassword}
                    onChange={(event) => {
                      setOpenId(letter.id);
                      setUnlockPassword(event.target.value);
                    }}
                    placeholder="输入锁信密码"
                    className={fieldClass}
                  />
                  <button type="submit" className={quietButtonClass}>
                    解密翻阅
                  </button>
                  {openId === letter.id && plain ? (
                    <p className="whitespace-pre-wrap text-sm leading-7">{plain}</p>
                  ) : null}
                </form>
              ) : null}
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
