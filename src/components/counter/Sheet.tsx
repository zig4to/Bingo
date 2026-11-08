"use client";

import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

/** Pogovorno okno z barvno glavo (preliv števca). Na telefonu pride od spodaj. */
export default function Sheet({
  background,
  header,
  onClose,
  children,
}: {
  background: string;
  header: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-[2px] sm:items-center sm:p-4">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-2xl dark:bg-gray-900 sm:rounded-[2rem]">
        <div className="relative shrink-0 px-5 pb-5 pt-4 text-white" style={{ background }}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zapri"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm hover:bg-white/30"
          >
            ✕
          </button>
          {header}
        </div>
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
