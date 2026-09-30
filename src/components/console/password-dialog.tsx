"use client";

import { useState } from "react";
import {
  Modal,
  fieldClass,
  primaryButtonClass,
  quietButtonClass,
} from "@/components/console/modal";

export function PasswordDialog({
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
