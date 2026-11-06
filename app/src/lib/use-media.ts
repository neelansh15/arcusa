"use client";

import { useSyncExternalStore } from "react";

/** True when the media query matches. False on the server and first render, so desktop markup is the SSR default. */
export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
