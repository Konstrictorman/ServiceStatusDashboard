import { useEffect, useState } from 'react';

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'always', style: 'narrow' });

/** "just now", "4s ago", "2m ago", "3h ago". */
export function formatRelative(from: Date | string | number, now: number): string {
  const seconds = Math.max(0, Math.round((now - new Date(from).getTime()) / 1000));
  if (seconds < 2) return 'just now';
  if (seconds < 60) return relative.format(-seconds, 'second');
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return relative.format(-minutes, 'minute');
  return relative.format(-Math.round(minutes / 60), 'hour');
}

export function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/** Re-renders every `intervalMs` so relative times ("checked 4s ago") stay current. */
export function useNow(intervalMs = 1_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
