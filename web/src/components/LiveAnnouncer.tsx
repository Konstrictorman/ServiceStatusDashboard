import Box from '@mui/material/Box';
import { useState } from 'react';
import type { ServiceStatus } from '@ssd/shared';
import { visuallyHidden } from '../lib/a11y';
import { STATUS_META } from '../lib/status';

const keyOf = (services: readonly ServiceStatus[]) =>
  services.map((s) => `${s.id}:${s.status}`).join('|');

/**
 * Announces status changes to screen-reader users ("Payments is now Down.") without
 * re-announcing the whole page on every poll. Nothing is announced on first load.
 */
export function LiveAnnouncer({ services }: { services: readonly ServiceStatus[] }) {
  const [previous, setPrevious] = useState(services);
  const [message, setMessage] = useState('');

  // Compare with the previous render (React's "adjust state when a prop changes" pattern).
  if (keyOf(services) !== keyOf(previous)) {
    const before = new Map(previous.map((s) => [s.id, s.status]));
    const changes = services
      .filter((s) => before.has(s.id) && before.get(s.id) !== s.status)
      .map((s) => `${s.name} is now ${STATUS_META[s.status].label}.`);
    setPrevious(services);
    if (changes.length > 0) setMessage(changes.join(' '));
  }

  return (
    <Box role="status" aria-live="polite" sx={visuallyHidden}>
      {message}
    </Box>
  );
}
