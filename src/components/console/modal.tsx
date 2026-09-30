"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  panelClassName?: string;
};

export function Modal({ title, onClose, children, panelClassName }: ModalProps) {
  const onCloseRef = useRef(onClose);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    setMounted(true);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#10241f]/55 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full max-w-md rounded-3xl border border-white/20 bg-white/80 p-6 text-[#241f1b] shadow-2xl backdrop-blur-md transition-all duration-300 ${panelClassName ?? ""}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export const fieldClass =
  "w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-[#241f1b] outline-none transition-all duration-300 placeholder:text-[#241f1b]/35 focus:border-[#1E6B48]/40 focus:ring-2 focus:ring-[#1E6B48]/15";

export const primaryButtonClass =
  "inline-flex h-11 items-center justify-center rounded-full bg-[#1E6B48] px-5 text-sm font-medium text-[#FAF9F6] transition-all duration-300 hover:bg-[#18583C] disabled:cursor-not-allowed disabled:opacity-40";

export const quietButtonClass =
  "inline-flex h-11 items-center justify-center rounded-full px-4 text-sm text-[#5c564e] transition-all duration-300 hover:bg-black/5";
