import { useEffect, useRef, useState, type RefObject } from 'react';

/** Native playback controls remain available, including before completion. */
export function useVideoGate(videoRef: RefObject<HTMLVideoElement | null>, onDone: () => void, locked: boolean, savedComplete = false) {
  const [failed, setFailed] = useState(false);
  const callback = useRef(onDone);
  callback.current = onDone;
  useEffect(() => {
    if (locked) return;
    const video = videoRef.current;
    if (!video) return;
    let complete = savedComplete;
    const finish = () => {
      if (complete) return;
      complete = true;
      callback.current();
    };
    const error = () => setFailed(true);
    const loaded = () => setFailed(false);
    video.addEventListener('ended', finish);
    video.addEventListener('error', error);
    video.addEventListener('loadeddata', loaded);
    return () => {
      video.removeEventListener('ended', finish);
      video.removeEventListener('error', error);
      video.removeEventListener('loadeddata', loaded);
    };
  }, [videoRef, locked, savedComplete]);
  return { failed, retry: () => { setFailed(false); videoRef.current?.load(); } };
}
