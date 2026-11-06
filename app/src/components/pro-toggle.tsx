"use client";

import { useEffect, useState } from "react";

const KEY = "arcusa.pro";

/** Pro mode flag, persisted in localStorage. Storage can throw (private mode, blocked data), so every access is guarded. */
export function usePro(): [boolean, (v: boolean) => void] {
  const [pro, setPro] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === "1") setPro(true);
    } catch {}
  }, []);
  const set = (v: boolean) => {
    setPro(v);
    try {
      localStorage.setItem(KEY, v ? "1" : "0");
    } catch {}
  };
  return [pro, set];
}

export function ProToggle({ pro, onChange }: { pro: boolean; onChange: (v: boolean) => void }) {
  return (
    <button className={`pro-toggle ${pro ? "on" : ""}`} role="switch" aria-checked={pro} onClick={() => onChange(!pro)} title="Show advanced panels">
      <i /><span>Pro</span>
    </button>
  );
}
