"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal (ADR 0022). Portal to <body>, one Escape handler, focus trap, focus return, inert background, scroll lock.
 * Centered dialog on desktop; CSS turns it into a bottom sheet under 768px (no drag, so a scrolling list cannot dismiss it).
 * Mount it only while open.
 */
export function Modal({ label, onClose, initialFocus, children }: { label: string; onClose: () => void; initialFocus?: RefObject<HTMLElement | null>; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const rootEl = root.current;
    // Inert the rest of the page.
    const inerted: Array<[Element, boolean]> = [];
    for (const el of Array.from(document.body.children)) {
      if (el === rootEl || el.tagName === "SCRIPT") continue;
      inerted.push([el, (el as HTMLElement).inert]);
      (el as HTMLElement).inert = true;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Desktop focuses the search field; on touch the dialog itself, so the keyboard does not open and shrink the viewport.
    const desktop = window.matchMedia("(min-width: 768px) and (hover: hover)").matches;
    (desktop && initialFocus?.current ? initialFocus.current : box.current)?.focus();

    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
      } else if (e.key === "Tab" && box.current) {
        const items = Array.from(box.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
        if (!items.length) return e.preventDefault();
        const first = items[0], last = items[items.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === box.current)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("keydown", key, true);
      inerted.forEach(([el, was]) => ((el as HTMLElement).inert = was));
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="modal-wrap" ref={root}>
      <div className="modal-bg" onClick={() => onClose()} />
      <div className="modal" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} ref={box}>
        {children}
      </div>
    </div>,
    document.body,
  );
}
