"use client";

import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/lib/config";
import { cssImage, sanitizeAssetUrl } from "@/lib/url";
import { useConsole } from "@/components/console/console-context";
import {
  Modal,
  fieldClass,
  primaryButtonClass,
  quietButtonClass,
} from "@/components/console/modal";

type AdminControlsProps = {
  secretSignal: number;
  onLiveBackground: (url: string | undefined) => void;
};

export function AdminControls({
  secretSignal,
  onLiveBackground,
}: AdminControlsProps) {
  const { admin, settings, unlock, lock, setGlobalBackground } = useConsole();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [backgroundOpen, setBackgroundOpen] = useState(false);
  const seenSignal = useRef(0);

  function openGate() {
    if (admin) {
      setBackgroundOpen(true);
      onLiveBackground(settings.globalBackgroundUrl);
      return;
    }
    setPasswordOpen(true);
  }

  useEffect(() => {
    if (secretSignal === 0 || secretSignal === seenSignal.current) return;
    seenSignal.current = secretSignal;
    if (admin) {
      setBackgroundOpen(true);
      onLiveBackground(settings.globalBackgroundUrl);
      return;
    }
    setPasswordOpen(true);
  }, [admin, onLiveBackground, secretSignal, settings.globalBackgroundUrl]);

  return (
    <>
      {admin ? (
        <div className="fixed left-1/2 top-4 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/20 bg-[#1c1917]/75 px-3 py-1.5 text-xs text-white shadow-lg backdrop-blur-md transition-all duration-300">
          <span>编辑模式</span>
          <button
            type="button"
            onClick={openGate}
            className="rounded-full px-2 py-1 text-white/80 transition-all duration-300 hover:bg-white/10 hover:text-white"
          >
            更换背景
          </button>
          <button
            type="button"
            onClick={lock}
            className="rounded-full px-2 py-1 text-white/80 transition-all duration-300 hover:bg-white/10 hover:text-white"
          >
            锁定
          </button>
        </div>
      ) : null}
      <button
        type="button"
        aria-label={admin ? "更换全局背景" : "管理入口"}
        onClick={openGate}
        className={`fixed bottom-5 right-5 z-40 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/25 text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:text-white ${
          admin ? "opacity-70 hover:opacity-100" : "opacity-30 hover:opacity-90"
        }`}
      >
        <GearIcon />
      </button>
      {passwordOpen ? (
        <PasswordDialog
          onClose={() => setPasswordOpen(false)}
          onUnlock={(password) => {
            const ok = unlock(password);
            if (ok) {
              setPasswordOpen(false);
              setBackgroundOpen(true);
              onLiveBackground(settings.globalBackgroundUrl);
            }
            return ok;
          }}
        />
      ) : null}
      {backgroundOpen ? (
        <BackgroundDialog
          initialUrl={settings.globalBackgroundUrl}
          onClose={() => {
            setBackgroundOpen(false);
            onLiveBackground(undefined);
          }}
          onPreview={onLiveBackground}
          onSave={(url) => {
            setGlobalBackground(url);
            setBackgroundOpen(false);
            onLiveBackground(undefined);
          }}
        />
      ) : null}
    </>
  );
}

function PasswordDialog({
  onClose,
  onUnlock,
}: {
  onClose: () => void;
  onUnlock: (password: string) => boolean;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(0);

  return (
    <Modal
      key={shake}
      title="管理员验证"
      onClose={onClose}
      panelClassName={shake > 0 ? "animate-shake" : ""}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const ok = onUnlock(password);
          if (!ok) {
            setError(true);
            setShake((value) => value + 1);
            setPassword("");
          }
        }}
      >
        <p className="text-[11px] font-medium tracking-[0.22em] text-[#1E6B48]">
          PRIVATE
        </p>
        <h2 className="mt-2 font-serif text-3xl">管理暗门</h2>
        <p className="mt-3 text-sm leading-7 text-[#5c564e]">
          只有正确口令能进入编辑模式。访客可以浏览和记录，不能改背景。
        </p>
        <label htmlFor="admin-password" className="mt-5 block text-xs text-[#5c564e]">
          密码
        </label>
        <input
          id="admin-password"
          type="password"
          autoFocus
          autoComplete="off"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError(false);
          }}
          className={`${fieldClass} mt-1.5`}
          placeholder="输入管理密码"
        />
        {error ? <p className="mt-2 text-sm text-red-700">密码不正确</p> : null}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={quietButtonClass}>
            取消
          </button>
          <button type="submit" className={primaryButtonClass}>
            进入
          </button>
        </div>
      </form>
    </Modal>
  );
}

function BackgroundDialog({
  initialUrl,
  onClose,
  onPreview,
  onSave,
}: {
  initialUrl: string;
  onClose: () => void;
  onPreview: (url: string | undefined) => void;
  onSave: (url: string) => void;
}) {
  const [draft, setDraft] = useState(initialUrl);
  const [error, setError] = useState("");

  useEffect(() => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setError("");
      onPreview("");
      return;
    }
    const safe = sanitizeAssetUrl(trimmed);
    if (!safe) {
      setError("请输入 http(s) 图片地址，或以 / 开头的站内路径。");
      return;
    }
    setError("");
    onPreview(safe);
  }, [draft, onPreview]);

  return (
    <Modal title="更换全局背景" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = draft.trim();
          if (!trimmed) {
            onSave("");
            return;
          }
          const safe = sanitizeAssetUrl(trimmed);
          if (!safe) {
            setError("请输入 http(s) 图片地址，或以 / 开头的站内路径。");
            return;
          }
          onSave(safe);
        }}
      >
        <p className="text-[11px] font-medium tracking-[0.22em] text-[#1E6B48]">
          WALLPAPER
        </p>
        <h2 className="mt-2 font-serif text-3xl">全局背景</h2>
        <p className="mt-3 text-sm leading-7 text-[#5c564e]">
          输入图片地址会立刻预览。保存后写入这台浏览器。留空则回到默认壁纸。
        </p>
        <label htmlFor="background-url" className="mt-5 block text-xs text-[#5c564e]">
          图片 URL
        </label>
        <input
          id="background-url"
          value={draft}
          spellCheck={false}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={siteConfig.defaultBackground}
          className={`${fieldClass} mt-1.5`}
        />
        <div
          className="mt-3 h-28 rounded-2xl border border-black/10 bg-cover bg-center"
          style={{
            backgroundImage: cssImage(
              sanitizeAssetUrl(draft) || siteConfig.defaultBackground,
            ),
          }}
        />
        {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={quietButtonClass}>
            取消
          </button>
          <button type="submit" className={primaryButtonClass}>
            保存
          </button>
        </div>
      </form>
    </Modal>
  );
}

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true" fill="currentColor">
      <path d="M6.2 1.2h2.6l.3 1.5a4.7 4.7 0 0 1 1.3.7l1.4-.6 1.3 2.2-1.1 1a4.8 4.8 0 0 1 0 1.5l1.1 1-1.3 2.2-1.4-.6a4.7 4.7 0 0 1-1.3.7l-.3 1.5H6.2l-.3-1.5a4.7 4.7 0 0 1-1.3-.7l-1.4.6-1.3-2.2 1.1-1a4.8 4.8 0 0 1 0-1.5l-1.1-1 1.3-2.2 1.4.6a4.7 4.7 0 0 1 1.3-.7l.3-1.5Zm1.3 3.4a2.9 2.9 0 1 0 0 5.8 2.9 2.9 0 0 0 0-5.8Z" />
    </svg>
  );
}
