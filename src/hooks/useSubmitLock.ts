import { useRef, useState } from "react";

/** Prevent duplicate submissions, including calls before React renders again. */
export function useSubmitLock(): [
  boolean,
  (task: () => Promise<void>) => Promise<void>,
] {
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const run = async (task: () => Promise<void>): Promise<void> => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    try {
      await task();
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  return [busy, run];
}
