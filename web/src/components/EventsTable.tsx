import ArrowForward from '@mui/icons-material/ArrowForward';
import InboxOutlined from '@mui/icons-material/InboxOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import type { StatusEvent } from '@ssd/shared';
import { visuallyHidden } from '../lib/a11y';
import { formatClock } from '../lib/time';
import { StatusChip } from './StatusChip';

interface EventsTableProps {
  events: readonly StatusEvent[] | undefined;
  loading: boolean;
  error: Error | null;
}

export function EventsTable({ events, loading, error }: EventsTableProps) {
  return (
    <Paper component="section" aria-labelledby="events-heading" sx={{ overflow: 'hidden' }}>
      <Typography id="events-heading" variant="h6" component="h2" sx={{ px: 2, py: 1.5 }}>
        Recent events
      </Typography>
      {error && !events ? (
        <Alert severity="error" sx={{ m: 2, mt: 0 }}>
          Couldn&apos;t load recent events: {error.message}
        </Alert>
      ) : !loading && events?.length === 0 ? (
        <EmptyState />
      ) : (
        <TableContainer>
          <Table size="small" sx={{ minWidth: 640 }}>
            <Box component="caption" sx={visuallyHidden}>
              Service status changes, newest first
            </Box>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>Time</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Change</TableCell>
                <TableCell>Message</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 4 }, (_, i) => <SkeletonRow key={i} />)
                : events?.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
                        <time dateTime={event.occurredAt}>{formatClock(event.occurredAt)}</time>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{event.serviceName}</TableCell>
                      <TableCell>
                        <Stack direction="row" sx={{ alignItems: 'center', gap: 0.75 }}>
                          <StatusChip status={event.from} />
                          <ArrowForward
                            fontSize="small"
                            sx={{ color: 'action.active' }}
                            aria-hidden
                          />
                          <Box component="span" sx={visuallyHidden}>
                            changed to
                          </Box>
                          <StatusChip status={event.to} />
                        </Stack>
                      </TableCell>
                      <TableCell>{event.message ?? '—'}</TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}

function EmptyState() {
  return (
    <Stack
      sx={{
        alignItems: 'center',
        textAlign: 'center',
        gap: 1,
        px: 3,
        py: 4,
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <InboxOutlined sx={{ fontSize: 40, color: 'action.disabled' }} aria-hidden />
      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
        No status changes yet
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Events appear here when a service changes status.
      </Typography>
    </Stack>
  );
}

function SkeletonRow() {
  return (
    <TableRow aria-hidden>
      <TableCell>
        <Skeleton width={64} />
      </TableCell>
      <TableCell>
        <Skeleton width={100} />
      </TableCell>
      <TableCell>
        <Skeleton variant="rounded" width={230} height={24} sx={{ borderRadius: 4 }} />
      </TableCell>
      <TableCell>
        <Skeleton width={260} />
      </TableCell>
    </TableRow>
  );
}
