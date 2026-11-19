import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import { ApiError } from '../api/client';
import { formatRelative } from '../lib/time';

interface ConnectionAlertProps {
  error: Error;
  /** Whether the browser still has an earlier successful response to show. */
  hasData: boolean;
  lastUpdatedAt: number;
  now: number;
  onRetry: () => void;
  retrying: boolean;
}

export function ConnectionAlert({
  error,
  hasData,
  lastUpdatedAt,
  now,
  onRetry,
  retrying,
}: ConnectionAlertProps) {
  const action = (
    <Button color="inherit" size="small" onClick={onRetry} loading={retrying}>
      Retry now
    </Button>
  );

  if (hasData) {
    return (
      <Alert severity="warning" action={action}>
        <AlertTitle>Can&apos;t reach the status API</AlertTitle>
        Showing last known data from {formatRelative(lastUpdatedAt, now)}. Retrying automatically…
      </Alert>
    );
  }

  const requestId = error instanceof ApiError ? error.requestId : null;
  return (
    <Alert severity="error" action={action}>
      <AlertTitle>Couldn&apos;t load service status</AlertTitle>
      {error.message}
      {requestId && ` (request ID ${requestId})`}
    </Alert>
  );
}
