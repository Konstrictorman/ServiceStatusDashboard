import type { SvgIconComponent } from '@mui/icons-material';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlined from '@mui/icons-material/ErrorOutlined';
import HelpOutlined from '@mui/icons-material/HelpOutlined';
import WarningAmber from '@mui/icons-material/WarningAmber';
import type { ServiceStatus, ServiceStatusValue } from '@ssd/shared';

export type StatusColor = 'success' | 'warning' | 'error' | 'unknown';

/** One place that maps a status to its label, color and icon (always shown together, never color alone). */
export const STATUS_META: Record<
  ServiceStatusValue,
  { label: string; color: StatusColor; Icon: SvgIconComponent }
> = {
  operational: { label: 'Operational', color: 'success', Icon: CheckCircleOutlined },
  degraded: { label: 'Degraded', color: 'warning', Icon: WarningAmber },
  down: { label: 'Down', color: 'error', Icon: ErrorOutlined },
  unknown: { label: 'Unknown', color: 'unknown', Icon: HelpOutlined },
};

export const OVERALL_TITLE: Record<ServiceStatusValue, string> = {
  operational: 'All systems operational',
  degraded: 'Partial degradation',
  down: 'Major outage',
  unknown: 'Status unknown',
};

/** "5 of 5 services operational" or "1 service down, 1 degraded". */
export function summarize(services: ReadonlyArray<Pick<ServiceStatus, 'status'>>): string {
  const count = (s: ServiceStatusValue) => services.filter((x) => x.status === s).length;
  const down = count('down');
  const degraded = count('degraded');
  const unknown = count('unknown');
  if (down + degraded + unknown === 0) {
    return `${services.length} of ${services.length} services operational`;
  }
  const parts: string[] = [];
  if (down) parts.push(`${down} ${down === 1 ? 'service' : 'services'} down`);
  if (degraded) parts.push(`${degraded} degraded`);
  if (unknown) parts.push(`${unknown} unknown`);
  return parts.join(', ');
}
