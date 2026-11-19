import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ServiceStatus } from '@ssd/shared';
import { STATUS_META } from '../lib/status';
import { formatRelative } from '../lib/time';
import { StatusChip } from './StatusChip';

export function ServiceCard({ service, now }: { service: ServiceStatus; now: number }) {
  const { color } = STATUS_META[service.status];
  const headingId = `service-${service.id}`;
  const showMessage = service.message !== null && service.status !== 'operational';

  return (
    <Card component="article" aria-labelledby={headingId} sx={{ height: '100%' }}>
      <CardContent>
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 1 }}
        >
          <Typography id={headingId} variant="subtitle1" component="h3" sx={{ fontWeight: 500 }}>
            {service.name}
          </Typography>
          <StatusChip status={service.status} />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Latency{' '}
          {service.latencyMs === null ? '—' : `${service.latencyMs.toLocaleString('en')} ms`}
        </Typography>
        <Typography variant="caption" component="p" color="text.secondary">
          {service.lastCheckedAt
            ? `Checked ${formatRelative(service.lastCheckedAt, now)}`
            : 'Not checked yet'}
        </Typography>
        {showMessage && (
          // The darker shade keeps the text readable (WCAG AA contrast) on white.
          <Typography variant="body2" sx={{ mt: 1, color: `${color}.dark` }}>
            {service.message}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export function ServiceCardSkeleton() {
  return (
    <Card aria-hidden sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1 }}>
          <Skeleton variant="text" width={130} />
          <Skeleton variant="rounded" width={104} height={24} sx={{ borderRadius: 4 }} />
        </Stack>
        <Skeleton variant="text" width={110} />
        <Skeleton variant="text" width={90} />
      </CardContent>
    </Card>
  );
}
