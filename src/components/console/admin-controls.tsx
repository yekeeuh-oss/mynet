"use client";

import { useEffect, useRef, useState } from "react";
import { mediaKeys } from "@/lib/media-db";
import { useConsole } from "@/components/console/console-context";
import { BackgroundDialog } from "@/components/console/background-dialog";
import { PasswordDialog } from "@/components/console/password-dialog";

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
          title="全局背景"
          description="拖入本地图片，或在面板里按 Ctrl+V 粘贴，会立刻换成新壁纸并保存在这台浏览器。清除后回到默认壁纸。"
          mediaId={mediaKeys.diaryBackground}
          initialRef={settings.globalBackgroundUrl}
          onClose={() => {
            setBackgroundOpen(false);
            onLiveBackground(undefined);
          }}
          onPreview={onLiveBackground}
          onApply={setGlobalBackground}
        />
      ) : null}
    </>
  );
}

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true" fill="currentColor">
      <path d="M6.2 1.2h2.6l.3 1.5a4.7 4.7 0 0 1 1.3.7l1.4-.6 1.3 2.2-1.1 1a4.8 4.8 0 0 1 0 1.5l1.1 1-1.3 2.2-1.4-.6a4.7 4.7 0 0 1-1.3.7l-.3 1.5H6.2l-.3-1.5a4.7 4.7 0 0 1-1.3-.7l-1.4.6-1.3-2.2 1.1-1a4.8 4.8 0 0 1 0-1.5l-1.1-1 1.3-2.2 1.4.6a4.7 4.7 0 0 1 1.3-.7l.3-1.5Zm1.3 3.4a2.9 2.9 0 1 0 0 5.8 2.9 2.9 0 0 0 0-5.8Z" />
    </svg>
  );
}
