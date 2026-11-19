import Chip from '@mui/material/Chip';
import type { ServiceStatusValue } from '@ssd/shared';
import { STATUS_META } from '../lib/status';

/** Status badge: icon + label, never color alone. Fixed minimum width so chips line up in lists. */
export function StatusChip({ status }: { status: ServiceStatusValue }) {
  const { label, color, Icon } = STATUS_META[status];
  return (
    <Chip
      size="small"
      variant="outlined"
      color={color}
      icon={<Icon />}
      label={label}
      sx={{ minWidth: 104, justifyContent: 'center' }}
    />
  );
}
