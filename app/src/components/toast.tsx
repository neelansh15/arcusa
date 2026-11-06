"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export type ToastMsg = { id: number; kind: "ok" | "err"; title: string; text: string; href?: string };

export function Toast({ toast, onClose }: { toast: ToastMsg | null; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, toast.kind === "ok" ? 7000 : 10000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast || typeof document === "undefined") return null;
  return createPortal(
    <div className={`toast ${toast.kind}`} role="status" key={toast.id}>
      <span className="toast-icon" aria-hidden>{toast.kind === "ok" ? "✓" : "!"}</span>
      <div className="toast-body">
        <b>{toast.title}</b>
        <span>{toast.text}</span>
        {toast.href && <a href={toast.href} target="_blank" rel="noreferrer">View transaction ↗</a>}
      </div>
      <button className="toast-x" onClick={onClose} aria-label="Dismiss">×</button>
    </div>,
    document.body,
  );
}
