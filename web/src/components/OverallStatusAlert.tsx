import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Skeleton from '@mui/material/Skeleton';
import type { ServiceStatus, ServiceStatusValue } from '@ssd/shared';
import { OVERALL_TITLE, STATUS_META, summarize } from '../lib/status';

interface OverallStatusAlertProps {
  overall: ServiceStatusValue;
  services: readonly ServiceStatus[];
}

export function OverallStatusAlert({ overall, services }: OverallStatusAlertProps) {
  const { color, Icon } = STATUS_META[overall];
  return (
    // Not role="alert": it re-renders on every poll. Changes are announced by <LiveAnnouncer/>.
    <Alert
      severity={color}
      icon={<Icon fontSize="inherit" />}
      role="region"
      aria-label="Overall status"
    >
      <AlertTitle>{OVERALL_TITLE[overall]}</AlertTitle>
      {summarize(services)}
    </Alert>
  );
}

export function OverallStatusSkeleton() {
  return <Skeleton variant="rounded" height={72} aria-hidden />;
}
