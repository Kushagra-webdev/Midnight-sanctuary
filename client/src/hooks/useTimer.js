import { useState, useRef, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'ms_timer_state';

export function useTimer(persistKey = null) {
  const key = persistKey || STORAGE_KEY;

  // Restore from localStorage on mount
  const [elapsed, setElapsed] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return 0;
      const { startedAt } = JSON.parse(raw);
      return Math.floor((Date.now() - startedAt) / 1000);
    } catch { return 0; }
  });

  const [running, setRunning] = useState(() => {
    try {
      return !!localStorage.getItem(key);
    } catch { return false; }
  });

  const ref = useRef(null);
  const startRef = useRef(null);

  // On mount, if timer was running, resume it
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const { startedAt } = JSON.parse(raw);
      startRef.current = startedAt;
      ref.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAt) / 1000));
      }, 1000);
    } catch {}
    return () => clearInterval(ref.current);
  }, [key]);

  const start = useCallback(() => {
    if (running) return;
    const now = Date.now();
    startRef.current = now;
    try { localStorage.setItem(key, JSON.stringify({ startedAt: now })); } catch {}
    setElapsed(0);
    setRunning(true);
    ref.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - now) / 1000));
    }, 1000);
  }, [running, key]);

  const stop = useCallback(() => {
    clearInterval(ref.current);
    try { localStorage.removeItem(key); } catch {}
    setRunning(false);
  }, [key]);

  const reset = useCallback(() => {
    clearInterval(ref.current);
    try { localStorage.removeItem(key); } catch {}
    setRunning(false);
    setElapsed(0);
  }, [key]);

  const format = (s = elapsed) => {
    const h = Math.floor(s / 3600);
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`;
  };

  return { elapsed, running, start, stop, reset, format };
}
